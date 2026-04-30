'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ShareRecord = {
  id: string
  shared_with_email: string
  created_at: string
}

export default function SharePanel({
  entityId,
  entityType,
  ownerId,
  userId,
  shares,
  onSharesChanged,
}: {
  entityId: string
  entityType: 'task' | 'project'
  ownerId: string
  userId: string
  shares: ShareRecord[]
  onSharesChanged: () => void
}) {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)

  const isOwner = userId === ownerId
  const table = entityType === 'task' ? 'task_shares' : 'project_shares'
  const idField = entityType === 'task' ? 'task_id' : 'project_id'

  const handleAdd = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    if (shares.some(s => s.shared_with_email === trimmed)) {
      setError('Already shared with this person.')
      return
    }

    setAdding(true)
    setError('')

    // Look up their user id if they exist
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', trimmed)
      .single()

    const { error: insertError } = await (supabase.from(table) as any).insert({
      [idField]: entityId,
      owner_id: ownerId,
      shared_with_email: trimmed,
      shared_with_id: profile?.id ?? null,
    })

    if (insertError) {
      setError('Failed to share. Please try again.')
    } else {
      setEmail('')
      onSharesChanged()
    }
    setAdding(false)
  }

  const handleRemove = async (shareId: string) => {
    setRemoving(shareId)
    await (supabase.from(table) as any).delete().eq('id', shareId)
    onSharesChanged()
    setRemoving(null)
  }

  return (
    <div className="share-panel">
      <div className="share-header">
        <span className="share-icon">👥</span>
        <span className="share-title">Shared with</span>
      </div>

      {shares.length === 0 ? (
        <p className="share-empty">Not shared with anyone yet.</p>
      ) : (
        <ul className="share-list">
          {shares.map(s => (
            <li key={s.id} className="share-item">
              <span className="share-avatar">{s.shared_with_email[0].toUpperCase()}</span>
              <span className="share-email">{s.shared_with_email}</span>
              {isOwner && (
                <button
                  className="share-remove"
                  onClick={() => handleRemove(s.id)}
                  disabled={removing === s.id}
                  title="Remove access"
                >
                  {removing === s.id ? '…' : '✕'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <div className="share-add">
          <input
            className="input-field share-input"
            type="email"
            placeholder="Enter email address to share"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            className="btn-primary share-btn"
            onClick={handleAdd}
            disabled={adding || !email.trim()}
          >
            {adding ? '…' : 'Share'}
          </button>
        </div>
      )}

      {error && <p className="share-error">{error}</p>}

      <style>{`
        .share-panel {
          padding: 0.875rem;
          background: var(--cream);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .share-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .share-icon { font-size: 0.875rem; }
        .share-title {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .share-empty {
          font-size: 0.8125rem;
          color: var(--text-muted);
          font-style: italic;
        }
        .share-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .share-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.5rem;
          background: white;
          border-radius: 6px;
          border: 1px solid var(--border-light);
        }
        .share-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--parchment);
          color: var(--warm-brown);
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .share-email {
          flex: 1;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .share-remove {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .share-remove:hover {
          background: #fef0ec;
          color: var(--terracotta);
        }
        .share-add {
          display: flex;
          gap: 0.5rem;
        }
        .share-input {
          flex: 1;
          font-size: 0.8125rem;
          padding: 0.5rem 0.75rem;
        }
        .share-btn {
          font-size: 0.8125rem;
          padding: 0.5rem 0.875rem;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .share-error {
          font-size: 0.8rem;
          color: #dc2626;
        }
      `}</style>
    </div>
  )
}
