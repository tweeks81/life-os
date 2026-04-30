'use client'

import { Contact, contactDisplayName, contactInitials, contactAvatarColour } from '@/types/contacts'
import SharePanel, { ShareRecord } from '@/components/tasks/SharePanel'

export default function ContactDetail({
  contact,
  userId,
  shares,
  onSharesChanged,
  onEdit,
  onDelete,
  onClose,
}: {
  contact: Contact
  userId: string
  shares: ShareRecord[]
  onSharesChanged: () => void
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const isOwner = contact.user_id === userId
  const isShared = !isOwner

  const hasAddress = contact.address_line1 || contact.address_town || contact.address_city || contact.address_postcode
  const hasPhones = contact.phone_mobile || contact.phone_home || contact.phone_work

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleDelete = () => {
    if (confirm(`Delete ${contactDisplayName(contact)}? This cannot be undone.`)) {
      onDelete()
    }
  }

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <div
            className="detail-avatar"
            style={{ background: contactAvatarColour(contact) }}
          >
            {contactInitials(contact)}
          </div>
          <div className="detail-name-block">
            <h2 className="detail-name">{contactDisplayName(contact)}</h2>
            {isShared && <span className="shared-badge">👥 Shared with you</span>}
          </div>
        </div>
        <div className="detail-header-right">
          <button className="btn-secondary detail-btn" onClick={onEdit}>Edit</button>
          {isOwner && (
            <button className="detail-delete-btn" onClick={handleDelete} title="Delete contact">🗑</button>
          )}
          <button className="detail-close" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="detail-scroll">

        {/* Contact info */}
        <div className="detail-section">
          {contact.email && (
            <div className="detail-field">
              <span className="field-icon">✉️</span>
              <div className="field-content">
                <span className="field-label">Email</span>
                <a href={`mailto:${contact.email}`} className="field-value field-link">{contact.email}</a>
              </div>
            </div>
          )}

          {contact.phone_mobile && (
            <div className="detail-field">
              <span className="field-icon">📱</span>
              <div className="field-content">
                <span className="field-label">Mobile</span>
                <a href={`tel:${contact.phone_mobile}`} className="field-value field-link">{contact.phone_mobile}</a>
              </div>
            </div>
          )}

          {contact.phone_home && (
            <div className="detail-field">
              <span className="field-icon">🏠</span>
              <div className="field-content">
                <span className="field-label">Home</span>
                <a href={`tel:${contact.phone_home}`} className="field-value field-link">{contact.phone_home}</a>
              </div>
            </div>
          )}

          {contact.phone_work && (
            <div className="detail-field">
              <span className="field-icon">💼</span>
              <div className="field-content">
                <span className="field-label">Work</span>
                <a href={`tel:${contact.phone_work}`} className="field-value field-link">{contact.phone_work}</a>
              </div>
            </div>
          )}

          {contact.date_of_birth && (
            <div className="detail-field">
              <span className="field-icon">🎂</span>
              <div className="field-content">
                <span className="field-label">Date of birth</span>
                <span className="field-value">{formatDate(contact.date_of_birth)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Address */}
        {hasAddress && (
          <div className="detail-section">
            <div className="section-heading">Address</div>
            <div className="address-block">
              {contact.address_line1 && <div>{contact.address_line1}</div>}
              {contact.address_line2 && <div>{contact.address_line2}</div>}
              {contact.address_town && <div>{contact.address_town}</div>}
              {contact.address_city && <div>{contact.address_city}</div>}
              {contact.address_postcode && <div>{contact.address_postcode}</div>}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="detail-section">
            <div className="section-heading">Notes</div>
            <p className="notes-text">{contact.notes}</p>
          </div>
        )}

        {/* Sharing */}
        <div className="detail-section">
          <SharePanel
            entityId={contact.id}
            entityType={'contact' as any}
            ownerId={contact.user_id}
            userId={userId}
            shares={shares}
            onSharesChanged={onSharesChanged}
          />
        </div>

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
          max-width: 480px;
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
        .detail-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .detail-name-block {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .detail-name {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .shared-badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.15rem 0.45rem;
          border-radius: 5px;
          background: #eff6ff;
          color: #2563eb;
          display: inline-block;
        }
        .detail-header-right {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .detail-btn {
          font-size: 0.8125rem;
          padding: 0.375rem 0.875rem;
        }
        .detail-delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: none;
          cursor: pointer;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .detail-delete-btn:hover {
          background: #fef2f2;
          border-color: #fecaca;
        }
        .detail-close {
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
        .detail-close:hover {
          background: var(--cream-dark);
          color: var(--deep-brown);
        }
        .detail-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .detail-section {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .section-heading {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.125rem;
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
        .field-content {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }
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
        .field-link {
          color: var(--terracotta);
          text-decoration: none;
        }
        .field-link:hover {
          text-decoration: underline;
        }
        .address-block {
          font-size: 0.9rem;
          color: var(--text-primary);
          line-height: 1.7;
        }
        .notes-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  )
}
