import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TripsShell from '@/components/trips/TripsShell'
import { LinkedContactForSharing } from '@/types/trips'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: trips }, { data: profile }, { data: linkedUserRows }] = await Promise.all([
    (supabase as any)
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('linked_contacts')
      .select('linked_user_id')
      .eq('user_id', user.id),
  ])

  // Fetch profiles for all linked users
  const linkedUserIds = (linkedUserRows ?? []).map((r: any) => r.linked_user_id)
  let linkedContacts: LinkedContactForSharing[] = []
  if (linkedUserIds.length > 0) {
    const { data: linkedProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', linkedUserIds)
    linkedContacts = (linkedProfiles ?? []).map((p: any) => ({
      user_id: p.id,
      full_name: p.full_name,
    }))
  }

  return (
    <TripsShell
      initialTrips={trips ?? []}
      linkedContacts={linkedContacts}
      userId={user.id}
      profile={profile}
    />
  )
}
