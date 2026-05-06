'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Property, PROPERTY_TYPE_LABELS, PropertyType } from '@/types/properties'
import Image from 'next/image'

const PROPERTY_TYPES: PropertyType[] = [
  'detached_house', 'semi_detached_house', 'terraced_house',
  'bungalow', 'flat', 'maisonette', 'cottage', 'farmhouse', 'other'
]

export default function PropertyForm({
  userId,
  property,
  onSaved,
  onClose,
}: {
  userId: string
  property: Property | null
  onSaved: (p?: Property) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!property
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(property?.name ?? '')
  const [propertyType, setPropertyType] = useState<PropertyType>(property?.property_type ?? 'detached_house')
  const [yearBuilt, setYearBuilt] = useState(property?.year_built?.toString() ?? '')
  const [isPrimary, setIsPrimary] = useState(property?.is_primary_residence ?? false)
  const [photoUrl, setPhotoUrl] = useState(property?.photo_url ?? '')
  const [addr1, setAddr1] = useState(property?.address_line1 ?? '')
  const [addr2, setAddr2] = useState(property?.address_line2 ?? '')
  const [town, setTown] = useState(property?.address_town ?? '')
  const [city, setCity] = useState(property?.address_city ?? '')
  const [postcode, setPostcode] = useState(property?.address_postcode ?? '')
  const [country, setCountry] = useState(property?.address_country ?? 'United Kingdom')
  const [notes, setNotes] = useState(property?.notes ?? '')

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB.')
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(filePath, file, { upsert: true })
    if (uploadError) {
      setError('Failed to upload photo.')
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('property-photos').getPublicUrl(filePath)
    setPhotoUrl(`${data.publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError('')

    const payload = {
      name: name.trim(),
      property_type: propertyType,
      year_built: yearBuilt ? parseInt(yearBuilt) : null,
      is_primary_residence: isPrimary,
      photo_url: photoUrl || null,
      address_line1: addr1.trim() || null,
      address_line2: addr2.trim() || null,
      address_town: town.trim() || null,
      address_city: city.trim() || null,
      address_postcode: postcode.trim() || null,
      address_country: country.trim() || 'United Kingdom',
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (isEdit) {
      const { data, error: err } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', property.id)
        .select()
        .single()
      if (err) { setError('Failed to save.'); setSaving(false); return }
      onSaved(data as Property)
    } else {
      const { data, error: err } = await supabase
        .from('properties')
        .insert({ ...payload, user_id: userId })
        .select()
        .single()
      if (err) { setError('Failed to save.'); setSaving(false); return }
      onSaved(data as Property)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit property' : 'Add property'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Photo */}
          <div className="photo-section">
            {photoUrl ? (
              <div className="photo-preview">
                <Image src={photoUrl} alt="Property" width={200} height={120} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} unoptimized />
                <button className="photo-remove" onClick={() => setPhotoUrl('')}>Remove photo</button>
              </div>
            ) : (
              <button
                className="photo-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                type="button"
              >
                <span style={{ fontSize: '1.5rem' }}>📷</span>
                <span>{uploading ? 'Uploading…' : 'Add a photo'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG or PNG · Max 5 MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Name */}
          <div className="field-group">
            <label className="label">Property name <span className="req">*</span></label>
            <input
              className="input-field"
              placeholder='e.g. "Home", "Mum & Dad\'s", "Holiday cottage"'
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="field-group">
            <label className="label">Property type <span className="req">*</span></label>
            <select className="input-field" value={propertyType} onChange={e => setPropertyType(e.target.value as PropertyType)}>
              {PROPERTY_TYPES.map(t => (
                <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Year built */}
          <div className="field-group">
            <label className="label">Year built</label>
            <input
              className="input-field"
              type="number"
              placeholder="e.g. 1985"
              min="1000"
              max={new Date().getFullYear()}
              value={yearBuilt}
              onChange={e => setYearBuilt(e.target.value)}
              style={{ maxWidth: '160px' }}
            />
          </div>

          {/* Primary residence */}
          <div className="field-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={e => setIsPrimary(e.target.checked)}
                className="checkbox-input"
              />
              <span>This is my primary residence</span>
            </label>
            {isPrimary && (
              <p className="field-hint">Any other property currently set as primary will be unset automatically.</p>
            )}
          </div>

          {/* Address */}
          <div className="form-section-label">Address</div>
          <div className="field-group">
            <label className="label">Address line 1</label>
            <input className="input-field" value={addr1} onChange={e => setAddr1(e.target.value)} placeholder="Street address" />
          </div>
          <div className="field-group">
            <label className="label">Address line 2</label>
            <input className="input-field" value={addr2} onChange={e => setAddr2(e.target.value)} placeholder="Flat, apartment, etc." />
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Town</label>
              <input className="input-field" value={town} onChange={e => setTown(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">City</label>
              <input className="input-field" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Postcode</label>
              <input className="input-field" value={postcode} onChange={e => setPostcode(e.target.value)} style={{ maxWidth: '160px' }} />
            </div>
            <div className="field-group">
              <label className="label">Country</label>
              <input className="input-field" value={country} onChange={e => setCountry(e.target.value)} />
            </div>
          </div>

          {/* Notes */}
          <div className="field-group">
            <label className="label">Notes</label>
            <textarea
              className="input-field"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes about this property…"
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || uploading}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add property'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 580px; max-height: 92vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1.125rem; font-weight: 600; }
        .modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .modal-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .modal-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .photo-section { margin-bottom: 0.25rem; }
        .photo-preview { display: flex; flex-direction: column; gap: 0.5rem; }
        .photo-remove { font-size: 0.8rem; color: var(--terracotta); background: none; border: none; cursor: pointer; font-family: var(--font-body); padding: 0; text-decoration: underline; align-self: flex-start; }
        .photo-upload-btn { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem; padding: 1.25rem; background: var(--cream); border: 1.5px dashed var(--border); border-radius: 10px; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; font-size: 0.9rem; color: var(--text-secondary); }
        .photo-upload-btn:hover { border-color: var(--warm-brown); background: var(--cream-dark); }
        .form-section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); padding-bottom: 0.25rem; border-bottom: 1px solid var(--border-light); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .checkbox-label { display: flex; align-items: center; gap: 0.625rem; font-size: 0.9375rem; font-weight: 500; color: var(--text-primary); cursor: pointer; }
        .checkbox-input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--deep-brown); flex-shrink: 0; }
        .field-hint { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
        .req { color: var(--terracotta); }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #fecaca; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
