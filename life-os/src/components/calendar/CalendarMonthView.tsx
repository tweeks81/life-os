'use client'

import { useMemo, useState } from 'react'
import { CalendarEvent, EVENT_TYPE_COLOURS, EVENT_TYPE_BG, isSameDay, DAYS_SHORT } from '@/lib/calendar'
import { ShareRecord } from '@/components/tasks/SharePanel'
import SharePanel from '@/components/tasks/SharePanel'

export default function CalendarMonthView({
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
  const { weeks } = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    let startDay = firstDay.getDay()
    startDay = startDay === 0 ? 6 : startDay - 1

    const days: (Date | null)[] = []
    for (let i = 0; i < startDay; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    while (days.length % 7 !== 0) days.push(null)

    const weeks: (Date | null)[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    return { weeks }
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
  const MAX_VISIBLE = 3

  return (
    <div className="month-view">
      <div className="month-headers">
        {DAYS_SHORT.map(d => <div key={d} className="month-day-header">{d}</div>)}
      </div>

      <div className="month-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="month-week">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="month-cell month-cell-empty" />
              const key = getDayKey(day)
              const dayEvents = eventsByDay[key] ?? []
              const isToday = isSameDay(day, today)
              const overflow = dayEvents.length - MAX_VISIBLE

              return (
                <div key={di} className={`month-cell ${isToday ? 'today' : ''}`}>
                  <div className="cell-date">
                    <span className={`date-num ${isToday ? 'today-num' : ''}`}>{day.getDate()}</span>
                  </div>
                  <div className="cell-events">
                    {dayEvents.slice(0, MAX_VISIBLE).map(ev => (
                      <EventPill
                        key={ev.id}
                        event={ev}
                        selected={selectedEvent?.id === ev.id}
                        userId={userId}
                        shares={ev.sourceId ? (eventShares[ev.sourceId] ?? []) : []}
                        onClick={() => onEventClick(ev)}
                        onEdit={() => onEditEvent(ev)}
                        onDelete={() => onDeleteEvent(ev)}
                        onSharesChanged={() => ev.sourceId && onSharesChanged(ev.sourceId)}
                      />
                    ))}
                    {overflow > 0 && <span className="overflow-pill">+{overflow} more</span>}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <style>{`
        .month-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--cream); }
        .month-headers { display: grid; grid-template-columns: repeat(7, 1fr); background: white; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .month-day-header { padding: 0.5rem; text-align: center; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-muted); }
        .month-grid { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .month-week { display: grid; grid-template-columns: repeat(7, 1fr); flex: 1; min-height: 100px; border-bottom: 1px solid var(--border-light); }
        .month-cell { border-right: 1px solid var(--border-light); padding: 0.375rem; background: white; min-height: 100px; display: flex; flex-direction: column; gap: 2px; position: relative; }
        .month-cell:last-child { border-right: none; }
        .month-cell-empty { background: var(--cream); border-right: 1px solid var(--border-light); }
        .month-cell.today { background: #fffdf8; }
        .cell-date { display: flex; justify-content: flex-end; margin-bottom: 2px; }
        .date-num { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .today-num { background: var(--deep-brown); color: white; font-weight: 700; }
        .cell-events { display: flex; flex-direction: column; gap: 2px; }
        .overflow-pill { font-size: 0.7rem; color: var(--text-muted); padding: 0.1rem 0.3rem; }
      `}</style>
    </div>
  )
}

function EventPill({ event, selected, userId, shares, onClick, onEdit, onDelete, onSharesChanged }: {
  event: CalendarEvent
  selected: boolean
  userId: string
  shares: ShareRecord[]
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onSharesChanged: () => void
}) {
  const colour = event.colour ?? EVENT_TYPE_COLOURS[event.type]
  const isCustom = !!event.sourceId &&
    !event.id.startsWith('holiday-') &&
    !event.id.startsWith('contact-bday-') &&
    !event.id.startsWith('my-birthday-')

  return (
    <div className="event-pill-wrapper">
      <button
        className={`event-pill ${selected ? 'selected' : ''}`}
        style={{ background: colour + '22', borderColor: colour + '66', color: colour }}
        onClick={onClick}
        title={event.title}
      >
        <span className="event-dot" style={{ background: colour }} />
        <span className="event-title">{event.title}</span>
      </button>

      {selected && (
        <div className="event-popup">
          <p className="popup-title">{event.title}</p>
          <p className="popup-date">
            {event.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {event.notes && <p className="popup-notes">{event.notes}</p>}
          {isCustom && (
            <>
              <div className="popup-actions">
                <button className="popup-btn" onClick={onEdit}>Edit</button>
                <button className="popup-btn popup-delete" onClick={onDelete}>Delete</button>
              </div>
              <div className="popup-share">
                <SharePanel
                  entityId={event.sourceId!}
                  entityType="calendar_event"
                  ownerId={userId}
                  userId={userId}
                  shares={shares}
                  onSharesChanged={onSharesChanged}
                />
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .event-pill-wrapper { position: relative; }
        .event-pill { display: flex; align-items: center; gap: 4px; padding: 2px 5px; border-radius: 4px; border: 1px solid; width: 100%; cursor: pointer; font-family: var(--font-body); font-size: 0.7rem; font-weight: 500; text-align: left; transition: all 0.12s; overflow: hidden; }
        .event-pill:hover { filter: brightness(0.95); }
        .event-pill.selected { box-shadow: 0 0 0 2px currentColor; }
        .event-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .event-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .event-popup { position: absolute; top: calc(100% + 4px); left: 0; z-index: 100; background: white; border: 1px solid var(--border-light); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 0.75rem; min-width: 240px; max-width: 300px; animation: fadeUp 0.15s ease; }
        .popup-title { font-size: 0.875rem; font-weight: 600; color: var(--deep-brown); margin-bottom: 0.25rem; }
        .popup-date { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; }
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
