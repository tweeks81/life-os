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

export interface ContactEntry {
  type: 'contact' | 'linked'
  contact?: Contact
  linked?: LinkedContact
  id: string
  first_name: string
  last_name: string
  email: string | null
  date_of_birth: string | null
  avatar_url: string | null
  user_id: string
  isLinked: boolean
  linkedUserId?: string
}

export default function ContactsShell({
  initialContacts,
  initialContactShares,
  initialLinked,
  userId,
  profile,
}: {
  initialContacts: Contact[]
  initialContactShares: Record<string, ShareRecord[]>
  initialLinked: LinkedContact[]
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [linked, setLinked] = useState<LinkedContact[]>(initialLinked)
  const [contactShares, setContactShares] = useState<Record<string, ShareRecord[]>>(initialContactShares)
  const [selectedEntry, setSelectedEntry] = useState<ContactEntry | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [search, setSearch] = useState('')

  const refreshContacts = useCallback(async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
    if (data) setContacts(data as Contact[])
  }, [supabase])

  const refreshLinked = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('linked_contacts')
      .select('*, profile:profiles!linked_user_id(id, full_name, email, avatar_url, date_of_birth)')
      .eq('user_id', userId)
    if (data) setLinked(data)
  }, [supabase, userId])

  const refreshShares = useCallback(async (contactId: string) => {
    const { data } = await (supabase as any)
      .from('contact_shares')
      .select('id, shared_with_email, created_at')
      .eq('contact_id', contactId)
      .eq('owner_id', userId)
    setContactShares(prev => ({ ...prev, [contactId]: data ?? [] }))
  }, [supabase, userId])

  const allEntries = useMemo((): ContactEntry[] => {
    const entries: ContactEntry[] = []

    for (const c of contacts) {
      entries.push({
        type: 'contact',
        contact: c,
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        date_of_birth: c.date_of_birth,
        avatar_url: null,
        user_id: c.user_id,
        isLinked: false,
      })
    }

    for (const l of linked) {
      if (!l.profile) continue
      const nameParts = (l.profile.full_name ?? '').trim().split(' ')
      const first = nameParts[0] ?? ''
      const last = nameParts.slice(1).join(' ') || first
      entries.push({
        type: 'linked',
        linked: l,
        id: `linked-${l.linked_user_id}`,
        first_name: first,
        last_name: last,
        email: l.profile.email,
        date_of_birth: l.profile.date_of_birth,
        avatar_url: l.profile.avatar_url,
        user_id: userId,
        isLinked: true,
        linkedUserId: l.linked_user_id,
      })
    }

    return entries.sort((a, b) =>
      a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)
    )
  }, [contacts, linked, userId])

  const handleSelectEntry = useCallback((entry: ContactEntry) => {
    setSelectedEntry(entry)
    if (entry.type === 'contact' && entry.contact?.user_id === userId) {
      refreshShares(entry.id)
    }
  }, [userId, refreshShares])

  const handleSaved = useCallback(async (contact?: Contact) => {
    await refreshContacts()
    setShowForm(false)
    setEditingContact(null)
    if (contact) {
      const { data } = await supabase.from('contacts').select('*').eq('id', contact.id).single()
      if (data) {
        const entry: ContactEntry = {
          type: 'contact',
          contact: data as Contact,
          id: (data as Contact).id,
          first_name: (data as Contact).first_name,
          last_name: (data as Contact).last_name,
          email: (data as Contact).email,
          date_of_birth: (data as Contact).date_of_birth,
          avatar_url: null,
          user_id: (data as Contact).user_id,
          isLinked: false,
        }
        setSelectedEntry(entry)
      }
    }
  }, [refreshContacts, supabase])

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

  return (
    <div className="contacts-shell">
      <NavBar profile={profile} />

      <div className="contacts-body">
        <ContactsList
          entries={allEntries}
          userId={userId}
          selectedId={selectedEntry?.id ?? null}
          search={search}
          onSearch={setSearch}
          onSelectEntry={handleSelectEntry}
          onNewContact={() => { setEditingContact(null); setShowForm(true) }}
        />

        <div className="mobile-bottom-spacer" />

        {selectedEntry ? (
          <ContactDetail
            entry={selectedEntry}
            userId={userId}
            shares={selectedEntry.type === 'contact' ? (contactShares[selectedEntry.id] ?? []) : []}
            onSharesChanged={() => selectedEntry.type === 'contact' && refreshShares(selectedEntry.id)}
            onEdit={() => handleEdit(selectedEntry)}
            onDelete={() => selectedEntry.contact && handleDelete(selectedEntry.contact.id)}
            onClose={() => setSelectedEntry(null)}
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