'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PropertyUtility, UtilityType, UTILITY_TYPE_LABELS, UTILITY_TYPE_ICONS } from '@/types/properties'

const UTILITY_TYPES: UtilityType[] = ['electricity', 'gas', 'water', 'internet']

export default function UtilityForm({
  propertyId,
  userId,
  utility,
  onSaved,
  onClose,
}: {
  propertyId: string
  userId: string
  utility: PropertyUtility | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!utility
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [utilityType, setUtilityType] = useState<UtilityType>(utility?.utility_type ?? 'electricity')
  const [provider, setProvider] = useState(utility?.provider ?? '')
  const [notes, setNotes] = useState(utility?.notes ?? '')

  const handleSave = async () => {
    if (!provider.trim()) { setError('Provider name is required.'); return }
    setSaving(true)
    setError('')
    const payload = {
      property_id: propertyId,
      user_id: userId,
      utility_type: utilityType,
      provider: provider.trim(),
      notes: notes.trim() || null,
    }
    const { error: err } = isEdit
      ? await (supabase as any).from('property_utilities').update(payload).eq('id', utility!.id)
      : await (supabase as any).from('property_utilities').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="uf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="uf-modal">
        <div className="uf-header">
          <h2 className="uf-title">{isEdit ? 'Edit utility' : 'Add utility'}</h2>
          <button className="uf-close" onClick={onClose}>✕</button>
        </div>

        <div className="uf-body">
          {error && <div className="uf-error">{error}</div>}

          <div className="uf-field">
            <label className="uf-label">Utility type</label>
            <div className="uf-type-grid">
              {UTILITY_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`uf-type-btn ${utilityType === t ? 'active' : ''}`}
                  onClick={() => setUtilityType(t)}
                >
                  <span className="uf-type-icon">{UTILITY_TYPE_ICONS[t]}</span>
                  <span className="uf-type-label">{UTILITY_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="uf-field">
            <label className="uf-label">Provider *</label>
            <input
              className="uf-input"
              value={provider}
              onChange={e => setProvider(e.target.value)}
              placeholder={`e.g. ${utilityType === 'electricity' ? 'Octopus Energy' : utilityType === 'gas' ? 'British Gas' : utilityType === 'water' ? 'Thames Water' : 'BT, Sky, Virgin Media'}`}
              autoFocus
            />
          </div>

          <div className="uf-field">
            <label className="uf-label">Notes</label>
            <textarea
              className="uf-input uf-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Account number, tariff, any other details…"
              rows={3}
            />
          </div>
        </div>

        <div className="uf-footer">
          <button className="uf-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add utility'}
          </button>
          <button className="uf-cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <style>{`
        .uf-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .uf-modal { background: white; border-radius: 16px; width: 100%; max-width: 440px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .uf-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .uf-title { font-size: 1.125rem; font-weight: 600; }
        .uf-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 0.875rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .uf-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .uf-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .uf-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 0.875rem; padding: 0.625rem 0.875rem; border-radius: 8px; }
        .uf-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .uf-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .uf-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
        .uf-type-btn { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; padding: 0.625rem 0.25rem; border: 1.5px solid var(--border); border-radius: 10px; background: white; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .uf-type-btn:hover { border-color: var(--warm-brown); background: var(--cream); }
        .uf-type-btn.active { border-color: var(--deep-brown); background: var(--cream-dark); }
        .uf-type-icon { font-size: 1.25rem; }
        .uf-type-label { font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); }
        .uf-type-btn.active .uf-type-label { color: var(--deep-brown); }
        .uf-input { padding: 0.4375rem 0.625rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: var(--font-body); background: white; color: var(--text-primary); width: 100%; box-sizing: border-box; }
        .uf-input:focus { outline: none; border-color: var(--terracotta); }
        .uf-textarea { resize: vertical; min-height: 72px; }
        .uf-footer { display: flex; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .uf-save-btn { padding: 0.5rem 1.25rem; border-radius: 8px; border: none; background: var(--deep-brown); color: var(--cream); font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .uf-save-btn:disabled { opacity: 0.5; cursor: default; }
        .uf-save-btn:not(:disabled):hover { background: var(--terracotta); }
        .uf-cancel-btn { padding: 0.5rem 0.875rem; border-radius: 8px; border: 1px solid var(--border); background: white; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .uf-cancel-btn:hover { background: var(--cream-dark); }
      `}</style>
    </div>
  )
}
