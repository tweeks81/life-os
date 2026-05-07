import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import DashboardClient from '@/components/DashboardClient'
import { generateEventsForRange, RawCalendarEvent, ContactBirthday } from '@/lib/calendar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  weekEnd.setHours(23, 59, 59, 999)

  // Fetch everything in parallel
  const [
    { data: profile },
    { data: ownEvents },
    { data: contacts },
    { data: linkedRaw },
    { data: sharedWithMe },
    { data: tasks },
    { data: projects },
    { data: allVehicles },
    { data: validTax },
    { data: validInsurance },
    { data: validMot },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    (supabase as any).from('calendar_events').select('*').eq('user_id', user.id),
    supabase.from('contacts').select('id, first_name, last_name, date_of_birth').not('date_of_birth', 'is', null),
    (supabase as any).from('linked_contacts').select('linked_user_id').eq('user_id', user.id),
    (supabase as any).from('calendar_event_shares').select('event_id').eq('shared_with_id', user.id),
    supabase
      .from('tasks')
      .select('*, project:projects(id, name, colour)')
      .neq('status', 'done')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('projects').select('*').eq('status', 'active'),
    supabase.from('vehicles').select('id, name, reg_number').is('sold_date', null),
    (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', new Date().toISOString().split('T')[0]),
    (supabase as any).from('vehicle_policies').select('vehicle_id, end_date').eq('policy_type', 'insurance').gte('end_date', new Date().toISOString().split('T')[0]),
    (supabase as any).from('vehicle_mots').select('vehicle_id').eq('passed', true).gte('expiry_date', new Date().toISOString().split('T')[0]),
  ])

  // Fetch linked profiles for birthdays
  const linkedIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
  const { data: linkedProfiles } = linkedIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, date_of_birth').in('id', linkedIds).not('date_of_birth', 'is', null)
    : { data: [] }

  // Fetch shared calendar events
  const sharedIds = (sharedWithMe ?? []).map((r: any) => r.event_id)
  const { data: sharedEvents } = sharedIds.length > 0
    ? await (supabase as any).from('calendar_events').select('*').in('id', sharedIds)
    : { data: [] }

  const ownIds = new Set((ownEvents ?? []).map((e: any) => e.id))
  const allDbEvents: RawCalendarEvent[] = [
    ...(ownEvents ?? []),
    ...(sharedEvents ?? []).filter((e: any) => !ownIds.has(e.id)),
  ]

  // Build contacts + linked birthdays
  const linkedAsBirthdays: ContactBirthday[] = (linkedProfiles ?? []).map((p: any) => {
    const parts = (p.full_name ?? '').trim().split(' ')
    return { id: `linked-${p.id}`, first_name: parts[0] ?? '', last_name: parts.slice(1).join(' ') || parts[0] || '', date_of_birth: p.date_of_birth }
  })
  const allContacts: ContactBirthday[] = [...(contacts ?? []), ...linkedAsBirthdays]

  // Generate calendar events for today + 7 days
  const calEvents = generateEventsForRange(today, weekEnd, allDbEvents, allContacts, profile)

  // Filter tasks due today or in next 7 days (plus overdue)
  const relevantTasks = (tasks ?? []).filter((t: any) => {
    if (!t.due_date) return false
    const due = new Date(t.due_date)
    due.setHours(0, 0, 0, 0)
    return due <= weekEnd
  })

  // Tasks with no due date but P1
  const urgentNoDue = (tasks ?? []).filter((t: any) => t.priority === 1 && !t.due_date)

  // Work out which vehicles have no valid tax
  const taxedVehicleIds = new Set((validTax ?? []).map((r: any) => r.vehicle_id))
  const insuredVehicleIds = new Set((validInsurance ?? []).map((r: any) => r.vehicle_id))
  const motVehicleIds = new Set((validMot ?? []).map((r: any) => r.vehicle_id))
  const untaxedVehicles = (allVehicles ?? []).filter((v: any) => !taxedVehicleIds.has(v.id))
  const uninsuredVehicles = (allVehicles ?? []).filter((v: any) => !insuredVehicleIds.has(v.id))
  const unmottedVehicles = (allVehicles ?? []).filter((v: any) => !motVehicleIds.has(v.id))

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <DashboardClient
      profile={profile}
      firstName={firstName}
      calEvents={calEvents.map(e => ({
        id: e.id,
        title: e.title,
        type: e.type,
        date: e.date.toISOString(),
        notes: e.notes ?? null,
      }))}
      dueTasks={relevantTasks}
      urgentTasks={urgentNoDue}
      totalActiveTasks={(tasks ?? []).length}
      totalProjects={(projects ?? []).length}
      untaxedVehicles={untaxedVehicles}
      uninsuredVehicles={uninsuredVehicles}
      unmottedVehicles={unmottedVehicles}
    />
  )
}
