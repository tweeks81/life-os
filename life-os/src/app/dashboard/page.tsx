import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import DashboardClient from '@/components/DashboardClient'
import { generateEventsForRange, RawCalendarEvent, ContactBirthday, RawTripForCalendar } from '@/lib/calendar'
import { getWeatherForLocation, LocationWeather } from '@/lib/weather'

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
  const ninetyDaysDate = new Date(today); ninetyDaysDate.setDate(ninetyDaysDate.getDate() + 90)
  const ninetyDaysStr = ninetyDaysDate.toISOString().split('T')[0]

  const [
    { data: profile },
    { data: nextFlightRow },
    { data: nextAccomRow },
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
    { data: expiringMortgageRows },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    (supabase as any).from('trip_flights').select('trip_id, depart_datetime, arrive_airport').gte('depart_datetime', new Date().toISOString()).order('depart_datetime', { ascending: true }).limit(1).maybeSingle(),
    (supabase as any).from('trip_accommodations').select('trip_id, check_in_date, name').gte('check_in_date', todayStr).order('check_in_date', { ascending: true }).limit(1).maybeSingle(),
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
    (supabase as any).from('property_mortgages').select('id, property_id, lender, end_date').gte('end_date', todayStr).lte('end_date', ninetyDaysStr).order('end_date', { ascending: true }),
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

  // Trips for calendar display
  const { data: dashTripRows } = await (supabase as any)
    .from('trips').select('id, name, start_date, end_date').not('start_date', 'is', null)
  const dashTrips: RawTripForCalendar[] = (dashTripRows ?? []).map((t: any) => ({
    id: t.id, name: t.name, start_date: t.start_date, end_date: t.end_date,
  }))

  const calEvents = generateEventsForRange(today, weekEnd, allDbEvents, allContacts, profile, dashTrips)

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

  // Determine next trip from earliest flight or accommodation
  let nextTrip: { name: string; daysUntil: number; destination: string | null } | null = null
  const flightDate = nextFlightRow ? new Date(nextFlightRow.depart_datetime) : null
  const accomDate = nextAccomRow?.check_in_date ? new Date(nextAccomRow.check_in_date + 'T00:00:00') : null

  let candidateTripId: string | null = null
  let candidateDate: Date | null = null
  let candidateDestination: string | null = null

  if (flightDate && (!accomDate || flightDate <= accomDate)) {
    candidateTripId = nextFlightRow.trip_id
    candidateDate = flightDate
    candidateDestination = nextFlightRow.arrive_airport ?? null
  } else if (accomDate) {
    candidateTripId = nextAccomRow.trip_id
    candidateDate = accomDate
    candidateDestination = nextAccomRow.name ?? null
  }

  if (candidateTripId && candidateDate) {
    const { data: tripRow } = await (supabase as any).from('trips').select('name').eq('id', candidateTripId).single()
    if (tripRow) {
      const startDay = new Date(candidateDate); startDay.setHours(0, 0, 0, 0)
      const todayMidnight = new Date(today); todayMidnight.setHours(0, 0, 0, 0)
      const daysUntil = Math.round((startDay.getTime() - todayMidnight.getTime()) / 86400000)
      nextTrip = { name: tripRow.name, daysUntil, destination: candidateDestination }
    }
  }

  // Build mortgage warning data — attach property name
  const mortgageWarnings: { propertyId: string; propertyName: string; lender: string; endDate: string; daysUntil: number }[] = []
  if (expiringMortgageRows && expiringMortgageRows.length > 0) {
    const propIds = Array.from(new Set((expiringMortgageRows as any[]).map((r: any) => r.property_id)))
    const { data: propNames } = await supabase.from('properties').select('id, name').in('id', propIds)
    const propNameMap: Record<string, string> = {}
    for (const p of propNames ?? []) propNameMap[p.id] = p.name
    for (const r of expiringMortgageRows as any[]) {
      const exp = new Date(r.end_date + 'T00:00:00')
      const daysUntil = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      mortgageWarnings.push({
        propertyId: r.property_id,
        propertyName: propNameMap[r.property_id] ?? 'Property',
        lender: r.lender,
        endDate: r.end_date,
        daysUntil,
      })
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  // ── Weather ──────────────────────────────────────────────────────
  // Home location: primary property's town/city
  let homeWeather: LocationWeather | null = null
  const { data: primaryProperty } = await supabase
    .from('properties')
    .select('address_town, address_city, address_postcode, address_country')
    .eq('user_id', user.id)
    .eq('is_primary_residence', true)
    .maybeSingle()

  const homeQuery = primaryProperty
    ? [primaryProperty.address_town, primaryProperty.address_city, primaryProperty.address_postcode, primaryProperty.address_country]
        .filter(Boolean).join(', ')
    : null

  if (homeQuery) {
    homeWeather = await getWeatherForLocation(homeQuery)
  }

  // Trip weather: only if next trip is within 14 days and has a destination
  let tripWeather: LocationWeather | null = null
  if (nextTrip && nextTrip.daysUntil <= 14 && candidateTripId) {
    // Try accommodation address first
    const { data: accomRow } = await (supabase as any)
      .from('trip_accommodations')
      .select('address, name')
      .eq('trip_id', candidateTripId)
      .not('address', 'is', null)
      .order('check_in_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    const tripQuery = accomRow?.address ?? nextTrip.destination ?? null
    if (tripQuery) {
      tripWeather = await getWeatherForLocation(tripQuery)
      if (tripWeather) tripWeather = { ...tripWeather, locationName: `✈ ${nextTrip.name} — ${tripWeather.locationName}` }
    }
  }

  return (
    <DashboardClient
      profile={profile}
      firstName={firstName}
      nextTrip={nextTrip}
      homeWeather={homeWeather}
      tripWeather={tripWeather}
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
      mortgageWarnings={mortgageWarnings}
    />
  )
}
