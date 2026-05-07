import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VehiclesShell from '@/components/vehicles/VehiclesShell'

export default async function VehiclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: vehicles },
    { data: profile },
    { data: shareRows },
    { data: taxRows },
    { data: insRows },
  ] = await Promise.all([
    supabase.from('vehicles').select('*').order('name', { ascending: true }),
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    (supabase as any).from('vehicle_shares').select('id, vehicle_id, shared_with_email, created_at').eq('owner_id', user.id),
    (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', new Date().toISOString().split('T')[0]),
    (supabase as any).from('vehicle_policies').select('vehicle_id').eq('policy_type', 'insurance').gte('end_date', new Date().toISOString().split('T')[0]),
  ])

  const vehicleShares: Record<string, any[]> = {}
  for (const row of shareRows ?? []) {
    if (!vehicleShares[row.vehicle_id]) vehicleShares[row.vehicle_id] = []
    vehicleShares[row.vehicle_id].push({ id: row.id, shared_with_email: row.shared_with_email, created_at: row.created_at })
  }

  // Build a set of vehicle IDs that have valid (non-expired) tax
  const taxedVehicleIds = new Set<string>((taxRows ?? []).map((r: any) => r.vehicle_id))
  const insuredVehicleIds = new Set<string>((insRows ?? []).map((r: any) => r.vehicle_id))

  return (
    <VehiclesShell
      initialVehicles={vehicles ?? []}
      initialShares={vehicleShares}
      taxedVehicleIds={Array.from(taxedVehicleIds)}
      insuredVehicleIds={Array.from(insuredVehicleIds)}
      userId={user.id}
      profile={profile}
    />
  )
}
