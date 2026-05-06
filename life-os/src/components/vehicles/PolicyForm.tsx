'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VehiclePolicy, PolicyType, CoverageType, POLICY_TYPE_LABELS, COVERAGE_TYPE_LABELS } from '@/types/vehicles'

const POLICY_TYPES: PolicyType[] = ['insurance', 'breakdown', 'warranty', 'other']
const COVERAGE_TYPES: CoverageType[] = ['third_party', 'third_party_fire_theft', 'comprehensive', 'other']

export default function PolicyForm({ vehicleId, userId, policy, onSaved, onClose }: {
  vehicleId: string; userId: string; policy: VehiclePolicy | null; onSaved: () => void; onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!policy
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [policyType, setPolicyType] = useState<PolicyType>(policy?.policy_type ?? 'insurance')
  const [insurer, setInsurer] = useState(policy?.insurer ?? '')
  const [policyNumber, setPolicyNumber] = useState(policy?.policy_number ?? '')
  const [coverageType, setCoverageType] = useState<CoverageType | ''>(policy?.coverage_type ?? '')
  const [startDate, setStartDate] = useState(policy?.start_date ?? '')
  const [endDate, setEndDate] = useState(policy?.end_date ?? '')
  const [cost, setCost] = useState(policy?.cost?.toString() ?? '')
  const [autoRenews, setAutoRenews] = useState(policy?.auto_renews ?? false)
  const [notes, setNotes] = useState(policy?.notes ?? '')

  const handleSave = async () => {
    if (!startDate || !endDate) { setError('Start and end dates are required.'); return }
    setSaving(true); setError('')
    const payload = {
      vehicle_id: vehicleId, user_id: userId,
      policy_type: policyType,
      insurer: insurer.trim() || null,
      policy_number: policyNumber.trim() || null,
      coverage_type: coverageType || null,
      start_date: startDate, end_date: endDate,
      cost: cost ? parseFloat(cost) : null,
      auto_renews: autoRenews,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (isEdit) {
      const { error: err } = await (supabase as any).from('vehicle_policies').update(payload).eq('id', policy.id)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    } else {
      const { error: err } = await (supabase as any).from('vehicle_policies').insert(payload)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    }
    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit policy' : 'Add policy'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="field-group">
              <label className="label">Policy type <span className="req">*</span></label>
              <select className="input-field" value={policyType} onChange={e => setPolicyType(e.target.value as PolicyType)}>
                {POLICY_TYPES.map(t => <option key={t} value={t}>{POLICY_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            {policyType === 'insurance' && (
              <div className="field-group">
                <label className="label">Coverage type</label>
                <select className="input-field" value={coverageType} onChange={e => setCoverageType(e.target.value as CoverageType)}>
                  <option value="">Not specified</option>
                  {COVERAGE_TYPES.map(t => <option key={t} value={t}>{COVERAGE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Insurer / Provider</label>
              <input className="input-field" value={insurer} onChange={e => setInsurer(e.target.value)} placeholder="e.g. Admiral, RAC" />
            </div>
            <div className="field-group">
              <label className="label">Policy number</label>
              <input className="input-field" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Start date <span className="req">*</span></label>
              <input className="input-field" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">End date <span className="req">*</span></label>
              <input className="input-field" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Cost (£)</label>
              <input className="input-field" type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="Annual premium" />
            </div>
            <div className="field-group" style={{ justifyContent: 'flex-end', paddingTop: '1.5rem' }}>
              <label className="checkbox-label">
                <input type="checkbox" checked={autoRenews} onChange={e => setAutoRenews(e.target.checked)} className="checkbox-input" />
                Auto-renews
              </label>
            </div>
          </div>
          <div className="field-group">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes…" style={{ resize: 'vertical' }} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add policy'}</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 500px; max-height: 92vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1.125rem; font-weight: 600; }
        .modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; }
        .modal-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; }
        .checkbox-input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--deep-brown); }
        .req { color: var(--terracotta); }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #fecaca; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
