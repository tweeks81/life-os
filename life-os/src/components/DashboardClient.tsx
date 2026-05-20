'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import LeftSidebar from './LeftSidebar'
import { EVENT_TYPE_COLOURS, EVENT_TYPE_LABELS, EventType } from '@/lib/calendar'
import { LocationWeather } from '@/lib/weather'

// ── Types ────────────────────────────────────────────────────────────────────

interface DashCalEvent {
  id: string
  title: string
  type: EventType
  date: string
  notes: string | null
}

interface DashTask {
  id: string
  title: string
  priority: number
  status: string
  due_date: string | null
  category: string
  context: string
  project: { id: string; name: string; colour: string | null } | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_COLOURS: Record<number, string> = { 1: '#dc2626', 2: '#ea580c', 3: '#2563eb', 4: '#6b7280' }
const PRIORITY_LABELS: Record<number, string>  = { 1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low' }
const PRIORITY_BG: Record<number, string>      = { 1: '#fef2f2', 2: '#fff7ed', 3: '#eff6ff', 4: '#f9fafb' }

function isoDate(d: Date) { return d.toISOString().split('T')[0] }

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = daysBetween(today, d)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 7) return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtDueDate(dateStr: string): { label: string; overdue: boolean; soon: boolean } {
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true, soon: false }
  if (diff === 0) return { label: 'Due today', overdue: false, soon: true }
  if (diff === 1) return { label: 'Due tomorrow', overdue: false, soon: true }
  if (diff <= 7) return { label: `Due ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, overdue: false, soon: true }
  return { label: `Due ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, overdue: false, soon: false }
}

// ── Props ────────────────────────────────────────────────────────────────────

export default function DashboardClient({
  profile,
  firstName,
  calEvents,
  dueTasks,
  urgentTasks,
  totalActiveTasks,
  totalProjects,
  vehicleWarnings,
  mortgageWarnings,
  nextTrip,
  weatherLocations,
}: {
  profile: any
  firstName: string
  calEvents: DashCalEvent[]
  dueTasks: DashTask[]
  urgentTasks: DashTask[]
  totalActiveTasks: number
  totalProjects: number
  vehicleWarnings: { id: string; name: string; reg_number: string | null; criticalIssues: string[]; warningIssues: string[] }[]
  mortgageWarnings: { propertyId: string; propertyName: string; lender: string; endDate: string; daysUntil: number }[]
  nextTrip: { name: string; daysUntil: number; destination: string | null; start_date: string | null; end_date: string | null } | null
  weatherLocations: LocationWeather[]
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const now = new Date()
  const todayStr = isoDate(now)
  const weekStr = isoDate(new Date(now.getTime() + 7 * 86400000))

  // Partition calendar events
  const todayEvents = useMemo(() =>
    calEvents.filter(e => isoDate(new Date(e.date)) === todayStr),
    [calEvents, todayStr])

  const weekEvents = useMemo(() =>
    calEvents.filter(e => {
      const d = isoDate(new Date(e.date))
      return d > todayStr && d <= weekStr
    }),
    [calEvents, todayStr, weekStr])

  const monthEvents = useMemo(() =>
    calEvents.filter(e => {
      const d = isoDate(new Date(e.date))
      return d > weekStr
    }),
    [calEvents, weekStr])

  // Partition tasks
  const overdueTasks = dueTasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date); d.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    return d < today
  })
  const priorityTasks = [...urgentTasks, ...dueTasks.filter(t => t.priority <= 2)].slice(0, 8)
  const otherCount = totalActiveTasks - priorityTasks.length

  // Home weather (first location, no ✈)
  const homeWeather = weatherLocations.find(w => !w.locationName.startsWith('✈')) ?? null
  const tripWeatherLocations = weatherLocations.filter(w => w.locationName.startsWith('✈'))

  // Trip forecast: filter to trip dates if available
  const tripForecastDays = useMemo(() => {
    if (!nextTrip?.start_date || tripWeatherLocations.length === 0) return null
    const tw = tripWeatherLocations[0]
    if (!tw) return null
    const start = nextTrip.start_date
    const end = nextTrip.end_date ?? nextTrip.start_date
    return tw.days.filter(d => d.date >= start && d.date <= end)
  }, [nextTrip, tripWeatherLocations])

  const sidebarW = sidebarOpen ? 220 : 64

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="db-shell">
      <LeftSidebar profile={profile} expanded={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />

      <main className="db-main" style={{ marginLeft: sidebarW }}>

        {/* ── Header ── */}
        <header className="db-header">
          <div className="db-header-date">
            <div className="db-day-name">{now.toLocaleDateString('en-GB', { weekday: 'long' })}</div>
            <div className="db-date-big">{now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div className="db-greeting">{greeting}, {firstName}</div>
          </div>
          <div className="db-header-stats">
            <Link href="/tasks" className="db-stat">
              <span className="db-stat-n">{totalActiveTasks}</span>
              <span className="db-stat-l">Active tasks</span>
            </Link>
            <Link href="/tasks" className="db-stat db-stat-warn">
              <span className="db-stat-n" style={{ color: '#dc2626' }}>{overdueTasks.length + urgentTasks.length}</span>
              <span className="db-stat-l">Need attention</span>
            </Link>
            <Link href="/tasks" className="db-stat">
              <span className="db-stat-n">{totalProjects}</span>
              <span className="db-stat-l">Projects</span>
            </Link>
            {nextTrip && (
              <Link href="/trips" className="db-stat db-stat-trip">
                <span className="db-stat-n" style={{ color: '#0369a1' }}>{nextTrip.daysUntil === 0 ? 'Today' : `${nextTrip.daysUntil}d`}</span>
                <span className="db-stat-l">Next trip</span>
              </Link>
            )}
          </div>
        </header>

        {/* ── Alerts ── */}
        {(vehicleWarnings.length > 0 || mortgageWarnings.length > 0) && (
          <div className="db-alerts">
            {vehicleWarnings.map(v => (
              <Link href="/vehicles" key={v.id} className="db-alert db-alert-red">
                <span className="db-alert-icon">⚠</span>
                <span className="db-alert-body">
                  <strong>{v.name}{v.reg_number ? ` (${v.reg_number.toUpperCase()})` : ''}</strong>
                  {' '}{[...v.criticalIssues, ...v.warningIssues].join(' · ')}
                </span>
              </Link>
            ))}
            {mortgageWarnings.map(m => (
              <Link href="/properties" key={`${m.propertyId}-${m.endDate}`} className="db-alert db-alert-amber">
                <span className="db-alert-icon">🏦</span>
                <span className="db-alert-body">
                  <strong>{m.propertyName}</strong>
                  {' '}mortgage with {m.lender} renews in <strong>{m.daysUntil}d</strong>
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="db-grid">

          {/* Column 1: Weather */}
          <section className="db-col db-col-weather">
            {homeWeather ? (
              <WeatherPanel weather={homeWeather} />
            ) : (
              <div className="db-card db-empty-weather">
                <span className="db-empty-icon">🌤️</span>
                <p>No home location set</p>
                <Link href="/properties">Add a property →</Link>
              </div>
            )}
          </section>

          {/* Column 2: Calendar */}
          <section className="db-col db-col-calendar">
            <CalendarPanel
              todayEvents={todayEvents}
              weekEvents={weekEvents}
              monthEvents={monthEvents}
            />
          </section>

          {/* Column 3: Tasks + Trip */}
          <section className="db-col db-col-right">
            <TasksPanel
              priorityTasks={priorityTasks}
              overdueTasks={overdueTasks}
              urgentTasks={urgentTasks}
              otherCount={otherCount}
              totalActive={totalActiveTasks}
            />
            {nextTrip && (
              <TripPanel
                trip={nextTrip}
                forecastDays={tripForecastDays}
              />
            )}
          </section>

        </div>

      </main>

      <style>{`
        .db-shell { min-height: 100vh; background: var(--cream); }
        .db-main {
          transition: margin-left 0.22s cubic-bezier(0.4,0,0.2,1);
          min-height: 100vh;
          padding: 0 0 3rem;
        }

        /* Header */
        .db-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 2rem; padding: 2rem 2rem 1.5rem; flex-wrap: wrap;
          border-bottom: 1px solid var(--border-light); background: white;
        }
        .db-day-name { font-size: 0.875rem; font-weight: 600; color: var(--terracotta); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem; }
        .db-date-big { font-family: var(--font-display); font-size: 2rem; font-weight: 600; color: var(--deep-brown); line-height: 1.1; letter-spacing: -0.02em; }
        .db-greeting { font-size: 0.9375rem; color: var(--text-muted); margin-top: 0.375rem; }
        .db-header-stats { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
        .db-stat {
          display: flex; flex-direction: column; align-items: center;
          padding: 0.625rem 1.125rem; background: var(--cream); border: 1px solid var(--border-light);
          border-radius: 12px; text-decoration: none; transition: all 0.15s; min-width: 80px;
        }
        .db-stat:hover { background: white; box-shadow: 0 2px 8px var(--shadow-warm); transform: translateY(-1px); }
        .db-stat-n { font-size: 1.5rem; font-weight: 700; font-family: var(--font-display); color: var(--deep-brown); line-height: 1.2; }
        .db-stat-l { font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; white-space: nowrap; }
        .db-stat-trip { background: #f0f9ff; border-color: #bae6fd; }
        .db-stat-trip:hover { background: #e0f2fe; }

        /* Alerts */
        .db-alerts { display: flex; flex-direction: column; gap: 0.375rem; padding: 0.75rem 2rem; }
        .db-alert {
          display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1rem;
          border-radius: 10px; font-size: 0.8125rem; text-decoration: none; color: inherit; transition: opacity 0.15s;
        }
        .db-alert:hover { opacity: 0.85; }
        .db-alert-red { background: #fef2f2; border: 1px solid #fecaca; }
        .db-alert-amber { background: #fffbeb; border: 1px solid #fde68a; }
        .db-alert-icon { font-size: 1rem; flex-shrink: 0; }
        .db-alert-body { font-size: 0.8125rem; color: var(--text-secondary); }
        .db-alert-red .db-alert-body { color: #7f1d1d; }
        .db-alert-amber .db-alert-body { color: #78350f; }

        /* Main grid */
        .db-grid {
          display: grid;
          grid-template-columns: 280px 1fr 300px;
          gap: 1.25rem;
          padding: 1.5rem 2rem;
          align-items: start;
        }
        .db-col { display: flex; flex-direction: column; gap: 1rem; }

        /* Shared card */
        .db-card {
          background: white; border: 1px solid var(--border-light);
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 1px 4px var(--shadow-warm);
        }
        .db-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 1.125rem 0.625rem;
          border-bottom: 1px solid var(--border-light);
        }
        .db-card-title { font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; }
        .db-card-link { font-size: 0.75rem; color: var(--terracotta); text-decoration: none; font-weight: 600; }
        .db-card-link:hover { color: var(--terracotta-light); }

        .db-empty-weather { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem; text-align: center; }
        .db-empty-icon { font-size: 2rem; }

        @media (max-width: 1100px) {
          .db-grid { grid-template-columns: 1fr 1fr; }
          .db-col-weather { grid-column: 1 / -1; }
        }
        @media (max-width: 768px) {
          .db-main { margin-left: 0 !important; }
          .db-grid { grid-template-columns: 1fr; padding: 1rem; }
          .db-header { padding: 1.25rem 1rem; }
          .db-alerts { padding: 0.5rem 1rem; }
          .db-date-big { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  )
}

// ── Weather Panel ─────────────────────────────────────────────────────────────

function WeatherPanel({ weather }: { weather: LocationWeather }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const todayDay = weather.days[0]
  const restDays = weather.days.slice(1)

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
    if (diff === 1) return 'Tomorrow'
    return d.toLocaleDateString('en-GB', { weekday: 'short' })
  }

  return (
    <div className="db-card wp-card">
      <div className="db-card-header">
        <span className="db-card-title">📍 {weather.locationName}</span>
        <span className="wp-today-label">Today</span>
      </div>

      {todayDay && (
        <div className="wp-today">
          <div className="wp-today-emoji">{todayDay.emoji}</div>
          <div className="wp-today-info">
            <div className="wp-today-desc">{todayDay.description}</div>
            <div className="wp-today-temps">
              <span className="wp-today-high">{todayDay.maxTemp}°</span>
              <span className="wp-today-low">{todayDay.minTemp}°</span>
            </div>
          </div>
        </div>
      )}

      {restDays.length > 0 && (
        <div className="wp-week">
          {restDays.map(day => (
            <div key={day.date} className="wp-week-day">
              <div className="wp-week-label">{dayLabel(day.date)}</div>
              <div className="wp-week-emoji" title={day.description}>{day.emoji}</div>
              <div className="wp-week-high">{day.maxTemp}°</div>
              <div className="wp-week-low">{day.minTemp}°</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .wp-card {}
        .wp-today-label { font-size: 0.75rem; color: var(--text-muted); }
        .wp-today {
          display: flex; align-items: center; gap: 1rem;
          padding: 1.25rem 1.25rem 1rem;
        }
        .wp-today-emoji { font-size: 3.5rem; line-height: 1; flex-shrink: 0; }
        .wp-today-info { min-width: 0; }
        .wp-today-desc { font-size: 0.9375rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.375rem; }
        .wp-today-temps { display: flex; align-items: baseline; gap: 0.625rem; }
        .wp-today-high { font-size: 2.25rem; font-weight: 700; color: var(--deep-brown); font-family: var(--font-display); line-height: 1; }
        .wp-today-low { font-size: 1.125rem; color: var(--text-muted); font-weight: 500; }
        .wp-week {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.25rem;
          padding: 0 0.75rem 0.875rem;
        }
        .wp-week-day {
          display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
          padding: 0.5rem 0.25rem; border-radius: 10px; background: var(--cream);
        }
        .wp-week-label { font-size: 0.6rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .wp-week-emoji { font-size: 1.25rem; line-height: 1; }
        .wp-week-high { font-size: 0.8125rem; font-weight: 700; color: var(--deep-brown); }
        .wp-week-low { font-size: 0.6875rem; color: var(--text-muted); }
      `}</style>
    </div>
  )
}

// ── Calendar Panel ────────────────────────────────────────────────────────────

function CalendarPanel({ todayEvents, weekEvents, monthEvents }: {
  todayEvents: DashCalEvent[]
  weekEvents: DashCalEvent[]
  monthEvents: DashCalEvent[]
}) {
  // Group week events by date
  const weekGrouped: Record<string, DashCalEvent[]> = {}
  for (const e of weekEvents) {
    const d = isoDate(new Date(e.date))
    if (!weekGrouped[d]) weekGrouped[d] = []
    weekGrouped[d].push(e)
  }
  const weekDates = Object.keys(weekGrouped).sort()

  // Group month events by date
  const monthGrouped: Record<string, DashCalEvent[]> = {}
  for (const e of monthEvents) {
    const d = isoDate(new Date(e.date))
    if (!monthGrouped[d]) monthGrouped[d] = []
    monthGrouped[d].push(e)
  }
  const monthDates = Object.keys(monthGrouped).sort().slice(0, 12)

  return (
    <div className="db-card cal-card">
      <div className="db-card-header">
        <span className="db-card-title">Calendar</span>
        <Link href="/calendar" className="db-card-link">View all →</Link>
      </div>
      <div className="cal-body">

        {/* Today */}
        <div className="cal-section-label cal-today-label">
          Today — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
        </div>
        {todayEvents.length === 0 ? (
          <div className="cal-empty">Nothing scheduled today</div>
        ) : todayEvents.map(e => <CalRow key={e.id} event={e} />)}

        {/* This week */}
        {weekDates.length > 0 && (
          <>
            <div className="cal-section-divider" />
            <div className="cal-section-label">This week</div>
            {weekDates.map(d => (
              <div key={d}>
                <div className="cal-date-label">{fmtDate(d)}</div>
                {weekGrouped[d].map(e => <CalRow key={e.id} event={e} />)}
              </div>
            ))}
          </>
        )}

        {/* Next 30 days */}
        {monthDates.length > 0 && (
          <>
            <div className="cal-section-divider" />
            <div className="cal-section-label">Next 30 days</div>
            {monthDates.map(d => (
              <div key={d}>
                <div className="cal-date-label">{fmtDate(d)}</div>
                {monthGrouped[d].map(e => <CalRow key={e.id} event={e} compact />)}
              </div>
            ))}
            {Object.keys(monthGrouped).length > 12 && (
              <div className="cal-more">+{Object.keys(monthGrouped).length - 12} more days — <Link href="/calendar">view calendar</Link></div>
            )}
          </>
        )}

        {weekDates.length === 0 && monthDates.length === 0 && todayEvents.length === 0 && (
          <div className="cal-empty-all">Nothing in the next 30 days</div>
        )}

      </div>

      <style>{`
        .cal-card {}
        .cal-body { padding: 0.625rem 0 0.75rem; }
        .cal-section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); padding: 0.125rem 1.125rem 0.375rem; }
        .cal-today-label { color: var(--terracotta); }
        .cal-date-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); padding: 0.375rem 1.125rem 0.2rem; }
        .cal-section-divider { height: 1px; background: var(--border-light); margin: 0.625rem 1.125rem; }
        .cal-empty { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; padding: 0.25rem 1.125rem 0.5rem; }
        .cal-empty-all { font-size: 0.875rem; color: var(--text-muted); font-style: italic; padding: 1.5rem; text-align: center; }
        .cal-more { font-size: 0.75rem; color: var(--text-muted); padding: 0.5rem 1.125rem; }
        .cal-more a { color: var(--terracotta); text-decoration: none; font-weight: 600; }

        .cal-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem 1.125rem; transition: background 0.1s; border-radius: 0; }
        .cal-row:hover { background: var(--cream); }
        .cal-row-compact { padding: 0.25rem 1.125rem; }
        .cal-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cal-row-title { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cal-row-compact .cal-row-title { font-size: 0.8125rem; }
        .cal-row-type { font-size: 0.6875rem; color: var(--text-muted); margin-top: 0.05rem; }
      `}</style>
    </div>
  )
}

function CalRow({ event, compact = false }: { event: DashCalEvent; compact?: boolean }) {
  const colour = EVENT_TYPE_COLOURS[event.type]
  return (
    <Link href="/calendar" className={`cal-row ${compact ? 'cal-row-compact' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
      <div className="cal-dot" style={{ background: colour }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cal-row-title">{event.title}</div>
        {!compact && <div className="cal-row-type">{EVENT_TYPE_LABELS[event.type]}</div>}
      </div>
    </Link>
  )
}

// ── Tasks Panel ───────────────────────────────────────────────────────────────

function TasksPanel({ priorityTasks, overdueTasks, urgentTasks, otherCount, totalActive }: {
  priorityTasks: DashTask[]
  overdueTasks: DashTask[]
  urgentTasks: DashTask[]
  otherCount: number
  totalActive: number
}) {
  return (
    <div className="db-card tasks-card">
      <div className="db-card-header">
        <span className="db-card-title">Tasks</span>
        <Link href="/tasks" className="db-card-link">View all →</Link>
      </div>
      <div className="tasks-body">
        {overdueTasks.length > 0 && (
          <div className="tasks-group">
            <div className="tasks-group-label tasks-overdue-label">⚠ Overdue ({overdueTasks.length})</div>
            {overdueTasks.slice(0,3).map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
        {urgentTasks.length > 0 && (
          <div className="tasks-group">
            <div className="tasks-group-label" style={{ color: '#dc2626' }}>🔴 Urgent — no due date</div>
            {urgentTasks.slice(0,3).map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
        {priorityTasks.filter(t => t.priority <= 2 && !overdueTasks.includes(t)).length > 0 && (
          <div className="tasks-group">
            <div className="tasks-group-label">High priority</div>
            {priorityTasks.filter(t => t.priority <= 2).slice(0,5).map(t => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
        {totalActive === 0 ? (
          <div className="tasks-empty">All caught up! 🎉</div>
        ) : otherCount > 0 ? (
          <Link href="/tasks" className="tasks-summary">
            <span>+{otherCount} more active task{otherCount !== 1 ? 's' : ''}</span>
            <span className="tasks-summary-arrow">→</span>
          </Link>
        ) : null}
      </div>

      <style>{`
        .tasks-card {}
        .tasks-body { padding: 0.5rem 0 0.25rem; }
        .tasks-group { margin-bottom: 0.375rem; }
        .tasks-group-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); padding: 0.375rem 1.125rem 0.2rem; }
        .tasks-overdue-label { color: #dc2626; }
        .tasks-empty { font-size: 0.875rem; color: var(--text-muted); font-style: italic; padding: 1rem 1.125rem; text-align: center; }
        .tasks-summary {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.625rem 1.125rem; font-size: 0.8125rem; font-weight: 600;
          color: var(--terracotta); text-decoration: none; border-top: 1px solid var(--border-light);
          margin-top: 0.25rem; transition: background 0.12s;
        }
        .tasks-summary:hover { background: var(--cream); }
        .tasks-summary-arrow { font-size: 1rem; }

        .task-row {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.375rem 1.125rem; transition: background 0.1s; text-decoration: none; color: inherit;
        }
        .task-row:hover { background: var(--cream); }
        .task-bar { width: 3px; height: 28px; border-radius: 2px; flex-shrink: 0; }
        .task-row-body { flex: 1; min-width: 0; }
        .task-row-title { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .task-row-meta { display: flex; gap: 0.375rem; align-items: center; margin-top: 0.1rem; }
        .task-pill { font-size: 0.6rem; font-weight: 600; padding: 0.1rem 0.375rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .task-due { font-size: 0.6875rem; font-weight: 600; }
        .task-due-overdue { color: #dc2626; }
        .task-due-soon { color: var(--terracotta); }
        .task-due-ok { color: var(--text-muted); }
      `}</style>
    </div>
  )
}

function TaskRow({ task }: { task: DashTask }) {
  const colour = PRIORITY_COLOURS[task.priority]
  const bg = PRIORITY_BG[task.priority]
  const due = task.due_date ? fmtDueDate(task.due_date) : null
  return (
    <Link href="/tasks" className="task-row">
      <div className="task-bar" style={{ background: colour }} />
      <div className="task-row-body">
        <div className="task-row-title">{task.title}</div>
        <div className="task-row-meta">
          <span className="task-pill" style={{ background: bg, color: colour }}>{PRIORITY_LABELS[task.priority]}</span>
          {task.project && (
            <span className="task-pill" style={{ background: (task.project.colour ?? '#8b6b4a') + '22', color: task.project.colour ?? '#8b6b4a' }}>
              {task.project.name}
            </span>
          )}
          {due && (
            <span className={`task-due ${due.overdue ? 'task-due-overdue' : due.soon ? 'task-due-soon' : 'task-due-ok'}`}>
              {due.overdue ? '⚠ ' : ''}{due.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Trip Panel ────────────────────────────────────────────────────────────────

function TripPanel({ trip, forecastDays }: {
  trip: { name: string; daysUntil: number; destination: string | null; start_date: string | null; end_date: string | null }
  forecastDays: LocationWeather['days'] | null
}) {
  const isToday = trip.daysUntil === 0

  const fmtTripDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  const fmtForecastLabel = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })

  return (
    <div className="db-card trip-card">
      <div className="trip-card-hero">
        <div className="trip-hero-left">
          <div className="trip-label">Next trip</div>
          <div className="trip-name">{trip.name}</div>
          {trip.destination && <div className="trip-dest">📍 {trip.destination}</div>}
          {(trip.start_date || trip.end_date) && (
            <div className="trip-dates">
              {trip.start_date && fmtTripDate(trip.start_date)}
              {trip.start_date && trip.end_date && ' → '}
              {trip.end_date && fmtTripDate(trip.end_date)}
            </div>
          )}
        </div>
        <div className="trip-countdown">
          {isToday ? (
            <span className="trip-today">Today!</span>
          ) : (
            <>
              <span className="trip-days-n">{trip.daysUntil}</span>
              <span className="trip-days-l">days to go</span>
            </>
          )}
        </div>
      </div>

      {forecastDays && forecastDays.length > 0 && (
        <div className="trip-forecast">
          <div className="trip-forecast-label">Forecast for your trip</div>
          <div className="trip-forecast-days">
            {forecastDays.map(day => (
              <div key={day.date} className="trip-forecast-day">
                <div className="trip-forecast-date">{fmtForecastLabel(day.date)}</div>
                <div className="trip-forecast-emoji" title={day.description}>{day.emoji}</div>
                <div className="trip-forecast-high">{day.maxTemp}°</div>
                <div className="trip-forecast-low">{day.minTemp}°</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="trip-footer">
        <Link href="/trips" className="trip-view-link">View full itinerary →</Link>
      </div>

      <style>{`
        .trip-card {}
        .trip-card-hero {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
          padding: 1.125rem 1.25rem 1rem;
          background: linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%);
        }
        .trip-label { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-bottom: 0.25rem; }
        .trip-name { font-size: 1.0625rem; font-weight: 700; color: white; line-height: 1.3; }
        .trip-dest { font-size: 0.8rem; color: rgba(255,255,255,0.65); margin-top: 0.2rem; }
        .trip-dates { font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-top: 0.125rem; }
        .trip-countdown { text-align: center; flex-shrink: 0; }
        .trip-days-n { display: block; font-size: 2.5rem; font-weight: 700; color: white; font-family: var(--font-display); line-height: 1; }
        .trip-days-l { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.55); }
        .trip-today { font-size: 1.25rem; font-weight: 700; color: #fbbf24; }

        .trip-forecast { padding: 0.875rem 1.125rem; }
        .trip-forecast-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 0.625rem; }
        .trip-forecast-days { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .trip-forecast-day {
          display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
          padding: 0.5rem 0.375rem; border-radius: 10px; background: #f0f9ff; border: 1px solid #bae6fd;
          min-width: 48px; flex: 1;
        }
        .trip-forecast-date { font-size: 0.625rem; font-weight: 700; color: #0369a1; text-align: center; white-space: nowrap; }
        .trip-forecast-emoji { font-size: 1.375rem; line-height: 1; }
        .trip-forecast-high { font-size: 0.8125rem; font-weight: 700; color: #0c4a6e; }
        .trip-forecast-low { font-size: 0.6875rem; color: #0369a1; }

        .trip-footer { padding: 0.625rem 1.25rem; border-top: 1px solid var(--border-light); }
        .trip-view-link { font-size: 0.8125rem; font-weight: 600; color: var(--terracotta); text-decoration: none; }
        .trip-view-link:hover { color: var(--terracotta-light); }
      `}</style>
    </div>
  )
}
