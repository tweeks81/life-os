import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VehiclesShell from '@/components/vehicles/VehiclesShell'

function latestExpiry(rows: any[] | null, dateField: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const r of rows ?? []) {
    const d = r[dateField] as string
    if (!map[r.vehicle_id] || d > map[r.vehicle_id]) map[r.vehicle_id] = d
  }
  return map
}

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

export default async function VehiclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = new Date().toISOString().split('T')[0]
  const soonDate = new Date(); soonDate.setDate(soonDate.getDate() + 30)
  const soon = soonDate.toISOString().split('T')[0]

  const [
    { data: vehicles },
    { data: profile },
    { data: shareRows },
    { data: taxRows },
    { data: insRows },
    { data: motRows },
    { data: serviceRows },
  ] = await Promise.all([
    supabase.from('vehicles').select('*').order('name', { ascending: true }),
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    (supabase as any).from('vehicle_shares').select('id, vehicle_id, shared_with_email, created_at').eq('owner_id', user.id),
    (supabase as any).from('vehicle_tax').select('vehicle_id, expiry_date').gte('expiry_date', today),
    (supabase as any).from('vehicle_policies').select('vehicle_id, end_date').eq('policy_type', 'insurance').gte('end_date', today),
    (supabase as any).from('vehicle_mots').select('vehicle_id, expiry_date').eq('passed', true).gte('expiry_date', today),
    (supabase as any).from('vehicle_services').select('vehicle_id, service_date').order('service_date', { ascending: false }),
  ])

  const latestTax = latestExpiry(taxRows, 'expiry_date')
  const latestIns = latestExpiry(insRows, 'end_date')
  const latestMot = latestExpiry(motRows, 'expiry_date')

  const vehicleShares: Record<string, any[]> = {}
  for (const row of shareRows ?? []) {
    if (!vehicleShares[row.vehicle_id]) vehicleShares[row.vehicle_id] = []
    vehicleShares[row.vehicle_id].push({ id: row.id, shared_with_email: row.shared_with_email, created_at: row.created_at })
  }

  const { overdueIds: serviceOverdueIds, soonIds: serviceDueSoonIds } = computeServiceStatus(serviceRows ?? [])

  return (
    <VehiclesShell
      initialVehicles={vehicles ?? []}
      initialShares={vehicleShares}
      taxedVehicleIds={Object.keys(latestTax)}
      insuredVehicleIds={Object.keys(latestIns)}
      motVehicleIds={Object.keys(latestMot)}
      taxWarnVehicleIds={Object.entries(latestTax).filter(([, exp]) => exp <= soon).map(([id]) => id)}
      insWarnVehicleIds={Object.entries(latestIns).filter(([, exp]) => exp <= soon).map(([id]) => id)}
      motWarnVehicleIds={Object.entries(latestMot).filter(([, exp]) => exp <= soon).map(([id]) => id)}
      serviceOverdueVehicleIds={Array.from(serviceOverdueIds)}
      serviceDueSoonVehicleIds={Array.from(serviceDueSoonIds)}
      userId={user.id}
      profile={profile}
    />
  )
}
