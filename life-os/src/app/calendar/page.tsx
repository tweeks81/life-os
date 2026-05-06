import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarShell from '@/components/calendar/CalendarShell'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, date_of_birth, email')
    .eq('id', user.id)
    .single()

  // Fetch own events
  const { data: ownEvents } = await (supabase as any)
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date')

  // Fetch event IDs shared with this user
  const { data: sharedWithMe } = await (supabase as any)
    .from('calendar_event_shares')
    .select('event_id')
    .or(`shared_with_id.eq.${user.id},shared_with_email.ilike.${userProfile?.email}`)

  // Fetch those shared events
  const sharedEventIds = (sharedWithMe ?? []).map((r: any) => r.event_id)
  const { data: sharedEvents } = sharedEventIds.length > 0
    ? await (supabase as any)
        .from('calendar_events')
        .select('*')
        .in('id', sharedEventIds)
    : { data: [] }

  const allDbEvents = [
    ...(ownEvents ?? []),
    ...(sharedEvents ?? []).filter((se: any) => !(ownEvents ?? []).find((oe: any) => oe.id === se.id)),
  ]

  // Fetch contacts with DOBs
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, date_of_birth')
    .not('date_of_birth', 'is', null)

  // Fetch linked contacts for birthdays
  const { data: linkedRaw } = await (supabase as any)
    .from('linked_contacts')
    .select('id, linked_user_id')
    .eq('user_id', user.id)

  const linkedUserIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
  const { data: linkedProfiles } = linkedUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, date_of_birth')
        .in('id', linkedUserIds)
        .not('date_of_birth', 'is', null)
    : { data: [] }

  const linkedAsBirthdays = (linkedProfiles ?? []).map((p: any) => {
    const nameParts = (p.full_name ?? '').trim().split(' ')
    return {
      id: `linked-${p.id}`,
      first_name: nameParts[0] ?? '',
      last_name: nameParts.slice(1).join(' ') || nameParts[0] || '',
      date_of_birth: p.date_of_birth,
    }
  })

  const allContacts = [...(contacts ?? []), ...linkedAsBirthdays]

  // Fetch shares the user owns (for managing)
  const { data: shareRows } = await (supabase as any)
    .from('calendar_event_shares')
    .select('id, event_id, shared_with_email, created_at')
    .eq('owner_id', user.id)

  const eventShares: Record<string, any[]> = {}
  for (const row of shareRows ?? []) {
    if (!eventShares[row.event_id]) eventShares[row.event_id] = []
    eventShares[row.event_id].push({
      id: row.id,
      shared_with_email: row.shared_with_email,
      created_at: row.created_at,
    })
  }

  return (
    <CalendarShell
      userId={user.id}
      profile={userProfile}
      initialDbEvents={allDbEvents}
      contacts={allContacts}
      initialEventShares={eventShares}
    />
  )
}