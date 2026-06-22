'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PropertyAsset, AssetType, ASSET_TYPE_LABELS, ASSET_TYPE_ICONS } from '@/types/properties'

const ASSET_TYPES: AssetType[] = [
  'fridge', 'freezer', 'dishwasher', 'washing_machine', 'tumble_dryer',
  'boiler', 'ev_charger', 'tv', 'speaker', 'oven', 'hob', 'grill',
  'microwave', 'slow_cooker', 'game_system', 'furniture', 'other',
]

export default function AssetForm({
  propertyId,
  userId,
  asset,
  onSaved,
  onClose,
}: {
  propertyId: string
  userId: string
  asset: PropertyAsset | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!asset
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(asset?.name ?? '')
  const [assetType, setAssetType] = useState<AssetType>(asset?.asset_type ?? 'other')
  const [make, setMake] = useState(asset?.make ?? '')
  const [model, setModel] = useState(asset?.model ?? '')
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchase_date ?? '')
  const [purchasePrice, setPurchasePrice] = useState(asset?.purchase_price?.toString() ?? '')
  const [purchasedFrom, setPurchasedFrom] = useState(asset?.purchased_from ?? '')
  const [serialNumber, setSerialNumber] = useState(asset?.serial_number ?? '')

  const handleSave = async () => {
    if (!name.trim()) { setError('Asset name is required.'); return }
    setSaving(true)
    setError('')
    const payload = {
      property_id: propertyId,
      user_id: userId,
      name: name.trim(),
      asset_type: assetType,
      make: make.trim() || null,
      model: model.trim() || null,
      purchase_date: purchaseDate || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      purchased_from: purchasedFrom.trim() || null,
      serial_number: serialNumber.trim() || null,
    }
    const { error: err } = isEdit
      ? await (supabase as any).from('property_assets').update(payload).eq('id', asset!.id)
      : await (supabase as any).from('property_assets').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="af-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="af-modal">
        <div className="af-header">
          <h2 className="af-title">{isEdit ? 'Edit asset' : 'Add asset'}</h2>
          <button className="af-close" onClick={onClose}>✕</button>
        </div>

        <div className="af-body">
          {error && <div className="af-error">{error}</div>}

          {/* Type picker */}
          <div className="af-field">
            <label className="af-label">Asset type</label>
            <div className="af-type-grid">
              {ASSET_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`af-type-btn ${assetType === t ? 'active' : ''}`}
                  onClick={() => setAssetType(t)}
                  title={ASSET_TYPE_LABELS[t]}
                >
                  <span className="af-type-icon">{ASSET_TYPE_ICONS[t]}</span>
                  <span className="af-type-label">{ASSET_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="af-field">
            <label className="af-label">Name / description *</label>
            <input
              className="af-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`e.g. Kitchen fridge, Living room TV…`}
              autoFocus
            />
          </div>

          <div className="af-row">
            <div className="af-field">
              <label className="af-label">Make</label>
              <input className="af-input" value={make} onChange={e => setMake(e.target.value)} placeholder="e.g. Samsung" />
            </div>
            <div className="af-field">
              <label className="af-label">Model</label>
              <input className="af-input" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. RS68A8840S9" />
            </div>
          </div>

          <div className="af-row">
            <div className="af-field">
              <label className="af-label">Purchase / install date</label>
              <input type="date" className="af-input" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </div>
            <div className="af-field">
              <label className="af-label">Purchase price (£)</label>
              <input type="number" className="af-input" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="e.g. 299" min="0" step="0.01" />
            </div>
          </div>

          <div className="af-row">
            <div className="af-field">
              <label className="af-label">Purchased from</label>
              <input className="af-input" value={purchasedFrom} onChange={e => setPurchasedFrom(e.target.value)} placeholder="e.g. John Lewis, IKEA" />
            </div>
            <div className="af-field">
              <label className="af-label">Serial number</label>
              <input className="af-input" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="e.g. SN123456789" />
            </div>
          </div>
        </div>

        <div className="af-footer">
          <button className="af-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add asset'}
          </button>
          <button className="af-cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>

      <style>{`
        .af-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .af-modal { background: white; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .af-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .af-title { font-size: 1.125rem; font-weight: 600; }
        .af-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 0.875rem; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .af-close:hover { background: var(--cream-dark); }
        .af-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .af-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 0.875rem; padding: 0.625rem 0.875rem; border-radius: 8px; }
        .af-field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
        .af-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .af-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .af-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.375rem; }
        .af-type-btn { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; padding: 0.5rem 0.25rem; border: 1.5px solid var(--border); border-radius: 8px; background: white; cursor: pointer; font-family: var(--font-body); transition: all 0.13s; }
        .af-type-btn:hover { border-color: var(--warm-brown); background: var(--cream); }
        .af-type-btn.active { border-color: var(--deep-brown); background: var(--cream-dark); }
        .af-type-icon { font-size: 1.1rem; }
        .af-type-label { font-size: 0.62rem; font-weight: 600; color: var(--text-secondary); text-align: center; line-height: 1.2; }
        .af-type-btn.active .af-type-label { color: var(--deep-brown); }
        .af-input { padding: 0.4375rem 0.625rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: var(--font-body); background: white; color: var(--text-primary); width: 100%; box-sizing: border-box; }
        .af-input:focus { outline: none; border-color: var(--terracotta); }
        .af-footer { display: flex; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .af-save-btn { padding: 0.5rem 1.25rem; border-radius: 8px; border: none; background: var(--deep-brown); color: var(--cream); font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .af-save-btn:disabled { opacity: 0.5; cursor: default; }
        .af-save-btn:not(:disabled):hover { background: var(--terracotta); }
        .af-cancel-btn { padding: 0.5rem 0.875rem; border-radius: 8px; border: 1px solid var(--border); background: white; font-size: 0.875rem; font-weight: 500; color: var(--text-muted); cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .af-cancel-btn:hover { background: var(--cream-dark); }
      `}</style>
    </div>
  )
}
