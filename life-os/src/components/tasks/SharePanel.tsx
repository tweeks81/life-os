'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ShareRecord = {
  id: string
  shared_with_email: string
  created_at: string
}

interface LinkedPerson {
  linked_user_id: string
  email: string
  full_name: string | null
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
  entityType: 'task' | 'project' | 'contact'
  ownerId: string
  userId: string
  shares: ShareRecord[]
  onSharesChanged: () => void
}) {
  const supabase = createClient()
  const [linkedPeople, setLinkedPeople] = useState<LinkedPerson[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const isOwner = userId === ownerId
  const table = entityType === 'task' ? 'task_shares' : entityType === 'project' ? 'project_shares' : 'contact_shares'
  const idField = entityType === 'task' ? 'task_id' : entityType === 'project' ? 'project_id' : 'contact_id'

  useEffect(() => {
    if (!isOwner) return
    ;(async () => {
      const { data: linkedRaw } = await (supabase as any)
        .from('linked_contacts')
        .select('linked_user_id')
        .eq('user_id', userId)

      const linkedIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
      if (linkedIds.length === 0) return

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', linkedIds)

      setLinkedPeople((profiles ?? []).map((p: any) => ({
        linked_user_id: p.id,
        email: p.email,
        full_name: p.full_name,
      })))
    })()
  }, [userId, isOwner])

  const alreadySharedEmails = new Set(shares.map(s => s.shared_with_email.toLowerCase()))
  const available = linkedPeople.filter(p => !alreadySharedEmails.has(p.email.toLowerCase()))

  const toggleSelect = (email: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  const handleShare = async () => {
    if (selected.size === 0) return
    setAdding(true)
    setError('')

    for (const email of Array.from(selected)) {
      const person = linkedPeople.find(p => p.email.toLowerCase() === email)
      await (supabase.from(table) as any).insert({
        [idField]: entityId,
        owner_id: ownerId,
        shared_with_email: email,
        shared_with_id: person?.linked_user_id ?? null,
      })
    }

    setSelected(new Set())
    setShowPicker(false)
    setAdding(false)
    onSharesChanged()
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
              <span className="share-email">
                {linkedPeople.find(p => p.email.toLowerCase() === s.shared_with_email.toLowerCase())?.full_name ?? s.shared_with_email}
              </span>
              {isOwner && (
                <button
                  className="share-remove"
                  onClick={() => handleRemove(s.id)}
                  disabled={removing === s.id}
                >
                  {removing === s.id ? '…' : '✕'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && available.length > 0 && !showPicker && (
        <button className="btn-secondary share-pick-btn" onClick={() => setShowPicker(true)}>
          + Share with connections
        </button>
      )}

      {isOwner && available.length === 0 && shares.length === 0 && (
        <p className="share-empty">Add connections on your Profile page to share with them.</p>
      )}

      {showPicker && (
        <div className="picker">
          <p className="picker-label">Select people to share with:</p>
          <div className="picker-list">
            {available.map(p => {
              const isSelected = selected.has(p.email.toLowerCase())
              return (
                <button
                  key={p.linked_user_id}
                  className={`picker-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSelect(p.email.toLowerCase())}
                >
                  <div className="picker-check">
                    {isSelected ? '✓' : ''}
                  </div>
                  <span className="picker-avatar">
                    {(p.full_name ?? p.email)[0].toUpperCase()}
                  </span>
                  <div className="picker-info">
                    <span className="picker-name">{p.full_name ?? p.email}</span>
                    <span className="picker-email">{p.email}</span>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="picker-footer">
            <button className="btn-secondary picker-cancel" onClick={() => { setShowPicker(false); setSelected(new Set()) }}>
              Cancel
            </button>
            <button
              className="btn-primary picker-confirm"
              onClick={handleShare}
              disabled={adding || selected.size === 0}
            >
              {adding ? 'Sharing…' : `Share with ${selected.size > 0 ? selected.size : ''} ${selected.size === 1 ? 'person' : selected.size > 1 ? 'people' : 'selected'}`}
            </button>
          </div>
        </div>
      )}

      {error && <p className="share-error">{error}</p>}

      <style>{`
        .share-panel { padding: 0.875rem; background: var(--cream); border: 1px solid var(--border-light); border-radius: 10px; display: flex; flex-direction: column; gap: 0.625rem; }
        .share-header { display: flex; align-items: center; gap: 0.4rem; }
        .share-icon { font-size: 0.875rem; }
        .share-title { font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-muted); }
        .share-empty { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; }
        .share-list { list-style: none; display: flex; flex-direction: column; gap: 0.375rem; }
        .share-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.5rem; background: white; border-radius: 6px; border: 1px solid var(--border-light); }
        .share-avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--parchment); color: var(--warm-brown); font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .share-email { flex: 1; font-size: 0.8125rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
        .share-remove { width: 20px; height: 20px; border-radius: 4px; border: none; background: none; cursor: pointer; color: var(--text-muted); font-size: 0.7rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
        .share-remove:hover { background: #fef0ec; color: var(--terracotta); }
        .share-pick-btn { font-size: 0.8125rem; padding: 0.4rem 0.75rem; width: fit-content; }
        .picker { display: flex; flex-direction: column; gap: 0.5rem; }
        .picker-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
        .picker-list { display: flex; flex-direction: column; gap: 0.25rem; max-height: 200px; overflow-y: auto; }
        .picker-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.625rem; background: white; border: 1.5px solid var(--border-light); border-radius: 8px; cursor: pointer; font-family: var(--font-body); transition: all 0.12s; text-align: left; }
        .picker-item:hover { border-color: var(--warm-brown); }
        .picker-item.selected { border-color: var(--deep-brown); background: var(--cream-dark); }
        .picker-check { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid var(--border); background: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: var(--deep-brown); flex-shrink: 0; transition: all 0.12s; }
        .picker-item.selected .picker-check { background: var(--deep-brown); color: white; border-color: var(--deep-brown); }
        .picker-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--parchment); color: var(--warm-brown); font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .picker-info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .picker-name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
        .picker-email { font-size: 0.72rem; color: var(--text-muted); }
        .picker-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.25rem; }
        .picker-cancel { font-size: 0.8125rem; padding: 0.4rem 0.75rem; }
        .picker-confirm { font-size: 0.8125rem; padding: 0.4rem 0.875rem; }
        .share-error { font-size: 0.8rem; color: #dc2626; }
      `}</style>
    </div>
  )
}