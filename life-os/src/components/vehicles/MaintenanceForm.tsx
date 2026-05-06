'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VehicleMaintenance } from '@/types/vehicles'

export default function MaintenanceForm({ vehicleId, userId, maintenance, onSaved, onClose }: {
  vehicleId: string; userId: string; maintenance: VehicleMaintenance | null; onSaved: () => void; onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!maintenance
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [workDate, setWorkDate] = useState(maintenance?.work_date ?? '')
  const [description, setDescription] = useState(maintenance?.description ?? '')
  const [garage, setGarage] = useState(maintenance?.garage_name ?? '')
  const [cost, setCost] = useState(maintenance?.cost?.toString() ?? '')
  const [mileage, setMileage] = useState(maintenance?.mileage?.toString() ?? '')
  const [notes, setNotes] = useState(maintenance?.notes ?? '')

  const handleSave = async () => {
    if (!workDate) { setError('Date is required.'); return }
    if (!description.trim()) { setError('Description is required.'); return }
    setSaving(true); setError('')
    const payload = {
      vehicle_id: vehicleId, user_id: userId,
      work_date: workDate, description: description.trim(),
      garage_name: garage.trim() || null,
      cost: cost ? parseFloat(cost) : null,
      mileage: mileage ? parseInt(mileage) : null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (isEdit) {
      const { error: err } = await (supabase as any).from('vehicle_maintenance').update(payload).eq('id', maintenance.id)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    } else {
      const { error: err } = await (supabase as any).from('vehicle_maintenance').insert(payload)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit maintenance' : 'Add maintenance'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="label">Date <span className="req">*</span></label>
            <input className="input-field" type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} style={{ maxWidth: '200px' }} />
          </div>
          <div className="field-group">
            <label className="label">Description <span className="req">*</span></label>
            <input className="input-field" value={description} onChange={e => setDescription(e.target.value)} placeholder='e.g. "Replaced front tyres", "New brake pads"' />
          </div>
          <div className="field-group">
            <label className="label">Garage / Who did the work</label>
            <input className="input-field" value={garage} onChange={e => setGarage(e.target.value)} placeholder="Optional" />
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
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional detail…" style={{ resize: 'vertical' }} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add record'}</button>
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
        .req { color: var(--terracotta); }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #fecaca; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
