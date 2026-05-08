'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trip } from '@/types/trips'

export default function TripForm({
  userId,
  trip,
  onSaved,
  onClose,
}: {
  userId: string
  trip: Trip | null
  onSaved: (t: Trip) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [name, setName] = useState(trip?.name ?? '')
  const [description, setDescription] = useState(trip?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (trip) {
      const { data, error: err } = await (supabase as any).from('trips').update(payload).eq('id', trip.id).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(data as Trip)
    } else {
      const { data, error: err } = await (supabase as any).from('trips').insert({ ...payload, user_id: userId }).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(data as Trip)
    }
    setSaving(false)
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{trip ? 'Edit trip' : 'New trip'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <p className="form-error">{error}</p>}
          <div className="field-group">
            <label className="label">Trip name <span className="req">*</span></label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Barcelona 2026" autoFocus />
          </div>
          <div className="field-group">
            <label className="label">Description</label>
            <textarea className="input-field" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Purpose, notes…" style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : trip ? 'Save changes' : 'Create trip'}
          </button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 480px; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.125rem 1.25rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1rem; font-weight: 600; }
        .modal-close { width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.8125rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .modal-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.875rem 1.25rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 0.5rem 0.75rem; }
        .req { color: var(--terracotta); }
      `}</style>
    </div>
  )
}
