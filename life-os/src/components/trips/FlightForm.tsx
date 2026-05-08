'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TripFlight, flightDuration } from '@/types/trips'

export default function FlightForm({
  userId,
  tripId,
  onSaved,
  onClose,
}: {
  userId: string
  tripId: string
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [departAirport, setDepartAirport] = useState('')
  const [departTerminal, setDepartTerminal] = useState('')
  const [departDatetime, setDepartDatetime] = useState('')
  const [flightNumber, setFlightNumber] = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [bookedVia, setBookedVia] = useState('')
  const [arriveAirport, setArriveAirport] = useState('')
  const [arriveTerminal, setArriveTerminal] = useState('')
  const [arriveDatetime, setArriveDatetime] = useState('')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (departDatetime && arriveDatetime) {
      setDuration(flightDuration(departDatetime, arriveDatetime))
    } else {
      setDuration('')
    }
  }, [departDatetime, arriveDatetime])

  const handleSave = async () => {
    if (!departAirport.trim()) { setError('Departure airport is required.'); return }
    if (!arriveAirport.trim()) { setError('Arrival airport is required.'); return }
    if (!departDatetime) { setError('Departure date/time is required.'); return }
    if (!arriveDatetime) { setError('Arrival date/time is required.'); return }
    setSaving(true)
    const { error: err } = await (supabase as any).from('trip_flights').insert({
      trip_id: tripId,
      user_id: userId,
      depart_airport: departAirport.trim().toUpperCase(),
      depart_terminal: departTerminal.trim() || null,
      depart_datetime: new Date(departDatetime).toISOString(),
      flight_number: flightNumber.trim() || null,
      booking_reference: bookingRef.trim() || null,
      booked_via: bookedVia.trim() || null,
      arrive_airport: arriveAirport.trim().toUpperCase(),
      arrive_terminal: arriveTerminal.trim() || null,
      arrive_datetime: new Date(arriveDatetime).toISOString(),
    })
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">✈️ Add flight</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}

          <p className="section-heading">Departure</p>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Airport code <span className="req">*</span></label>
              <input className="input-field" value={departAirport} onChange={e => setDepartAirport(e.target.value)} placeholder="e.g. MAN" />
            </div>
            <div className="field-group">
              <label className="label">Terminal</label>
              <input className="input-field" value={departTerminal} onChange={e => setDepartTerminal(e.target.value)} placeholder="e.g. T2" />
            </div>
          </div>
          <div className="field-group">
            <label className="label">Date & time <span className="req">*</span></label>
            <input className="input-field" type="datetime-local" value={departDatetime} onChange={e => setDepartDatetime(e.target.value)} />
          </div>

          <p className="section-heading">Flight details</p>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Flight number</label>
              <input className="input-field" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder="e.g. EZY1234" />
            </div>
            <div className="field-group">
              <label className="label">Booking reference</label>
              <input className="input-field" value={bookingRef} onChange={e => setBookingRef(e.target.value)} placeholder="e.g. ABC123" />
            </div>
          </div>
          <div className="field-group">
            <label className="label">Booked via</label>
            <input className="input-field" value={bookedVia} onChange={e => setBookedVia(e.target.value)} placeholder="e.g. easyJet.com, Expedia" />
          </div>

          <p className="section-heading">Arrival</p>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Airport code <span className="req">*</span></label>
              <input className="input-field" value={arriveAirport} onChange={e => setArriveAirport(e.target.value)} placeholder="e.g. BCN" />
            </div>
            <div className="field-group">
              <label className="label">Terminal</label>
              <input className="input-field" value={arriveTerminal} onChange={e => setArriveTerminal(e.target.value)} placeholder="e.g. T1" />
            </div>
          </div>
          <div className="field-group">
            <label className="label">Date & time <span className="req">*</span></label>
            <input className="input-field" type="datetime-local" value={arriveDatetime} onChange={e => setArriveDatetime(e.target.value)} />
          </div>
          {duration && (
            <div className="duration-badge">✈️ Flight time: <strong>{duration}</strong></div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add flight'}</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 520px; max-height: 90vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.125rem 1.25rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1rem; font-weight: 600; }
        .modal-close { width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.8125rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .modal-close:hover { background: var(--cream-dark); }
        .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; overflow-y: auto; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.875rem 1.25rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .section-heading { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: -0.375rem; padding-top: 0.25rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 0.5rem 0.75rem; }
        .req { color: var(--terracotta); }
        .duration-badge { font-size: 0.875rem; color: var(--warm-brown); background: var(--parchment); border-radius: 8px; padding: 0.5rem 0.875rem; }
      `}</style>
    </div>
  )
}
