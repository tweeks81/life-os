'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VehicleMot } from '@/types/vehicles'

export default function MotForm({ vehicleId, userId, mot, onSaved, onClose }: {
  vehicleId: string; userId: string; mot: VehicleMot | null; onSaved: () => void; onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!mot
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [testDate, setTestDate] = useState(mot?.test_date ?? '')
  const [expiryDate, setExpiryDate] = useState(mot?.expiry_date ?? '')
  const [passed, setPassed] = useState(mot?.passed ?? true)
  const [garage, setGarage] = useState(mot?.garage_name ?? '')
  const [cost, setCost] = useState(mot?.cost?.toString() ?? '')
  const [mileage, setMileage] = useState(mot?.mileage?.toString() ?? '')
  const [notes, setNotes] = useState(mot?.notes ?? '')

  const handleSave = async () => {
    if (!testDate || !expiryDate) { setError('Test date and expiry date are required.'); return }
    setSaving(true); setError('')
    const payload = {
      vehicle_id: vehicleId, user_id: userId,
      test_date: testDate, expiry_date: expiryDate, passed,
      garage_name: garage.trim() || null,
      cost: cost ? parseFloat(cost) : null,
      mileage: mileage ? parseInt(mileage) : null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (isEdit) {
      const { error: err } = await (supabase as any).from('vehicle_mots').update(payload).eq('id', mot.id)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    } else {
      const { error: err } = await (supabase as any).from('vehicle_mots').insert(payload)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit MOT' : 'Add MOT'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="label">Result</label>
            <div className="radio-row">
              <label className="radio-label"><input type="radio" checked={passed} onChange={() => setPassed(true)} /> Pass</label>
              <label className="radio-label"><input type="radio" checked={!passed} onChange={() => setPassed(false)} /> Fail</label>
            </div>
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Test date <span className="req">*</span></label>
              <input className="input-field" type="date" value={testDate} onChange={e => setTestDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Expiry date <span className="req">*</span></label>
              <input className="input-field" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label className="label">Garage</label>
            <input className="input-field" value={garage} onChange={e => setGarage(e.target.value)} placeholder="Who carried out the MOT?" />
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Cost (£)</label>
              <input className="input-field" type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field-group">
              <label className="label">Mileage</label>
              <input className="input-field" type="number" min="0" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="e.g. 45000" />
            </div>
          </div>
          <div className="field-group">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any advisories or notes…" style={{ resize: 'vertical' }} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add MOT'}</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 480px; max-height: 92vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1.125rem; font-weight: 600; }
        .modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; }
        .modal-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .radio-row { display: flex; gap: 1.5rem; }
        .radio-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9375rem; cursor: pointer; }
        .req { color: var(--terracotta); }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #fecaca; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
