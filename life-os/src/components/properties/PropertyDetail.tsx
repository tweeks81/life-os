'use client'

import Image from 'next/image'
import { Property, PropertyPurchase, PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, formatAddress } from '@/types/properties'
import SharePanel, { ShareRecord } from '@/components/tasks/SharePanel'
import PropertyPurchaseSection from './PropertyPurchaseSection'

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
  const isOwner = property.user_id === userId
  const isShared = !isOwner
  const fullAddress = formatAddress(property)

  const handleDelete = () => {
    if (confirm(`Delete "${property.name}"? This cannot be undone.`)) {
      onDelete()
    }
  }

  return (
    <div className="detail-panel">
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

      <div className="detail-scroll">
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
      </div>

      <style>{`
        .detail-panel {
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
      `}</style>
    </div>
  )
}
