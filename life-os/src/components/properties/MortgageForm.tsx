'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PropertyMortgage, MortgageProductType, MORTGAGE_PRODUCT_LABELS } from '@/types/properties'

const PRODUCT_TYPES: MortgageProductType[] = [
  'fixed_2yr', 'fixed_5yr', 'fixed_10yr', 'tracker', 'variable', 'discount', 'svr', 'other',
]

export default function MortgageForm({
  propertyId,
  userId,
  mortgage,
  onSaved,
  onClose,
}: {
  propertyId: string
  userId: string
  mortgage: PropertyMortgage | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!mortgage
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [lender, setLender] = useState(mortgage?.lender ?? '')
  const [productType, setProductType] = useState<MortgageProductType | ''>(mortgage?.product_type ?? '')
  const [interestRate, setInterestRate] = useState(mortgage?.interest_rate?.toString() ?? '')
  const [monthlyPayment, setMonthlyPayment] = useState(mortgage?.monthly_payment?.toString() ?? '')
  const [startDate, setStartDate] = useState(mortgage?.start_date ?? '')
  const [endDate, setEndDate] = useState(mortgage?.end_date ?? '')
  const [notes, setNotes] = useState(mortgage?.notes ?? '')

  const handleSave = async () => {
    if (!lender.trim()) { setError('Lender name is required.'); return }
    if (startDate && endDate && endDate < startDate) { setError('End date cannot be before start date.'); return }
    setSaving(true)
    setError('')
    const payload = {
      property_id: propertyId,
      user_id: userId,
      lender: lender.trim(),
      product_type: productType || null,
      interest_rate: interestRate ? parseFloat(interestRate) : null,
      monthly_payment: monthlyPayment ? parseFloat(monthlyPayment) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      notes: notes.trim() || null,
    }
    const { error: err } = isEdit
      ? await (supabase as any).from('property_mortgages').update(payload).eq('id', mortgage!.id)
      : await (supabase as any).from('property_mortgages').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="mf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mf-modal">
        <div className="mf-header">
          <h2 className="mf-title">{isEdit ? 'Edit mortgage' : 'Add mortgage'}</h2>
          <button className="mf-close" onClick={onClose}>✕</button>
        </div>

        <div className="mf-body">
          {error && <div className="mf-error">{error}</div>}

          <div className="mf-field">
            <label className="mf-label">Lender *</label>
            <input
              className="mf-input"
              value={lender}
              onChange={e => setLender(e.target.value)}
              placeholder="e.g. Nationwide, Halifax, Barclays"
            />
          </div>

          <div className="mf-field">
            <label className="mf-label">Product type</label>
            <select
              className="mf-input"
              value={productType}
              onChange={e => setProductType(e.target.value as MortgageProductType | '')}
            >
              <option value="">— Select —</option>
              {PRODUCT_TYPES.map(pt => (
                <option key={pt} value={pt}>{MORTGAGE_PRODUCT_LABELS[pt]}</option>
              ))}
            </select>
          </div>

          <div className="mf-grid">
            <div className="mf-field">
              <label className="mf-label">Interest rate (%)</label>
              <input
                type="number"
                className="mf-input"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                placeholder="e.g. 4.25"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div className="mf-field">
              <label className="mf-label">Monthly payment (£)</label>
              <input
                type="number"
                className="mf-input"
                value={monthlyPayment}
                onChange={e => setMonthlyPayment(e.target.value)}
                placeholder="e.g. 1250"
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
              placeholder="Any additional notes about this mortgage deal…"
              rows={3}
            />
          </div>
        </div>

        <div className="mf-footer">
          <button className="mf-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add mortgage'}
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
        .mf-input:focus { outline: none; border-color: var(--terracotta); box-shadow: 0 0 0 3px rgba(var(--terracotta-rgb, 180,82,60), 0.1); }
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
