'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripFlight, TripParking, TripTaxi, TripAccommodation } from '@/types/trips'
import TripsList from './TripsList'
import TripDetail from './TripDetail'
import TripForm from './TripForm'
import NavBar from '../NavBar'

export default function TripsShell({
  initialTrips,
  userId,
  profile,
}: {
  initialTrips: Trip[]
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
  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState(false)

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

  const handleSelectTrip = useCallback(async (trip: Trip) => {
    setSelectedTrip(trip)
    await loadTripItems(trip.id)
  }, [loadTripItems])

  const handleTripSaved = useCallback(async (saved: Trip) => {
    await refreshTrips()
    setShowTripForm(false)
    setEditingTrip(null)
    setSelectedTrip(saved)
    await loadTripItems(saved.id)
  }, [refreshTrips, loadTripItems])

  const handleDeleteTrip = useCallback(async () => {
    if (!selectedTrip) return
    await (supabase as any).from('trips').delete().eq('id', selectedTrip.id)
    await refreshTrips()
    setSelectedTrip(null)
    setFlights([])
    setParking([])
    setTaxis([])
    setAccommodations([])
  }, [supabase, selectedTrip, refreshTrips])

  const handleDeleteItem = useCallback(async (table: string, id: string) => {
    await (supabase as any).from(table).delete().eq('id', id)
    if (selectedTrip) await loadTripItems(selectedTrip.id)
  }, [supabase, selectedTrip, loadTripItems])

  const handleItemAdded = useCallback(async () => {
    if (selectedTrip) await loadTripItems(selectedTrip.id)
  }, [selectedTrip, loadTripItems])

  return (
    <div className="trips-shell">
      <NavBar profile={profile} />

      <div className="trips-body">
        <TripsList
          trips={trips}
          selectedTripId={selectedTrip?.id ?? null}
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
              userId={userId}
              onEditTrip={() => { setEditingTrip(selectedTrip); setShowTripForm(true) }}
              onDeleteTrip={handleDeleteTrip}
              onItemAdded={handleItemAdded}
              onDeleteItem={handleDeleteItem}
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
        .trips-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--cream);
          overflow: hidden;
        }
        .trips-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .trips-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .trips-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
          text-align: center;
        }
        .trips-empty-icon { font-size: 2.5rem; }
        .trips-empty-title { font-size: 1.125rem; font-weight: 600; color: var(--text-secondary); }
        .trips-empty-sub { font-size: 0.875rem; color: var(--text-muted); max-width: 280px; line-height: 1.6; }
      `}</style>
    </div>
  )
}
