'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CalendarEvent, EventType, RawCalendarEvent, ContactBirthday, UserProfile,
  generateEventsForRange, EVENT_TYPE_LABELS, EVENT_TYPE_COLOURS
} from '@/lib/calendar'
import NavBar from '../NavBar'
import CalendarMonthView from './CalendarMonthView'
import CalendarWeekView from './CalendarWeekView'
import CalendarEventForm from './CalendarEventForm'

type ViewMode = 'month' | 'week'

export default function CalendarShell({
  userId,
  profile,
  initialDbEvents,
  contacts,
}: {
  userId: string
  profile: (UserProfile & { avatar_url?: string | null }) | null
  initialDbEvents: RawCalendarEvent[]
  contacts: ContactBirthday[]
}) {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [dbEvents, setDbEvents] = useState<RawCalendarEvent[]>(initialDbEvents)
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(
    new Set(['birthday', 'anniversary', 'remembrance', 'holiday', 'other'] as EventType[])
  )
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<RawCalendarEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Generate a wide range of events (±1 year from current view)
  const rangeStart = useMemo(() => {
    const d = new Date(currentDate.getFullYear() - 1, 0, 1)
    return d
  }, [currentDate])

  const rangeEnd = useMemo(() => {
    const d = new Date(currentDate.getFullYear() + 1, 11, 31)
    return d
  }, [currentDate])

  const allEvents = useMemo(() => {
    return generateEventsForRange(rangeStart, rangeEnd, dbEvents, contacts, profile)
  }, [rangeStart, rangeEnd, dbEvents, contacts, profile])

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => activeTypes.has(e.type))
  }, [allEvents, activeTypes])

  const toggleType = (type: EventType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const refreshEvents = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date')
    if (data) setDbEvents(data)
  }, [supabase, userId])

  const handleEventSaved = useCallback(async () => {
    await refreshEvents()
    setShowForm(false)
    setEditingEvent(null)
  }, [refreshEvents])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(prev => prev?.id === event.id ? null : event)
  }, [])

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    if (!event.sourceId) return
    const dbEvent = dbEvents.find(e => e.id === event.sourceId)
    if (dbEvent) {
      setEditingEvent(dbEvent)
      setShowForm(true)
      setSelectedEvent(null)
    }
  }, [dbEvents])

  const handleDeleteEvent = useCallback(async (event: CalendarEvent) => {
    if (!event.sourceId) return
    if (!confirm(`Delete "${event.title}"?`)) return
    await (supabase as any).from('calendar_events').delete().eq('id', event.sourceId)
    await refreshEvents()
    setSelectedEvent(null)
  }, [supabase, refreshEvents])

  const navigate = (direction: number) => {
    if (viewMode === 'month') {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + direction, 1))
    } else {
      setCurrentDate(d => {
        const next = new Date(d)
        next.setDate(next.getDate() + direction * 7)
        return next
      })
    }
    setSelectedEvent(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedEvent(null)
  }

  const allTypes: EventType[] = ['birthday', 'anniversary', 'remembrance', 'holiday', 'other']

  return (
    <div className="cal-shell">
      <NavBar profile={profile} />

      <div className="cal-toolbar">
        {/* Navigation */}
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => navigate(-1)}>‹</button>
          <button className="cal-today-btn" onClick={goToToday}>Today</button>
          <button className="cal-nav-btn" onClick={() => navigate(1)}>›</button>
          <h2 className="cal-heading">
            {viewMode === 'month'
              ? currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
              : (() => {
                  const mon = new Date(currentDate)
                  const day = mon.getDay()
                  const diff = day === 0 ? -6 : 1 - day
                  mon.setDate(mon.getDate() + diff)
                  const sun = new Date(mon)
                  sun.setDate(sun.getDate() + 6)
                  return `${mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                })()
            }
          </h2>
        </div>

        {/* Filters */}
        <div className="cal-filters">
          {allTypes.map(type => (
            <button
              key={type}
              className={`filter-chip ${activeTypes.has(type) ? 'active' : ''}`}
              onClick={() => toggleType(type)}
              style={activeTypes.has(type) ? {
                background: EVENT_TYPE_COLOURS[type] + '20',
                borderColor: EVENT_TYPE_COLOURS[type],
                color: EVENT_TYPE_COLOURS[type],
              } : {}}
            >
              {EVENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* View toggle + add */}
        <div className="cal-actions">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >Month</button>
            <button
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >Week</button>
          </div>
          <button className="btn-primary add-btn" onClick={() => { setEditingEvent(null); setShowForm(true) }}>
            + Add event
          </button>
        </div>
      </div>

      <div className="cal-body">
        {viewMode === 'month' ? (
          <CalendarMonthView
            currentDate={currentDate}
            events={filteredEvents}
            today={today}
            selectedEvent={selectedEvent}
            onEventClick={handleEventClick}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        ) : (
          <CalendarWeekView
            currentDate={currentDate}
            events={filteredEvents}
            today={today}
            selectedEvent={selectedEvent}
            onEventClick={handleEventClick}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </div>

      {showForm && (
        <CalendarEventForm
          userId={userId}
          event={editingEvent}
          onSaved={handleEventSaved}
          onClose={() => { setShowForm(false); setEditingEvent(null) }}
        />
      )}

      <style>{`
        .cal-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--cream);
          overflow: hidden;
        }
        .cal-toolbar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.625rem 1.25rem;
          background: white;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .cal-nav {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .cal-nav-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: none;
          cursor: pointer;
          font-size: 1.125rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          line-height: 1;
        }
        .cal-nav-btn:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .cal-today-btn {
          font-size: 0.8125rem;
          font-weight: 500;
          font-family: var(--font-body);
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: none;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.15s;
        }
        .cal-today-btn:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .cal-heading {
          font-size: 1rem;
          font-weight: 600;
          font-family: var(--font-body);
          color: var(--deep-brown);
          white-space: nowrap;
          margin-left: 0.25rem;
          min-width: 180px;
        }
        .cal-filters {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex: 1;
          flex-wrap: wrap;
        }
        .filter-chip {
          font-size: 0.75rem;
          font-weight: 500;
          font-family: var(--font-body);
          padding: 0.25rem 0.625rem;
          border-radius: 100px;
          border: 1.5px solid var(--border);
          background: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .filter-chip:hover { border-color: var(--warm-brown); color: var(--deep-brown); }
        .cal-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .view-toggle {
          display: flex;
          background: var(--parchment);
          border-radius: 8px;
          padding: 2px;
        }
        .view-btn {
          font-size: 0.8125rem;
          font-weight: 500;
          font-family: var(--font-body);
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.15s;
        }
        .view-btn.active {
          background: white;
          color: var(--deep-brown);
          box-shadow: 0 1px 3px var(--shadow-warm);
        }
        .add-btn {
          font-size: 0.8125rem;
          padding: 0.4rem 0.875rem;
        }
        .cal-body {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  )
}
