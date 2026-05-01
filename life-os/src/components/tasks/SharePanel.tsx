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
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [manualEmail, setManualEmail] = useState('')
  const [useManual, setUseManual] = useState(false)

  const isOwner = userId === ownerId
  const table = entityType === 'task' ? 'task_shares' : entityType === 'project' ? 'project_shares' : 'contact_shares'
  const idField = entityType === 'task' ? 'task_id' : entityType === 'project' ? 'project_id' : 'contact_id'

  // Fetch linked people
  useEffect(() => {
    if (!isOwner) return
    ;(async () => {
      const { data } = await (supabase as any)
        .from('linked_contacts')
        .select('linked_user_id, profile:profiles!linked_user_id(email, full_name)')
        .eq('user_id', userId)
      if (data) {
        setLinkedPeople(data.map((d: any) => ({
          linked_user_id: d.linked_user_id,
          email: d.profile?.email ?? '',
          full_name: d.profile?.full_name ?? null,
        })))
      }
    })()
  }, [userId, isOwner, supabase])

  const alreadySharedEmails = new Set(shares.map(s => s.shared_with_email.toLowerCase()))

  const availableLinked = linkedPeople.filter(p => !alreadySharedEmails.has(p.email.toLowerCase()))

  const handleAddLinked = async (person: LinkedPerson) => {
    setAdding(true)
    setError('')

    const { error: insertError } = await (supabase.from(table) as any).insert({
      [idField]: entityId,
      owner_id: ownerId,
      shared_with_email: person.email.toLowerCase(),
      shared_with_id: person.linked_user_id,
    })

    if (insertError) {
      setError('Failed to share. Please try again.')
    } else {
      setShowPicker(false)
      onSharesChanged()
    }
    setAdding(false)
  }

  const handleAddManual = async () => {
    const trimmed = manualEmail.trim().toLowerCase()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    if (alreadySharedEmails.has(trimmed)) {
      setError('Already shared with this person.')
      return
    }

    setAdding(true)
    setError('')

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
      setManualEmail('')
      setUseManual(false)
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
                >
                  {removing === s.id ? '…' : '✕'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <div className="share-add-section">
          {/* Linked contacts picker */}
          {!showPicker && !useManual && (
            <div className="share-add-buttons">
              {availableLinked.length > 0 && (
                <button className="btn-secondary share-pick-btn" onClick={() => setShowPicker(true)}>
                  + Share with a connection
                </button>
              )}
              <button
                className="share-manual-link"
                onClick={() => setUseManual(true)}
              >
                {availableLinked.length > 0 ? 'or enter email manually' : '+ Share by email'}
              </button>
            </div>
          )}

          {showPicker && (
            <div className="linked-picker">
              <p className="picker-label">Select a connection to share with:</p>
              {availableLinked.map(p => (
                <button
                  key={p.linked_user_id}
                  className="picker-item"
                  onClick={() => handleAddLinked(p)}
                  disabled={adding}
                >
                  <span className="picker-avatar">{(p.full_name ?? p.email)[0].toUpperCase()}</span>
                  <span className="picker-name">{p.full_name ?? p.email}</span>
                  <span className="picker-email">{p.email}</span>
                </button>
              ))}
              <button className="share-manual-link" onClick={() => { setShowPicker(false); setUseManual(true) }}>
                Enter email manually instead
              </button>
              <button className="share-cancel" onClick={() => setShowPicker(false)}>Cancel</button>
            </div>
          )}

          {useManual && (
            <div className="share-manual">
              <div className="share-add">
                <input
                  className="input-field share-input"
                  type="email"
                  placeholder="Enter email address"
                  value={manualEmail}
                  onChange={e => { setManualEmail(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleAddManual()}
                  autoFocus
                />
                <button
                  className="btn-primary share-btn"
                  onClick={handleAddManual}
                  disabled={adding || !manualEmail.trim()}
                >
                  {adding ? '…' : 'Share'}
                </button>
              </div>
              <button className="share-cancel" onClick={() => { setUseManual(false); setManualEmail('') }}>Cancel</button>
            </div>
          )}
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
        .share-email { flex: 1; font-size: 0.8125rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .share-remove { width: 20px; height: 20px; border-radius: 4px; border: none; background: none; cursor: pointer; color: var(--text-muted); font-size: 0.7rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
        .share-remove:hover { background: #fef0ec; color: var(--terracotta); }
        .share-add-section { display: flex; flex-direction: column; gap: 0.375rem; }
        .share-add-buttons { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
        .share-pick-btn { font-size: 0.8125rem; padding: 0.4rem 0.75rem; }
        .share-manual-link { font-size: 0.8rem; color: var(--terracotta); background: none; border: none; cursor: pointer; font-family: var(--font-body); padding: 0; text-decoration: underline; }
        .share-cancel { font-size: 0.75rem; color: var(--text-muted); background: none; border: none; cursor: pointer; font-family: var(--font-body); padding: 0.25rem 0; }
        .linked-picker { display: flex; flex-direction: column; gap: 0.375rem; }
        .picker-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
        .picker-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.625rem; background: white; border: 1px solid var(--border-light); border-radius: 8px; cursor: pointer; font-family: var(--font-body); transition: all 0.12s; text-align: left; }
        .picker-item:hover { border-color: var(--warm-brown); background: var(--cream-dark); }
        .picker-avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--parchment); color: var(--warm-brown); font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .picker-name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); flex: 1; }
        .picker-email { font-size: 0.75rem; color: var(--text-muted); }
        .share-manual { display: flex; flex-direction: column; gap: 0.375rem; }
        .share-add { display: flex; gap: 0.5rem; }
        .share-input { flex: 1; font-size: 0.8125rem; padding: 0.5rem 0.75rem; }
        .share-btn { font-size: 0.8125rem; padding: 0.5rem 0.875rem; white-space: nowrap; flex-shrink: 0; }
        .share-error { font-size: 0.8rem; color: #dc2626; }
      `}</style>
    </div>
  )
}
