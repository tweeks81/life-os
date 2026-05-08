'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ACCOMMODATION_TYPES } from '@/types/trips'

export default function AccommodationForm({
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
  const [accommodationType, setAccommodationType] = useState('hotel')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [bookingReference, setBookingReference] = useState('')
  const [checkInDate, setCheckInDate] = useState('')
  const [checkOutDate, setCheckOutDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    const { error: err } = await (supabase as any).from('trip_accommodations').insert({
      trip_id: tripId,
      user_id: userId,
      accommodation_type: accommodationType,
      name: name.trim() || null,
      address: address.trim() || null,
      booking_reference: bookingReference.trim() || null,
      check_in_date: checkInDate || null,
      check_out_date: checkOutDate || null,
      notes: notes.trim() || null,
    })
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">🏨 Add accommodation</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}
          <div className="field-group">
            <label className="label">Type</label>
            <select className="input-field" value={accommodationType} onChange={e => setAccommodationType(e.target.value)}>
              {Object.entries(ACCOMMODATION_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="label">Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hotel Arts Barcelona" />
          </div>
          <div className="field-group">
            <label className="label">Address</label>
            <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Carrer de la Marina, 19-21" />
          </div>
          <div className="field-group">
            <label className="label">Booking reference</label>
            <input className="input-field" value={bookingReference} onChange={e => setBookingReference(e.target.value)} placeholder="e.g. BK123456" />
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Check-in date</label>
              <input className="input-field" type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Check-out date</label>
              <input className="input-field" type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="WiFi details, parking, check-in instructions…" style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Add accommodation'}</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 480px; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.125rem 1.25rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1rem; font-weight: 600; }
        .modal-close { width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.8125rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .modal-close:hover { background: var(--cream-dark); }
        .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; overflow-y: auto; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.875rem 1.25rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 0.5rem 0.75rem; }
        .req { color: var(--terracotta); }
      `}</style>
    </div>
  )
}
