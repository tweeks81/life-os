'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TripParking } from '@/types/trips'

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ParkingForm({
  userId,
  tripId,
  item,
  onSaved,
  onClose,
}: {
  userId: string
  tripId: string
  item?: TripParking
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!item
  const [company, setCompany] = useState(item?.company ?? '')
  const [reference, setReference] = useState(item?.reference ?? '')
  const [startDatetime, setStartDatetime] = useState(item ? toDatetimeLocal(item.start_datetime) : '')
  const [endDatetime, setEndDatetime] = useState(item ? toDatetimeLocal(item.end_datetime) : '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!startDatetime) { setError('Arrival date/time is required.'); return }
    if (!endDatetime) { setError('Return date/time is required.'); return }
    setSaving(true)
    const payload = {
      company: company.trim() || null,
      reference: reference.trim() || null,
      start_datetime: new Date(startDatetime).toISOString(),
      end_datetime: new Date(endDatetime).toISOString(),
      notes: notes.trim() || null,
    }
    const q = isEdit
      ? (supabase as any).from('trip_parking').update(payload).eq('id', item!.id)
      : (supabase as any).from('trip_parking').insert({ ...payload, trip_id: tripId, user_id: userId })
    const { error: err } = await q
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">🅿️ {isEdit ? 'Edit parking' : 'Add parking'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}
          <div className="form-row">
            <div className="field-group">
              <label className="label">Company</label>
              <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Purple Parking" />
            </div>
            <div className="field-group">
              <label className="label">Reference</label>
              <input className="input-field" value={reference} onChange={e => setReference(e.target.value)} placeholder="Booking ref" />
            </div>
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Arrival date & time <span className="req">*</span></label>
              <input className="input-field" type="datetime-local" value={startDatetime} onChange={e => setStartDatetime(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Return date & time <span className="req">*</span></label>
              <input className="input-field" type="datetime-local" value={endDatetime} onChange={e => setEndDatetime(e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Terminal location, shuttle info, PIN code…" style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add parking'}</button>
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
