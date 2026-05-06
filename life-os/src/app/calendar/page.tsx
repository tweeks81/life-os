import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarShell from '@/components/calendar/CalendarShell'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: profile },
    { data: dbEvents },
    { data: contacts },
    { data: linkedRaw },
    { data: shareRows },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url, date_of_birth').eq('id', user.id).single(),
    (supabase as any).from('calendar_events').select('*').eq('user_id', user.id).order('event_date'),
    supabase.from('contacts').select('id, first_name, last_name, date_of_birth').not('date_of_birth', 'is', null),
    (supabase as any).from('linked_contacts').select('id, linked_user_id').eq('user_id', user.id),
    (supabase as any).from('calendar_event_shares').select('id, event_id, shared_with_email, created_at').eq('owner_id', user.id),
  ])

  // Fetch linked profiles for birthdays
  const linkedUserIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
  const { data: linkedProfiles } = linkedUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, date_of_birth').in('id', linkedUserIds).not('date_of_birth', 'is', null)
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

  // Index shares by event id
  const eventShares: Record<string, any[]> = {}
  for (const row of shareRows ?? []) {
    if (!eventShares[row.event_id]) eventShares[row.event_id] = []
    eventShares[row.event_id].push({ id: row.id, shared_with_email: row.shared_with_email, created_at: row.created_at })
  }

  return (
    <CalendarShell
      userId={user.id}
      profile={profile}
      initialDbEvents={dbEvents ?? []}
      contacts={allContacts}
      initialEventShares={eventShares}
    />
  )
}
