'use client'

import { useState } from 'react'
import { PropertyPurchase } from '@/types/properties'

function fmt(v: string | null | undefined) { return v || '—' }

function fmtPrice(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v)
}

function fmtDate(v: string | null | undefined) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ContactBlock({ label, firm, contact, phone, email }: {
  label: string
  firm: string | null | undefined
  contact: string | null | undefined
  phone: string | null | undefined
  email: string | null | undefined
}) {
  const hasAny = firm || contact || phone || email
  return (
    <div className="pps-contact-block">
      <div className="pps-contact-label">{label}</div>
      {hasAny ? (
        <div className="pps-contact-details">
          {firm && <div className="pps-contact-firm">{firm}</div>}
          {contact && <div className="pps-contact-line">👤 {contact}</div>}
          {phone && <div className="pps-contact-line">📞 <a href={`tel:${phone}`}>{phone}</a></div>}
          {email && <div className="pps-contact-line">✉ <a href={`mailto:${email}`}>{email}</a></div>}
        </div>
      ) : (
        <div className="pps-contact-empty">No details recorded</div>
      )}
    </div>
  )
}

export default function PropertyPurchaseSection({
  purchase,
  isOwner,
  propertyId,
  userId,
  onSave,
}: {
  purchase: PropertyPurchase | null
  isOwner: boolean
  propertyId: string
  userId: string
  onSave: (data: Omit<PropertyPurchase, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [isOwned, setIsOwned] = useState(purchase?.is_owned ?? false)
  const [purchaseDate, setPurchaseDate] = useState(purchase?.purchase_date ?? '')
  const [purchasePrice, setPurchasePrice] = useState(purchase?.purchase_price?.toString() ?? '')
  const [convFirm, setConvFirm] = useState(purchase?.conveyancer_firm ?? '')
  const [convContact, setConvContact] = useState(purchase?.conveyancer_contact ?? '')
  const [convPhone, setConvPhone] = useState(purchase?.conveyancer_phone ?? '')
  const [convEmail, setConvEmail] = useState(purchase?.conveyancer_email ?? '')
  const [agentFirm, setAgentFirm] = useState(purchase?.estate_agent_firm ?? '')
  const [agentContact, setAgentContact] = useState(purchase?.estate_agent_contact ?? '')
  const [agentPhone, setAgentPhone] = useState(purchase?.estate_agent_phone ?? '')
  const [agentEmail, setAgentEmail] = useState(purchase?.estate_agent_email ?? '')

  const openEdit = () => {
    setIsOwned(purchase?.is_owned ?? false)
    setPurchaseDate(purchase?.purchase_date ?? '')
    setPurchasePrice(purchase?.purchase_price?.toString() ?? '')
    setConvFirm(purchase?.conveyancer_firm ?? '')
    setConvContact(purchase?.conveyancer_contact ?? '')
    setConvPhone(purchase?.conveyancer_phone ?? '')
    setConvEmail(purchase?.conveyancer_email ?? '')
    setAgentFirm(purchase?.estate_agent_firm ?? '')
    setAgentContact(purchase?.estate_agent_contact ?? '')
    setAgentPhone(purchase?.estate_agent_phone ?? '')
    setAgentEmail(purchase?.estate_agent_email ?? '')
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave({
      property_id: propertyId,
      user_id: userId,
      is_owned: isOwned,
      purchase_date: isOwned && purchaseDate ? purchaseDate : null,
      purchase_price: isOwned && purchasePrice ? parseFloat(purchasePrice) : null,
      conveyancer_firm: isOwned && convFirm ? convFirm : null,
      conveyancer_contact: isOwned && convContact ? convContact : null,
      conveyancer_phone: isOwned && convPhone ? convPhone : null,
      conveyancer_email: isOwned && convEmail ? convEmail : null,
      estate_agent_firm: isOwned && agentFirm ? agentFirm : null,
      estate_agent_contact: isOwned && agentContact ? agentContact : null,
      estate_agent_phone: isOwned && agentPhone ? agentPhone : null,
      estate_agent_email: isOwned && agentEmail ? agentEmail : null,
    })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="pps-wrap">
      <div className="pps-section-header">
        <span className="pps-section-title">Purchase Details</span>
        {isOwner && !editing && (
          <button className="pps-edit-btn" onClick={openEdit}>Edit</button>
        )}
      </div>

      {editing ? (
        <div className="pps-form">
          {/* Owned checkbox */}
          <label className="pps-owned-row">
            <input
              type="checkbox"
              checked={isOwned}
              onChange={e => setIsOwned(e.target.checked)}
              className="pps-checkbox"
            />
            <span className="pps-owned-label">This property is owned</span>
          </label>

          {isOwned && (
            <>
              <div className="pps-form-grid">
                <div className="pps-field">
                  <label className="pps-label">Purchase date</label>
                  <input type="date" className="pps-input" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                </div>
                <div className="pps-field">
                  <label className="pps-label">Purchase price (£)</label>
                  <input type="number" className="pps-input" placeholder="e.g. 350000" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} min="0" />
                </div>
              </div>

              <div className="pps-group-label">Conveyancer / Solicitor</div>
              <div className="pps-form-grid">
                <div className="pps-field">
                  <label className="pps-label">Firm name</label>
                  <input className="pps-input" value={convFirm} onChange={e => setConvFirm(e.target.value)} placeholder="e.g. Smith & Co Solicitors" />
                </div>
                <div className="pps-field">
                  <label className="pps-label">Contact name</label>
                  <input className="pps-input" value={convContact} onChange={e => setConvContact(e.target.value)} placeholder="e.g. Jane Smith" />
                </div>
                <div className="pps-field">
                  <label className="pps-label">Phone</label>
                  <input className="pps-input" value={convPhone} onChange={e => setConvPhone(e.target.value)} placeholder="e.g. 01234 567890" />
                </div>
                <div className="pps-field">
                  <label className="pps-label">Email</label>
                  <input type="email" className="pps-input" value={convEmail} onChange={e => setConvEmail(e.target.value)} placeholder="e.g. jane@smithco.com" />
                </div>
              </div>

              <div className="pps-group-label">Estate Agent</div>
              <div className="pps-form-grid">
                <div className="pps-field">
                  <label className="pps-label">Firm name</label>
                  <input className="pps-input" value={agentFirm} onChange={e => setAgentFirm(e.target.value)} placeholder="e.g. Foxtons" />
                </div>
                <div className="pps-field">
                  <label className="pps-label">Contact name</label>
                  <input className="pps-input" value={agentContact} onChange={e => setAgentContact(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="pps-field">
                  <label className="pps-label">Phone</label>
                  <input className="pps-input" value={agentPhone} onChange={e => setAgentPhone(e.target.value)} placeholder="e.g. 020 7946 0123" />
                </div>
                <div className="pps-field">
                  <label className="pps-label">Email</label>
                  <input type="email" className="pps-input" value={agentEmail} onChange={e => setAgentEmail(e.target.value)} placeholder="e.g. john@foxtons.com" />
                </div>
              </div>
            </>
          )}

          <div className="pps-form-actions">
            <button className="pps-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="pps-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : purchase?.is_owned ? (
        <div className="pps-view">
          <div className="pps-owned-badge">✓ Owned</div>

          <div className="pps-details-grid">
            {purchase.purchase_date && (
              <div className="pps-detail-item">
                <span className="pps-detail-label">Purchase date</span>
                <span className="pps-detail-value">{fmtDate(purchase.purchase_date)}</span>
              </div>
            )}
            {purchase.purchase_price != null && (
              <div className="pps-detail-item">
                <span className="pps-detail-label">Purchase price</span>
                <span className="pps-detail-value">{fmtPrice(purchase.purchase_price)}</span>
              </div>
            )}
          </div>

          <ContactBlock
            label="Conveyancer / Solicitor"
            firm={purchase.conveyancer_firm}
            contact={purchase.conveyancer_contact}
            phone={purchase.conveyancer_phone}
            email={purchase.conveyancer_email}
          />
          <ContactBlock
            label="Estate Agent"
            firm={purchase.estate_agent_firm}
            contact={purchase.estate_agent_contact}
            phone={purchase.estate_agent_phone}
            email={purchase.estate_agent_email}
          />
        </div>
      ) : (
        <p className="pps-not-owned">
          {isOwner ? 'Not marked as owned — click Edit to update.' : 'Not marked as owned.'}
        </p>
      )}

      <style>{`
        .pps-wrap { display: flex; flex-direction: column; gap: 0.75rem; }
        .pps-section-header { display: flex; align-items: center; justify-content: space-between; }
        .pps-section-title { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
        .pps-edit-btn { font-size: 0.75rem; font-weight: 500; color: var(--terracotta); background: none; border: none; cursor: pointer; padding: 0; font-family: var(--font-body); transition: color 0.15s; }
        .pps-edit-btn:hover { color: var(--deep-brown); }
        .pps-not-owned { font-size: 0.875rem; color: var(--text-muted); font-style: italic; }

        /* Form */
        .pps-form { display: flex; flex-direction: column; gap: 0.875rem; }
        .pps-owned-row { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .pps-checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: var(--terracotta); flex-shrink: 0; }
        .pps-owned-label { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
        .pps-group-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-secondary); padding-top: 0.25rem; border-top: 1px solid var(--border-light); }
        .pps-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .pps-field { display: flex; flex-direction: column; gap: 0.2rem; }
        .pps-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .pps-input { padding: 0.375rem 0.5rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.8125rem; font-family: var(--font-body); background: white; color: var(--text-primary); width: 100%; box-sizing: border-box; }
        .pps-input:focus { outline: none; border-color: var(--terracotta); }
        .pps-form-actions { display: flex; gap: 0.5rem; padding-top: 0.25rem; }
        .pps-save-btn { padding: 0.375rem 0.875rem; border-radius: 6px; border: none; background: var(--terracotta); color: white; font-size: 0.8125rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .pps-save-btn:disabled { opacity: 0.5; cursor: default; }
        .pps-save-btn:not(:disabled):hover { background: var(--deep-brown); }
        .pps-cancel-btn { padding: 0.375rem 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: white; font-size: 0.8125rem; font-weight: 500; color: var(--text-muted); cursor: pointer; font-family: var(--font-body); }
        .pps-cancel-btn:hover { background: var(--cream-dark); }

        /* View */
        .pps-view { display: flex; flex-direction: column; gap: 0.875rem; }
        .pps-owned-badge { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 700; color: #16a34a; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 5px; padding: 0.15rem 0.5rem; width: fit-content; }
        .pps-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }
        .pps-detail-item { display: flex; flex-direction: column; gap: 0.15rem; }
        .pps-detail-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .pps-detail-value { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); }
        .pps-contact-block { display: flex; flex-direction: column; gap: 0.3rem; padding-top: 0.5rem; border-top: 1px solid var(--border-light); }
        .pps-contact-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-secondary); }
        .pps-contact-firm { font-size: 0.875rem; font-weight: 600; color: var(--deep-brown); }
        .pps-contact-line { font-size: 0.8125rem; color: var(--text-secondary); }
        .pps-contact-line a { color: var(--terracotta); text-decoration: none; }
        .pps-contact-line a:hover { text-decoration: underline; }
        .pps-contact-empty { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; }
      `}</style>
    </div>
  )
}
