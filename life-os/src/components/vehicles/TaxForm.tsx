'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VehicleTax } from '@/types/vehicles'

export default function TaxForm({ vehicleId, userId, tax, onSaved, onClose }: {
  vehicleId: string
  userId: string
  tax: VehicleTax | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!tax
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [duration, setDuration] = useState<'6_months' | '12_months'>(tax?.duration ?? '12_months')
  const [startDate, setStartDate] = useState(tax?.start_date ?? '')
  const [expiryDate, setExpiryDate] = useState(tax?.expiry_date ?? '')
  const [cost, setCost] = useState(tax?.cost?.toString() ?? '')
  const [notes, setNotes] = useState(tax?.notes ?? '')

  // Auto-calculate expiry when start date or duration changes
  const handleStartDateChange = (val: string) => {
    setStartDate(val)
    if (val) {
      const start = new Date(val)
      const expiry = new Date(start)
      if (duration === '6_months') {
        expiry.setMonth(expiry.getMonth() + 6)
      } else {
        expiry.setFullYear(expiry.getFullYear() + 1)
      }
      // Subtract one day (tax expires last day of month typically)
      expiry.setDate(expiry.getDate() - 1)
      setExpiryDate(expiry.toISOString().split('T')[0])
    }
  }

  const handleDurationChange = (val: '6_months' | '12_months') => {
    setDuration(val)
    if (startDate) {
      const start = new Date(startDate)
      const expiry = new Date(start)
      if (val === '6_months') {
        expiry.setMonth(expiry.getMonth() + 6)
      } else {
        expiry.setFullYear(expiry.getFullYear() + 1)
      }
      expiry.setDate(expiry.getDate() - 1)
      setExpiryDate(expiry.toISOString().split('T')[0])
    }
  }

  const handleSave = async () => {
    if (!startDate || !expiryDate) { setError('Start and expiry dates are required.'); return }
    setSaving(true); setError('')

    const payload = {
      vehicle_id: vehicleId,
      user_id: userId,
      duration,
      start_date: startDate,
      expiry_date: expiryDate,
      cost: cost ? parseFloat(cost) : null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (isEdit) {
      const { error: err } = await (supabase as any).from('vehicle_tax').update(payload).eq('id', tax.id)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    } else {
      const { error: err } = await (supabase as any).from('vehicle_tax').insert(payload)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit tax' : 'Add vehicle tax'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <label className="label">Duration <span className="req">*</span></label>
            <div className="duration-toggle">
              <button
                type="button"
                className={`duration-btn ${duration === '6_months' ? 'active' : ''}`}
                onClick={() => handleDurationChange('6_months')}
              >
                6 months
              </button>
              <button
                type="button"
                className={`duration-btn ${duration === '12_months' ? 'active' : ''}`}
                onClick={() => handleDurationChange('12_months')}
              >
                12 months
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="field-group">
              <label className="label">Start date <span className="req">*</span></label>
              <input
                className="input-field"
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
              />
            </div>
            <div className="field-group">
              <label className="label">Expiry date <span className="req">*</span></label>
              <input
                className="input-field"
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
              <p className="field-hint">Auto-calculated from start date</p>
            </div>
          </div>

          <div className="field-group">
            <label className="label">Cost (£)</label>
            <input
              className="input-field"
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="0.00"
              style={{ maxWidth: '160px' }}
            />
          </div>

          <div className="field-group">
            <label className="label">Notes</label>
            <textarea
              className="input-field"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes…"
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add tax'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 460px; max-height: 92vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1.125rem; font-weight: 600; }
        .modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; }
        .modal-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .duration-toggle { display: flex; gap: 0; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; width: fit-content; }
        .duration-btn { padding: 0.5rem 1.25rem; border: none; background: none; cursor: pointer; font-family: var(--font-body); font-size: 0.9rem; font-weight: 500; color: var(--text-secondary); transition: all 0.15s; }
        .duration-btn:first-child { border-right: 1px solid var(--border); }
        .duration-btn.active { background: var(--deep-brown); color: var(--cream); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .field-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
        .req { color: var(--terracotta); }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #fecaca; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
