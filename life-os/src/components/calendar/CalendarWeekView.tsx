'use client'

import { useMemo } from 'react'
import { CalendarEvent, EVENT_TYPE_COLOURS, isSameDay, DAYS_SHORT } from '@/lib/calendar'
import { ShareRecord } from '@/components/tasks/SharePanel'
import SharePanel from '@/components/tasks/SharePanel'

export default function CalendarWeekView({
  currentDate,
  events,
  today,
  selectedEvent,
  userId,
  eventShares,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  onSharesChanged,
}: {
  currentDate: Date
  events: CalendarEvent[]
  today: Date
  selectedEvent: CalendarEvent | null
  userId: string
  eventShares: Record<string, ShareRecord[]>
  onEventClick: (e: CalendarEvent) => void
  onEditEvent: (e: CalendarEvent) => void
  onDeleteEvent: (e: CalendarEvent) => void
  onSharesChanged: (eventId: string) => void
}) {
  const weekDays = useMemo(() => {
    const mon = new Date(currentDate)
    const day = mon.getDay()
    const diff = day === 0 ? -6 : 1 - day
    mon.setDate(mon.getDate() + diff)
    mon.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [currentDate])

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of events) {
      const key = `${ev.date.getFullYear()}-${ev.date.getMonth()}-${ev.date.getDate()}`
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [events])

  const getDayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

  return (
    <div className="week-view">
      <div className="week-grid">
        {weekDays.map((day, i) => {
          const key = getDayKey(day)
          const dayEvents = eventsByDay[key] ?? []
          const isToday = isSameDay(day, today)

          return (
            <div key={i} className={`week-col ${isToday ? 'today' : ''}`}>
              <div className={`week-col-header ${isToday ? 'today-header' : ''}`}>
                <span className="week-day-name">{DAYS_SHORT[i]}</span>
                <span className={`week-day-num ${isToday ? 'today-num' : ''}`}>{day.getDate()}</span>
                <span className="week-month-label">{day.toLocaleDateString('en-GB', { month: 'short' })}</span>
              </div>

              <div className="week-col-events">
                {dayEvents.map(ev => {
                  const colour = ev.colour ?? EVENT_TYPE_COLOURS[ev.type]
                  const isCustom = !!ev.sourceId &&
                    !ev.id.startsWith('holiday-') &&
                    !ev.id.startsWith('contact-bday-') &&
                    !ev.id.startsWith('my-birthday-')
                  const isSelected = selectedEvent?.id === ev.id
                  const shares = ev.sourceId ? (eventShares[ev.sourceId] ?? []) : []

                  return (
                    <div key={ev.id} className="week-event-wrapper">
                      <button
                        className={`week-event ${isSelected ? 'selected' : ''}`}
                        style={{ background: colour + '18', borderLeft: `3px solid ${colour}`, color: colour }}
                        onClick={() => onEventClick(ev)}
                      >
                        <span className="week-event-title">{ev.title}</span>
                        {ev.notes && <span className="week-event-notes">{ev.notes}</span>}
                      </button>

                      {isSelected && (
                        <div className="week-popup">
                          <p className="popup-title">{ev.title}</p>
                          <p className="popup-date">
                            {ev.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {ev.notes && <p className="popup-notes">{ev.notes}</p>}
                          {isCustom && (
                            <>
                              <div className="popup-actions">
                                <button className="popup-btn" onClick={() => onEditEvent(ev)}>Edit</button>
                                <button className="popup-btn popup-delete" onClick={() => onDeleteEvent(ev)}>Delete</button>
                              </div>
                              <div className="popup-share">
                                <SharePanel
                                  entityId={ev.sourceId!}
                                  entityType="calendar_event"
                                  ownerId={userId}
                                  userId={userId}
                                  shares={shares}
                                  onSharesChanged={() => ev.sourceId && onSharesChanged(ev.sourceId)}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        .week-view { flex: 1; overflow: hidden; display: flex; flex-direction: column; background: var(--cream); }
        .week-grid { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); overflow-y: auto; background: white; border-top: 1px solid var(--border-light); }
        .week-col { border-right: 1px solid var(--border-light); display: flex; flex-direction: column; min-height: 100%; }
        .week-col:last-child { border-right: none; }
        .week-col.today { background: #fffdf8; }
        .week-col-header { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 0.5rem 0.625rem; border-bottom: 1px solid var(--border-light); gap: 0.1rem; background: white; position: sticky; top: 0; z-index: 5; }
        .week-col.today .week-col-header { background: #fffdf8; }
        .week-day-name { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); }
        .week-day-num { font-size: 1.375rem; font-weight: 700; color: var(--text-secondary); line-height: 1.1; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-family: var(--font-display); }
        .today-num { background: var(--deep-brown); color: white !important; }
        .week-month-label { font-size: 0.65rem; color: var(--text-muted); }
        .week-col-events { flex: 1; padding: 0.5rem 0.375rem; display: flex; flex-direction: column; gap: 0.375rem; }
        .week-event-wrapper { position: relative; }
        .week-event { display: flex; flex-direction: column; gap: 2px; padding: 0.375rem 0.5rem; border-radius: 6px; border: none; width: 100%; text-align: left; cursor: pointer; font-family: var(--font-body); transition: all 0.12s; }
        .week-event:hover { filter: brightness(0.96); }
        .week-event.selected { box-shadow: 0 0 0 2px currentColor; }
        .week-event-title { font-size: 0.8rem; font-weight: 600; line-height: 1.3; }
        .week-event-notes { font-size: 0.72rem; opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .week-popup { position: absolute; top: calc(100% + 4px); left: 0; z-index: 100; background: white; border: 1px solid var(--border-light); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 0.75rem; min-width: 240px; max-width: 300px; animation: fadeUp 0.15s ease; }
        .popup-title { font-size: 0.875rem; font-weight: 600; color: var(--deep-brown); margin-bottom: 0.25rem; }
        .popup-date { font-size: 0.75rem; color: var(--text-muted); }
        .popup-notes { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-top: 0.25rem; padding-top: 0.25rem; border-top: 1px solid var(--border-light); }
        .popup-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-light); }
        .popup-btn { font-size: 0.75rem; font-weight: 500; font-family: var(--font-body); padding: 0.25rem 0.625rem; border-radius: 5px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-secondary); transition: all 0.12s; }
        .popup-btn:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .popup-delete { color: #dc2626; border-color: #fecaca; }
        .popup-delete:hover { background: #fef2f2; }
        .popup-share { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-light); }
      `}</style>
    </div>
  )
}
