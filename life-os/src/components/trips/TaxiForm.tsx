'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TripTaxi } from '@/types/trips'

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function TaxiForm({
  userId,
  tripId,
  item,
  onSaved,
  onClose,
}: {
  userId: string
  tripId: string
  item?: TripTaxi
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!item
  const [company, setCompany] = useState(item?.company ?? '')
  const [collectionAddress, setCollectionAddress] = useState(item?.collection_address ?? '')
  const [collectionDatetime, setCollectionDatetime] = useState(item ? toDatetimeLocal(item.collection_datetime) : '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!collectionAddress.trim()) { setError('Collection address is required.'); return }
    if (!collectionDatetime) { setError('Collection date/time is required.'); return }
    setSaving(true)
    const payload = {
      company: company.trim() || null,
      collection_address: collectionAddress.trim(),
      collection_datetime: new Date(collectionDatetime).toISOString(),
      notes: notes.trim() || null,
    }
    const q = isEdit
      ? (supabase as any).from('trip_taxis').update(payload).eq('id', item!.id)
      : (supabase as any).from('trip_taxis').insert({ ...payload, trip_id: tripId, user_id: userId })
    const { error: err } = await q
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">🚕 {isEdit ? 'Edit taxi / transfer' : 'Add taxi / transfer'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}
          <div className="field-group">
            <label className="label">Company</label>
            <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Uber, local taxi" />
          </div>
          <div className="field-group">
            <label className="label">Collection address <span className="req">*</span></label>
            <input className="input-field" value={collectionAddress} onChange={e => setCollectionAddress(e.target.value)} placeholder="e.g. 12 Main Street, Manchester" />
          </div>
          <div className="field-group">
            <label className="label">Collection date & time <span className="req">*</span></label>
            <input className="input-field" type="datetime-local" value={collectionDatetime} onChange={e => setCollectionDatetime(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Driver name, contact number, meet point…" style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add taxi'}</button>
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
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 0.5rem 0.75rem; }
        .req { color: var(--terracotta); }
      `}</style>
    </div>
  )
}
