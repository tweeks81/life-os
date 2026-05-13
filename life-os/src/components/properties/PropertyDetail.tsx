'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Property, PropertyPurchase, PropertyMortgage, MortgageProductType,
  PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, MORTGAGE_PRODUCT_LABELS, formatAddress,
} from '@/types/properties'
import SharePanel, { ShareRecord } from '@/components/tasks/SharePanel'
import PropertyPurchaseSection from './PropertyPurchaseSection'
import MortgageForm from './MortgageForm'

type Tab = 'info' | 'mortgage'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'info', label: 'Info', icon: '🏠' },
  { id: 'mortgage', label: 'Mortgage', icon: '🏦' },
]

function isMortgageExpired(endDate: string | null): boolean {
  if (!endDate) return false
  const exp = new Date(endDate + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return exp < now
}

function isMortgageExpiringSoon(endDate: string | null, days = 90): boolean {
  if (!endDate) return false
  const exp = new Date(endDate + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PropertyDetail({
  property,
  userId,
  shares,
  purchase,
  onSharesChanged,
  onSavePurchase,
  onEdit,
  onDelete,
  onClose,
}: {
  property: Property
  userId: string
  shares: ShareRecord[]
  purchase: PropertyPurchase | null
  onSharesChanged: () => void
  onSavePurchase: (data: Omit<PropertyPurchase, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isOwner = property.user_id === userId
  const isShared = !isOwner
  const fullAddress = formatAddress(property)

  const [tab, setTab] = useState<Tab>('info')
  const [mortgages, setMortgages] = useState<PropertyMortgage[]>([])
  const [showMortgageForm, setShowMortgageForm] = useState(false)
  const [editingMortgage, setEditingMortgage] = useState<PropertyMortgage | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadMortgages = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('property_mortgages')
      .select('*')
      .eq('property_id', property.id)
      .order('end_date', { ascending: false, nullsFirst: true })
      .order('start_date', { ascending: false })
    setMortgages(data ?? [])
  }, [supabase, property.id])

  useEffect(() => {
    if (tab === 'mortgage') loadMortgages()
  }, [tab, loadMortgages])

  // Reset to info tab when a different property is selected
  useEffect(() => {
    setTab('info')
    setMortgages([])
  }, [property.id])

  const handleDelete = () => {
    if (confirm(`Delete "${property.name}"? This cannot be undone.`)) onDelete()
  }

  const handleDeleteMortgage = async (id: string) => {
    if (!confirm('Delete this mortgage record?')) return
    setDeletingId(id)
    await (supabase as any).from('property_mortgages').delete().eq('id', id)
    setDeletingId(null)
    loadMortgages()
  }

  // Determine "current" mortgage — non-expired with latest end_date, or most recent if all expired
  const activeMortgage = mortgages.find(m => !isMortgageExpired(m.end_date)) ?? mortgages[0] ?? null
  const historyMortgages = mortgages.filter(m => m !== activeMortgage)

  return (
    <div className="prop-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <span className="detail-type-icon">{PROPERTY_TYPE_ICONS[property.property_type]}</span>
          <div className="detail-title-block">
            <h2 className="detail-title">{property.name}</h2>
            <div className="detail-badges">
              {property.is_primary_residence && (
                <span className="primary-badge">⌂ Primary residence</span>
              )}
              {isShared && (
                <span className="shared-badge">👥 Shared with you</span>
              )}
            </div>
          </div>
        </div>
        <div className="detail-header-right">
          {isOwner && (
            <>
              <button className="btn-secondary detail-btn" onClick={onEdit}>Edit</button>
              <button className="detail-delete-btn" onClick={handleDelete} title="Delete">🗑</button>
            </>
          )}
          <button className="detail-close mobile-only" onClick={onClose} style={{ display: 'none', width: 'auto', padding: '0 0.75rem', fontSize: '0.875rem', borderRadius: '8px', color: 'var(--terracotta)', borderColor: 'transparent', background: 'none' }}>← Back</button>
          <button className="detail-close desktop-only" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="prop-tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`prop-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="prop-tab-icon">{t.icon}</span>
            <span className="prop-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="detail-scroll">

        {/* ── INFO TAB ── */}
        {tab === 'info' && (
          <>
            {/* Photo */}
            {property.photo_url && (
              <div className="detail-photo-wrap">
                <Image
                  src={property.photo_url}
                  alt={property.name}
                  width={600}
                  height={280}
                  className="detail-photo"
                  unoptimized
                />
              </div>
            )}

            {/* Core info */}
            <div className="detail-section">
              <div className="detail-field">
                <span className="field-icon">🏠</span>
                <div className="field-content">
                  <span className="field-label">Type</span>
                  <span className="field-value">{PROPERTY_TYPE_LABELS[property.property_type]}</span>
                </div>
              </div>

              {property.year_built && (
                <div className="detail-field">
                  <span className="field-icon">📅</span>
                  <div className="field-content">
                    <span className="field-label">Year built</span>
                    <span className="field-value">{property.year_built}</span>
                  </div>
                </div>
              )}

              {fullAddress && (
                <div className="detail-field">
                  <span className="field-icon">📍</span>
                  <div className="field-content">
                    <span className="field-label">Address</span>
                    <div className="field-value address-block">
                      {property.address_line1 && <div>{property.address_line1}</div>}
                      {property.address_line2 && <div>{property.address_line2}</div>}
                      {property.address_town && <div>{property.address_town}</div>}
                      {property.address_city && <div>{property.address_city}</div>}
                      {property.address_postcode && <div>{property.address_postcode}</div>}
                      {property.address_country && property.address_country !== 'United Kingdom' && (
                        <div>{property.address_country}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {property.notes && (
              <div className="detail-section">
                <div className="section-heading">Notes</div>
                <p className="notes-text">{property.notes}</p>
              </div>
            )}

            {/* Purchase details */}
            <div className="detail-section">
              <PropertyPurchaseSection
                purchase={purchase}
                isOwner={isOwner}
                propertyId={property.id}
                userId={userId}
                onSave={onSavePurchase}
              />
            </div>

            {/* Future modules placeholder */}
            <div className="detail-section modules-placeholder">
              <div className="section-heading">Modules</div>
              <div className="modules-coming">
                <div className="module-item coming">
                  <span className="module-icon">📦</span>
                  <span className="module-label">Assets</span>
                  <span className="module-soon">Coming soon</span>
                </div>
                <div className="module-item coming">
                  <span className="module-icon">⚡</span>
                  <span className="module-label">Utilities</span>
                  <span className="module-soon">Coming soon</span>
                </div>
                <div className="module-item coming">
                  <span className="module-icon">🛡</span>
                  <span className="module-label">Policies</span>
                  <span className="module-soon">Coming soon</span>
                </div>
              </div>
            </div>

            {/* Sharing */}
            {isOwner && (
              <div className="detail-section">
                <SharePanel
                  entityId={property.id}
                  entityType={'property' as any}
                  ownerId={property.user_id}
                  userId={userId}
                  shares={shares}
                  onSharesChanged={onSharesChanged}
                />
              </div>
            )}
          </>
        )}

        {/* ── MORTGAGE TAB ── */}
        {tab === 'mortgage' && (
          <div className="tab-content">
            {isOwner && (
              <button
                className="add-record-btn"
                onClick={() => { setEditingMortgage(null); setShowMortgageForm(true) }}
              >
                + Add mortgage
              </button>
            )}

            {mortgages.length === 0 ? (
              <div className="empty-tab">No mortgage records yet.</div>
            ) : (
              <>
                {/* Current deal */}
                {activeMortgage && (
                  <div>
                    <div className="mort-group-label">Current deal</div>
                    <MortgageCard
                      mortgage={activeMortgage}
                      isOwner={isOwner}
                      deleting={deletingId === activeMortgage.id}
                      onEdit={() => { setEditingMortgage(activeMortgage); setShowMortgageForm(true) }}
                      onDelete={() => handleDeleteMortgage(activeMortgage.id)}
                    />
                  </div>
                )}

                {/* History */}
                {historyMortgages.length > 0 && (
                  <div>
                    <div className="mort-group-label">History</div>
                    <div className="mort-history-list">
                      {historyMortgages.map(m => (
                        <MortgageCard
                          key={m.id}
                          mortgage={m}
                          isOwner={isOwner}
                          deleting={deletingId === m.id}
                          onEdit={() => { setEditingMortgage(m); setShowMortgageForm(true) }}
                          onDelete={() => handleDeleteMortgage(m.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Mortgage form modal */}
      {showMortgageForm && (
        <MortgageForm
          propertyId={property.id}
          userId={userId}
          mortgage={editingMortgage}
          onSaved={() => { setShowMortgageForm(false); setEditingMortgage(null); loadMortgages() }}
          onClose={() => { setShowMortgageForm(false); setEditingMortgage(null) }}
        />
      )}

      <style>{`
        .prop-detail {
          flex: 1;
          background: white;
          border-left: 1px solid var(--border-light);
          box-shadow: -4px 0 24px var(--shadow-warm-md);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideIn 0.22s ease;
          max-width: 520px;
        }
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
          gap: 0.75rem;
        }
        .detail-header-left {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          flex: 1;
          min-width: 0;
        }
        .detail-type-icon {
          font-size: 1.75rem;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          background: var(--cream-dark);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .detail-title-block { min-width: 0; }
        .detail-title {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 0.2rem;
        }
        .detail-badges { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .primary-badge {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: var(--deep-brown);
          color: var(--cream);
          padding: 0.15rem 0.5rem;
          border-radius: 5px;
          display: inline-block;
        }
        .shared-badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.15rem 0.45rem;
          border-radius: 5px;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          display: inline-block;
        }
        .detail-header-right {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .detail-btn { font-size: 0.8125rem; padding: 0.375rem 0.875rem; }
        .detail-delete-btn {
          width: 32px; height: 32px;
          border-radius: 8px; border: 1px solid var(--border);
          background: none; cursor: pointer; font-size: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .detail-delete-btn:hover { background: #fef2f2; border-color: #fecaca; }
        .detail-close {
          width: 32px; height: 32px;
          border-radius: 8px; border: 1px solid var(--border);
          background: none; cursor: pointer; color: var(--text-muted);
          font-size: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .detail-close:hover { background: var(--cream-dark); color: var(--deep-brown); }

        /* Tab bar */
        .prop-tab-bar {
          display: flex;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .prop-tab-bar::-webkit-scrollbar { display: none; }
        .prop-tab-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 0.625rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          font-family: var(--font-body);
          color: var(--text-muted);
          transition: all 0.15s;
          border-bottom: 2px solid transparent;
          flex-shrink: 0;
        }
        .prop-tab-btn:hover { color: var(--deep-brown); background: var(--cream); }
        .prop-tab-btn.active { color: var(--deep-brown); border-bottom-color: var(--deep-brown); }
        .prop-tab-icon { font-size: 1rem; }
        .prop-tab-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; }

        .detail-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .detail-photo-wrap {
          flex-shrink: 0;
          height: 200px;
          overflow: hidden;
        }
        .detail-photo {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }
        .detail-section {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .section-heading {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .detail-field {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .field-icon {
          font-size: 0.9rem;
          margin-top: 0.1rem;
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }
        .field-content { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .field-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          font-weight: 600;
        }
        .field-value {
          font-size: 0.9rem;
          color: var(--text-primary);
          font-weight: 500;
        }
        .address-block {
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.7;
          font-weight: 400;
        }
        .notes-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          white-space: pre-wrap;
        }
        .modules-placeholder {}
        .modules-coming {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        .module-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem 0.5rem;
          background: var(--cream);
          border-radius: 10px;
          border: 1px solid var(--border-light);
        }
        .module-item.coming { opacity: 0.5; }
        .module-icon { font-size: 1.25rem; }
        .module-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .module-soon {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Mortgage tab */
        .tab-content { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .add-record-btn {
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 1rem; background: var(--deep-brown); color: var(--cream);
          border: none; border-radius: 8px; font-family: var(--font-body);
          font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.15s; width: fit-content;
        }
        .add-record-btn:hover { background: var(--terracotta); }
        .empty-tab { text-align: center; padding: 2.5rem 1rem; font-size: 0.875rem; color: var(--text-muted); font-style: italic; }
        .mort-group-label {
          font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .mort-history-list { display: flex; flex-direction: column; gap: 0.625rem; }
      `}</style>
    </div>
  )
}

function MortgageCard({
  mortgage, isOwner, deleting, onEdit, onDelete,
}: {
  mortgage: PropertyMortgage
  isOwner: boolean
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const expired = isMortgageExpired(mortgage.end_date)
  const expiringSoon = !expired && isMortgageExpiringSoon(mortgage.end_date)

  const cardClass = `mort-card${expired ? ' mort-expired' : expiringSoon ? ' mort-warning' : ''}`

  const fmtMoney = (v: number | null) =>
    v == null ? null : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(v)

  return (
    <div className={cardClass}>
      <div className="mort-card-header">
        <div className="mort-lender-block">
          <span className="mort-lender">{mortgage.lender}</span>
          {mortgage.product_type && (
            <span className="mort-product">{MORTGAGE_PRODUCT_LABELS[mortgage.product_type]}</span>
          )}
        </div>
        {isOwner && (
          <div className="mort-actions">
            <button className="mort-edit-btn" onClick={onEdit} disabled={deleting}>Edit</button>
            <button className="mort-delete-btn" onClick={onDelete} disabled={deleting}>🗑</button>
          </div>
        )}
      </div>

      <div className="mort-fields">
        {mortgage.interest_rate != null && (
          <MortgageField label="Rate" value={`${mortgage.interest_rate}%`} />
        )}
        {mortgage.monthly_payment != null && (
          <MortgageField label="Monthly" value={fmtMoney(mortgage.monthly_payment)!} />
        )}
        {mortgage.start_date && (
          <MortgageField label="Started" value={fmtDate(mortgage.start_date)} />
        )}
        {mortgage.end_date && (
          <MortgageField
            label={expired ? 'Ended' : 'Renews'}
            value={fmtDate(mortgage.end_date)}
            highlight={expired ? 'expired' : expiringSoon ? 'warning' : undefined}
          />
        )}
      </div>

      {expiringSoon && !expired && (
        <div className="mort-expiry-warning">
          ⚠ Renewal due within 3 months — consider remortgaging
        </div>
      )}

      {mortgage.notes && (
        <p className="mort-notes">{mortgage.notes}</p>
      )}

      <style>{`
        .mort-card { border: 1px solid var(--border-light); border-radius: 10px; padding: 0.875rem; background: var(--cream); display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0; }
        .mort-card.mort-expired { border-color: #d1d5db; background: #f9fafb; opacity: 0.8; }
        .mort-card.mort-warning { border-color: #fde68a; background: #fffef5; }
        .mort-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
        .mort-lender-block { display: flex; flex-direction: column; gap: 0.15rem; }
        .mort-lender { font-size: 1rem; font-weight: 700; color: var(--deep-brown); }
        .mort-product { font-size: 0.8rem; color: var(--text-secondary); }
        .mort-actions { display: flex; gap: 0.375rem; align-items: center; flex-shrink: 0; }
        .mort-edit-btn { font-size: 0.75rem; color: var(--text-muted); background: white; border: 1px solid var(--border); border-radius: 5px; padding: 0.2rem 0.5rem; cursor: pointer; font-family: var(--font-body); transition: all 0.12s; }
        .mort-edit-btn:hover { color: var(--deep-brown); border-color: var(--warm-brown); }
        .mort-edit-btn:disabled { opacity: 0.4; cursor: default; }
        .mort-delete-btn { font-size: 0.8rem; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0.2rem; transition: color 0.12s; }
        .mort-delete-btn:hover { color: #dc2626; }
        .mort-delete-btn:disabled { opacity: 0.4; cursor: default; }
        .mort-fields { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .mort-field { font-size: 0.75rem; background: white; padding: 0.2rem 0.5rem; border-radius: 5px; border: 1px solid var(--border-light); }
        .mort-field-label { color: var(--text-muted); margin-right: 0.25rem; }
        .mort-field-value { font-weight: 500; color: var(--text-primary); }
        .mort-field-value.expired { color: #6b7280; }
        .mort-field-value.warning { color: #b45309; font-weight: 700; }
        .mort-expiry-warning { font-size: 0.8rem; font-weight: 600; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.375rem 0.625rem; }
        .mort-notes { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; font-style: italic; border-top: 1px solid var(--border-light); padding-top: 0.375rem; }
      `}</style>
    </div>
  )
}

function MortgageField({ label, value, highlight }: { label: string; value: string; highlight?: 'expired' | 'warning' }) {
  return (
    <div className="mort-field">
      <span className="mort-field-label">{label}:</span>
      <span className={`mort-field-value ${highlight ?? ''}`}>{value}</span>
    </div>
  )
}
