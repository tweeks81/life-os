'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { contactAvatarColour } from '@/types/contacts'
import { ContactEntry, ContactRelationship } from './ContactsShell'
import Avatar from '../Avatar'

const ROLE_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'spouse', label: 'Spouse / Partner' },
] as const

export default function RelationshipPicker({
  userId,
  currentEntry,
  allEntries,
  relationships,
  onSaved,
  onClose,
}: {
  userId: string
  currentEntry: ContactEntry
  allEntries: ContactEntry[]
  relationships: ContactRelationship[]
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<ContactEntry | null>(null)
  const [role, setRole] = useState<string>('child')
  const [saving, setSaving] = useState(false)

  // Contacts already related to this entry (either direction)
  const relatedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const rel of relationships) {
      if (rel.contact_a_id === currentEntry.id) ids.add(rel.contact_b_id)
      if (rel.contact_b_id === currentEntry.id) ids.add(rel.contact_a_id)
    }
    return ids
  }, [relationships, currentEntry.id])

  const available = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allEntries.filter(e => {
      if (e.type !== 'contact') return false
      if (e.id === currentEntry.id) return false
      if (relatedIds.has(e.id)) return false
      if (!q) return true
      const name = `${e.first_name} ${e.last_name ?? ''}`.toLowerCase()
      return name.includes(q) || e.email?.toLowerCase().includes(q)
    })
  }, [allEntries, currentEntry.id, relatedIds, search])

  const handleSave = async () => {
    if (!selectedEntry) return
    setSaving(true)
    await (supabase as any).from('contact_relationships').insert({
      user_id: userId,
      contact_a_id: currentEntry.id,
      contact_b_id: selectedEntry.id,
      b_role: role,
    })
    setSaving(false)
    onSaved()
  }

  const currentName = `${currentEntry.first_name} ${currentEntry.last_name ?? ''}`.trim()

  return (
    <div className="rp-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rp-box card">
        <div className="rp-header">
          <h2 className="rp-title">Add relationship</h2>
          <button className="rp-close" onClick={onClose}>✕</button>
        </div>

        <div className="rp-body">
          {!selectedEntry ? (
            <>
              <p className="rp-hint">Who is related to <strong>{currentName}</strong>?</p>
              <div className="rp-search-wrap">
                <span className="rp-search-icon">🔍</span>
                <input
                  className="rp-search"
                  type="text"
                  placeholder="Search contacts…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="rp-list">
                {available.length === 0 ? (
                  <p className="rp-empty">
                    {search ? 'No contacts match.' : 'No available contacts.'}
                  </p>
                ) : (
                  available.map(entry => {
                    const name = `${entry.first_name} ${entry.last_name ?? ''}`.trim()
                    return (
                      <button
                        key={entry.id}
                        className="rp-row"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        {entry.avatar_url ? (
                          <Avatar url={entry.avatar_url} name={name} size={36} />
                        ) : (
                          <div
                            className="rp-avatar"
                            style={{ background: contactAvatarColour({ first_name: entry.originalFirstName, last_name: entry.originalLastName ?? '' } as any) }}
                          >
                            {entry.first_name[0]?.toUpperCase()}{(entry.last_name ?? '')[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="rp-row-info">
                          <span className="rp-row-name">{name}</span>
                          {entry.isSelf && <span className="rp-self-tag">You</span>}
                          {entry.email && <span className="rp-row-sub">{entry.email}</span>}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rp-confirm-info">
                <div className="rp-confirm-row">
                  <span className="rp-confirm-label">Contact</span>
                  <span className="rp-confirm-name">
                    {`${selectedEntry.first_name} ${selectedEntry.last_name ?? ''}`.trim()}
                  </span>
                  <button className="rp-change" onClick={() => setSelectedEntry(null)}>Change</button>
                </div>
              </div>

              <div className="rp-role-section">
                <p className="rp-role-label">
                  What is <strong>{`${selectedEntry.first_name} ${selectedEntry.last_name ?? ''}`.trim()}</strong> to <strong>{currentName}</strong>?
                </p>
                <div className="rp-role-options">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`rp-role-btn ${role === opt.value ? 'selected' : ''}`}
                      onClick={() => setRole(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {selectedEntry && (
          <div className="rp-footer">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save relationship'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .rp-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .rp-box { width: 100%; max-width: 420px; max-height: 80vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .rp-header { display: flex; align-items: center; justify-content: space-between; padding: 1.125rem 1.25rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .rp-title { font-size: 1rem; font-weight: 600; }
        .rp-close { width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.8125rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .rp-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .rp-body { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .rp-hint { font-size: 0.875rem; color: var(--text-secondary); }
        .rp-search-wrap { position: relative; }
        .rp-search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 0.8rem; pointer-events: none; }
        .rp-search { width: 100%; padding: 0.5rem 0.75rem 0.5rem 2rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: var(--font-body); background: var(--cream); color: var(--text-primary); outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .rp-search:focus { border-color: var(--warm-brown); }
        .rp-list { display: flex; flex-direction: column; gap: 0.125rem; }
        .rp-empty { font-size: 0.875rem; color: var(--text-muted); font-style: italic; text-align: center; padding: 1rem; }
        .rp-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.625rem; border: none; background: none; cursor: pointer; width: 100%; text-align: left; border-radius: 8px; transition: background 0.12s; font-family: var(--font-body); }
        .rp-row:hover { background: var(--cream-dark); }
        .rp-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: white; flex-shrink: 0; }
        .rp-row-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
        .rp-row-name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rp-row-sub { font-size: 0.75rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rp-self-tag { font-size: 0.7rem; font-weight: 600; padding: 0.1rem 0.35rem; border-radius: 4px; background: var(--parchment); color: var(--warm-brown); width: fit-content; }
        .rp-confirm-info { background: var(--cream); border-radius: 8px; padding: 0.75rem 1rem; }
        .rp-confirm-row { display: flex; align-items: center; gap: 0.75rem; }
        .rp-confirm-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: 600; flex-shrink: 0; }
        .rp-confirm-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); flex: 1; }
        .rp-change { font-size: 0.75rem; color: var(--terracotta); background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; flex-shrink: 0; }
        .rp-role-section { display: flex; flex-direction: column; gap: 0.625rem; }
        .rp-role-label { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; }
        .rp-role-options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .rp-role-btn { padding: 0.625rem 0.75rem; border-radius: 8px; border: 1.5px solid var(--border); background: white; cursor: pointer; font-size: 0.875rem; font-weight: 500; font-family: var(--font-body); color: var(--text-primary); transition: all 0.15s; text-align: center; }
        .rp-role-btn:hover { border-color: var(--warm-brown); background: var(--cream); }
        .rp-role-btn.selected { border-color: var(--terracotta); background: #fdf5f2; color: var(--terracotta); font-weight: 600; }
        .rp-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.875rem 1.25rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
