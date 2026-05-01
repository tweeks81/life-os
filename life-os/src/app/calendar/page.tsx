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
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url, date_of_birth').eq('id', user.id).single(),
    (supabase as any).from('calendar_events').select('*').eq('user_id', user.id).order('event_date'),
    supabase.from('contacts').select('id, first_name, last_name, date_of_birth').not('date_of_birth', 'is', null),
  ])

  return (
    <CalendarShell
      userId={user.id}
      profile={profile}
      initialDbEvents={dbEvents ?? []}
      contacts={contacts ?? []}
    />
  )
}
