'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CalendarEvent, EventType, RawCalendarEvent, ContactBirthday, UserProfile,
  generateEventsForRange, EVENT_TYPE_LABELS, EVENT_TYPE_COLOURS
} from '@/lib/calendar'
import { ShareRecord } from '@/components/tasks/SharePanel'
import NavBar from '../NavBar'
import CalendarMonthView from './CalendarMonthView'
import CalendarWeekView from './CalendarWeekView'
import CalendarListView from './CalendarListView'
import CalendarEventForm from './CalendarEventForm'

type ViewMode = 'month' | 'week' | 'list'

function getSeriesKey(ev: CalendarEvent): string {
  if (!ev.isRecurring) return ev.id
  if (ev.sourceId) return `src-${ev.sourceId}`
  if (ev.id.startsWith('my-birthday')) return 'my-birthday'
  return `holiday-${ev.title}`
}

export default function CalendarShell({
  userId,
  profile,
  initialDbEvents,
  contacts,
  initialEventShares,
  initialSharedWithMeIds,
}: {
  userId: string
  profile: (UserProfile & { avatar_url?: string | null }) | null
  initialDbEvents: RawCalendarEvent[]
  contacts: ContactBirthday[]
  initialEventShares: Record<string, ShareRecord[]>
  initialSharedWithMeIds: string[]
}) {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [dbEvents, setDbEvents] = useState<RawCalendarEvent[]>(initialDbEvents)
  const [eventShares, setEventShares] = useState<Record<string, ShareRecord[]>>(initialEventShares)
  const [sharedWithMeIds, setSharedWithMeIds] = useState<Set<string>>(new Set(initialSharedWithMeIds))
  const [activeTypes, setActiveTypes] = useState<Set<EventType>>(
    new Set(['birthday', 'anniversary', 'remembrance', 'holiday', 'other'] as EventType[])
  )
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<RawCalendarEvent | null>(null)
  const [editingShares, setEditingShares] = useState<ShareRecord[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const rangeStart = useMemo(() => new Date(currentDate.getFullYear() - 1, 0, 1), [currentDate])
  const rangeEnd = useMemo(() => new Date(currentDate.getFullYear() + 1, 11, 31), [currentDate])

  const allEvents = useMemo(() => {
    return generateEventsForRange(rangeStart, rangeEnd, dbEvents, contacts, profile)
  }, [rangeStart, rangeEnd, dbEvents, contacts, profile])

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => activeTypes.has(e.type))
  }, [allEvents, activeTypes])

  // List view: next 12 months from today, deduplicated so recurring events appear only once
  const listEvents = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + 1)
    end.setDate(end.getDate() - 1)

    const raw = generateEventsForRange(start, end, dbEvents, contacts, profile)
      .filter(e => activeTypes.has(e.type))

    const seen = new Set<string>()
    return raw.filter(ev => {
      const key = getSeriesKey(ev)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [dbEvents, contacts, profile, activeTypes])

  const toggleType = (type: EventType) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const refreshEvents = useCallback(async () => {
    // Refresh own events
    const { data: ownData } = await (supabase as any)
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date')

    // Refresh shared-with-me event IDs
    const { data: shareData } = await (supabase as any)
      .from('calendar_event_shares')
      .select('event_id')
      .or(`shared_with_id.eq.${userId}`)

    const sharedIds = (shareData ?? []).map((r: any) => r.event_id)
    const newSharedSet = new Set<string>(sharedIds)
    setSharedWithMeIds(newSharedSet)

    // Fetch shared events content
    const { data: sharedData } = sharedIds.length > 0
      ? await (supabase as any).from('calendar_events').select('*').in('id', sharedIds)
      : { data: [] }

    const allOwn = ownData ?? []
    const allShared = (sharedData ?? []).filter((se: any) => !allOwn.find((oe: any) => oe.id === se.id))
    setDbEvents([...allOwn, ...allShared])
  }, [supabase, userId])

  const refreshShares = useCallback(async (eventId: string) => {
    const { data } = await (supabase as any)
      .from('calendar_event_shares')
      .select('id, shared_with_email, created_at')
      .eq('event_id', eventId)
      .eq('owner_id', userId)
    setEventShares(prev => ({ ...prev, [eventId]: data ?? [] }))
  }, [supabase, userId])

  const handleEventSaved = useCallback(async (savedId?: string) => {
    await refreshEvents()
    if (savedId) await refreshShares(savedId)
    setShowForm(false)
    setEditingEvent(null)
    setEditingShares([])
  }, [refreshEvents, refreshShares])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(prev => prev?.id === event.id ? null : event)
  }, [])

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    if (!event.sourceId) return
    const dbEvent = dbEvents.find(e => e.id === event.sourceId)
    if (dbEvent) {
      setEditingEvent(dbEvent)
      setEditingShares(eventShares[dbEvent.id] ?? [])
      setShowForm(true)
      setSelectedEvent(null)
    }
  }, [dbEvents, eventShares])

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
    } else if (viewMode === 'week') {
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
      <NavBar profile={profile ? { full_name: profile.full_name ?? null, avatar_url: profile.avatar_url ?? null } : null} />

      <div className="cal-toolbar">
        <div className="cal-nav">
          {viewMode !== 'list' && <>
            <button className="cal-nav-btn" onClick={() => navigate(-1)}>‹</button>
            <button className="cal-today-btn" onClick={goToToday}>Today</button>
            <button className="cal-nav-btn" onClick={() => navigate(1)}>›</button>
          </>}
          <h2 className="cal-heading">
            {viewMode === 'month'
              ? currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
              : viewMode === 'week'
              ? (() => {
                  const mon = new Date(currentDate)
                  const day = mon.getDay()
                  const diff = day === 0 ? -6 : 1 - day
                  mon.setDate(mon.getDate() + diff)
                  const sun = new Date(mon)
                  sun.setDate(sun.getDate() + 6)
                  return `${mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                })()
              : 'Upcoming Events'
            }
          </h2>
        </div>

        <div className="cal-filter-dropdown" ref={filterRef}>
          <button
            className={`cal-filter-btn ${activeTypes.size < allTypes.length ? 'has-filter' : ''}`}
            onClick={() => setFilterOpen(o => !o)}
          >
            <span>
              {activeTypes.size === allTypes.length
                ? 'All types'
                : activeTypes.size === 0
                ? 'No types'
                : activeTypes.size === 1
                ? EVENT_TYPE_LABELS[[...activeTypes][0] as EventType]
                : `${activeTypes.size} of ${allTypes.length} types`}
            </span>
            <span className="cal-filter-chevron">{filterOpen ? '▲' : '▼'}</span>
          </button>

          {filterOpen && (
            <div className="cal-filter-menu">
              <div className="cal-filter-menu-top">
                <button className="cal-filter-quick" onClick={() => setActiveTypes(new Set(allTypes))}>All</button>
                <button className="cal-filter-quick" onClick={() => setActiveTypes(new Set())}>None</button>
              </div>
              {allTypes.map(type => (
                <label key={type} className="cal-filter-item">
                  <span className="cal-filter-dot" style={{ background: EVENT_TYPE_COLOURS[type] }} />
                  <span className="cal-filter-label">{EVENT_TYPE_LABELS[type]}</span>
                  <input
                    type="checkbox"
                    className="cal-filter-check"
                    checked={activeTypes.has(type)}
                    onChange={() => toggleType(type)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="cal-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Month</button>
            <button className={`view-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Week</button>
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>List</button>
          </div>
          <button className="btn-primary add-btn" onClick={() => { setEditingEvent(null); setEditingShares([]); setShowForm(true) }}>
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
            userId={userId}
            sharedEventIds={sharedWithMeIds}
            onEventClick={handleEventClick}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        ) : viewMode === 'week' ? (
          <CalendarWeekView
            currentDate={currentDate}
            events={filteredEvents}
            today={today}
            selectedEvent={selectedEvent}
            userId={userId}
            sharedEventIds={sharedWithMeIds}
            onEventClick={handleEventClick}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        ) : (
          <CalendarListView
            events={listEvents}
            today={today}
            selectedEvent={selectedEvent}
            sharedEventIds={sharedWithMeIds}
            onEventClick={handleEventClick}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
        <div className="mobile-bottom-spacer" />
      </div>

      {showForm && (
        <CalendarEventForm
          userId={userId}
          event={editingEvent}
          initialShares={editingShares}
          onSaved={handleEventSaved}
          onClose={() => { setShowForm(false); setEditingEvent(null); setEditingShares([]) }}
        />
      )}

      <style>{`
        .cal-shell { height: 100vh; display: flex; flex-direction: column; background: var(--cream); overflow: hidden; }
        .cal-toolbar { display: flex; align-items: center; gap: 1rem; padding: 0.625rem 1.25rem; background: white; border-bottom: 1px solid var(--border-light); flex-shrink: 0; flex-wrap: wrap; }
        .cal-nav { display: flex; align-items: center; gap: 0.375rem; }
        .cal-nav-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 1.125rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; transition: all 0.15s; line-height: 1; }
        .cal-nav-btn:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .cal-today-btn { font-size: 0.8125rem; font-weight: 500; font-family: var(--font-body); padding: 0.3rem 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; }
        .cal-today-btn:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .cal-heading { font-size: 1rem; font-weight: 600; font-family: var(--font-body); color: var(--deep-brown); white-space: nowrap; margin-left: 0.25rem; min-width: 180px; }
        .cal-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .view-toggle { display: flex; background: var(--parchment); border-radius: 8px; padding: 2px; }
        .view-btn { font-size: 0.8125rem; font-weight: 500; font-family: var(--font-body); padding: 0.3rem 0.75rem; border-radius: 6px; border: none; background: none; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; }
        .view-btn.active { background: white; color: var(--deep-brown); box-shadow: 0 1px 3px var(--shadow-warm); }
        .add-btn { font-size: 0.8125rem; padding: 0.4rem 0.875rem; }
        .cal-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

        .cal-filter-dropdown { position: relative; flex-shrink: 0; }
        .cal-filter-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0.75rem; border-radius: 6px; border: 1.5px solid var(--border); background: white; cursor: pointer; font-size: 0.8125rem; font-weight: 500; font-family: var(--font-body); color: var(--text-secondary); transition: all 0.15s; white-space: nowrap; }
        .cal-filter-btn:hover { border-color: var(--warm-brown); color: var(--deep-brown); }
        .cal-filter-btn.has-filter { border-color: var(--warm-brown); color: var(--warm-brown); background: var(--parchment); }
        .cal-filter-chevron { font-size: 0.6rem; opacity: 0.6; }
        .cal-filter-menu { position: absolute; top: calc(100% + 6px); left: 0; min-width: 180px; background: white; border: 1px solid var(--border-light); border-radius: 10px; box-shadow: 0 4px 16px var(--shadow-warm); z-index: 100; overflow: hidden; animation: fadeIn 0.12s ease; }
        .cal-filter-menu-top { display: flex; gap: 0.25rem; padding: 0.5rem 0.625rem 0.25rem; border-bottom: 1px solid var(--border-light); }
        .cal-filter-quick { font-size: 0.75rem; font-weight: 600; font-family: var(--font-body); padding: 0.2rem 0.625rem; border-radius: 5px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); transition: all 0.12s; }
        .cal-filter-quick:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .cal-filter-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.75rem; cursor: pointer; transition: background 0.1s; }
        .cal-filter-item:hover { background: var(--cream-dark); }
        .cal-filter-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .cal-filter-label { flex: 1; font-size: 0.875rem; color: var(--text-primary); font-family: var(--font-body); }
        .cal-filter-check { width: 15px; height: 15px; cursor: pointer; accent-color: var(--terracotta); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
