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
  ] = await Promise.all([
    supabase.from('vehicles').select('*').order('name', { ascending: true }),
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    (supabase as any).from('vehicle_shares').select('id, vehicle_id, shared_with_email, created_at').eq('owner_id', user.id),
  ])

  const vehicleShares: Record<string, any[]> = {}
  for (const row of shareRows ?? []) {
    if (!vehicleShares[row.vehicle_id]) vehicleShares[row.vehicle_id] = []
    vehicleShares[row.vehicle_id].push({ id: row.id, shared_with_email: row.shared_with_email, created_at: row.created_at })
  }

  return (
    <VehiclesShell
      initialVehicles={vehicles ?? []}
      initialShares={vehicleShares}
      userId={user.id}
      profile={profile}
    />
  )
}
