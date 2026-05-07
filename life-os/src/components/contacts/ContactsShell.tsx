'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Contact } from '@/types/contacts'
import { LinkedContact } from '@/types/linked-contacts'
import { ShareRecord } from '@/components/tasks/SharePanel'
import NavBar from '../NavBar'
import ContactsList from './ContactsList'
import ContactDetail from './ContactDetail'
import ContactForm from './ContactForm'

export interface NameOverride {
  id: string
  contact_id: string | null
  linked_user_id: string | null
  first_name: string
  last_name: string | null
}

export interface ContactRelationship {
  id: string
  contact_a_id: string
  contact_b_id: string
  b_role: 'parent' | 'child' | 'sibling' | 'spouse'
}

export interface ContactEntry {
  type: 'contact' | 'linked'
  contact?: Contact
  linked?: LinkedContact
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  date_of_birth: string | null
  avatar_url: string | null
  user_id: string
  isLinked: boolean
  isSelf: boolean
  linkedUserId?: string
  canSetName: boolean
  originalFirstName: string
  originalLastName: string | null
  nameOverride: NameOverride | null
}

export default function ContactsShell({
  initialContacts,
  initialContactShares,
  initialLinked,
  initialNameOverrides,
  initialRelationships,
  userId,
  profile,
}: {
  initialContacts: Contact[]
  initialContactShares: Record<string, ShareRecord[]>
  initialLinked: LinkedContact[]
  initialNameOverrides: NameOverride[]
  initialRelationships: ContactRelationship[]
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [linked, setLinked] = useState<LinkedContact[]>(initialLinked)
  const [contactShares, setContactShares] = useState<Record<string, ShareRecord[]>>(initialContactShares)
  const [nameOverrides, setNameOverrides] = useState<NameOverride[]>(initialNameOverrides)
  const [relationships, setRelationships] = useState<ContactRelationship[]>(initialRelationships)
  const [selectedEntry, setSelectedEntry] = useState<ContactEntry | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [search, setSearch] = useState('')

  const refreshContacts = useCallback(async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
    if (data) setContacts(data as Contact[])
  }, [supabase])

  const refreshShares = useCallback(async (contactId: string) => {
    const { data } = await (supabase as any)
      .from('contact_shares')
      .select('id, shared_with_email, created_at')
      .eq('contact_id', contactId)
      .eq('owner_id', userId)
    setContactShares(prev => ({ ...prev, [contactId]: data ?? [] }))
  }, [supabase, userId])

  const refreshNameOverrides = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('contact_name_overrides')
      .select('id, contact_id, linked_user_id, first_name, last_name')
      .eq('user_id', userId)
    if (data) setNameOverrides(data)
  }, [supabase, userId])

  const refreshRelationships = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('contact_relationships')
      .select('id, contact_a_id, contact_b_id, b_role')
      .eq('user_id', userId)
    if (data) setRelationships(data)
  }, [supabase, userId])

  const allEntries = useMemo((): ContactEntry[] => {
    const entries: ContactEntry[] = []

    for (const c of contacts) {
      const isSharedWithMe = c.user_id !== userId
      const override = isSharedWithMe
        ? nameOverrides.find(o => o.contact_id === c.id) ?? null
        : null
      const originalFirst = c.first_name
      const originalLast = c.last_name
      const isSelf = c.is_self && c.user_id === userId

      entries.push({
        type: 'contact',
        contact: c,
        id: c.id,
        first_name: override ? override.first_name : originalFirst,
        last_name: override ? override.last_name : originalLast,
        email: c.email,
        date_of_birth: c.date_of_birth,
        avatar_url: isSelf ? (profile?.avatar_url ?? null) : null,
        user_id: c.user_id,
        isLinked: false,
        isSelf,
        canSetName: isSharedWithMe,
        originalFirstName: originalFirst,
        originalLastName: originalLast,
        nameOverride: override,
      })
    }

    for (const l of linked) {
      if (!l.profile) continue
      const nameParts = (l.profile.full_name ?? '').trim().split(' ')
      const first = nameParts[0] ?? ''
      const last = nameParts.slice(1).join(' ') || null
      const override = nameOverrides.find(o => o.linked_user_id === l.linked_user_id) ?? null

      entries.push({
        type: 'linked',
        linked: l,
        id: `linked-${l.linked_user_id}`,
        first_name: override ? override.first_name : first,
        last_name: override ? override.last_name : last,
        email: l.profile.email,
        date_of_birth: l.profile.date_of_birth,
        avatar_url: l.profile.avatar_url,
        user_id: userId,
        isLinked: true,
        isSelf: false,
        linkedUserId: l.linked_user_id,
        canSetName: true,
        originalFirstName: first,
        originalLastName: last,
        nameOverride: override,
      })
    }

    return entries.sort((a, b) =>
      a.first_name.localeCompare(b.first_name) || (a.last_name ?? '').localeCompare(b.last_name ?? '')
    )
  }, [contacts, linked, userId, nameOverrides, profile])

  const handleSelectEntry = useCallback((entry: ContactEntry) => {
    setSelectedEntry(entry)
    if (entry.type === 'contact' && entry.contact?.user_id === userId) {
      refreshShares(entry.id)
    }
  }, [userId, refreshShares])

  const handleNameOverrideSaved = useCallback(async () => {
    await refreshNameOverrides()
  }, [refreshNameOverrides])

  const handleSaved = useCallback(async (contact?: Contact) => {
    await refreshContacts()
    setShowForm(false)
    setEditingContact(null)
    if (contact) {
      const { data } = await supabase.from('contacts').select('*').eq('id', contact.id).single()
      if (data) {
        const c = data as Contact
        const isSharedWithMe = c.user_id !== userId
        const override = isSharedWithMe
          ? nameOverrides.find(o => o.contact_id === c.id) ?? null
          : null
        const entry: ContactEntry = {
          type: 'contact',
          contact: c,
          id: c.id,
          first_name: override ? override.first_name : c.first_name,
          last_name: override ? override.last_name : c.last_name,
          email: c.email,
          date_of_birth: c.date_of_birth,
          avatar_url: c.is_self ? (profile?.avatar_url ?? null) : null,
          user_id: c.user_id,
          isLinked: false,
          isSelf: c.is_self && c.user_id === userId,
          canSetName: isSharedWithMe,
          originalFirstName: c.first_name,
          originalLastName: c.last_name,
          nameOverride: override,
        }
        setSelectedEntry(entry)
      }
    }
  }, [refreshContacts, supabase, userId, nameOverrides, profile])

  const handleDelete = useCallback(async (contactId: string) => {
    await supabase.from('contacts').delete().eq('id', contactId)
    setSelectedEntry(null)
    await refreshContacts()
  }, [supabase, refreshContacts])

  const handleEdit = useCallback((entry: ContactEntry) => {
    if (entry.contact) {
      setEditingContact(entry.contact)
      setShowForm(true)
    }
  }, [])

  // Keep selectedEntry in sync with allEntries so overrides + relationship changes propagate
  const syncedSelectedEntry = useMemo(() => {
    if (!selectedEntry) return null
    return allEntries.find(e => e.id === selectedEntry.id) ?? selectedEntry
  }, [selectedEntry, allEntries])

  return (
    <div className="contacts-shell">
      <NavBar profile={profile} />

      <div className="contacts-body">
        <ContactsList
          entries={allEntries}
          userId={userId}
          selectedId={syncedSelectedEntry?.id ?? null}
          search={search}
          onSearch={setSearch}
          onSelectEntry={handleSelectEntry}
          onNewContact={() => { setEditingContact(null); setShowForm(true) }}
        />

        <div className="mobile-bottom-spacer" />

        {syncedSelectedEntry ? (
          <ContactDetail
            entry={syncedSelectedEntry}
            userId={userId}
            shares={syncedSelectedEntry.type === 'contact' ? (contactShares[syncedSelectedEntry.id] ?? []) : []}
            allEntries={allEntries}
            relationships={relationships}
            onSharesChanged={() => syncedSelectedEntry.type === 'contact' && refreshShares(syncedSelectedEntry.id)}
            onEdit={() => handleEdit(syncedSelectedEntry)}
            onDelete={() => syncedSelectedEntry.contact && handleDelete(syncedSelectedEntry.contact.id)}
            onClose={() => setSelectedEntry(null)}
            onNameOverrideSaved={handleNameOverrideSaved}
            onRelationshipChanged={refreshRelationships}
          />
        ) : (
          <div className="contacts-empty-state">
            <p className="empty-icon">👤</p>
            <p className="empty-title">Select a contact</p>
            <p className="empty-desc">Choose a contact from the list, or add a new one.</p>
          </div>
        )}
      </div>

      {showForm && (
        <ContactForm
          userId={userId}
          contact={editingContact}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditingContact(null) }}
        />
      )}

      <style>{`
        .contacts-shell { height: 100vh; display: flex; flex-direction: column; background: var(--cream); overflow: hidden; }
        .contacts-body { flex: 1; display: flex; overflow: hidden; position: relative; }
        .contacts-empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-muted); }
        .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .empty-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; color: var(--deep-brown); }
        .empty-desc { font-size: 0.9rem; }
        .mobile-bottom-spacer { height: 64px; flex-shrink: 0; }
      `}</style>
    </div>
  )
}
