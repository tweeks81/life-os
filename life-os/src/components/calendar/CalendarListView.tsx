'use client'

import { useMemo } from 'react'
import { CalendarEvent, EVENT_TYPE_COLOURS, EVENT_TYPE_BG } from '@/lib/calendar'

const TYPE_ICON: Record<string, string> = {
  birthday: '🎂',
  anniversary: '💍',
  remembrance: '🕯️',
  holiday: '🏖️',
  other: '📅',
}

export default function CalendarListView({
  events,
  today,
  selectedEvent,
  sharedEventIds,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
}: {
  events: CalendarEvent[]
  today: Date
  selectedEvent: CalendarEvent | null
  sharedEventIds: Set<string>
  onEventClick: (e: CalendarEvent) => void
  onEditEvent: (e: CalendarEvent) => void
  onDeleteEvent: (e: CalendarEvent) => void
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const key = `${ev.date.getFullYear()}-${String(ev.date.getMonth()).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, evs]) => {
        const [year, month] = key.split('-').map(Number)
        return { year, month, events: evs }
      })
  }, [events])

  function daysUntil(date: Date): number {
    return Math.round((date.getTime() - today.getTime()) / 86400000)
  }

  function daysLabel(days: number): string {
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days < 7) return `in ${days} days`
    if (days < 14) return 'in 1 week'
    if (days < 30) return `in ${Math.round(days / 7)} weeks`
    const m = Math.round(days / 30)
    return `in ${m} month${m > 1 ? 's' : ''}`
  }

  if (events.length === 0) {
    return (
      <div className="lv-empty">
        <p className="lv-empty-icon">📅</p>
        <p className="lv-empty-title">No upcoming events</p>
        <p className="lv-empty-sub">Add events or enable more types above.</p>
        <style>{`
          .lv-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; text-align: center; padding: 3rem; color: var(--text-muted); }
          .lv-empty-icon { font-size: 2.5rem; }
          .lv-empty-title { font-size: 1.1rem; font-weight: 600; font-family: var(--font-display); color: var(--deep-brown); }
          .lv-empty-sub { font-size: 0.875rem; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="cal-list-view">
      {grouped.map(({ year, month, events: monthEvs }) => (
        <div key={`${year}-${month}`} className="lv-month-group">
          <div className="lv-month-header">
            {new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>

          {monthEvs.map(ev => {
            const days = daysUntil(ev.date)
            const colour = ev.colour ?? EVENT_TYPE_COLOURS[ev.type]
            const bg = EVENT_TYPE_BG[ev.type]
            const isSelected = selectedEvent?.id === ev.id
            const isToday = days === 0
            const canEdit = !!ev.sourceId
            const isShared = sharedEventIds.has(ev.sourceId ?? '') || sharedEventIds.has(ev.id)

            return (
              <div key={ev.id} className="lv-item-wrap">
                <button
                  className={`lv-row${isSelected ? ' selected' : ''}${isToday ? ' is-today' : ''}`}
                  onClick={() => onEventClick(ev)}
                >
                  <span className="lv-dot" style={{ background: colour }} />
                  <span className="lv-name">
                    {TYPE_ICON[ev.type]}&nbsp;{ev.title}
                    {isShared && <span className="lv-shared"> 👥</span>}
                  </span>
                  <span className="lv-right">
                    <span className="lv-date">
                      {ev.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`lv-countdown${isToday ? ' today' : ''}`}>
                      {daysLabel(days)}
                    </span>
                  </span>
                </button>

                {isSelected && (
                  <div className="lv-detail" style={{ borderLeftColor: colour, background: bg }}>
                    <p className="lv-detail-date">
                      {ev.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {ev.notes && <p className="lv-detail-notes">{ev.notes}</p>}
                    {canEdit && (
                      <div className="lv-detail-actions">
                        <button className="lv-action" onClick={() => onEditEvent(ev)}>Edit</button>
                        <button className="lv-action danger" onClick={() => onDeleteEvent(ev)}>Delete</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      <style>{`
        .cal-list-view { flex: 1; overflow-y: auto; padding: 1rem 1.25rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; }

        .lv-month-group { display: flex; flex-direction: column; gap: 0.25rem; }

        .lv-month-header {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-muted); padding: 0 0 0.5rem;
          border-bottom: 1px solid var(--border-light); margin-bottom: 0.125rem;
        }

        .lv-item-wrap { display: flex; flex-direction: column; }

        .lv-row {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.5rem 0.625rem; border-radius: 8px;
          border: 1.5px solid transparent; background: white;
          cursor: pointer; width: 100%; text-align: left;
          transition: all 0.15s; font-family: var(--font-body);
        }
        .lv-row:hover { background: var(--cream-dark); }
        .lv-row.selected { border-color: var(--warm-brown); background: var(--cream); }
        .lv-row.is-today { background: #fffbeb; border-color: #f59e0b; }

        .lv-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

        .lv-name {
          flex: 1; min-width: 0;
          font-size: 0.875rem; font-weight: 500; color: var(--text-primary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .lv-shared { font-size: 0.75rem; }

        .lv-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem; flex-shrink: 0; }
        .lv-date { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
        .lv-countdown { font-size: 0.7rem; color: var(--text-muted); white-space: nowrap; }
        .lv-countdown.today { color: #d97706; font-weight: 600; }

        .lv-detail {
          border-left: 3px solid; border-radius: 0 8px 8px 0;
          padding: 0.625rem 0.875rem; margin: 0.125rem 0 0.25rem 1.25rem;
        }
        .lv-detail-date { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.25rem; }
        .lv-detail-notes { font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-style: italic; }
        .lv-detail-actions { display: flex; gap: 0.5rem; }
        .lv-action {
          font-size: 0.8rem; padding: 0.25rem 0.75rem; border-radius: 6px;
          border: 1px solid var(--border); background: white; cursor: pointer;
          font-family: var(--font-body); color: var(--text-secondary); transition: all 0.15s;
        }
        .lv-action:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .lv-action.danger { color: #dc2626; border-color: #fecaca; }
        .lv-action.danger:hover { background: #fef2f2; }
      `}</style>
    </div>
  )
}
