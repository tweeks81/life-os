export interface Trip {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface TripFlight {
  id: string
  trip_id: string
  user_id: string
  depart_airport: string
  depart_terminal: string | null
  depart_datetime: string
  depart_timezone: string | null
  flight_number: string | null
  booking_reference: string | null
  booked_via: string | null
  arrive_airport: string
  arrive_terminal: string | null
  arrive_datetime: string
  arrive_timezone: string | null
  notes: string | null
  sort_order: number | null
  created_at: string
}

export interface TripParking {
  id: string
  trip_id: string
  user_id: string
  company: string | null
  reference: string | null
  start_datetime: string
  end_datetime: string
  notes: string | null
  sort_order: number | null
  created_at: string
}

export interface TripTaxi {
  id: string
  trip_id: string
  user_id: string
  company: string | null
  collection_address: string
  collection_datetime: string
  notes: string | null
  sort_order: number | null
  created_at: string
}

export interface TripAccommodation {
  id: string
  trip_id: string
  user_id: string
  accommodation_type: string
  name: string | null
  address: string | null
  booking_reference: string | null
  check_in_date: string | null
  check_out_date: string | null
  notes: string | null
  sort_order: number | null
  created_at: string
}

export interface TripShare {
  id: string
  trip_id: string
  owner_id: string
  shared_with_user_id: string
  name: string | null
  created_at: string
}

export interface LinkedContactForSharing {
  user_id: string
  full_name: string | null
}

export const ACCOMMODATION_TYPES: Record<string, string> = {
  hotel: 'Hotel',
  villa: 'Villa',
  apartment: 'Apartment',
  airbnb: 'Airbnb',
  hostel: 'Hostel',
  other: 'Other',
}

export const ACCOMMODATION_ICONS: Record<string, string> = {
  hotel: '🏨',
  villa: '🏡',
  apartment: '🏢',
  airbnb: '🔑',
  hostel: '🛏️',
  other: '🏠',
}

export function flightDuration(depart: string, arrive: string): string {
  const diff = new Date(arrive).getTime() - new Date(depart).getTime()
  if (diff <= 0) return ''
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatDT(dt: string): string {
  return new Date(dt).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDTInZone(dt: string, tz?: string | null): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  }
  if (tz) opts.timeZone = tz
  return new Date(dt).toLocaleString('en-GB', opts)
}

export function tzShort(dt: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, timeZoneName: 'short',
  }).formatToParts(new Date(dt)).find(p => p.type === 'timeZoneName')?.value ?? ''
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatTime(dt: string): string {
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
