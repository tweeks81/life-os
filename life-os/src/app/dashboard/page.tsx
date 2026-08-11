import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import DashboardClient from '@/components/DashboardClient'
import { generateEventsForRange, RawCalendarEvent, ContactBirthday, RawTripForCalendar } from '@/lib/calendar'
import { getWeatherForLocation, getWeatherByCoords, LocationWeather } from '@/lib/weather'

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
    { data: _warnTax },
    { data: _warnInsurance },
    { data: _warnMot },
    { data: serviceRows },
    { data: expiringMortgageRows },
    { data: expiringPolicyRows },
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
    (supabase as any).from('vehicle_tax').select('vehicle_id, expiry_date').gte('expiry_date', todayStr),
    (supabase as any).from('vehicle_policies').select('vehicle_id, end_date').eq('policy_type', 'insurance').gte('end_date', todayStr),
    (supabase as any).from('vehicle_mots').select('vehicle_id, expiry_date').eq('passed', true).gte('expiry_date', todayStr),
    { data: null }, { data: null }, { data: null },
    (supabase as any).from('vehicle_services').select('vehicle_id, service_date').order('service_date', { ascending: false }),
    (supabase as any).from('property_mortgages').select('id, property_id, lender, end_date').gte('end_date', todayStr).lte('end_date', ninetyDaysStr).order('end_date', { ascending: true }),
    (supabase as any).from('property_policies').select('id, property_id, policy_type, insurer, end_date').gte('end_date', todayStr).lte('end_date', soonStr).order('end_date', { ascending: true }),
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

  // Build vehicle warning data — per vehicle, use the latest expiry so a newly-added
  // record with a longer validity clears the warning from an older expiring record.
  function latestExpiry(rows: any[] | null, dateField: string): Record<string, string> {
    const map: Record<string, string> = {}
    for (const r of rows ?? []) {
      const d = r[dateField] as string
      if (!map[r.vehicle_id] || d > map[r.vehicle_id]) map[r.vehicle_id] = d
    }
    return map
  }
  const latestTax = latestExpiry(validTax, 'expiry_date')
  const latestIns = latestExpiry(validInsurance, 'end_date')
  const latestMot = latestExpiry(validMot, 'expiry_date')

  const taxedIds = new Set(Object.keys(latestTax))
  const insuredIds = new Set(Object.keys(latestIns))
  const motIds = new Set(Object.keys(latestMot))
  const taxWarnIds = new Set(Object.entries(latestTax).filter(([, exp]) => exp <= soonStr).map(([id]) => id))
  const insWarnIds = new Set(Object.entries(latestIns).filter(([, exp]) => exp <= soonStr).map(([id]) => id))
  const motWarnIds = new Set(Object.entries(latestMot).filter(([, exp]) => exp <= soonStr).map(([id]) => id))
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

  // Build policy warning data — attach property name
  const policyWarnings: { propertyId: string; propertyName: string; policyType: string; insurer: string; endDate: string; daysUntil: number }[] = []
  if (expiringPolicyRows && expiringPolicyRows.length > 0) {
    const polPropIds = Array.from(new Set((expiringPolicyRows as any[]).map((r: any) => r.property_id)))
    const { data: polPropNames } = await supabase.from('properties').select('id, name').in('id', polPropIds)
    const polPropMap: Record<string, string> = {}
    for (const p of polPropNames ?? []) polPropMap[p.id] = p.name
    for (const r of expiringPolicyRows as any[]) {
      const exp = new Date(r.end_date + 'T00:00:00')
      const daysUntil = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      policyWarnings.push({
        propertyId: r.property_id,
        propertyName: polPropMap[r.property_id] ?? 'Property',
        policyType: r.policy_type,
        insurer: r.insurer,
        endDate: r.end_date,
        daysUntil,
      })
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  // ── Weather ──────────────────────────────────────────────────────
  // Home location: primary property first, then any owned property
  let homeWeather: LocationWeather | null = null

  let propForWeather: { address_town: string | null; address_city: string | null; address_postcode: string | null; address_country: string | null } | null = null

  const { data: primaryProp } = await supabase
    .from('properties')
    .select('address_town, address_city, address_postcode, address_country')
    .eq('user_id', user.id)
    .eq('is_primary_residence', true)
    .maybeSingle()

  if (primaryProp) {
    propForWeather = primaryProp
  } else {
    // Fall back to first property the user owns
    const { data: anyProp } = await supabase
      .from('properties')
      .select('address_town, address_city, address_postcode, address_country')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    propForWeather = anyProp ?? null
  }

  if (propForWeather) {
    // Prefer town or city name alone — geocoding APIs work best with place names
    const homeQuery =
      propForWeather.address_town ||
      propForWeather.address_city ||
      propForWeather.address_postcode ||
      null
    if (homeQuery) {
      homeWeather = await getWeatherForLocation(homeQuery)
    }
  }

  // Trip weather: query all trips starting within 14 days that have stored destination coords
  const fourteenDaysDate = new Date(today); fourteenDaysDate.setDate(fourteenDaysDate.getDate() + 14)
  const fourteenDaysStr = fourteenDaysDate.toISOString().split('T')[0]

  const { data: upcomingTripRows } = await (supabase as any)
    .from('trips')
    .select('id, name, destination, destination_lat, destination_lon, start_date')
    .eq('user_id', user.id)
    .not('destination_lat', 'is', null)
    .not('start_date', 'is', null)
    .gte('start_date', todayStr)
    .lte('start_date', fourteenDaysStr)
    .order('start_date', { ascending: true })

  const tripWeatherResults: LocationWeather[] = []
  if (upcomingTripRows && upcomingTripRows.length > 0) {
    const fetches = (upcomingTripRows as any[]).map(async (t: any) => {
      const w = await getWeatherByCoords(t.destination_lat, t.destination_lon, t.destination ?? t.name, 7)
      if (w) tripWeatherResults.push({ ...w, locationName: `✈ ${t.name}${w.locationName !== t.name ? ` — ${w.locationName}` : ''}` })
    })
    await Promise.all(fetches)
    // Restore order (Promise.all can resolve out of order)
    tripWeatherResults.sort((a, b) => a.locationName.localeCompare(b.locationName))
  }

  const weatherLocations: LocationWeather[] = [
    ...(homeWeather ? [homeWeather] : []),
    ...tripWeatherResults,
  ]

  return (
    <DashboardClient
      profile={profile}
      firstName={firstName}
      nextTrip={nextTrip}
      weatherLocations={weatherLocations}
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
      policyWarnings={policyWarnings}
    />
  )
}
