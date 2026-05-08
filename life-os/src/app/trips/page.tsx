import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TripsShell from '@/components/trips/TripsShell'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: trips }, { data: profile }] = await Promise.all([
    (supabase as any)
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <TripsShell
      initialTrips={trips ?? []}
      userId={user.id}
      profile={profile}
    />
  )
}
