'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PropertyPolicy, POLICY_TYPE_LABELS } from '@/types/properties'

const POLICY_TYPES = Object.keys(POLICY_TYPE_LABELS)

export default function PolicyForm({
  propertyId,
  userId,
  policy,
  onSaved,
  onClose,
}: {
  propertyId: string
  userId: string
  policy: PropertyPolicy | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!policy
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [policyType, setPolicyType] = useState(policy?.policy_type ?? 'home_insurance')
  const [insurer, setInsurer] = useState(policy?.insurer ?? '')
  const [policyNumber, setPolicyNumber] = useState(policy?.policy_number ?? '')
  const [premiumAnnual, setPremiumAnnual] = useState(policy?.premium_annual?.toString() ?? '')
  const [startDate, setStartDate] = useState(policy?.start_date ?? '')
  const [endDate, setEndDate] = useState(policy?.end_date ?? '')
  const [notes, setNotes] = useState(policy?.notes ?? '')

  const handleSave = async () => {
    if (!insurer.trim()) { setError('Insurer name is required.'); return }
    if (startDate && endDate && endDate < startDate) { setError('End date cannot be before start date.'); return }
    setSaving(true)
    setError('')
    const payload = {
      property_id: propertyId,
      user_id: userId,
      policy_type: policyType,
      insurer: insurer.trim(),
      policy_number: policyNumber.trim() || null,
      premium_annual: premiumAnnual ? parseFloat(premiumAnnual) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error: err } = isEdit
      ? await (supabase as any).from('property_policies').update(payload).eq('id', policy!.id)
      : await (supabase as any).from('property_policies').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal">
        <div className="mf-header">
          <h2 className="mf-title">{isEdit ? 'Edit policy' : 'Add policy'}</h2>
          <button className="mf-close" onClick={onClose}>✕</button>
        </div>

        <div className="mf-body">
          {error && <div className="mf-error">{error}</div>}

          <div className="mf-field">
            <label className="mf-label">Policy type</label>
            <select className="mf-input" value={policyType} onChange={e => setPolicyType(e.target.value)}>
              {POLICY_TYPES.map(pt => (
                <option key={pt} value={pt}>{POLICY_TYPE_LABELS[pt]}</option>
              ))}
            </select>
          </div>

          <div className="mf-field">
            <label className="mf-label">Insurer *</label>
            <input
              className="mf-input"
              value={insurer}
              onChange={e => setInsurer(e.target.value)}
              placeholder="e.g. Aviva, Direct Line, LV="
              autoFocus
            />
          </div>

          <div className="mf-grid">
            <div className="mf-field">
              <label className="mf-label">Policy number</label>
              <input
                className="mf-input"
                value={policyNumber}
                onChange={e => setPolicyNumber(e.target.value)}
                placeholder="e.g. POL-123456"
              />
            </div>
            <div className="mf-field">
              <label className="mf-label">Annual premium (£)</label>
              <input
                type="number"
                className="mf-input"
                value={premiumAnnual}
                onChange={e => setPremiumAnnual(e.target.value)}
                placeholder="e.g. 450"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="mf-grid">
            <div className="mf-field">
              <label className="mf-label">Start date</label>
              <input
                type="date"
                className="mf-input"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  if (endDate && e.target.value > endDate) setEndDate('')
                }}
              />
            </div>
            <div className="mf-field">
              <label className="mf-label">Renewal / end date</label>
              <input
                type="date"
                className="mf-input"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="mf-field">
            <label className="mf-label">Notes</label>
            <textarea
              className="mf-input mf-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes about this policy…"
              rows={3}
            />
          </div>
        </div>

        <div className="mf-footer">
          <button className="mf-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add policy'}
          </button>
          <button className="mf-cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <style>{`
        .mf-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .mf-modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .mf-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .mf-title { font-size: 1.125rem; font-weight: 600; }
        .mf-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 0.875rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .mf-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .mf-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .mf-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 0.875rem; padding: 0.625rem 0.875rem; border-radius: 8px; }
        .mf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .mf-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .mf-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .mf-input { padding: 0.4375rem 0.625rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: var(--font-body); background: white; color: var(--text-primary); width: 100%; box-sizing: border-box; }
        .mf-input:focus { outline: none; border-color: var(--terracotta); }
        .mf-textarea { resize: vertical; min-height: 72px; }
        .mf-footer { display: flex; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .mf-save-btn { padding: 0.5rem 1.25rem; border-radius: 8px; border: none; background: var(--deep-brown); color: var(--cream); font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .mf-save-btn:disabled { opacity: 0.5; cursor: default; }
        .mf-save-btn:not(:disabled):hover { background: var(--terracotta); }
        .mf-cancel-btn { padding: 0.5rem 0.875rem; border-radius: 8px; border: 1px solid var(--border); background: white; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .mf-cancel-btn:hover { background: var(--cream-dark); }
      `}</style>
    </div>
  )
}
