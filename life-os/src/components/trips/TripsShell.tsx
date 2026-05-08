'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripFlight, TripParking, TripTaxi, TripAccommodation, TripShare, LinkedContactForSharing } from '@/types/trips'
import TripsList from './TripsList'
import TripDetail from './TripDetail'
import TripForm from './TripForm'
import NavBar from '../NavBar'

export default function TripsShell({
  initialTrips,
  linkedContacts,
  userId,
  profile,
}: {
  initialTrips: Trip[]
  linkedContacts: LinkedContactForSharing[]
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()

  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [flights, setFlights] = useState<TripFlight[]>([])
  const [parking, setParking] = useState<TripParking[]>([])
  const [taxis, setTaxis] = useState<TripTaxi[]>([])
  const [accommodations, setAccommodations] = useState<TripAccommodation[]>([])
  const [shares, setShares] = useState<TripShare[]>([])
  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)

  const refreshTrips = useCallback(async () => {
    const { data } = await (supabase as any).from('trips').select('*').order('created_at', { ascending: false })
    if (data) setTrips(data as Trip[])
  }, [supabase])

  const loadTripItems = useCallback(async (tripId: string) => {
    const [f, p, t, a] = await Promise.all([
      (supabase as any).from('trip_flights').select('*').eq('trip_id', tripId).order('depart_datetime'),
      (supabase as any).from('trip_parking').select('*').eq('trip_id', tripId).order('start_datetime'),
      (supabase as any).from('trip_taxis').select('*').eq('trip_id', tripId).order('collection_datetime'),
      (supabase as any).from('trip_accommodations').select('*').eq('trip_id', tripId).order('check_in_date'),
    ])
    setFlights(f.data ?? [])
    setParking(p.data ?? [])
    setTaxis(t.data ?? [])
    setAccommodations(a.data ?? [])
  }, [supabase])

  const loadShares = useCallback(async (tripId: string) => {
    const { data } = await (supabase as any)
      .from('trip_shares')
      .select('id, trip_id, owner_id, shared_with_user_id, created_at')
      .eq('trip_id', tripId)
      .eq('owner_id', userId)
    if (!data) { setShares([]); return }
    // Fetch names for shared users
    const userIds = (data as any[]).map((s: any) => s.shared_with_user_id)
    const names: Record<string, string | null> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
      for (const p of profiles ?? []) names[p.id] = p.full_name
    }
    setShares((data as any[]).map((s: any) => ({ ...s, name: names[s.shared_with_user_id] ?? null })))
  }, [supabase, userId])

  const handleSelectTrip = useCallback(async (trip: Trip) => {
    setSelectedTrip(trip)
    await Promise.all([loadTripItems(trip.id), loadShares(trip.id)])
  }, [loadTripItems, loadShares])

  const handleTripSaved = useCallback(async (saved: Trip) => {
    await refreshTrips()
    setShowTripForm(false)
    setEditingTrip(null)
    setSelectedTrip(saved)
    await Promise.all([loadTripItems(saved.id), loadShares(saved.id)])
  }, [refreshTrips, loadTripItems, loadShares])

  const handleDeleteTrip = useCallback(async () => {
    if (!selectedTrip) return
    await (supabase as any).from('trips').delete().eq('id', selectedTrip.id)
    await refreshTrips()
    setSelectedTrip(null)
    setFlights([]); setParking([]); setTaxis([]); setAccommodations([]); setShares([])
  }, [supabase, selectedTrip, refreshTrips])

  const handleDeleteItem = useCallback(async (table: string, id: string) => {
    await (supabase as any).from(table).delete().eq('id', id)
    if (selectedTrip) await loadTripItems(selectedTrip.id)
  }, [supabase, selectedTrip, loadTripItems])

  const handleItemAdded = useCallback(async () => {
    if (selectedTrip) await loadTripItems(selectedTrip.id)
  }, [selectedTrip, loadTripItems])

  const handleAddShare = useCallback(async (sharedWithUserId: string) => {
    if (!selectedTrip) return
    await (supabase as any).from('trip_shares').insert({
      trip_id: selectedTrip.id,
      owner_id: userId,
      shared_with_user_id: sharedWithUserId,
    })
    await loadShares(selectedTrip.id)
  }, [supabase, selectedTrip, userId, loadShares])

  const handleRemoveShare = useCallback(async (shareId: string) => {
    await (supabase as any).from('trip_shares').delete().eq('id', shareId)
    if (selectedTrip) await loadShares(selectedTrip.id)
  }, [supabase, selectedTrip, loadShares])

  const isOwner = selectedTrip ? selectedTrip.user_id === userId : false

  // Find owner name for shared trips
  const ownerName = selectedTrip && !isOwner
    ? linkedContacts.find(c => c.user_id === selectedTrip.user_id)?.full_name ?? null
    : null

  return (
    <div className="trips-shell">
      <NavBar profile={profile} />

      <div className="trips-body">
        <TripsList
          trips={trips}
          selectedTripId={selectedTrip?.id ?? null}
          userId={userId}
          onSelectTrip={handleSelectTrip}
          onNewTrip={() => { setEditingTrip(null); setShowTripForm(true) }}
        />

        <div className="trips-main">
          {selectedTrip ? (
            <TripDetail
              trip={selectedTrip}
              flights={flights}
              parking={parking}
              taxis={taxis}
              accommodations={accommodations}
              shares={shares}
              linkedContacts={linkedContacts}
              userId={userId}
              isOwner={isOwner}
              ownerName={ownerName}
              onEditTrip={() => { setEditingTrip(selectedTrip); setShowTripForm(true) }}
              onDeleteTrip={handleDeleteTrip}
              onItemAdded={handleItemAdded}
              onDeleteItem={handleDeleteItem}
              onAddShare={handleAddShare}
              onRemoveShare={handleRemoveShare}
            />
          ) : (
            <div className="trips-empty">
              <div className="trips-empty-icon">✈️</div>
              <p className="trips-empty-title">Select a trip</p>
              <p className="trips-empty-sub">Choose a trip from the list, or create a new one to get started.</p>
              <button className="btn-primary" onClick={() => { setEditingTrip(null); setShowTripForm(true) }}>
                + New trip
              </button>
            </div>
          )}
        </div>
      </div>

      {showTripForm && (
        <TripForm
          userId={userId}
          trip={editingTrip}
          onSaved={handleTripSaved}
          onClose={() => { setShowTripForm(false); setEditingTrip(null) }}
        />
      )}

      <style>{`
        .trips-shell { height: 100vh; display: flex; flex-direction: column; background: var(--cream); overflow: hidden; }
        .trips-body { flex: 1; display: flex; overflow: hidden; }
        .trips-main { flex: 1; display: flex; overflow: hidden; }
        .trips-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 2rem; text-align: center; }
        .trips-empty-icon { font-size: 2.5rem; }
        .trips-empty-title { font-size: 1.125rem; font-weight: 600; color: var(--text-secondary); }
        .trips-empty-sub { font-size: 0.875rem; color: var(--text-muted); max-width: 280px; line-height: 1.6; }
      `}</style>
    </div>
  )
}
