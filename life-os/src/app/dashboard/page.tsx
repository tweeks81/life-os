import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import DashboardClient from '@/components/DashboardClient'
import { generateEventsForRange, RawCalendarEvent, ContactBirthday } from '@/lib/calendar'

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  weekEnd.setHours(23, 59, 59, 999)

  const todayStr = today.toISOString().split('T')[0]
  const soonDate = new Date(today); soonDate.setDate(soonDate.getDate() + 30)
  const soonStr = soonDate.toISOString().split('T')[0]

  const [
    { data: profile },
    { data: nextFlightRow },
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
    { data: warnTax },
    { data: warnInsurance },
    { data: warnMot },
    { data: serviceRows },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    (supabase as any).from('trip_flights').select('trip_id, depart_datetime, arrive_airport').gte('depart_datetime', new Date().toISOString()).order('depart_datetime', { ascending: true }).limit(1).maybeSingle(),
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
    (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', todayStr),
    (supabase as any).from('vehicle_policies').select('vehicle_id').eq('policy_type', 'insurance').gte('end_date', todayStr),
    (supabase as any).from('vehicle_mots').select('vehicle_id').eq('passed', true).gte('expiry_date', todayStr),
    (supabase as any).from('vehicle_tax').select('vehicle_id').gte('expiry_date', todayStr).lte('expiry_date', soonStr),
    (supabase as any).from('vehicle_policies').select('vehicle_id').eq('policy_type', 'insurance').gte('end_date', todayStr).lte('end_date', soonStr),
    (supabase as any).from('vehicle_mots').select('vehicle_id').eq('passed', true).gte('expiry_date', todayStr).lte('expiry_date', soonStr),
    (supabase as any).from('vehicle_services').select('vehicle_id, service_date').order('service_date', { ascending: false }),
  ])

  const linkedIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
  const { data: linkedProfiles } = linkedIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, date_of_birth').in('id', linkedIds).not('date_of_birth', 'is', null)
    : { data: [] }

  const sharedIds = (sharedWithMe ?? []).map((r: any) => r.event_id)
  const { data: sharedEvents } = sharedIds.length > 0
    ? await (supabase as any).from('calendar_events').select('*').in('id', sharedIds)
    : { data: [] }

  const ownIds = new Set((ownEvents ?? []).map((e: any) => e.id))
  const allDbEvents: RawCalendarEvent[] = [
    ...(ownEvents ?? []),
    ...(sharedEvents ?? []).filter((e: any) => !ownIds.has(e.id)),
  ]

  const linkedAsBirthdays: ContactBirthday[] = (linkedProfiles ?? []).map((p: any) => {
    const parts = (p.full_name ?? '').trim().split(' ')
    return { id: `linked-${p.id}`, first_name: parts[0] ?? '', last_name: parts.slice(1).join(' ') || parts[0] || '', date_of_birth: p.date_of_birth }
  })
  const allContacts: ContactBirthday[] = [...(contacts ?? []), ...linkedAsBirthdays]

  const calEvents = generateEventsForRange(today, weekEnd, allDbEvents, allContacts, profile)

  const relevantTasks = (tasks ?? []).filter((t: any) => {
    if (!t.due_date) return false
    const due = new Date(t.due_date); due.setHours(0, 0, 0, 0)
    return due <= weekEnd
  })
  const urgentNoDue = (tasks ?? []).filter((t: any) => t.priority === 1 && !t.due_date)

  // Build vehicle warning data
  const taxedIds = new Set((validTax ?? []).map((r: any) => r.vehicle_id))
  const insuredIds = new Set((validInsurance ?? []).map((r: any) => r.vehicle_id))
  const motIds = new Set((validMot ?? []).map((r: any) => r.vehicle_id))
  const taxWarnIds = new Set((warnTax ?? []).map((r: any) => r.vehicle_id))
  const insWarnIds = new Set((warnInsurance ?? []).map((r: any) => r.vehicle_id))
  const motWarnIds = new Set((warnMot ?? []).map((r: any) => r.vehicle_id))
  const { overdueIds: serviceOverdueIds, soonIds: serviceSoonIds } = computeServiceStatus(serviceRows ?? [])

  const vehicleWarnings = (allVehicles ?? []).map((v: any) => {
    const criticalIssues = [
      !taxedIds.has(v.id) && 'no valid tax',
      !insuredIds.has(v.id) && 'no valid insurance',
      !motIds.has(v.id) && 'no valid MOT',
      serviceOverdueIds.has(v.id) && 'service overdue',
    ].filter(Boolean) as string[]
    const warningIssues = [
      taxWarnIds.has(v.id) && 'tax expiring soon',
      insWarnIds.has(v.id) && 'insurance expiring soon',
      motWarnIds.has(v.id) && 'MOT expiring soon',
      serviceSoonIds.has(v.id) && 'service due soon',
    ].filter(Boolean) as string[]
    return { id: v.id, name: v.name, reg_number: v.reg_number, criticalIssues, warningIssues }
  }).filter((v: any) => v.criticalIssues.length > 0 || v.warningIssues.length > 0)

  let nextTrip: { name: string; daysUntil: number; destination: string | null } | null = null
  if (nextFlightRow) {
    const { data: tripRow } = await (supabase as any).from('trips').select('name').eq('id', nextFlightRow.trip_id).single()
    if (tripRow) {
      const departDate = new Date(nextFlightRow.depart_datetime)
      departDate.setHours(0, 0, 0, 0)
      const todayMidnight = new Date(today)
      todayMidnight.setHours(0, 0, 0, 0)
      const daysUntil = Math.round((departDate.getTime() - todayMidnight.getTime()) / 86400000)
      nextTrip = { name: tripRow.name, daysUntil, destination: nextFlightRow.arrive_airport ?? null }
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <DashboardClient
      profile={profile}
      firstName={firstName}
      nextTrip={nextTrip}
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
      vehicleWarnings={vehicleWarnings}
    />
  )
}
