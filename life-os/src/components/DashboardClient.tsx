'use client'

import Link from 'next/link'
import NavBar from './NavBar'
import { EVENT_TYPE_COLOURS, EVENT_TYPE_LABELS, EventType } from '@/lib/calendar'

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

const PRIORITY_COLOURS: Record<number, string> = {
  1: '#dc2626', 2: '#ea580c', 3: '#2563eb', 4: '#6b7280'
}
const PRIORITY_LABELS: Record<number, string> = {
  1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low'
}
const PRIORITY_BG: Record<number, string> = {
  1: '#fef2f2', 2: '#fff7ed', 3: '#eff6ff', 4: '#f9fafb'
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const date = new Date(d); date.setHours(0,0,0,0)
  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function formatDueDate(dateStr: string): { label: string; overdue: boolean } {
  const d = new Date(dateStr); d.setHours(0,0,0,0)
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { label: 'Due today', overdue: false }
  if (diff === 1) return { label: 'Due tomorrow', overdue: false }
  return { label: `Due ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, overdue: false }
}

function groupEventsByDay(events: DashCalEvent[]) {
  const groups: Record<string, DashCalEvent[]> = {}
  for (const ev of events) {
    const d = new Date(ev.date); d.setHours(0,0,0,0)
    const key = d.toISOString()
    if (!groups[key]) groups[key] = []
    groups[key].push(ev)
  }
  return Object.entries(groups).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
}

export default function DashboardClient({
  profile,
  firstName,
  calEvents,
  dueTasks,
  urgentTasks,
  totalActiveTasks,
  totalProjects,
  vehicleWarnings,
}: {
  profile: any
  firstName: string
  calEvents: DashCalEvent[]
  dueTasks: DashTask[]
  urgentTasks: DashTask[]
  totalActiveTasks: number
  totalProjects: number
  vehicleWarnings: { id: string; name: string; reg_number: string | null; criticalIssues: string[]; warningIssues: string[] }[]
}) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const todayStr = new Date().toDateString()
  const todayEvents = calEvents.filter(e => new Date(e.date).toDateString() === todayStr)
  const upcomingEvents = calEvents.filter(e => new Date(e.date).toDateString() !== todayStr)
  const upcomingGrouped = groupEventsByDay(upcomingEvents)

  const todayTasks = dueTasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date); d.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    return d.getTime() === today.getTime()
  })
  const overdueTasks = dueTasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date); d.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    return d.getTime() < today.getTime()
  })
  const upcomingTasks = dueTasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date); d.setHours(0,0,0,0)
    const today = new Date(); today.setHours(0,0,0,0)
    return d.getTime() > today.getTime()
  })

  const hasAnythingToday = todayEvents.length > 0 || todayTasks.length > 0 || overdueTasks.length > 0 || urgentTasks.length > 0

  return (
    <div className="dash">
      <NavBar profile={profile} />

      <main className="dash-main">
        <div className="dash-header">
          <div className="dash-greeting-block">
            <p className="dash-greeting">{greeting},</p>
            <h1 className="dash-name">{firstName}</h1>
            <p className="dash-date">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="dash-stats">
            <Link href="/tasks" className="stat-card">
              <span className="stat-num">{totalActiveTasks}</span>
              <span className="stat-label">Active tasks</span>
            </Link>
            <Link href="/tasks" className="stat-card">
              <span className="stat-num" style={{ color: '#dc2626' }}>{overdueTasks.length + urgentTasks.length}</span>
              <span className="stat-label">Need attention</span>
            </Link>
            <Link href="/tasks" className="stat-card">
              <span className="stat-num">{totalProjects}</span>
              <span className="stat-label">Projects</span>
            </Link>
          </div>
        </div>

        {vehicleWarnings.length > 0 && (
          <div className="vehicle-alert">
            <div className="vehicle-alert-header">
              <span className="vehicle-alert-icon">⚠</span>
              <strong>Vehicle action required</strong>
              <a href="/vehicles" className="vehicle-alert-link">View vehicles →</a>
            </div>
            <div className="vehicle-alert-list">
              {vehicleWarnings.map(v => (
                <div key={v.id} className="vehicle-alert-row">
                  <span className="vehicle-alert-name">
                    {v.name}{v.reg_number ? ` (${v.reg_number.toUpperCase()})` : ''}
                  </span>
                  <span className="vehicle-alert-issues">
                    {v.criticalIssues.map((issue, i) => (
                      <span key={i} className="issue-critical">{issue}</span>
                    ))}
                    {v.warningIssues.map((issue, i) => (
                      <span key={i} className="issue-warning">{issue}</span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dash-columns">

          <section className="dash-section">
            <div className="section-header">
              <h2 className="section-title">Today</h2>
              <span className="section-date">{now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
            </div>

            {!hasAnythingToday && (
              <div className="empty-day">
                <span className="empty-icon">✦</span>
                <p>A clear day — nothing scheduled.</p>
              </div>
            )}

            {overdueTasks.length > 0 && (
              <div className="day-group">
                <div className="day-group-label overdue-label">⚠ Overdue</div>
                {overdueTasks.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}

            {urgentTasks.length > 0 && (
              <div className="day-group">
                <div className="day-group-label urgent-label">🔴 Urgent — no due date</div>
                {urgentTasks.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}

            {todayEvents.length > 0 && (
              <div className="day-group">
                <div className="day-group-label">📅 Calendar</div>
                {todayEvents.map(e => <CalEventRow key={e.id} event={e} />)}
              </div>
            )}

            {todayTasks.length > 0 && (
              <div className="day-group">
                <div className="day-group-label">✓ Due today</div>
                {todayTasks.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </section>

          <section className="dash-section">
            <div className="section-header">
              <h2 className="section-title">Coming up</h2>
              <span className="section-date">Next 7 days</span>
            </div>

            {upcomingEvents.length === 0 && upcomingTasks.length === 0 && (
              <div className="empty-day">
                <span className="empty-icon">✦</span>
                <p>Nothing in the next 7 days.</p>
              </div>
            )}

            {upcomingGrouped.map(([dateKey, events]) => (
              <div key={dateKey} className="day-group">
                <div className="day-group-label">📅 {formatDay(dateKey)}</div>
                {events.map(e => <CalEventRow key={e.id} event={e} />)}
              </div>
            ))}

            {upcomingTasks.length > 0 && (
              <div className="day-group">
                <div className="day-group-label">✓ Upcoming tasks</div>
                {upcomingTasks.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </section>

        </div>

        <div className="mobile-bottom-spacer" />
      </main>

      <style>{`
        .dash { min-height: 100vh; background: var(--cream); }
        .dash-main { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }
        .dash-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .dash-greeting { font-size: 0.9375rem; color: var(--text-muted); margin-bottom: 0.125rem; }
        .dash-name { font-size: 2.25rem; font-weight: 600; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 0.375rem; }
        .dash-date { font-size: 0.875rem; color: var(--text-secondary); }
        .dash-stats { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .stat-card { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 1.25rem; background: white; border: 1px solid var(--border-light); border-radius: 12px; text-decoration: none; transition: all 0.15s; min-width: 80px; box-shadow: 0 1px 4px var(--shadow-warm); }
        .stat-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px var(--shadow-warm-md); }
        .stat-num { font-size: 1.5rem; font-weight: 700; font-family: var(--font-display); color: var(--deep-brown); line-height: 1.2; }
        .stat-label { font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; white-space: nowrap; }
        .dash-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
        .dash-section { display: flex; flex-direction: column; gap: 1rem; }
        .section-header { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 0.625rem; border-bottom: 2px solid var(--parchment); }
        .section-title { font-size: 1.125rem; font-weight: 600; letter-spacing: -0.01em; }
        .section-date { font-size: 0.8125rem; color: var(--text-muted); }
        .empty-day { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem 1rem; text-align: center; background: white; border-radius: 12px; border: 1px solid var(--border-light); }
        .empty-icon { font-size: 1.5rem; color: var(--parchment); }
        .empty-day p { font-size: 0.875rem; color: var(--text-muted); font-style: italic; }
        .day-group { display: flex; flex-direction: column; gap: 0.375rem; }
        .day-group-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.02em; padding: 0.125rem 0; }
        .overdue-label { color: #dc2626; }
        .urgent-label { color: #dc2626; }
        .task-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.875rem; background: white; border: 1px solid var(--border-light); border-radius: 10px; text-decoration: none; color: inherit; transition: all 0.15s; }
        .task-row:hover { border-color: var(--parchment); box-shadow: 0 2px 8px var(--shadow-warm); transform: translateY(-1px); }
        .task-priority-bar { width: 3px; height: 100%; min-height: 32px; border-radius: 2px; flex-shrink: 0; align-self: stretch; }
        .task-row-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
        .task-row-title { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .task-row-meta { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
        .task-meta-pill { font-size: 0.6875rem; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 500; }
        .task-due-pill { font-size: 0.6875rem; font-weight: 600; }
        .task-due-overdue { color: #dc2626; }
        .task-due-ok { color: var(--text-muted); }
        .cal-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.875rem; background: white; border: 1px solid var(--border-light); border-radius: 10px; transition: all 0.15s; }
        .cal-row:hover { border-color: var(--parchment); box-shadow: 0 2px 8px var(--shadow-warm); }
        .cal-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cal-row-content { flex: 1; min-width: 0; }
        .cal-row-title { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cal-row-type { font-size: 0.6875rem; color: var(--text-muted); margin-top: 0.1rem; }
        .vehicle-alert { background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 12px; padding: 0.875rem 1.25rem; margin-bottom: 1.5rem; animation: fadeUp 0.4s ease; display: flex; flex-direction: column; gap: 0.625rem; }
        .vehicle-alert-header { display: flex; align-items: center; gap: 0.5rem; }
        .vehicle-alert-icon { font-size: 1rem; flex-shrink: 0; }
        .vehicle-alert-header strong { font-size: 0.9rem; font-weight: 700; color: #991b1b; flex: 1; }
        .vehicle-alert-link { font-size: 0.8125rem; font-weight: 600; color: #dc2626; text-decoration: none; padding: 0.25rem 0.625rem; border: 1.5px solid #fca5a5; border-radius: 6px; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
        .vehicle-alert-link:hover { background: #dc2626; color: white; border-color: #dc2626; }
        .vehicle-alert-list { display: flex; flex-direction: column; gap: 0; }
        .vehicle-alert-row { display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.875rem; padding: 0.375rem 0; border-top: 1px solid #fecaca; }
        .vehicle-alert-row:first-child { border-top: none; }
        .vehicle-alert-name { font-weight: 600; color: #7f1d1d; white-space: nowrap; }
        .vehicle-alert-issues { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
        .issue-critical { font-size: 0.8rem; font-weight: 600; color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; padding: 0.05rem 0.4rem; border-radius: 4px; }
        .issue-warning { font-size: 0.8rem; font-weight: 600; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; padding: 0.05rem 0.4rem; border-radius: 4px; }
        @media (max-width: 768px) {
          .dash-main { padding: 1.25rem 1rem 2rem; }
          .dash-header { flex-direction: column; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
          .dash-name { font-size: 1.75rem !important; }
          .dash-stats { width: 100%; gap: 0.5rem; }
          .stat-card { flex: 1; min-width: 0; padding: 0.625rem 0.5rem; }
          .stat-num { font-size: 1.25rem !important; }
          .dash-columns { grid-template-columns: 1fr !important; gap: 1.5rem; }
        }
      `}</style>
    </div>
  )
}

function TaskRow({ task }: { task: DashTask }) {
  const colour = PRIORITY_COLOURS[task.priority]
  const bg = PRIORITY_BG[task.priority]
  const due = task.due_date ? formatDueDate(task.due_date) : null

  return (
    <Link href="/tasks" className="task-row">
      <div className="task-priority-bar" style={{ background: colour }} />
      <div className="task-row-content">
        <div className="task-row-title">{task.title}</div>
        <div className="task-row-meta">
          <span className="task-meta-pill" style={{ background: bg, color: colour }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.project && (
            <span
              className="task-meta-pill"
              style={{ background: (task.project.colour ?? '#8b6b4a') + '22', color: task.project.colour ?? '#8b6b4a' }}
            >
              {task.project.name}
            </span>
          )}
          {due && (
            <span className={`task-due-pill ${due.overdue ? 'task-due-overdue' : 'task-due-ok'}`}>
              {due.overdue ? '⚠ ' : ''}{due.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function CalEventRow({ event }: { event: DashCalEvent }) {
  const colour = EVENT_TYPE_COLOURS[event.type]
  return (
    <Link href="/calendar" className="cal-row">
      <div className="cal-type-dot" style={{ background: colour }} />
      <div className="cal-row-content">
        <div className="cal-row-title">{event.title}</div>
        <div className="cal-row-type">{EVENT_TYPE_LABELS[event.type]}</div>
      </div>
    </Link>
  )
}