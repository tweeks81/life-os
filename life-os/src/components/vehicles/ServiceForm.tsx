'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VehicleService, ServiceType, SERVICE_TYPE_LABELS } from '@/types/vehicles'

const SERVICE_TYPES: ServiceType[] = ['full', 'interim', 'major', 'other']

export default function ServiceForm({ vehicleId, userId, service, onSaved, onClose }: {
  vehicleId: string; userId: string; service: VehicleService | null; onSaved: () => void; onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!service
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [serviceDate, setServiceDate] = useState(service?.service_date ?? '')
  const [serviceType, setServiceType] = useState<ServiceType | ''>(service?.service_type ?? '')
  const [garage, setGarage] = useState(service?.garage_name ?? '')
  const [cost, setCost] = useState(service?.cost?.toString() ?? '')
  const [mileage, setMileage] = useState(service?.mileage?.toString() ?? '')
  const [notes, setNotes] = useState(service?.notes ?? '')

  const handleSave = async () => {
    if (!serviceDate) { setError('Service date is required.'); return }
    setSaving(true); setError('')
    const payload = {
      vehicle_id: vehicleId, user_id: userId,
      service_date: serviceDate,
      service_type: serviceType || null,
      garage_name: garage.trim() || null,
      cost: cost ? parseFloat(cost) : null,
      mileage: mileage ? parseInt(mileage) : null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (isEdit) {
      const { error: err } = await (supabase as any).from('vehicle_services').update(payload).eq('id', service.id)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    } else {
      const { error: err } = await (supabase as any).from('vehicle_services').insert(payload)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit service' : 'Add service'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="field-group">
              <label className="label">Service date <span className="req">*</span></label>
              <input className="input-field" type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">Service type</label>
              <select className="input-field" value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)}>
                <option value="">Not specified</option>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{SERVICE_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
          </div>
          <div className="field-group">
            <label className="label">Garage</label>
            <input className="input-field" value={garage} onChange={e => setGarage(e.target.value)} placeholder="Who carried out the service?" />
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
            <textarea className="input-field" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="What was done, any issues found…" style={{ resize: 'vertical' }} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add service'}</button>
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
