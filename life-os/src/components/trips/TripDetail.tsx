'use client'

import { useState, useEffect } from 'react'
import {
  Trip, TripFlight, TripParking, TripTaxi, TripAccommodation, TripShare, LinkedContactForSharing, TripTask,
  ACCOMMODATION_ICONS, ACCOMMODATION_TYPES,
  formatDTInZone, tzShort, formatDate, flightDuration,
} from '@/types/trips'
import type { DayForecast } from '@/lib/weather'
import FlightForm from './FlightForm'
import ParkingForm from './ParkingForm'
import TaxiForm from './TaxiForm'
import AccommodationForm from './AccommodationForm'
import TripSharePanel from './TripSharePanel'
import TripTasksSection from './TripTasksSection'

type ItineraryItem =
  | { kind: 'flight'; sortDt: string; data: TripFlight }
  | { kind: 'parking'; sortDt: string; data: TripParking }
  | { kind: 'taxi'; sortDt: string; data: TripTaxi }
  | { kind: 'accommodation'; sortDt: string; data: TripAccommodation }

function itemTable(item: ItineraryItem): string {
  const map = { flight: 'trip_flights', parking: 'trip_parking', taxi: 'trip_taxis', accommodation: 'trip_accommodations' } as const
  return map[item.kind]
}

function buildItinerary(
  flights: TripFlight[], parking: TripParking[],
  taxis: TripTaxi[], accommodations: TripAccommodation[]
): ItineraryItem[] {
  const items: ItineraryItem[] = [
    ...flights.map(f => ({ kind: 'flight' as const, sortDt: f.depart_datetime, data: f })),
    ...parking.map(p => ({ kind: 'parking' as const, sortDt: p.start_datetime, data: p })),
    ...taxis.map(t => ({ kind: 'taxi' as const, sortDt: t.collection_datetime, data: t })),
    ...accommodations.map(a => ({
      kind: 'accommodation' as const,
      sortDt: a.check_in_date ? a.check_in_date + 'T00:00:00Z' : '9999',
      data: a,
    })),
  ]
  const hasSortOrder = items.some(i => i.data.sort_order != null)
  return items.sort((a, b) => {
    if (hasSortOrder) {
      const oa = a.data.sort_order ?? 99999
      const ob = b.data.sort_order ?? 99999
      if (oa !== ob) return oa - ob
    }
    return a.sortDt.localeCompare(b.sortDt)
  })
}

export default function TripDetail({
  trip,
  flights,
  parking,
  taxis,
  accommodations,
  shares,
  linkedContacts,
  tripTasks,
  userId,
  isOwner,
  ownerName,
  onEditTrip,
  onDeleteTrip,
  onItemAdded,
  onDeleteItem,
  onReorderItems,
  onAddShare,
  onRemoveShare,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: {
  trip: Trip
  flights: TripFlight[]
  parking: TripParking[]
  taxis: TripTaxi[]
  accommodations: TripAccommodation[]
  shares: TripShare[]
  linkedContacts: LinkedContactForSharing[]
  tripTasks: TripTask[]
  userId: string
  isOwner: boolean
  ownerName: string | null
  onEditTrip: () => void
  onDeleteTrip: () => void
  onItemAdded: () => void
  onDeleteItem: (table: string, id: string) => void
  onReorderItems: (updates: { table: string; id: string; sortOrder: number }[]) => void
  onAddShare: (sharedWithUserId: string) => void
  onRemoveShare: (shareId: string) => void
  onAddTask: (title: string, urgency: number, dueDate: string | null) => Promise<string | null>
  onToggleTask: (id: string, status: string) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
}) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(() =>
    buildItinerary(flights, parking, taxis, accommodations)
  )
  const [addFlight, setAddFlight] = useState(false)
  const [addParking, setAddParking] = useState(false)
  const [addTaxi, setAddTaxi] = useState(false)
  const [addAccommodation, setAddAccommodation] = useState(false)
  const [editFlight, setEditFlight] = useState<TripFlight | null>(null)
  const [editParking, setEditParking] = useState<TripParking | null>(null)
  const [editTaxi, setEditTaxi] = useState<TripTaxi | null>(null)
  const [editAccommodation, setEditAccommodation] = useState<TripAccommodation | null>(null)
  const [showSharePanel, setShowSharePanel] = useState(false)
  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState(false)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ kind: string; id: string } | null>(null)
  const [tasksOpen, setTasksOpen] = useState(false)

  useEffect(() => {
    setItinerary(buildItinerary(flights, parking, taxis, accommodations))
  }, [flights, parking, taxis, accommodations])

  const handleSavePDF = () => {
    const fmt = (dt: string | null | undefined) => dt ? new Date(dt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
    const fmtDate = (d: string | null | undefined) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'

    const fmtFlightDT = (dt: string, tz: string | null | undefined): string => {
      if (!tz) return formatDTInZone(dt, null)
      const local = formatDTInZone(dt, tz)
      const abbr = tzShort(dt, tz)
      const isUK = tz === 'Europe/London' || abbr === 'GMT' || abbr === 'BST'
      if (isUK) return `${local} ${abbr}`
      const ukTime = new Date(dt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
      const ukAbbr = tzShort(dt, 'Europe/London')
      return `${local} ${abbr} (${ukTime} ${ukAbbr})`
    }

    const cards = itinerary.map(item => {
      if (item.kind === 'flight') {
        const f = item.data as TripFlight
        const duration = flightDuration(f.depart_datetime, f.arrive_datetime)
        return `<div class="card">
          <div class="card-icon">✈️</div>
          <div class="card-body">
            <div class="card-title">${f.depart_airport} → ${f.arrive_airport}${f.flight_number ? ` <span class="ref">${f.flight_number}</span>` : ''}${duration ? ` <span class="flight-dur">${duration}</span>` : ''}</div>
            <div class="detail">Depart: ${fmtFlightDT(f.depart_datetime, f.depart_timezone)}${f.depart_terminal ? `, Terminal ${f.depart_terminal}` : ''}</div>
            <div class="detail">Arrive: ${fmtFlightDT(f.arrive_datetime, f.arrive_timezone)}${f.arrive_terminal ? `, Terminal ${f.arrive_terminal}` : ''}</div>
            ${f.booking_reference ? `<div class="ref-row">Booking ref: <span class="ref">${f.booking_reference}</span>${f.booked_via ? ` via ${f.booked_via}` : ''}</div>` : ''}
            ${f.notes ? `<div class="notes">${f.notes}</div>` : ''}
          </div>
        </div>`
      }
      if (item.kind === 'parking') {
        const p = item.data as TripParking
        return `<div class="card">
          <div class="card-icon">🅿️</div>
          <div class="card-body">
            <div class="card-title">${p.company || 'Parking'}${p.reference ? ` <span class="ref">${p.reference}</span>` : ''}</div>
            <div class="detail">Drop off: ${fmt(p.start_datetime)}</div>
            <div class="detail">Return: ${fmt(p.end_datetime)}</div>
            ${p.notes ? `<div class="notes">${p.notes}</div>` : ''}
          </div>
        </div>`
      }
      if (item.kind === 'taxi') {
        const t = item.data as TripTaxi
        return `<div class="card">
          <div class="card-icon">🚕</div>
          <div class="card-body">
            <div class="card-title">${t.company || 'Taxi / Transfer'}</div>
            <div class="detail">Pickup: ${t.collection_address}</div>
            <div class="detail">${fmt(t.collection_datetime)}</div>
            ${t.notes ? `<div class="notes">${t.notes}</div>` : ''}
          </div>
        </div>`
      }
      if (item.kind === 'accommodation') {
        const a = item.data as TripAccommodation
        return `<div class="card">
          <div class="card-icon">${ACCOMMODATION_ICONS[a.accommodation_type] ?? '🏠'}</div>
          <div class="card-body">
            <div class="card-title">${a.name || ACCOMMODATION_TYPES[a.accommodation_type]}${a.booking_reference ? ` <span class="ref">${a.booking_reference}</span>` : ''}</div>
            ${a.address ? `<div class="detail">${a.address}</div>` : ''}
            ${a.check_in_date ? `<div class="detail">Check in: ${fmtDate(a.check_in_date)}</div>` : ''}
            ${a.check_out_date ? `<div class="detail">Check out: ${fmtDate(a.check_out_date)}</div>` : ''}
            ${a.notes ? `<div class="notes">${a.notes}</div>` : ''}
          </div>
        </div>`
      }
      return ''
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${trip.name} — Itinerary</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a1a; padding: 32px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
    .trip-meta { font-size: 13px; color: #555; margin-bottom: 24px; line-height: 1.6; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 20px 0 10px; border-top: 1px solid #e5e5e5; padding-top: 14px; }
    .card { display: flex; gap: 12px; padding: 12px 14px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 8px; break-inside: avoid; }
    .card-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
    .card-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .card-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
    .detail { font-size: 12px; color: #444; }
    .ref { display: inline-block; font-size: 11px; font-weight: 600; background: #fff4f0; color: #c44b20; border-radius: 3px; padding: 1px 5px; letter-spacing: 0.04em; }
    .flight-dur { display: inline-block; font-size: 11px; font-weight: 500; background: #f0f4ff; color: #3b5bdb; border-radius: 3px; padding: 1px 5px; }
    .ref-row { font-size: 12px; color: #444; }
    .notes { font-size: 12px; color: #666; background: #f9f7f4; border-radius: 4px; padding: 5px 8px; margin-top: 2px; white-space: pre-wrap; }
    @media print { body { padding: 16px; } .section-title:first-of-type { border-top: none; } }
  </style>
</head>
<body>
  <h1>✈ ${trip.name}</h1>
  <div class="trip-meta">
    ${trip.destination ? `📍 ${trip.destination}<br>` : ''}
    ${trip.start_date ? `📅 ${fmtDate(trip.start_date)}${trip.end_date && trip.end_date !== trip.start_date ? ` — ${fmtDate(trip.end_date)}` : ''}` : ''}
    ${trip.description ? `<br>${trip.description}` : ''}
  </div>
  ${itinerary.length > 0 ? `<div class="section-title">Itinerary</div>${cards}` : ''}
  <script>window.onload = () => window.print()</script>
</body>
</html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= itinerary.length) return
    const next = [...itinerary]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    setItinerary(next)
    onReorderItems(next.map((item, i) => ({ table: itemTable(item), id: item.data.id, sortOrder: i + 1 })))
  }

  return (
    <div className="trip-detail">
      <div className="td-header">
        <div className="td-header-left">
          <span className="td-icon">✈</span>
          <div>
            <h2 className="td-title">{trip.name}</h2>
            {trip.description && <p className="td-desc">{trip.description}</p>}
            {(trip.start_date || trip.end_date) && (
              <p className="td-dates">
                📅{' '}
                {trip.start_date ? formatDate(trip.start_date) : '?'}
                {trip.end_date && trip.end_date !== trip.start_date && <> — {formatDate(trip.end_date)}</>}
              </p>
            )}
            {!isOwner && ownerName && <p className="td-shared-by">Shared with you by {ownerName}</p>}
          </div>
        </div>
        <div className="td-header-actions">
          {isOwner && !confirmDeleteTrip && (
            <>
              <button className="td-btn-pdf" onClick={handleSavePDF} title="Save itinerary as PDF">📄 PDF</button>
              <button className="td-btn-secondary" onClick={() => setShowSharePanel(true)}>Share</button>
              <button className="td-btn-secondary" onClick={onEditTrip}>Edit</button>
              <button className="td-btn-danger" onClick={() => setConfirmDeleteTrip(true)}>Delete</button>
            </>
          )}
          {isOwner && confirmDeleteTrip && (
            <>
              <span className="td-confirm-label">Delete trip?</span>
              <button className="td-btn-danger" onClick={onDeleteTrip}>Yes, delete</button>
              <button className="td-btn-secondary" onClick={() => setConfirmDeleteTrip(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>

      {/* Weather forecast for destination */}
      {trip.destination_lat != null && trip.destination_lon != null && (
        <TripWeatherBar
          lat={trip.destination_lat}
          lon={trip.destination_lon}
          destination={trip.destination ?? ''}
        />
      )}

      {isOwner && (
        <div className="td-add-bar">
          <span className="td-add-label">Add:</span>
          <button className="td-add-btn" onClick={() => setAddFlight(true)}>✈️ Flight</button>
          <button className="td-add-btn" onClick={() => setAddParking(true)}>🅿️ Parking</button>
          <button className="td-add-btn" onClick={() => setAddTaxi(true)}>🚕 Taxi</button>
          <button className="td-add-btn" onClick={() => setAddAccommodation(true)}>🏨 Stay</button>
        </div>
      )}

      <div className="td-body">
        {isOwner && (
          <div className="tasks-collapsible">
            <button className="tasks-toggle" onClick={() => setTasksOpen(o => !o)}>
              <span className="tasks-toggle-label">
                ✓ To-do{tripTasks.length > 0 && <span className="tasks-count">{tripTasks.filter(t => t.status !== 'done').length}/{tripTasks.length}</span>}
              </span>
              <span className="tasks-chevron">{tasksOpen ? '▲' : '▼'}</span>
            </button>
            {tasksOpen && (
              <TripTasksSection
                tasks={tripTasks}
                onAddTask={onAddTask}
                onToggleTask={onToggleTask}
                onDeleteTask={onDeleteTask}
              />
            )}
          </div>
        )}

        {itinerary.length === 0 && (
          <div className="td-empty">
            <p className="td-empty-title">No items yet</p>
            <p className="td-empty-sub">{isOwner ? 'Add flights, parking, taxis and accommodation above to build your itinerary.' : 'No itinerary items have been added yet.'}</p>
          </div>
        )}

        {itinerary.map((item, index) => {
          const id = item.data.id
          const isDeleting = confirmDeleteItem?.id === id
          const canMoveUp = index > 0
          const canMoveDown = index < itinerary.length - 1

          const reorderBtns = isOwner && (
            <div className="td-reorder-btns">
              <button className="td-reorder-btn" onClick={() => moveItem(index, 'up')} disabled={!canMoveUp} title="Move up">↑</button>
              <button className="td-reorder-btn" onClick={() => moveItem(index, 'down')} disabled={!canMoveDown} title="Move down">↓</button>
            </div>
          )

          const actionBtns = isOwner && (
            <div className="td-card-actions">
              {isDeleting ? (
                <>
                  <button className="td-del-confirm" onClick={() => { onDeleteItem(itemTable(item), id); setConfirmDeleteItem(null) }}>Delete</button>
                  <button className="td-del-cancel" onClick={() => setConfirmDeleteItem(null)}>Cancel</button>
                </>
              ) : (
                <>
                  {item.kind === 'flight' && <button className="td-edit-btn" onClick={() => setEditFlight(item.data as TripFlight)}>Edit</button>}
                  {item.kind === 'parking' && <button className="td-edit-btn" onClick={() => setEditParking(item.data as TripParking)}>Edit</button>}
                  {item.kind === 'taxi' && <button className="td-edit-btn" onClick={() => setEditTaxi(item.data as TripTaxi)}>Edit</button>}
                  {item.kind === 'accommodation' && <button className="td-edit-btn" onClick={() => setEditAccommodation(item.data as TripAccommodation)}>Edit</button>}
                  <button className="td-del-btn" onClick={() => setConfirmDeleteItem({ kind: item.kind, id })}>✕</button>
                </>
              )}
            </div>
          )

          if (item.kind === 'flight') {
            const f = item.data as TripFlight
            const dur = flightDuration(f.depart_datetime, f.arrive_datetime)
            return (
              <div key={id} className="td-card">
                {reorderBtns}
                <div className="td-card-icon">✈️</div>
                <div className="td-card-body">
                  <div className="td-card-title">
                    {f.depart_airport} → {f.arrive_airport}
                    {f.flight_number && <span className="td-badge">{f.flight_number}</span>}
                  </div>
                  <div className="td-card-row">
                    <span className="td-card-sub">
                      Depart: {formatDTInZone(f.depart_datetime, f.depart_timezone)}
                      {f.depart_timezone && <span className="td-tz"> {tzShort(f.depart_datetime, f.depart_timezone)}</span>}
                      {f.depart_terminal ? ` · T${f.depart_terminal}` : ''}
                    </span>
                  </div>
                  <div className="td-card-row">
                    <span className="td-card-sub">
                      Arrive: {formatDTInZone(f.arrive_datetime, f.arrive_timezone)}
                      {f.arrive_timezone && <span className="td-tz"> {tzShort(f.arrive_datetime, f.arrive_timezone)}</span>}
                      {f.arrive_terminal ? ` · T${f.arrive_terminal}` : ''}
                    </span>
                    {dur && <span className="td-duration">{dur}</span>}
                  </div>
                  {f.booking_reference && <div className="td-card-sub">Ref: {f.booking_reference}{f.booked_via ? ` · via ${f.booked_via}` : ''}</div>}
                  {f.notes && <div className="td-notes">{f.notes}</div>}
                </div>
                {actionBtns}
              </div>
            )
          }

          if (item.kind === 'parking') {
            const p = item.data as TripParking
            return (
              <div key={id} className="td-card">
                {reorderBtns}
                <div className="td-card-icon">🅿️</div>
                <div className="td-card-body">
                  <div className="td-card-title">{p.company || 'Parking'}{p.reference && <span className="td-badge">{p.reference}</span>}</div>
                  <div className="td-card-sub">Drop off: {formatDTInZone(p.start_datetime)}</div>
                  <div className="td-card-sub">Return: {formatDTInZone(p.end_datetime)}</div>
                  {p.notes && <div className="td-notes">{p.notes}</div>}
                </div>
                {actionBtns}
              </div>
            )
          }

          if (item.kind === 'taxi') {
            const t = item.data as TripTaxi
            return (
              <div key={id} className="td-card">
                {reorderBtns}
                <div className="td-card-icon">🚕</div>
                <div className="td-card-body">
                  <div className="td-card-title">{t.company || 'Taxi / Transfer'}</div>
                  <div className="td-card-sub">Pickup: {t.collection_address}</div>
                  <div className="td-card-sub">{formatDTInZone(t.collection_datetime)}</div>
                  {t.notes && <div className="td-notes">{t.notes}</div>}
                </div>
                {actionBtns}
              </div>
            )
          }

          if (item.kind === 'accommodation') {
            const a = item.data as TripAccommodation
            const icon = ACCOMMODATION_ICONS[a.accommodation_type] ?? '🏠'
            const typeName = ACCOMMODATION_TYPES[a.accommodation_type] ?? a.accommodation_type
            return (
              <div key={id} className="td-card">
                {reorderBtns}
                <div className="td-card-icon">{icon}</div>
                <div className="td-card-body">
                  <div className="td-card-title">
                    {a.name || typeName}
                    {a.name && <span className="td-type-label">{typeName}</span>}
                    {a.booking_reference && <span className="td-badge">{a.booking_reference}</span>}
                  </div>
                  {a.address && <div className="td-card-sub">{a.address}</div>}
                  {(a.check_in_date || a.check_out_date) && (
                    <div className="td-card-sub">
                      {a.check_in_date && <>Check in: {formatDate(a.check_in_date)}</>}
                      {a.check_in_date && a.check_out_date && ' · '}
                      {a.check_out_date && <>Check out: {formatDate(a.check_out_date)}</>}
                    </div>
                  )}
                  {a.notes && <div className="td-notes">{a.notes}</div>}
                </div>
                {actionBtns}
              </div>
            )
          }

          return null
        })}
      </div>

      {addFlight && <FlightForm userId={userId} tripId={trip.id} onSaved={() => { setAddFlight(false); onItemAdded() }} onClose={() => setAddFlight(false)} />}
      {addParking && <ParkingForm userId={userId} tripId={trip.id} onSaved={() => { setAddParking(false); onItemAdded() }} onClose={() => setAddParking(false)} />}
      {addTaxi && <TaxiForm userId={userId} tripId={trip.id} onSaved={() => { setAddTaxi(false); onItemAdded() }} onClose={() => setAddTaxi(false)} />}
      {addAccommodation && <AccommodationForm userId={userId} tripId={trip.id} onSaved={() => { setAddAccommodation(false); onItemAdded() }} onClose={() => setAddAccommodation(false)} />}
      {editFlight && <FlightForm userId={userId} tripId={trip.id} item={editFlight} onSaved={() => { setEditFlight(null); onItemAdded() }} onClose={() => setEditFlight(null)} />}
      {editParking && <ParkingForm userId={userId} tripId={trip.id} item={editParking} onSaved={() => { setEditParking(null); onItemAdded() }} onClose={() => setEditParking(null)} />}
      {editTaxi && <TaxiForm userId={userId} tripId={trip.id} item={editTaxi} onSaved={() => { setEditTaxi(null); onItemAdded() }} onClose={() => setEditTaxi(null)} />}
      {editAccommodation && <AccommodationForm userId={userId} tripId={trip.id} item={editAccommodation} onSaved={() => { setEditAccommodation(null); onItemAdded() }} onClose={() => setEditAccommodation(null)} />}
      {showSharePanel && (
        <TripSharePanel shares={shares} linkedContacts={linkedContacts} onAdd={onAddShare} onRemove={onRemoveShare} onClose={() => setShowSharePanel(false)} />
      )}

      <style>{`
        .trip-detail { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--cream); }
        .td-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.125rem 1.5rem; background: white; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .td-header-left { display: flex; align-items: flex-start; gap: 0.75rem; min-width: 0; }
        .td-icon { font-size: 1.25rem; margin-top: 1px; flex-shrink: 0; }
        .td-title { font-size: 1.125rem; font-weight: 700; color: var(--deep-brown); line-height: 1.3; }
        .td-desc { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.125rem; }
        .td-dates { font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.2rem; }
        .td-shared-by { font-size: 0.75rem; color: var(--terracotta); font-weight: 500; margin-top: 0.25rem; }
        .td-header-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
        .td-confirm-label { font-size: 0.8125rem; color: var(--text-secondary); }
        .td-btn-pdf { padding: 0.375rem 0.75rem; border-radius: 7px; border: 1px solid #bfdbfe; background: #eff6ff; font-size: 0.8125rem; font-weight: 500; color: #1d4ed8; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .td-btn-pdf:hover { background: #dbeafe; }
        .td-btn-secondary { padding: 0.375rem 0.75rem; border-radius: 7px; border: 1px solid var(--border); background: white; font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .td-btn-secondary:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .tasks-collapsible { background: white; border: 1px solid var(--border-light); border-radius: 10px; overflow: hidden; }
        .tasks-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: none; border: none; cursor: pointer; font-family: var(--font-body); transition: background 0.13s; }
        .tasks-toggle:hover { background: var(--cream-dark); }
        .tasks-toggle-label { font-size: 0.875rem; font-weight: 600; color: var(--deep-brown); display: flex; align-items: center; gap: 0.5rem; }
        .tasks-count { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); background: var(--cream-dark); border-radius: 10px; padding: 0.1rem 0.45rem; }
        .tasks-chevron { font-size: 0.625rem; color: var(--text-muted); }
        .td-btn-danger { padding: 0.375rem 0.75rem; border-radius: 7px; border: 1px solid #fca5a5; background: white; font-size: 0.8125rem; font-weight: 500; color: #dc2626; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .td-btn-danger:hover { background: #fef2f2; }
        .td-add-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: white; border-bottom: 1px solid var(--border-light); flex-wrap: wrap; flex-shrink: 0; }
        .td-add-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-right: 0.25rem; }
        .td-add-btn { padding: 0.3125rem 0.75rem; border-radius: 20px; border: 1px solid var(--border); background: white; font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .td-add-btn:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .td-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .td-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; gap: 0.5rem; }
        .td-empty-title { font-size: 1rem; font-weight: 600; color: var(--text-secondary); }
        .td-empty-sub { font-size: 0.875rem; color: var(--text-muted); max-width: 320px; line-height: 1.6; }
        .td-card { background: white; border: 1px solid var(--border-light); border-radius: 10px; padding: 0.875rem 1rem; display: flex; align-items: flex-start; gap: 0.75rem; transition: box-shadow 0.15s; }
        .td-card:hover { box-shadow: 0 2px 8px var(--shadow-warm-sm); }
        .td-reorder-btns { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
        .td-card:hover .td-reorder-btns { opacity: 1; }
        .td-reorder-btn { width: 22px; height: 22px; border-radius: 4px; border: 1px solid var(--border-light); background: white; cursor: pointer; font-size: 0.6875rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; line-height: 1; transition: all 0.12s; padding: 0; }
        .td-reorder-btn:hover:not(:disabled) { background: var(--cream-dark); color: var(--deep-brown); border-color: var(--border); }
        .td-reorder-btn:disabled { opacity: 0.25; cursor: default; }
        .td-card-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 1px; }
        .td-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .td-card-title { font-size: 0.9375rem; font-weight: 600; color: var(--deep-brown); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .td-card-row { display: flex; align-items: center; gap: 0.625rem; }
        .td-card-sub { font-size: 0.8125rem; color: var(--text-secondary); }
        .td-badge { font-size: 0.6875rem; font-weight: 600; color: var(--terracotta); background: #fef0ec; border-radius: 4px; padding: 0.125rem 0.375rem; letter-spacing: 0.04em; }
        .td-type-label { font-size: 0.6875rem; font-weight: 500; color: var(--text-muted); background: var(--cream-dark); border-radius: 4px; padding: 0.125rem 0.375rem; }
        .td-duration { font-size: 0.75rem; color: var(--text-muted); background: var(--parchment); border-radius: 4px; padding: 0.125rem 0.375rem; }
        .td-tz { font-size: 0.75rem; color: var(--text-muted); font-style: italic; }
        .td-notes { font-size: 0.8125rem; color: var(--text-secondary); background: var(--cream); border-radius: 6px; padding: 0.375rem 0.625rem; margin-top: 0.125rem; white-space: pre-wrap; }
        .td-card-actions { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
        .td-edit-btn { padding: 0.25rem 0.5rem; border-radius: 5px; border: 1px solid var(--border-light); background: white; color: var(--text-muted); font-size: 0.75rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); opacity: 0; transition: all 0.15s; }
        .td-card:hover .td-edit-btn { opacity: 1; }
        .td-edit-btn:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .td-del-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border-light); background: none; cursor: pointer; font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.15s; }
        .td-card:hover .td-del-btn { opacity: 1; }
        .td-del-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .td-del-confirm { padding: 0.25rem 0.5rem; border-radius: 5px; border: 1px solid #fca5a5; background: #fef2f2; color: #dc2626; font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
        .td-del-cancel { padding: 0.25rem 0.5rem; border-radius: 5px; border: 1px solid var(--border); background: white; color: var(--text-muted); font-size: 0.75rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); }
        .twb-wrap { background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%); border-bottom: 1px solid #bae6fd; padding: 0.75rem 1.5rem; flex-shrink: 0; display: flex; flex-direction: column; gap: 0.625rem; }
        .twb-wrap.twb-loading { flex-direction: row; align-items: center; gap: 1rem; }
        .twb-header { display: flex; align-items: center; gap: 0.5rem; }
        .twb-icon { font-size: 1rem; }
        .twb-dest { font-size: 0.8125rem; font-weight: 600; color: #0c4a6e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
        .twb-sublabel { font-size: 0.75rem; color: #0369a1; flex-shrink: 0; }
        .twb-spinner { font-size: 0.8125rem; color: #0369a1; font-style: italic; }
        .twb-days { display: grid; grid-template-columns: repeat(10, 1fr); gap: 0.25rem; }
        .twb-day { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; padding: 0.5rem 0.25rem; border-radius: 10px; background: rgba(255,255,255,0.6); }
        .twb-day-label { font-size: 0.68rem; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
        .twb-day-emoji { font-size: 1.5rem; line-height: 1; }
        .twb-day-high { font-size: 0.875rem; font-weight: 700; color: #0c4a6e; }
        .twb-day-low { font-size: 0.75rem; color: #0369a1; }
      `}</style>
    </div>
  )
}

// ─── Trip weather bar (client-side fetch) ────────────────────────────────────

const WMO_MAP: Record<number, [string, string]> = {
  0: ['☀️', 'Clear sky'], 1: ['🌤️', 'Mainly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'], 48: ['🌫️', 'Freezing fog'],
  51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌧️', 'Heavy drizzle'],
  61: ['🌧️', 'Slight rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'],
  71: ['🌨️', 'Slight snow'], 73: ['🌨️', 'Snow'], 75: ['❄️', 'Heavy snow'], 77: ['🌨️', 'Snow grains'],
  80: ['🌦️', 'Slight showers'], 81: ['🌧️', 'Showers'], 82: ['⛈️', 'Heavy showers'],
  85: ['🌨️', 'Snow showers'], 86: ['❄️', 'Heavy snow showers'],
  95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm + hail'], 99: ['⛈️', 'Thunderstorm + hail'],
}

function wmoLookup(code: number): [string, string] {
  return WMO_MAP[code] ?? WMO_MAP[Math.floor(code / 10) * 10] ?? ['🌡️', 'Unknown']
}

function TripWeatherBar({ lat, lon, destination }: { lat: number; lon: number; destination: string }) {
  const [days, setDays] = useState<DayForecast[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=10`
    )
      .then(r => r.json())
      .then(data => {
        const d = data.daily
        if (!d?.time) { setLoading(false); return }
        const forecasts: DayForecast[] = d.time.map((date: string, i: number) => {
          const code: number = d.weathercode[i] ?? 0
          const [emoji, description] = wmoLookup(code)
          return {
            date,
            maxTemp: Math.round(d.temperature_2m_max[i] ?? 0),
            minTemp: Math.round(d.temperature_2m_min[i] ?? 0),
            weatherCode: code,
            emoji,
            description,
          } satisfies DayForecast
        })
        setDays(forecasts)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [lat, lon])

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tmrw'
    return d.toLocaleDateString('en-GB', { weekday: 'short' })
  }

  if (loading) {
    return (
      <div className="twb-wrap twb-loading">
        <span className="twb-icon">🌤️</span>
        <span className="twb-dest">{destination}</span>
        <span className="twb-spinner">Loading forecast…</span>
      </div>
    )
  }

  if (!days) return null

  return (
    <div className="twb-wrap">
      <div className="twb-header">
        <span className="twb-icon">🌤️</span>
        <span className="twb-dest">{destination}</span>
        <span className="twb-sublabel">10-day forecast</span>
      </div>
      <div className="twb-days">
        {days.map(day => (
          <div key={day.date} className="twb-day">
            <div className="twb-day-label">{dayLabel(day.date)}</div>
            <div className="twb-day-emoji" title={day.description}>{day.emoji}</div>
            <div className="twb-day-high">{day.maxTemp}°</div>
            <div className="twb-day-low">{day.minTemp}°</div>
          </div>
        ))}
      </div>
    </div>
  )
}
