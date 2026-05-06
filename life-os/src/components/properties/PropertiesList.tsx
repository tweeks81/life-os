'use client'

import { Property, PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, formatAddress } from '@/types/properties'
import Image from 'next/image'

export default function PropertiesList({
  properties,
  userId,
  selectedId,
  onSelectProperty,
  onNewProperty,
}: {
  properties: Property[]
  userId: string
  selectedId: string | null
  onSelectProperty: (p: Property) => void
  onNewProperty: () => void
}) {
  return (
    <div className="prop-list">
      <div className="list-header">
        <h2 className="list-title">
          Properties
          <span className="list-count">{properties.length}</span>
        </h2>
        <button className="btn-primary new-btn" onClick={onNewProperty}>+ Add</button>
      </div>

      <div className="list-scroll">
        {properties.length === 0 ? (
          <div className="list-empty">
            <p>No properties yet.</p>
            <p>Add your home to get started.</p>
          </div>
        ) : (
          properties.map(p => (
            <button
              key={p.id}
              className={`prop-row ${selectedId === p.id ? 'selected' : ''}`}
              onClick={() => onSelectProperty(p)}
            >
              <div className="prop-photo">
                {p.photo_url ? (
                  <Image
                    src={p.photo_url}
                    alt={p.name}
                    width={56}
                    height={56}
                    className="prop-img"
                    unoptimized
                  />
                ) : (
                  <div className="prop-img-placeholder">
                    {PROPERTY_TYPE_ICONS[p.property_type]}
                  </div>
                )}
              </div>
              <div className="prop-info">
                <div className="prop-name-row">
                  <span className="prop-name">{p.name}</span>
                  {p.is_primary_residence && (
                    <span className="primary-badge">Primary</span>
                  )}
                  {p.user_id !== userId && (
                    <span className="shared-badge">👥 Shared</span>
                  )}
                </div>
                <span className="prop-type">{PROPERTY_TYPE_LABELS[p.property_type]}</span>
                {p.address_postcode && (
                  <span className="prop-address">{[p.address_line1, p.address_postcode].filter(Boolean).join(' · ')}</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="mobile-bottom-spacer" />

      <style>{`
        .prop-list {
          width: 300px;
          flex-shrink: 0;
          background: white;
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1rem 0.75rem;
          flex-shrink: 0;
        }
        .list-title {
          font-size: 1rem;
          font-weight: 600;
          font-family: var(--font-body);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .list-count {
          font-size: 0.75rem;
          background: var(--parchment);
          color: var(--warm-brown);
          padding: 0.1rem 0.4rem;
          border-radius: 100px;
          font-weight: 600;
        }
        .new-btn { font-size: 0.8125rem; padding: 0.4rem 0.875rem; }
        .list-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .list-empty {
          padding: 2rem 1rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
          font-style: italic;
          line-height: 1.8;
        }
        .prop-row {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          background: none;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-body);
          transition: all 0.15s;
          width: 100%;
        }
        .prop-row:hover {
          background: var(--cream-dark);
          border-color: var(--parchment);
        }
        .prop-row.selected {
          background: var(--cream-dark);
          border-color: var(--warm-brown);
          box-shadow: 0 0 0 2px rgba(139,107,74,0.12);
        }
        .prop-photo { flex-shrink: 0; }
        .prop-img {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          object-fit: cover;
        }
        .prop-img-placeholder {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          background: var(--cream-dark);
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .prop-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .prop-name-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .prop-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .primary-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: var(--deep-brown);
          color: var(--cream);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .shared-badge {
          font-size: 0.7rem;
          background: #eff6ff;
          color: #2563eb;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .prop-type {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .prop-address {
          font-size: 0.75rem;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .mobile-bottom-spacer { height: 64px; flex-shrink: 0; }
      `}</style>
    </div>
  )
}
