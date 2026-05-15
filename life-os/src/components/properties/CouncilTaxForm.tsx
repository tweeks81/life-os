'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PropertyCouncilTax, CouncilTaxBand, COUNCIL_TAX_BANDS } from '@/types/properties'

export default function CouncilTaxForm({
  propertyId,
  userId,
  record,
  onSaved,
  onClose,
}: {
  propertyId: string
  userId: string
  record: PropertyCouncilTax | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!record
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [councilName, setCouncilName] = useState(record?.council_name ?? '')
  const [band, setBand] = useState<CouncilTaxBand>(record?.band ?? 'D')
  const [periodStart, setPeriodStart] = useState(record?.period_start ?? '')
  const [periodEnd, setPeriodEnd] = useState(record?.period_end ?? '')
  const [annualCharge, setAnnualCharge] = useState(record?.annual_charge?.toString() ?? '')
  const [notes, setNotes] = useState(record?.notes ?? '')

  const handleSave = async () => {
    if (!councilName.trim()) { setError('Council name is required.'); return }
    if (periodStart && periodEnd && periodEnd < periodStart) {
      setError('Period end cannot be before period start.'); return
    }
    setSaving(true)
    setError('')
    const payload = {
      property_id: propertyId,
      user_id: userId,
      council_name: councilName.trim(),
      band,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      annual_charge: annualCharge ? parseFloat(annualCharge) : null,
      notes: notes.trim() || null,
    }
    const { error: err } = isEdit
      ? await (supabase as any).from('property_council_tax').update(payload).eq('id', record!.id)
      : await (supabase as any).from('property_council_tax').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="ctf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ctf-modal">
        <div className="ctf-header">
          <h2 className="ctf-title">{isEdit ? 'Edit council tax' : 'Add council tax'}</h2>
          <button className="ctf-close" onClick={onClose}>✕</button>
        </div>

        <div className="ctf-body">
          {error && <div className="ctf-error">{error}</div>}

          <div className="ctf-field">
            <label className="ctf-label">Council name *</label>
            <input
              className="ctf-input"
              value={councilName}
              onChange={e => setCouncilName(e.target.value)}
              placeholder="e.g. Westminster City Council"
              autoFocus
            />
          </div>

          <div className="ctf-field">
            <label className="ctf-label">Property band</label>
            <div className="ctf-band-grid">
              {COUNCIL_TAX_BANDS.map(b => (
                <button
                  key={b}
                  type="button"
                  className={`ctf-band-btn ${band === b ? 'active' : ''}`}
                  onClick={() => setBand(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="ctf-grid">
            <div className="ctf-field">
              <label className="ctf-label">Period start</label>
              <input
                type="date"
                className="ctf-input"
                value={periodStart}
                onChange={e => {
                  setPeriodStart(e.target.value)
                  if (periodEnd && e.target.value > periodEnd) setPeriodEnd('')
                }}
              />
            </div>
            <div className="ctf-field">
              <label className="ctf-label">Period end</label>
              <input
                type="date"
                className="ctf-input"
                value={periodEnd}
                min={periodStart || undefined}
                onChange={e => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="ctf-field">
            <label className="ctf-label">Total annual charge (£)</label>
            <input
              type="number"
              className="ctf-input"
              value={annualCharge}
              onChange={e => setAnnualCharge(e.target.value)}
              placeholder="e.g. 2100"
              min="0"
              step="0.01"
            />
          </div>

          <div className="ctf-field">
            <label className="ctf-label">Notes</label>
            <textarea
              className="ctf-input ctf-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional details…"
              rows={2}
            />
          </div>
        </div>

        <div className="ctf-footer">
          <button className="ctf-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add record'}
          </button>
          <button className="ctf-cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <style>{`
        .ctf-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .ctf-modal { background: white; border-radius: 16px; width: 100%; max-width: 460px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .ctf-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .ctf-title { font-size: 1.125rem; font-weight: 600; }
        .ctf-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 0.875rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .ctf-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .ctf-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .ctf-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 0.875rem; padding: 0.625rem 0.875rem; border-radius: 8px; }
        .ctf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .ctf-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .ctf-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .ctf-input { padding: 0.4375rem 0.625rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: var(--font-body); background: white; color: var(--text-primary); width: 100%; box-sizing: border-box; }
        .ctf-input:focus { outline: none; border-color: var(--terracotta); }
        .ctf-textarea { resize: vertical; min-height: 60px; }
        .ctf-band-grid { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .ctf-band-btn { width: 38px; height: 38px; border: 1.5px solid var(--border); border-radius: 8px; background: white; font-size: 0.9375rem; font-weight: 700; cursor: pointer; font-family: var(--font-body); color: var(--text-secondary); transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
        .ctf-band-btn:hover { border-color: var(--warm-brown); background: var(--cream); }
        .ctf-band-btn.active { border-color: var(--deep-brown); background: var(--deep-brown); color: var(--cream); }
        .ctf-footer { display: flex; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .ctf-save-btn { padding: 0.5rem 1.25rem; border-radius: 8px; border: none; background: var(--deep-brown); color: var(--cream); font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .ctf-save-btn:disabled { opacity: 0.5; cursor: default; }
        .ctf-save-btn:not(:disabled):hover { background: var(--terracotta); }
        .ctf-cancel-btn { padding: 0.5rem 0.875rem; border-radius: 8px; border: 1px solid var(--border); background: white; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .ctf-cancel-btn:hover { background: var(--cream-dark); }
      `}</style>
    </div>
  )
}
