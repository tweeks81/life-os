'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip, TripFlight, TripParking, TripTaxi, TripAccommodation, TripShare, LinkedContactForSharing, TripTask } from '@/types/trips'
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
  const [tripTasks, setTripTasks] = useState<TripTask[]>([])
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

  const loadTripTasks = useCallback(async (tripId: string) => {
    const { data: proj } = await (supabase as any)
      .from('projects').select('id').eq('trip_id', tripId).eq('user_id', userId).maybeSingle()
    if (!proj) { setTripTasks([]); return }
    const { data } = await (supabase as any)
      .from('tasks').select('id, title, priority, status, due_date, created_at')
      .eq('project_id', proj.id).order('created_at', { ascending: true })
    setTripTasks(data ?? [])
  }, [supabase, userId])

  const handleSelectTrip = useCallback(async (trip: Trip) => {
    setSelectedTrip(trip)
    if (trip.user_id !== userId) setTripTasks([])
    const promises: Promise<void>[] = [loadTripItems(trip.id), loadShares(trip.id)]
    if (trip.user_id === userId) promises.push(loadTripTasks(trip.id))
    await Promise.all(promises)
  }, [loadTripItems, loadShares, loadTripTasks, userId])

  const handleTripSaved = useCallback(async (saved: Trip) => {
    await refreshTrips()
    setShowTripForm(false)
    setEditingTrip(null)
    setSelectedTrip(saved)
    await Promise.all([loadTripItems(saved.id), loadShares(saved.id), loadTripTasks(saved.id)])
  }, [refreshTrips, loadTripItems, loadShares, loadTripTasks])

  const handleToggleComplete = useCallback(async (trip: Trip) => {
    await (supabase as any).from('trips').update({ completed: !trip.completed }).eq('id', trip.id)
    await refreshTrips()
  }, [supabase, refreshTrips])

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

  const handleAddTask = useCallback(async (title: string, urgency: number, dueDate: string | null): Promise<string | null> => {
    if (!selectedTrip) return null
    let projectId: string

    const { data: existing, error: findErr } = await (supabase as any)
      .from('projects').select('id').eq('trip_id', selectedTrip.id).eq('user_id', userId).maybeSingle()
    if (findErr) return findErr.message

    if (existing) {
      projectId = existing.id
    } else {
      const { data: created, error: projErr } = await (supabase as any)
        .from('projects')
        .insert({ name: selectedTrip.name, user_id: userId, trip_id: selectedTrip.id, status: 'active', colour: '#2d5a8e' })
        .select('id').single()
      if (projErr || !created) return projErr?.message ?? 'Failed to create project'
      projectId = created.id
    }

    const { error: taskErr } = await (supabase as any).from('tasks').insert({
      title, user_id: userId, project_id: projectId,
      category: 'admin', context: 'anywhere', urgency, effort: 2,
      due_date: dueDate || null, status: 'open',
    })
    if (taskErr) return taskErr.message

    await loadTripTasks(selectedTrip.id)
    return null
  }, [supabase, selectedTrip, userId, loadTripTasks])

  const handleToggleTask = useCallback(async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'open' : 'done'
    await (supabase as any).from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }).eq('id', taskId)
    if (selectedTrip) await loadTripTasks(selectedTrip.id)
  }, [supabase, selectedTrip, loadTripTasks])

  const handleDeleteTask = useCallback(async (taskId: string) => {
    await (supabase as any).from('tasks').delete().eq('id', taskId)
    if (selectedTrip) await loadTripTasks(selectedTrip.id)
  }, [supabase, selectedTrip, loadTripTasks])

  const handleReorderItems = useCallback(async (updates: { table: string; id: string; sortOrder: number }[]) => {
    await Promise.all(
      updates.map(u => (supabase as any).from(u.table).update({ sort_order: u.sortOrder }).eq('id', u.id))
    )
  }, [supabase])

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
          onToggleComplete={handleToggleComplete}
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
              tripTasks={tripTasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onAddShare={handleAddShare}
              onRemoveShare={handleRemoveShare}
              onReorderItems={handleReorderItems}
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
