'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vehicle } from '@/types/vehicles'
import { ShareRecord } from '@/components/tasks/SharePanel'
import NavBar from '../NavBar'
import VehiclesList from './VehiclesList'
import VehicleDetail from './VehicleDetail'
import VehicleForm from './VehicleForm'

function computeServiceStatus(serviceRows: { vehicle_id: string; service_date: string }[]) {
  const latest: Record<string, string> = {}
  for (const r of serviceRows) {
    if (!latest[r.vehicle_id]) latest[r.vehicle_id] = r.service_date
  }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const overdueIds = new Set<string>()
  const soonIds = new Set<string>()
  for (const [vehicleId, serviceDate] of Object.entries(latest)) {
    const nextDue = new Date(serviceDate)
    nextDue.setFullYear(nextDue.getFullYear() + 1)
    const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilDue <= 0) overdueIds.add(vehicleId)
    else if (daysUntilDue <= 30) soonIds.add(vehicleId)
  }
  return { overdueIds, soonIds }
}

export default function VehiclesShell({
  initialVehicles,
  initialShares,
  taxedVehicleIds,
  insuredVehicleIds,
  motVehicleIds,
  taxWarnVehicleIds,
  insWarnVehicleIds,
  motWarnVehicleIds,
  serviceOverdueVehicleIds,
  serviceDueSoonVehicleIds,
  userId,
  profile,
}: {
  initialVehicles: Vehicle[]
  initialShares: Record<string, ShareRecord[]>
  taxedVehicleIds: string[]
  insuredVehicleIds: string[]
  motVehicleIds: string[]
  taxWarnVehicleIds: string[]
  insWarnVehicleIds: string[]
  motWarnVehicleIds: string[]
  serviceOverdueVehicleIds: string[]
  serviceDueSoonVehicleIds: string[]
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [taxedIds, setTaxedIds] = useState<Set<string>>(new Set(taxedVehicleIds))
  const [insuredIds, setInsuredIds] = useState<Set<string>>(new Set(insuredVehicleIds))
  const [motIds, setMotIds] = useState<Set<string>>(new Set(motVehicleIds))
  const [taxWarnIds, setTaxWarnIds] = useState<Set<string>>(new Set(taxWarnVehicleIds))
  const [insWarnIds, setInsWarnIds] = useState<Set<string>>(new Set(insWarnVehicleIds))
  const [motWarnIds, setMotWarnIds] = useState<Set<string>>(new Set(motWarnVehicleIds))
  const [serviceOverdueIds, setServiceOverdueIds] = useState<Set<string>>(new Set(serviceOverdueVehicleIds))
  const [serviceDueSoonIds, setServiceDueSoonIds] = useState<Set<string>>(new Set(serviceDueSoonVehicleIds))
  const [shares, setShares] = useState<Record<string, ShareRecord[]>>(initialShares)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [showSold, setShowSold] = useState(false)

  const refreshVehicles = useCallback(async () => {
    const { data } = await supabase.from('vehicles').select('*').order('name', { ascending: true })
    if (data) setVehicles(data as Vehicle[])
    const today = new Date().toISOString().split('T')[0]
    const soonDate = new Date(); soonDate.setDate(soonDate.getDate() + 30)
    const soon = soonDate.toISOString().split('T')[0]
    const [
      { data: taxData }, { data: insData }, { data: motData },
      { data: taxWarnData }, { data: insWarnData }, { data: motWarnData },
      { data: svcData },
    ] = await Promise.all([
      (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', today),
      (supabase as any).from('vehicle_policies').select('vehicle_id').eq('policy_type', 'insurance').gte('end_date', today),
      (supabase as any).from('vehicle_mots').select('vehicle_id').eq('passed', true).gte('expiry_date', today),
      (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', today).lte('expiry_date', soon),
      (supabase as any).from('vehicle_policies').select('vehicle_id').eq('policy_type', 'insurance').gte('end_date', today).lte('end_date', soon),
      (supabase as any).from('vehicle_mots').select('vehicle_id').eq('passed', true).gte('expiry_date', today).lte('expiry_date', soon),
      (supabase as any).from('vehicle_services').select('vehicle_id, service_date').order('service_date', { ascending: false }),
    ])
    setTaxedIds(new Set((taxData ?? []).map((r: any) => r.vehicle_id)))
    setInsuredIds(new Set((insData ?? []).map((r: any) => r.vehicle_id)))
    setMotIds(new Set((motData ?? []).map((r: any) => r.vehicle_id)))
    setTaxWarnIds(new Set((taxWarnData ?? []).map((r: any) => r.vehicle_id)))
    setInsWarnIds(new Set((insWarnData ?? []).map((r: any) => r.vehicle_id)))
    setMotWarnIds(new Set((motWarnData ?? []).map((r: any) => r.vehicle_id)))
    const { overdueIds, soonIds } = computeServiceStatus(svcData ?? [])
    setServiceOverdueIds(overdueIds)
    setServiceDueSoonIds(soonIds)
  }, [supabase])

  const refreshTaxStatus = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const soonDate = new Date(); soonDate.setDate(soonDate.getDate() + 30)
    const soon = soonDate.toISOString().split('T')[0]
    const [{ data: taxData }, { data: taxWarnData }] = await Promise.all([
      (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', today),
      (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', today).lte('expiry_date', soon),
    ])
    setTaxedIds(new Set((taxData ?? []).map((r: any) => r.vehicle_id)))
    setTaxWarnIds(new Set((taxWarnData ?? []).map((r: any) => r.vehicle_id)))
  }, [supabase])

  const refreshInsuranceStatus = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const soonDate = new Date(); soonDate.setDate(soonDate.getDate() + 30)
    const soon = soonDate.toISOString().split('T')[0]
    const [{ data: insData }, { data: insWarnData }] = await Promise.all([
      (supabase as any).from('vehicle_policies').select('vehicle_id').eq('policy_type', 'insurance').gte('end_date', today),
      (supabase as any).from('vehicle_policies').select('vehicle_id').eq('policy_type', 'insurance').gte('end_date', today).lte('end_date', soon),
    ])
    setInsuredIds(new Set((insData ?? []).map((r: any) => r.vehicle_id)))
    setInsWarnIds(new Set((insWarnData ?? []).map((r: any) => r.vehicle_id)))
  }, [supabase])

  const refreshMotStatus = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]
    const soonDate = new Date(); soonDate.setDate(soonDate.getDate() + 30)
    const soon = soonDate.toISOString().split('T')[0]
    const [{ data: motData }, { data: motWarnData }] = await Promise.all([
      (supabase as any).from('vehicle_mots').select('vehicle_id').eq('passed', true).gte('expiry_date', today),
      (supabase as any).from('vehicle_mots').select('vehicle_id').eq('passed', true).gte('expiry_date', today).lte('expiry_date', soon),
    ])
    setMotIds(new Set((motData ?? []).map((r: any) => r.vehicle_id)))
    setMotWarnIds(new Set((motWarnData ?? []).map((r: any) => r.vehicle_id)))
  }, [supabase])

  const refreshServiceStatus = useCallback(async () => {
    const { data: svcData } = await (supabase as any)
      .from('vehicle_services').select('vehicle_id, service_date').order('service_date', { ascending: false })
    const { overdueIds, soonIds } = computeServiceStatus(svcData ?? [])
    setServiceOverdueIds(overdueIds)
    setServiceDueSoonIds(soonIds)
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
          insuredIds={insuredIds}
          motIds={motIds}
          taxWarnIds={taxWarnIds}
          insWarnIds={insWarnIds}
          motWarnIds={motWarnIds}
          serviceOverdueIds={serviceOverdueIds}
          serviceDueSoonIds={serviceDueSoonIds}
          shares={shares}
          showSold={showSold}
          onSelect={handleSelect}
          onNew={() => { setEditingVehicle(null); setShowForm(true) }}
          onToggleShowSold={() => setShowSold(s => !s)}
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
            onTaxChanged={refreshTaxStatus}
            onInsuranceChanged={refreshInsuranceStatus}
            onMotChanged={refreshMotStatus}
            onServiceChanged={refreshServiceStatus}
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
