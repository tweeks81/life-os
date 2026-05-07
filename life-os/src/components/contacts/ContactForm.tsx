'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Contact } from '@/types/contacts'

export default function ContactForm({
  userId,
  contact,
  onSaved,
  onClose,
}: {
  userId: string
  contact: Contact | null
  onSaved: (c?: Contact) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!contact
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState(contact?.first_name ?? '')
  const [lastName, setLastName] = useState(contact?.last_name ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [dob, setDob] = useState(contact?.date_of_birth ?? '')
  const [phoneMobile, setPhoneMobile] = useState(contact?.phone_mobile ?? '')
  const [phoneHome, setPhoneHome] = useState(contact?.phone_home ?? '')
  const [phoneWork, setPhoneWork] = useState(contact?.phone_work ?? '')
  const [addr1, setAddr1] = useState(contact?.address_line1 ?? '')
  const [addr2, setAddr2] = useState(contact?.address_line2 ?? '')
  const [town, setTown] = useState(contact?.address_town ?? '')
  const [city, setCity] = useState(contact?.address_city ?? '')
  const [postcode, setPostcode] = useState(contact?.address_postcode ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')

  const handleSave = async () => {
    if (!firstName.trim()) { setError('First name is required.'); return }
    setSaving(true)
    setError('')

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim() || null,
      date_of_birth: dob || null,
      phone_mobile: phoneMobile.trim() || null,
      phone_home: phoneHome.trim() || null,
      phone_work: phoneWork.trim() || null,
      address_line1: addr1.trim() || null,
      address_line2: addr2.trim() || null,
      address_town: town.trim() || null,
      address_city: city.trim() || null,
      address_postcode: postcode.trim() || null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (isEdit) {
      const { data, error: err } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', contact.id)
        .select()
        .single()
      if (err) { setError('Failed to save.'); setSaving(false); return }
      onSaved(data as Contact)
    } else {
      const { data, error: err } = await supabase
        .from('contacts')
        .insert({ ...payload, user_id: userId })
        .select()
        .single()
      if (err) { setError('Failed to save.'); setSaving(false); return }
      onSaved(data as Contact)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit contact' : 'New contact'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Name */}
          <div className="form-section-label">Name</div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">First name <span className="req">*</span></label>
              <input className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus />
            </div>
            <div className="field-group">
              <label className="label">Last name</label>
              <input className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          {/* Basic info */}
          <div className="form-section-label">Contact info</div>
          <div className="field-group">
            <label className="label">Email address</label>
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="field-group">
            <label className="label">Date of birth</label>
            <input className="input-field" type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </div>

          {/* Phone numbers */}
          <div className="form-section-label">Phone numbers</div>
          <div className="field-group">
            <label className="label">📱 Mobile</label>
            <input className="input-field" type="tel" value={phoneMobile} onChange={e => setPhoneMobile(e.target.value)} placeholder="+44 7700 000000" />
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">🏠 Home</label>
              <input className="input-field" type="tel" value={phoneHome} onChange={e => setPhoneHome(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">💼 Work</label>
              <input className="input-field" type="tel" value={phoneWork} onChange={e => setPhoneWork(e.target.value)} />
            </div>
          </div>

          {/* Address */}
          <div className="form-section-label">Address</div>
          <div className="field-group">
            <label className="label">Address line 1</label>
            <input className="input-field" value={addr1} onChange={e => setAddr1(e.target.value)} placeholder="Street address" />
          </div>
          <div className="field-group">
            <label className="label">Address line 2</label>
            <input className="input-field" value={addr2} onChange={e => setAddr2(e.target.value)} placeholder="Apartment, flat, etc." />
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
          <div className="field-group">
            <label className="label">Postcode</label>
            <input className="input-field" value={postcode} onChange={e => setPostcode(e.target.value)} style={{ maxWidth: '160px' }} />
          </div>

          {/* Notes */}
          <div className="form-section-label">Notes</div>
          <div className="field-group">
            <textarea
              className="input-field"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes about this contact…"
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add contact'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(44,31,20,0.35);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.15s ease;
        }
        .modal-box {
          width: 100%;
          max-width: 580px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.2s ease;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }
        .modal-title {
          font-size: 1.125rem;
          font-weight: 600;
        }
        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .modal-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .form-section-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-top: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid var(--border-light);
        }
        .form-section-label:first-child {
          margin-top: 0;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .req { color: var(--terracotta); }
        .form-error {
          font-size: 0.875rem;
          color: #dc2626;
          background: #fef2f2;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #fecaca;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-light);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
