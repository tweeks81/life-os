export type EventType = 'birthday' | 'anniversary' | 'remembrance' | 'holiday' | 'other'

export interface CalendarEvent {
  id: string
  title: string
  type: EventType
  date: Date
  notes?: string | null
  colour?: string | null
  isRecurring?: boolean
  sourceId?: string // contact id or db id
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  remembrance: 'Remembrance',
  holiday: 'UK Holiday',
  other: 'Other',
}

export const EVENT_TYPE_COLOURS: Record<EventType, string> = {
  birthday: '#ec4899',
  anniversary: '#f59e0b',
  remembrance: '#6b7280',
  holiday: '#2563eb',
  other: '#7c3aed',
}

export const EVENT_TYPE_BG: Record<EventType, string> = {
  birthday: '#fdf2f8',
  anniversary: '#fffbeb',
  remembrance: '#f9fafb',
  holiday: '#eff6ff',
  other: '#f5f3ff',
}

// ============================================================
// UK (England & Wales) Public Holidays
// Calculates dynamically for any year
// ============================================================

function easterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Last Monday of May (Spring Bank Holiday — not always last Monday, but close enough for display)
function lastMondayOfMay(year: number): Date {
  const d = new Date(year, 4, 31) // May 31
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1)
  return new Date(d)
}

// Last Monday of August (Summer Bank Holiday)
function lastMondayOfAugust(year: number): Date {
  const d = new Date(year, 7, 31) // Aug 31
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1)
  return new Date(d)
}

// Substitute day if holiday falls on weekend
function substituteWeekend(date: Date): Date {
  const day = date.getDay()
  if (day === 6) return addDays(date, 2) // Sat -> Mon
  if (day === 0) return addDays(date, 1) // Sun -> Mon
  return date
}

export function getUKHolidays(year: number): CalendarEvent[] {
  const easter = easterSunday(year)
  const goodFriday = addDays(easter, -2)
  const easterMonday = addDays(easter, 1)

  const holidays: { title: string; date: Date }[] = [
    { title: "New Year's Day", date: substituteWeekend(new Date(year, 0, 1)) },
    { title: 'Good Friday', date: goodFriday },
    { title: 'Easter Monday', date: easterMonday },
    { title: 'Early May Bank Holiday', date: (() => {
      // First Monday of May
      const d = new Date(year, 4, 1)
      while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
      return new Date(d)
    })() },
    { title: 'Spring Bank Holiday', date: lastMondayOfMay(year) },
    { title: 'Summer Bank Holiday', date: lastMondayOfAugust(year) },
    { title: 'Christmas Day', date: substituteWeekend(new Date(year, 11, 25)) },
    { title: 'Boxing Day', date: substituteWeekend(new Date(year, 11, 26)) },
  ]

  return holidays.map((h, i) => ({
    id: `holiday-${year}-${i}`,
    title: h.title,
    type: 'holiday' as EventType,
    date: h.date,
    isRecurring: true,
  }))
}

// ============================================================
// Generate all events for a date range
// ============================================================

export interface RawCalendarEvent {
  id: string
  title: string
  event_type: string
  event_date: string
  recurs_annually: boolean
  notes: string | null
  colour: string | null
}

export interface ContactBirthday {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
}

export interface UserProfile {
  full_name: string | null
  date_of_birth: string | null
}

export function generateEventsForRange(
  startDate: Date,
  endDate: Date,
  dbEvents: RawCalendarEvent[],
  contacts: ContactBirthday[],
  userProfile: UserProfile | null,
): CalendarEvent[] {
  const events: CalendarEvent[] = []

  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()

  // 1. UK Holidays for all years in range
  for (let y = startYear; y <= endYear; y++) {
    for (const h of getUKHolidays(y)) {
      if (h.date >= startDate && h.date <= endDate) {
        events.push(h)
      }
    }
  }

  // 2. User's own birthday
  if (userProfile?.date_of_birth) {
    const dob = new Date(userProfile.date_of_birth)
    for (let y = startYear; y <= endYear; y++) {
      const thisYear = new Date(y, dob.getMonth(), dob.getDate())
      if (thisYear >= startDate && thisYear <= endDate) {
        const age = y - dob.getFullYear()
        events.push({
          id: `my-birthday-${y}`,
          title: `My Birthday${age > 0 ? ` (${age})` : ''}`,
          type: 'birthday',
          date: thisYear,
          isRecurring: true,
        })
      }
    }
  }

  // 3. Contact birthdays
  for (const contact of contacts) {
    if (!contact.date_of_birth) continue
    const dob = new Date(contact.date_of_birth)
    for (let y = startYear; y <= endYear; y++) {
      const thisYear = new Date(y, dob.getMonth(), dob.getDate())
      if (thisYear >= startDate && thisYear <= endDate) {
        const age = y - dob.getFullYear()
        const name = `${contact.first_name} ${contact.last_name}`
        events.push({
          id: `contact-bday-${contact.id}-${y}`,
          title: `${name}'s Birthday${age > 0 ? ` (${age})` : ''}`,
          type: 'birthday',
          date: thisYear,
          isRecurring: true,
          sourceId: contact.id,
        })
      }
    }
  }

  // 4. DB events (custom: anniversaries, remembrance, other birthdays, etc.)
  for (const ev of dbEvents) {
    const evDate = new Date(ev.event_date)
    if (ev.recurs_annually) {
      for (let y = startYear; y <= endYear; y++) {
        const thisYear = new Date(y, evDate.getMonth(), evDate.getDate())
        if (thisYear >= startDate && thisYear <= endDate) {
          const yearsAgo = y - evDate.getFullYear()
          let title = ev.title
          if (yearsAgo > 0 && ev.event_type === 'anniversary') {
            title = `${ev.title} (${yearsAgo}${getOrdinalSuffix(yearsAgo)})`
          }
          events.push({
            id: `${ev.id}-${y}`,
            title,
            type: ev.event_type as EventType,
            date: thisYear,
            notes: ev.notes,
            colour: ev.colour,
            isRecurring: true,
            sourceId: ev.id,
          })
        }
      }
    } else {
      if (evDate >= startDate && evDate <= endDate) {
        events.push({
          id: ev.id,
          title: ev.title,
          type: ev.event_type as EventType,
          date: evDate,
          notes: ev.notes,
          colour: ev.colour,
          isRecurring: false,
          sourceId: ev.id,
        })
      }
    }
  }

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime())
  return events
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0) ? -6 : 1 - day // Monday start
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
