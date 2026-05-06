'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vehicle, VehicleType, VEHICLE_TYPE_LABELS } from '@/types/vehicles'

const VEHICLE_TYPES: VehicleType[] = ['car', 'van', 'motorbike', 'scooter', 'truck', 'motorhome', 'caravan', 'other']

export default function VehicleForm({ userId, vehicle, onSaved, onClose }: {
  userId: string; vehicle: Vehicle | null; onSaved: (v?: Vehicle) => void; onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!vehicle
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(vehicle?.name ?? '')
  const [type, setType] = useState<VehicleType>(vehicle?.vehicle_type ?? 'car')
  const [make, setMake] = useState(vehicle?.make ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [reg, setReg] = useState(vehicle?.reg_number ?? '')
  const [year, setYear] = useState(vehicle?.year?.toString() ?? '')
  const [colour, setColour] = useState(vehicle?.colour ?? '')
  const [notes, setNotes] = useState(vehicle?.notes ?? '')

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true); setError('')
    const payload = {
      name: name.trim(), vehicle_type: type,
      make: make.trim() || null, model: model.trim() || null,
      reg_number: reg.trim().toUpperCase() || null,
      year: year ? parseInt(year) : null,
      colour: colour.trim() || null, notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (isEdit) {
      const { data, error: err } = await supabase.from('vehicles').update(payload).eq('id', vehicle.id).select().single()
      if (err) { setError('Failed to save.'); setSaving(false); return }
      onSaved(data as Vehicle)
    } else {
      const { data, error: err } = await supabase.from('vehicles').insert({ ...payload, user_id: userId }).select().single()
      if (err) { setError('Failed to save.'); setSaving(false); return }
      onSaved(data as Vehicle)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit vehicle' : 'Add vehicle'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="label">Name <span className="req">*</span></label>
            <input className="input-field" placeholder='e.g. "My Car", "Work Van"' value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="field-group">
            <label className="label">Type <span className="req">*</span></label>
            <select className="input-field" value={type} onChange={e => setType(e.target.value as VehicleType)}>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{VEHICLE_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Make</label>
              <input className="input-field" placeholder="e.g. Ford" value={make} onChange={e => setMake(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Model</label>
              <input className="input-field" placeholder="e.g. Focus" value={model} onChange={e => setModel(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Registration</label>
              <input className="input-field" placeholder="AB12 CDE" value={reg} onChange={e => setReg(e.target.value)} style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }} />
            </div>
            <div className="field-group">
              <label className="label">Year</label>
              <input className="input-field" type="number" placeholder="e.g. 2019" min="1900" max={new Date().getFullYear() + 1} value={year} onChange={e => setYear(e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label className="label">Colour</label>
            <input className="input-field" placeholder="e.g. Blue" value={colour} onChange={e => setColour(e.target.value)} />
          </div>
          <div className="field-group">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes…" style={{ resize: 'vertical' }} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 520px; max-height: 92vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1.125rem; font-weight: 600; }
        .modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; }
        .modal-close:hover { background: var(--cream-dark); }
        .modal-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .req { color: var(--terracotta); }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #fecaca; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
