'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vehicle } from '@/types/vehicles'
import { ShareRecord } from '@/components/tasks/SharePanel'
import NavBar from '../NavBar'
import VehiclesList from './VehiclesList'
import VehicleDetail from './VehicleDetail'
import VehicleForm from './VehicleForm'

export default function VehiclesShell({
  initialVehicles,
  initialShares,
  taxedVehicleIds,
  userId,
  profile,
}: {
  initialVehicles: Vehicle[]
  initialShares: Record<string, ShareRecord[]>
  taxedVehicleIds: string[]
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [taxedIds, setTaxedIds] = useState<Set<string>>(new Set(taxedVehicleIds))
  const [shares, setShares] = useState<Record<string, ShareRecord[]>>(initialShares)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const refreshVehicles = useCallback(async () => {
    const { data } = await supabase.from('vehicles').select('*').order('name', { ascending: true })
    if (data) setVehicles(data as Vehicle[])
    // Refresh tax status
    const today = new Date().toISOString().split('T')[0]
    const { data: taxData } = await (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', today)
    setTaxedIds(new Set((taxData ?? []).map((r: any) => r.vehicle_id)))
  }, [supabase])

  const refreshTaxStatus = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data: taxData } = await (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', today)
    setTaxedIds(new Set((taxData ?? []).map((r: any) => r.vehicle_id)))
  }, [supabase])

  const refreshShares = useCallback(async (vehicleId: string) => {
    const { data } = await (supabase as any)
      .from('vehicle_shares')
      .select('id, shared_with_email, created_at')
      .eq('vehicle_id', vehicleId)
      .eq('owner_id', userId)
    setShares(prev => ({ ...prev, [vehicleId]: data ?? [] }))
  }, [supabase, userId])

  const handleSelect = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    if (vehicle.user_id === userId) refreshShares(vehicle.id)
  }, [userId, refreshShares])

  const handleSaved = useCallback(async (vehicle?: Vehicle) => {
    await refreshVehicles()
    setShowForm(false)
    setEditingVehicle(null)
    if (vehicle) {
      const { data } = await supabase.from('vehicles').select('*').eq('id', vehicle.id).single()
      if (data) setSelectedVehicle(data as Vehicle)
    }
  }, [refreshVehicles, supabase])

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('vehicles').delete().eq('id', id)
    setSelectedVehicle(null)
    await refreshVehicles()
  }, [supabase, refreshVehicles])

  return (
    <div className="vehicles-shell">
      <NavBar profile={profile} />
      <div className="vehicles-body">
        <VehiclesList
          vehicles={vehicles}
          userId={userId}
          selectedId={selectedVehicle?.id ?? null}
          taxedIds={taxedIds}
          onSelect={handleSelect}
          onNew={() => { setEditingVehicle(null); setShowForm(true) }}
        />

        {selectedVehicle ? (
          <VehicleDetail
            vehicle={selectedVehicle}
            userId={userId}
            shares={shares[selectedVehicle.id] ?? []}
            onSharesChanged={() => refreshShares(selectedVehicle.id)}
            onEdit={() => { setEditingVehicle(selectedVehicle); setShowForm(true) }}
            onDelete={() => handleDelete(selectedVehicle.id)}
            onClose={() => setSelectedVehicle(null)}
          />
        ) : (
          <div className="vehicles-empty">
            <span className="empty-icon">🚗</span>
            <p className="empty-title">Select a vehicle</p>
            <p className="empty-desc">Choose a vehicle from the list, or add a new one.</p>
          </div>
        )}
      </div>

      {showForm && (
        <VehicleForm
          userId={userId}
          vehicle={editingVehicle}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditingVehicle(null) }}
        />
      )}

      <style>{`
        .vehicles-shell { height: 100vh; display: flex; flex-direction: column; background: var(--cream); overflow: hidden; }
        .vehicles-body { flex: 1; display: flex; overflow: hidden; }
        .vehicles-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-muted); }
        .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .empty-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; color: var(--deep-brown); }
        .empty-desc { font-size: 0.9rem; }
      `}</style>
    </div>
  )
}
