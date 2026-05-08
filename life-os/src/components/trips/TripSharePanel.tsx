'use client'

import { useState } from 'react'
import { TripShare, LinkedContactForSharing } from '@/types/trips'

export default function TripSharePanel({
  shares,
  linkedContacts,
  onAdd,
  onRemove,
  onClose,
}: {
  shares: TripShare[]
  linkedContacts: LinkedContactForSharing[]
  onAdd: (userId: string) => void
  onRemove: (shareId: string) => void
  onClose: () => void
}) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const sharedUserIds = new Set(shares.map(s => s.shared_with_user_id))
  const available = linkedContacts.filter(c => !sharedUserIds.has(c.user_id))

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">🔗 Share trip</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {shares.length === 0 && available.length === 0 && (
            <p className="sp-empty">You have no linked contacts to share with. Link up with other Life OS users via the Contacts section first.</p>
          )}

          {shares.length > 0 && (
            <div className="sp-section">
              <p className="sp-label">Shared with</p>
              {shares.map(s => (
                <div key={s.id} className="sp-row">
                  <div className="sp-avatar">{(s.name ?? '?')[0].toUpperCase()}</div>
                  <span className="sp-name">{s.name ?? 'Unknown'}</span>
                  <div className="sp-actions">
                    {confirmRemove === s.id ? (
                      <>
                        <button className="sp-btn-danger" onClick={() => { onRemove(s.id); setConfirmRemove(null) }}>Remove</button>
                        <button className="sp-btn-cancel" onClick={() => setConfirmRemove(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="sp-btn-remove" onClick={() => setConfirmRemove(s.id)}>Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {available.length > 0 && (
            <div className="sp-section">
              <p className="sp-label">Add linked contact</p>
              {available.map(c => (
                <div key={c.user_id} className="sp-row sp-row-add">
                  <div className="sp-avatar sp-avatar-muted">{(c.full_name ?? '?')[0].toUpperCase()}</div>
                  <span className="sp-name">{c.full_name ?? 'Unknown'}</span>
                  <button className="sp-btn-add" onClick={() => onAdd(c.user_id)}>Share</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 420px; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.125rem 1.25rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1rem; font-weight: 600; }
        .modal-close { width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.8125rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .modal-close:hover { background: var(--cream-dark); }
        .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.875rem 1.25rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .sp-empty { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
        .sp-section { display: flex; flex-direction: column; gap: 0.5rem; }
        .sp-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
        .sp-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border-radius: 8px; background: var(--cream); }
        .sp-row-add { background: white; border: 1px solid var(--border-light); }
        .sp-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--terracotta); color: white; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sp-avatar-muted { background: var(--text-muted); }
        .sp-name { flex: 1; font-size: 0.875rem; font-weight: 500; color: var(--deep-brown); }
        .sp-actions { display: flex; gap: 0.375rem; }
        .sp-btn-remove { padding: 0.25rem 0.625rem; border-radius: 5px; border: 1px solid var(--border); background: white; color: var(--text-muted); font-size: 0.75rem; font-weight: 500; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .sp-btn-remove:hover { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }
        .sp-btn-danger { padding: 0.25rem 0.625rem; border-radius: 5px; border: 1px solid #fca5a5; background: #fef2f2; color: #dc2626; font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
        .sp-btn-cancel { padding: 0.25rem 0.625rem; border-radius: 5px; border: 1px solid var(--border); background: white; color: var(--text-muted); font-size: 0.75rem; cursor: pointer; font-family: var(--font-body); }
        .sp-btn-add { padding: 0.25rem 0.75rem; border-radius: 5px; border: 1px solid var(--terracotta); background: var(--terracotta); color: white; font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: opacity 0.15s; }
        .sp-btn-add:hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}
