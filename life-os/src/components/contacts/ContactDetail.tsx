'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { contactAvatarColour } from '@/types/contacts'
import { ContactEntry, ContactRelationship } from './ContactsShell'
import SharePanel, { ShareRecord } from '@/components/tasks/SharePanel'
import Avatar from '../Avatar'
import RelationshipPicker from './RelationshipPicker'

const ROLE_LABELS: Record<string, string> = {
  parent: 'Parent',
  child: 'Child',
  sibling: 'Sibling',
  spouse: 'Spouse / Partner',
}

const INVERSE_ROLE: Record<string, string> = {
  parent: 'child',
  child: 'parent',
  sibling: 'sibling',
  spouse: 'spouse',
}

function joinNames(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
}

function RelationshipDescription({
  relationships,
}: {
  relationships: { relId: string; relEntry: ContactEntry; role: string }[]
}) {
  const order: Array<{ role: string; prefix: string }> = [
    { role: 'child', prefix: 'Parent of' },
    { role: 'spouse', prefix: 'Married to / Partner of' },
    { role: 'parent', prefix: 'Child of' },
    { role: 'sibling', prefix: 'Sibling of' },
  ]

  const lines = order.flatMap(({ role, prefix }) => {
    const group = relationships.filter(r => r.role === role)
    if (group.length === 0) return []
    const names = group.map(r => `${r.relEntry.first_name} ${r.relEntry.last_name ?? ''}`.trim())
    return [{ prefix, text: joinNames(names) }]
  })

  return (
    <div className="rel-desc">
      {lines.map(({ prefix, text }) => (
        <p key={prefix} className="rel-desc-line">
          {prefix} <span className="rel-desc-name">{text}</span>
        </p>
      ))}
    </div>
  )
}

export default function ContactDetail({
  entry,
  userId,
  shares,
  allEntries,
  relationships,
  onSharesChanged,
  onEdit,
  onDelete,
  onClose,
  onNameOverrideSaved,
  onRelationshipChanged,
}: {
  entry: ContactEntry
  userId: string
  shares: ShareRecord[]
  allEntries: ContactEntry[]
  relationships: ContactRelationship[]
  onSharesChanged: () => void
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onNameOverrideSaved: () => void
  onRelationshipChanged: () => void
}) {
  const supabase = createClient()
  const isOwnContact = entry.type === 'contact' && entry.contact?.user_id === userId
  const isLinked = entry.isLinked
  const isSharedContact = entry.type === 'contact' && entry.contact?.user_id !== userId

  const contact = entry.contact
  const displayName = `${entry.first_name} ${entry.last_name ?? ''}`.trim()

  const hasAddress = contact?.address_line1 || contact?.address_town || contact?.address_city || contact?.address_postcode

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const calculateAge = (dob: string) => {
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const handleDelete = () => {
    if (confirm(`Delete ${displayName}? This cannot be undone.`)) onDelete()
  }

  const dob = entry.date_of_birth
  const email = entry.email

  // Name override state
  const [editingName, setEditingName] = useState(false)
  const [overrideFirst, setOverrideFirst] = useState('')
  const [overrideLast, setOverrideLast] = useState('')
  const [savingName, setSavingName] = useState(false)

  const startEditName = () => {
    setOverrideFirst(entry.nameOverride?.first_name ?? entry.originalFirstName)
    setOverrideLast(entry.nameOverride?.last_name ?? entry.originalLastName ?? '')
    setEditingName(true)
  }

  const saveNameOverride = async () => {
    if (!overrideFirst.trim()) return
    setSavingName(true)
    const payload = {
      user_id: userId,
      first_name: overrideFirst.trim(),
      last_name: overrideLast.trim() || null,
      updated_at: new Date().toISOString(),
      ...(entry.type === 'linked'
        ? { linked_user_id: entry.linkedUserId, contact_id: null }
        : { contact_id: entry.id, linked_user_id: null }),
    }
    if (entry.nameOverride) {
      await (supabase as any)
        .from('contact_name_overrides')
        .update({ first_name: payload.first_name, last_name: payload.last_name, updated_at: payload.updated_at })
        .eq('id', entry.nameOverride.id)
    } else {
      await (supabase as any).from('contact_name_overrides').insert(payload)
    }
    setSavingName(false)
    setEditingName(false)
    onNameOverrideSaved()
  }

  const removeNameOverride = async () => {
    if (!entry.nameOverride) return
    await (supabase as any).from('contact_name_overrides').delete().eq('id', entry.nameOverride.id)
    setEditingName(false)
    onNameOverrideSaved()
  }

  // Relationships
  const [showPicker, setShowPicker] = useState(false)
  const [editingRelationships, setEditingRelationships] = useState(false)

  const contactRelationships = useMemo(() => {
    if (entry.type !== 'contact') return []
    const entryById = new Map(allEntries.filter(e => e.type === 'contact').map(e => [e.id, e]))
    const result: { relId: string; relEntry: ContactEntry; role: string }[] = []

    for (const rel of relationships) {
      if (rel.contact_a_id === entry.id) {
        const relEntry = entryById.get(rel.contact_b_id)
        if (relEntry) result.push({ relId: rel.id, relEntry, role: rel.b_role })
      } else if (rel.contact_b_id === entry.id) {
        const relEntry = entryById.get(rel.contact_a_id)
        if (relEntry) result.push({ relId: rel.id, relEntry, role: INVERSE_ROLE[rel.b_role] ?? rel.b_role })
      }
    }
    return result
  }, [entry, relationships, allEntries])

  const handleDeleteRelationship = async (relId: string) => {
    await (supabase as any).from('contact_relationships').delete().eq('id', relId)
    onRelationshipChanged()
  }

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-header-left">
          {isLinked || entry.avatar_url ? (
            <Avatar url={entry.avatar_url} name={displayName} size={48} />
          ) : (
            <div
              className="detail-avatar"
              style={{ background: contactAvatarColour({ first_name: entry.originalFirstName, last_name: entry.originalLastName ?? '' } as any) }}
            >
              {entry.first_name[0]?.toUpperCase()}{(entry.last_name ?? '')[0]?.toUpperCase()}
            </div>
          )}
          <div className="detail-name-block">
            <h2 className="detail-name">{displayName}</h2>
            {entry.nameOverride && (
              <div className="detail-orig-name">
                Originally: {entry.originalFirstName} {entry.originalLastName ?? ''}
              </div>
            )}
            <div className="detail-badges">
              {entry.isSelf && <span className="badge self-badge">You</span>}
              {isLinked && <span className="badge linked-badge">🔗 Linked contact</span>}
              {isSharedContact && <span className="badge shared-badge">👥 Shared with you</span>}
            </div>
          </div>
        </div>
        <div className="detail-header-right">
          {isOwnContact && (
            <>
              <button className="btn-secondary detail-btn" onClick={onEdit}>Edit</button>
              {!entry.isSelf && (
                <button className="detail-delete-btn" onClick={handleDelete} title="Delete">🗑</button>
              )}
            </>
          )}
          <button className="detail-close mobile-only" onClick={onClose} style={{display:'none', fontSize:'0.875rem', padding:'0 0.5rem', width:'auto', borderRadius:'8px'}}>← Back</button>
          <button className="detail-close desktop-only" onClick={onClose}>✕</button>
        </div>
      </div>

      <div className="detail-scroll">
        {/* Linked contact notice */}
        {isLinked && (
          <div className="linked-notice">
            <span className="linked-notice-icon">🔗</span>
            <p>This contact is linked to a Life OS account. Their details are kept up to date automatically. To remove this connection, visit your <strong>Profile</strong> page.</p>
          </div>
        )}

        {/* My name for this contact */}
        {entry.canSetName && (
          <div className="detail-section">
            <div className="section-heading">My name for this contact</div>
            {editingName ? (
              <div className="name-override-form">
                <div className="name-override-inputs">
                  <input className="input-field override-input" placeholder="First name" value={overrideFirst} onChange={e => setOverrideFirst(e.target.value)} autoFocus />
                  <input className="input-field override-input" placeholder="Last name (optional)" value={overrideLast} onChange={e => setOverrideLast(e.target.value)} />
                </div>
                <div className="name-override-actions">
                  <button className="btn-primary override-save-btn" onClick={saveNameOverride} disabled={savingName || !overrideFirst.trim()}>{savingName ? 'Saving…' : 'Save'}</button>
                  <button className="btn-secondary override-save-btn" onClick={() => setEditingName(false)}>Cancel</button>
                  {entry.nameOverride && <button className="override-remove-btn" onClick={removeNameOverride}>Use original name</button>}
                </div>
              </div>
            ) : (
              <div className="name-override-display">
                <span className="name-override-value">
                  {entry.nameOverride
                    ? `${entry.nameOverride.first_name} ${entry.nameOverride.last_name ?? ''}`.trim()
                    : <span className="name-override-none">Using original name ({entry.originalFirstName} {entry.originalLastName ?? ''})</span>
                  }
                </span>
                <button className="btn-secondary override-edit-btn" onClick={startEditName}>{entry.nameOverride ? 'Change' : 'Set custom name'}</button>
              </div>
            )}
          </div>
        )}

        {/* Contact info */}
        <div className="detail-section">
          {email && (
            <div className="detail-field">
              <span className="field-icon">✉️</span>
              <div className="field-content">
                <span className="field-label">Email</span>
                <a href={`mailto:${email}`} className="field-value field-link">{email}</a>
              </div>
            </div>
          )}
          {contact?.phone_mobile && (
            <div className="detail-field">
              <span className="field-icon">📱</span>
              <div className="field-content">
                <span className="field-label">Mobile</span>
                <a href={`tel:${contact.phone_mobile}`} className="field-value field-link">{contact.phone_mobile}</a>
              </div>
            </div>
          )}
          {contact?.phone_home && (
            <div className="detail-field">
              <span className="field-icon">🏠</span>
              <div className="field-content">
                <span className="field-label">Home</span>
                <a href={`tel:${contact.phone_home}`} className="field-value field-link">{contact.phone_home}</a>
              </div>
            </div>
          )}
          {contact?.phone_work && (
            <div className="detail-field">
              <span className="field-icon">💼</span>
              <div className="field-content">
                <span className="field-label">Work</span>
                <a href={`tel:${contact.phone_work}`} className="field-value field-link">{contact.phone_work}</a>
              </div>
            </div>
          )}
          {dob && (
            <div className="detail-field">
              <span className="field-icon">🎂</span>
              <div className="field-content">
                <span className="field-label">Date of birth</span>
                <span className="field-value">
                  {formatDate(dob)}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                    (age {calculateAge(dob)})
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Address */}
        {hasAddress && (
          <div className="detail-section">
            <div className="section-heading">Address</div>
            <div className="address-block">
              {contact?.address_line1 && <div>{contact.address_line1}</div>}
              {contact?.address_line2 && <div>{contact.address_line2}</div>}
              {contact?.address_town && <div>{contact.address_town}</div>}
              {contact?.address_city && <div>{contact.address_city}</div>}
              {contact?.address_postcode && <div>{contact.address_postcode}</div>}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact?.notes && (
          <div className="detail-section">
            <div className="section-heading">Notes</div>
            <p className="notes-text">{contact.notes}</p>
          </div>
        )}

        {/* Relationships — for regular contacts only */}
        {entry.type === 'contact' && (
          <div className="detail-section">
            <div className="rel-header">
              <div className="section-heading">Relationships</div>
              <div className="rel-header-actions">
                {contactRelationships.length > 0 && (
                  <button className="rel-action-btn" onClick={() => setEditingRelationships(e => !e)}>
                    {editingRelationships ? 'Done' : 'Edit'}
                  </button>
                )}
                <button className="rel-action-btn" onClick={() => setShowPicker(true)}>+ Add</button>
              </div>
            </div>
            {contactRelationships.length === 0 ? (
              <p className="rel-empty">No relationships added yet.</p>
            ) : editingRelationships ? (
              <div className="rel-list">
                {contactRelationships.map(({ relId, relEntry, role }) => {
                  const relName = `${relEntry.first_name} ${relEntry.last_name ?? ''}`.trim()
                  return (
                    <div key={relId} className="rel-row">
                      {relEntry.avatar_url ? (
                        <Avatar url={relEntry.avatar_url} name={relName} size={32} />
                      ) : (
                        <div
                          className="rel-avatar"
                          style={{ background: contactAvatarColour({ first_name: relEntry.originalFirstName, last_name: relEntry.originalLastName ?? '' } as any) }}
                        >
                          {relEntry.first_name[0]?.toUpperCase()}{(relEntry.last_name ?? '')[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="rel-info">
                        <span className="rel-name">{relName}</span>
                        <span className="rel-role">{ROLE_LABELS[role] ?? role}</span>
                      </div>
                      <button className="rel-delete" onClick={() => handleDeleteRelationship(relId)} title="Remove relationship">✕</button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <RelationshipDescription relationships={contactRelationships} />
            )}
          </div>
        )}

        {/* Sharing — only for own non-self contacts */}
        {isOwnContact && !entry.isSelf && (
          <div className="detail-section">
            <SharePanel
              entityId={entry.contact!.id}
              entityType={'contact' as any}
              ownerId={entry.contact!.user_id}
              userId={userId}
              shares={shares}
              onSharesChanged={onSharesChanged}
            />
          </div>
        )}
      </div>

      {showPicker && (
        <RelationshipPicker
          userId={userId}
          currentEntry={entry}
          allEntries={allEntries}
          relationships={relationships}
          onSaved={() => { setShowPicker(false); onRelationshipChanged() }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <style>{`
        .detail-panel { flex: 1; background: white; border-left: 1px solid var(--border-light); box-shadow: -4px 0 24px var(--shadow-warm-md); display: flex; flex-direction: column; overflow: hidden; animation: slideIn 0.22s ease; max-width: 480px; }
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .detail-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; gap: 0.75rem; }
        .detail-header-left { display: flex; align-items: center; gap: 0.875rem; flex: 1; min-width: 0; }
        .detail-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; color: white; flex-shrink: 0; }
        .detail-name-block { min-width: 0; }
        .detail-name { font-size: 1.125rem; font-weight: 600; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 0.1rem; }
        .detail-orig-name { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.2rem; font-style: italic; }
        .detail-badges { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .badge { font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 5px; display: inline-block; }
        .self-badge { background: #fdf5f2; color: var(--terracotta); border: 1px solid #f5c9b8; }
        .linked-badge { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .shared-badge { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .detail-header-right { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
        .detail-btn { font-size: 0.8125rem; padding: 0.375rem 0.875rem; }
        .detail-delete-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .detail-delete-btn:hover { background: #fef2f2; border-color: #fecaca; }
        .detail-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .detail-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .detail-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .linked-notice { display: flex; gap: 0.75rem; padding: 0.875rem 1.25rem; background: #f0fdf4; border-bottom: 1px solid #bbf7d0; font-size: 0.8125rem; color: #166534; line-height: 1.5; }
        .linked-notice-icon { font-size: 1rem; flex-shrink: 0; }
        .detail-section { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 0.625rem; }
        .section-heading { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
        .detail-field { display: flex; align-items: flex-start; gap: 0.75rem; }
        .field-icon { font-size: 0.9rem; margin-top: 0.1rem; flex-shrink: 0; width: 20px; text-align: center; }
        .field-content { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .field-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-weight: 600; }
        .field-value { font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }
        .field-link { color: var(--terracotta); text-decoration: none; }
        .field-link:hover { text-decoration: underline; }
        .address-block { font-size: 0.9rem; color: var(--text-primary); line-height: 1.7; }
        .notes-text { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; }
        .name-override-display { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
        .name-override-value { font-size: 0.9rem; color: var(--text-primary); font-weight: 500; flex: 1; min-width: 0; }
        .name-override-none { color: var(--text-muted); font-weight: 400; font-style: italic; }
        .override-edit-btn { font-size: 0.75rem; padding: 0.25rem 0.625rem; flex-shrink: 0; }
        .name-override-form { display: flex; flex-direction: column; gap: 0.5rem; }
        .name-override-inputs { display: flex; gap: 0.5rem; }
        .override-input { flex: 1; font-size: 0.875rem; padding: 0.4rem 0.625rem; }
        .name-override-actions { display: flex; align-items: center; gap: 0.5rem; }
        .override-save-btn { font-size: 0.8125rem; padding: 0.35rem 0.75rem; }
        .override-remove-btn { font-size: 0.75rem; color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 0.25rem 0; text-decoration: underline; margin-left: auto; }
        .override-remove-btn:hover { color: var(--text-primary); }
        .rel-header { display: flex; align-items: center; justify-content: space-between; }
        .rel-header-actions { display: flex; align-items: center; gap: 0.75rem; }
        .rel-action-btn { font-size: 0.75rem; font-weight: 600; color: var(--terracotta); background: none; border: none; cursor: pointer; padding: 0; font-family: var(--font-body); }
        .rel-action-btn:hover { text-decoration: underline; }
        .rel-empty { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; }
        .rel-desc { display: flex; flex-direction: column; gap: 0.3rem; }
        .rel-desc-line { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; }
        .rel-desc-name { color: var(--text-primary); font-weight: 500; }
        .rel-list { display: flex; flex-direction: column; gap: 0.375rem; }
        .rel-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem 0; }
        .rel-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white; flex-shrink: 0; }
        .rel-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.05rem; }
        .rel-name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rel-role { font-size: 0.75rem; color: var(--text-muted); }
        .rel-delete { width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--border-light); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.7rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .rel-delete:hover { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
      `}</style>
    </div>
  )
}
