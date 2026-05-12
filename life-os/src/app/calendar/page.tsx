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

  // Own events
  const { data: ownEvents } = await (supabase as any)
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date')

  // Events shared with this user
  const { data: sharedWithMe } = await (supabase as any)
    .from('calendar_event_shares')
    .select('event_id')
    .eq('shared_with_id', user.id)

  const sharedEventIds: string[] = (sharedWithMe ?? []).map((r: any) => r.event_id)

  const { data: sharedEvents } = sharedEventIds.length > 0
    ? await (supabase as any).from('calendar_events').select('*').in('id', sharedEventIds)
    : { data: [] }

  const ownIds = new Set((ownEvents ?? []).map((e: any) => e.id))
  const allDbEvents = [
    ...(ownEvents ?? []),
    ...(sharedEvents ?? []).filter((se: any) => !ownIds.has(se.id)),
  ]

  // Contacts with DOBs + name overrides
  const [
    { data: contacts },
    { data: nameOverrides },
    { data: linkedRaw },
  ] = await Promise.all([
    supabase.from('contacts').select('id, first_name, last_name, date_of_birth').not('date_of_birth', 'is', null),
    (supabase as any).from('contact_name_overrides').select('contact_id, linked_user_id, first_name, last_name').eq('user_id', user.id),
    (supabase as any).from('linked_contacts').select('linked_user_id').eq('user_id', user.id),
  ])

  const overrideMap = new Map<string, { first_name: string; last_name: string | null }>()
  for (const o of nameOverrides ?? []) {
    if (o.contact_id) overrideMap.set(`c-${o.contact_id}`, o)
    if (o.linked_user_id) overrideMap.set(`l-${o.linked_user_id}`, o)
  }

  const contactsWithNames = (contacts ?? []).map((c: any) => {
    const ov = overrideMap.get(`c-${c.id}`)
    return {
      id: c.id,
      first_name: ov ? ov.first_name : c.first_name,
      last_name: ov ? ov.last_name : c.last_name,
      date_of_birth: c.date_of_birth,
    }
  })

  // Linked contacts for birthdays
  const linkedUserIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
  const { data: linkedProfiles } = linkedUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, date_of_birth').in('id', linkedUserIds).not('date_of_birth', 'is', null)
    : { data: [] }

  const linkedAsBirthdays = (linkedProfiles ?? []).map((p: any) => {
    const ov = overrideMap.get(`l-${p.id}`)
    if (ov) {
      return { id: `linked-${p.id}`, first_name: ov.first_name, last_name: ov.last_name, date_of_birth: p.date_of_birth }
    }
    const nameParts = (p.full_name ?? '').trim().split(' ')
    return {
      id: `linked-${p.id}`,
      first_name: nameParts[0] ?? '',
      last_name: nameParts.slice(1).join(' ') || null,
      date_of_birth: p.date_of_birth,
    }
  })

  // Trips with dates for calendar display
  const { data: tripRows } = await (supabase as any)
    .from('trips')
    .select('id, name, start_date, end_date')
    .not('start_date', 'is', null)

  const calendarTrips = (tripRows ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    start_date: t.start_date,
    end_date: t.end_date,
  }))

  // Shares owned by this user (for managing)
  const { data: shareRows } = await (supabase as any)
    .from('calendar_event_shares')
    .select('id, event_id, shared_with_email, created_at')
    .eq('owner_id', user.id)

  const eventShares: Record<string, any[]> = {}
  for (const row of shareRows ?? []) {
    if (!eventShares[row.event_id]) eventShares[row.event_id] = []
    eventShares[row.event_id].push({ id: row.id, shared_with_email: row.shared_with_email, created_at: row.created_at })
  }

  return (
    <CalendarShell
      userId={user.id}
      profile={userProfile}
      initialDbEvents={allDbEvents}
      contacts={[...contactsWithNames, ...linkedAsBirthdays]}
      initialEventShares={eventShares}
      initialSharedWithMeIds={sharedEventIds}
      trips={calendarTrips}
    />
  )
}
