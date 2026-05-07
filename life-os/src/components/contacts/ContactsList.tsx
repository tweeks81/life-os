'use client'

import { useMemo } from 'react'
import { contactAvatarColour } from '@/types/contacts'
import { ContactEntry } from './ContactsShell'
import Avatar from '../Avatar'

export default function ContactsList({
  entries,
  userId,
  selectedId,
  search,
  onSearch,
  onSelectEntry,
  onNewContact,
}: {
  entries: ContactEntry[]
  userId: string
  selectedId: string | null
  search: string
  onSearch: (s: string) => void
  onSelectEntry: (e: ContactEntry) => void
  onNewContact: () => void
}) {
  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(e =>
      e.first_name.toLowerCase().includes(q) ||
      (e.last_name ?? '').toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q)
    )
  }, [entries, search])

  const grouped = useMemo(() => {
    const groups: Record<string, ContactEntry[]> = {}
    for (const entry of filtered) {
      const letter = entry.first_name[0]?.toUpperCase() ?? '#'
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(entry)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <div className="contacts-list">
      <div className="list-header">
        <h2 className="list-title">
          Contacts <span className="list-count">{entries.length}</span>
        </h2>
        <button className="btn-primary new-btn" onClick={onNewContact}>+ New</button>
      </div>

      <div className="list-search">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search contacts…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => onSearch('')}>✕</button>
        )}
      </div>

      <div className="list-scroll">
        {filtered.length === 0 ? (
          <div className="list-empty">
            <p>{search ? 'No contacts match your search.' : 'No contacts yet.'}</p>
          </div>
        ) : (
          grouped.map(([letter, groupEntries]) => (
            <div key={letter} className="alpha-group">
              <div className="alpha-letter">{letter}</div>
              {groupEntries.map(entry => {
                const displayName = `${entry.first_name} ${entry.last_name ?? ''}`.trim()
                const isSharedContact = entry.type === 'contact' && entry.contact?.user_id !== userId

                return (
                  <button
                    key={entry.id}
                    className={`contact-row ${selectedId === entry.id ? 'selected' : ''}`}
                    onClick={() => onSelectEntry(entry)}
                  >
                    {entry.isLinked ? (
                      <Avatar url={entry.avatar_url} name={displayName} size={36} />
                    ) : (
                      <div
                        className="contact-avatar"
                        style={{ background: contactAvatarColour({ first_name: entry.first_name, last_name: entry.last_name ?? '' } as any) }}
                      >
                        {entry.first_name[0]?.toUpperCase()}{(entry.last_name ?? '')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="contact-info">
                      <span className="contact-name">{displayName}</span>
                      {entry.email && <span className="contact-sub">{entry.email}</span>}
                    </div>
                    {entry.isLinked && <span className="badge linked-badge" title="Linked Life OS user">🔗</span>}
                    {isSharedContact && <span className="badge shared-badge" title="Shared with you">👥</span>}
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>

      <style>{`
        .contacts-list { width: 280px; flex-shrink: 0; background: white; border-right: 1px solid var(--border-light); display: flex; flex-direction: column; overflow: hidden; }
        .list-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1rem 0.75rem; flex-shrink: 0; }
        .list-title { font-size: 1rem; font-weight: 600; font-family: var(--font-body); display: flex; align-items: center; gap: 0.4rem; }
        .list-count { font-size: 0.75rem; background: var(--parchment); color: var(--warm-brown); padding: 0.1rem 0.4rem; border-radius: 100px; font-weight: 600; }
        .new-btn { font-size: 0.8125rem; padding: 0.4rem 0.875rem; }
        .list-search { position: relative; padding: 0 0.75rem 0.75rem; flex-shrink: 0; }
        .search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-60%); font-size: 0.8rem; pointer-events: none; }
        .search-input { width: 100%; padding: 0.5rem 2rem 0.5rem 2rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: var(--font-body); background: var(--cream); color: var(--text-primary); outline: none; transition: border-color 0.15s; }
        .search-input:focus { border-color: var(--warm-brown); }
        .search-clear { position: absolute; right: 1.25rem; top: 50%; transform: translateY(-60%); background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.75rem; padding: 0.25rem; }
        .list-scroll { flex: 1; overflow-y: auto; padding-bottom: 1rem; }
        .list-empty { padding: 2rem 1rem; text-align: center; font-size: 0.875rem; color: var(--text-muted); font-style: italic; }
        .alpha-group { margin-bottom: 0.25rem; }
        .alpha-letter { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); padding: 0.5rem 1rem 0.25rem; }
        .contact-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.875rem; border: none; background: none; cursor: pointer; width: 100%; text-align: left; transition: background 0.12s; font-family: var(--font-body); }
        .contact-row:hover { background: var(--cream-dark); }
        .contact-row.selected { background: var(--cream-dark); }
        .contact-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: white; flex-shrink: 0; }
        .contact-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
        .contact-name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .contact-sub { font-size: 0.75rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .badge { font-size: 0.75rem; flex-shrink: 0; }
      `}</style>
    </div>
  )
}
