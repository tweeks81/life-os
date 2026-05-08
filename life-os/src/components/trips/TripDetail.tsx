'use client'

import { useState, useMemo } from 'react'
import {
  Trip, TripFlight, TripParking, TripTaxi, TripAccommodation,
  ACCOMMODATION_ICONS, ACCOMMODATION_TYPES,
  formatDTInZone, tzShort, formatDate, flightDuration,
} from '@/types/trips'
import FlightForm from './FlightForm'
import ParkingForm from './ParkingForm'
import TaxiForm from './TaxiForm'
import AccommodationForm from './AccommodationForm'

type ItineraryItem =
  | { kind: 'flight'; sortDt: string; data: TripFlight }
  | { kind: 'parking'; sortDt: string; data: TripParking }
  | { kind: 'taxi'; sortDt: string; data: TripTaxi }
  | { kind: 'accommodation'; sortDt: string; data: TripAccommodation }

export default function TripDetail({
  trip,
  flights,
  parking,
  taxis,
  accommodations,
  userId,
  onEditTrip,
  onDeleteTrip,
  onItemAdded,
  onDeleteItem,
}: {
  trip: Trip
  flights: TripFlight[]
  parking: TripParking[]
  taxis: TripTaxi[]
  accommodations: TripAccommodation[]
  userId: string
  onEditTrip: () => void
  onDeleteTrip: () => void
  onItemAdded: () => void
  onDeleteItem: (table: string, id: string) => void
}) {
  const [addFlight, setAddFlight] = useState(false)
  const [addParking, setAddParking] = useState(false)
  const [addTaxi, setAddTaxi] = useState(false)
  const [addAccommodation, setAddAccommodation] = useState(false)
  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState(false)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ kind: string; id: string } | null>(null)

  const itinerary: ItineraryItem[] = useMemo(() => {
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
    return items.sort((a, b) => a.sortDt.localeCompare(b.sortDt))
  }, [flights, parking, taxis, accommodations])

  const hasItems = itinerary.length > 0

  return (
    <div className="trip-detail">
      {/* Header */}
      <div className="td-header">
        <div className="td-header-left">
          <span className="td-icon">✈</span>
          <div>
            <h2 className="td-title">{trip.name}</h2>
            {trip.description && <p className="td-desc">{trip.description}</p>}
          </div>
        </div>
        <div className="td-header-actions">
          {!confirmDeleteTrip ? (
            <>
              <button className="td-btn-secondary" onClick={onEditTrip}>Edit</button>
              <button className="td-btn-danger" onClick={() => setConfirmDeleteTrip(true)}>Delete</button>
            </>
          ) : (
            <>
              <span className="td-confirm-label">Delete trip?</span>
              <button className="td-btn-danger" onClick={onDeleteTrip}>Yes, delete</button>
              <button className="td-btn-secondary" onClick={() => setConfirmDeleteTrip(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>

      {/* Add buttons */}
      <div className="td-add-bar">
        <span className="td-add-label">Add:</span>
        <button className="td-add-btn" onClick={() => setAddFlight(true)}>✈️ Flight</button>
        <button className="td-add-btn" onClick={() => setAddParking(true)}>🅿️ Parking</button>
        <button className="td-add-btn" onClick={() => setAddTaxi(true)}>🚕 Taxi</button>
        <button className="td-add-btn" onClick={() => setAddAccommodation(true)}>🏨 Stay</button>
      </div>

      {/* Itinerary */}
      <div className="td-body">
        {!hasItems && (
          <div className="td-empty">
            <p className="td-empty-title">No items yet</p>
            <p className="td-empty-sub">Add flights, parking, taxis and accommodation above to build your itinerary.</p>
          </div>
        )}

        {hasItems && itinerary.map((item, i) => {
          const id = item.data.id
          const isDeleting = confirmDeleteItem?.id === id

          if (item.kind === 'flight') {
            const f = item.data
            const dur = flightDuration(f.depart_datetime, f.arrive_datetime)
            return (
              <div key={id} className="td-card">
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
                </div>
                <div className="td-card-actions">
                  {isDeleting ? (
                    <>
                      <button className="td-del-confirm" onClick={() => { onDeleteItem('trip_flights', id); setConfirmDeleteItem(null) }}>Delete</button>
                      <button className="td-del-cancel" onClick={() => setConfirmDeleteItem(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="td-del-btn" onClick={() => setConfirmDeleteItem({ kind: 'flight', id })}>✕</button>
                  )}
                </div>
              </div>
            )
          }

          if (item.kind === 'parking') {
            const p = item.data
            return (
              <div key={id} className="td-card">
                <div className="td-card-icon">🅿️</div>
                <div className="td-card-body">
                  <div className="td-card-title">{p.company || 'Parking'}{p.reference && <span className="td-badge">{p.reference}</span>}</div>
                  <div className="td-card-sub">Drop off: {formatDT(p.start_datetime)}</div>
                  <div className="td-card-sub">Return: {formatDT(p.end_datetime)}</div>
                </div>
                <div className="td-card-actions">
                  {isDeleting ? (
                    <>
                      <button className="td-del-confirm" onClick={() => { onDeleteItem('trip_parking', id); setConfirmDeleteItem(null) }}>Delete</button>
                      <button className="td-del-cancel" onClick={() => setConfirmDeleteItem(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="td-del-btn" onClick={() => setConfirmDeleteItem({ kind: 'parking', id })}>✕</button>
                  )}
                </div>
              </div>
            )
          }

          if (item.kind === 'taxi') {
            const t = item.data
            return (
              <div key={id} className="td-card">
                <div className="td-card-icon">🚕</div>
                <div className="td-card-body">
                  <div className="td-card-title">{t.company || 'Taxi / Transfer'}</div>
                  <div className="td-card-sub">Pickup: {t.collection_address}</div>
                  <div className="td-card-sub">{formatDT(t.collection_datetime)}</div>
                </div>
                <div className="td-card-actions">
                  {isDeleting ? (
                    <>
                      <button className="td-del-confirm" onClick={() => { onDeleteItem('trip_taxis', id); setConfirmDeleteItem(null) }}>Delete</button>
                      <button className="td-del-cancel" onClick={() => setConfirmDeleteItem(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="td-del-btn" onClick={() => setConfirmDeleteItem({ kind: 'taxi', id })}>✕</button>
                  )}
                </div>
              </div>
            )
          }

          if (item.kind === 'accommodation') {
            const a = item.data
            const icon = ACCOMMODATION_ICONS[a.accommodation_type] ?? '🏠'
            const typeName = ACCOMMODATION_TYPES[a.accommodation_type] ?? a.accommodation_type
            return (
              <div key={id} className="td-card">
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
                </div>
                <div className="td-card-actions">
                  {isDeleting ? (
                    <>
                      <button className="td-del-confirm" onClick={() => { onDeleteItem('trip_accommodations', id); setConfirmDeleteItem(null) }}>Delete</button>
                      <button className="td-del-cancel" onClick={() => setConfirmDeleteItem(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="td-del-btn" onClick={() => setConfirmDeleteItem({ kind: 'accommodation', id })}>✕</button>
                  )}
                </div>
              </div>
            )
          }

          return null
        })}
      </div>

      {/* Modals */}
      {addFlight && <FlightForm userId={userId} tripId={trip.id} onSaved={() => { setAddFlight(false); onItemAdded() }} onClose={() => setAddFlight(false)} />}
      {addParking && <ParkingForm userId={userId} tripId={trip.id} onSaved={() => { setAddParking(false); onItemAdded() }} onClose={() => setAddParking(false)} />}
      {addTaxi && <TaxiForm userId={userId} tripId={trip.id} onSaved={() => { setAddTaxi(false); onItemAdded() }} onClose={() => setAddTaxi(false)} />}
      {addAccommodation && <AccommodationForm userId={userId} tripId={trip.id} onSaved={() => { setAddAccommodation(false); onItemAdded() }} onClose={() => setAddAccommodation(false)} />}

      <style>{`
        .trip-detail {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--cream);
        }
        .td-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.125rem 1.5rem;
          background: white;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }
        .td-header-left {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          min-width: 0;
        }
        .td-icon {
          font-size: 1.25rem;
          margin-top: 1px;
          flex-shrink: 0;
        }
        .td-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--deep-brown);
          line-height: 1.3;
        }
        .td-desc {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin-top: 0.125rem;
        }
        .td-header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .td-confirm-label {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-right: 0.25rem;
        }
        .td-btn-secondary {
          padding: 0.375rem 0.75rem;
          border-radius: 7px;
          border: 1px solid var(--border);
          background: white;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s;
        }
        .td-btn-secondary:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .td-btn-danger {
          padding: 0.375rem 0.75rem;
          border-radius: 7px;
          border: 1px solid #fca5a5;
          background: white;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #dc2626;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s;
        }
        .td-btn-danger:hover { background: #fef2f2; }

        .td-add-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: white;
          border-bottom: 1px solid var(--border-light);
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .td-add-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-right: 0.25rem;
        }
        .td-add-btn {
          padding: 0.3125rem 0.75rem;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: white;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s;
        }
        .td-add-btn:hover { background: var(--cream-dark); color: var(--deep-brown); border-color: var(--border); }

        .td-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .td-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          gap: 0.5rem;
        }
        .td-empty-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .td-empty-sub {
          font-size: 0.875rem;
          color: var(--text-muted);
          max-width: 320px;
          line-height: 1.6;
        }

        .td-card {
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 0.875rem 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          transition: box-shadow 0.15s;
        }
        .td-card:hover { box-shadow: 0 2px 8px var(--shadow-warm-sm); }
        .td-card-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 1px; }
        .td-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .td-card-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--deep-brown);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .td-card-row { display: flex; align-items: center; gap: 0.625rem; }
        .td-card-sub { font-size: 0.8125rem; color: var(--text-secondary); }
        .td-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--terracotta);
          background: #fef0ec;
          border-radius: 4px;
          padding: 0.125rem 0.375rem;
          letter-spacing: 0.04em;
        }
        .td-type-label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: var(--text-muted);
          background: var(--cream-dark);
          border-radius: 4px;
          padding: 0.125rem 0.375rem;
        }
        .td-duration {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: var(--parchment);
          border-radius: 4px;
          padding: 0.125rem 0.375rem;
        }
        .td-tz {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-style: italic;
        }

        .td-card-actions {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-shrink: 0;
        }
        .td-del-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid var(--border-light);
          background: none;
          cursor: pointer;
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.15s;
        }
        .td-card:hover .td-del-btn { opacity: 1; }
        .td-del-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
        .td-del-confirm {
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          border: 1px solid #fca5a5;
          background: #fef2f2;
          color: #dc2626;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-body);
        }
        .td-del-cancel {
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          font-family: var(--font-body);
        }
      `}</style>
    </div>
  )
}
