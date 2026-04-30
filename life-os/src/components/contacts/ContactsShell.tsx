'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Contact } from '@/types/contacts'
import { ShareRecord } from '@/components/tasks/SharePanel'
import NavBar from '../NavBar'
import ContactsList from './ContactsList'
import ContactDetail from './ContactDetail'
import ContactForm from './ContactForm'

export default function ContactsShell({
  initialContacts,
  initialContactShares,
  userId,
  profile,
}: {
  initialContacts: Contact[]
  initialContactShares: Record<string, ShareRecord[]>
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [contactShares, setContactShares] = useState<Record<string, ShareRecord[]>>(initialContactShares)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
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

  const refreshShares = useCallback(async (contactId: string) => {
    const { data } = await (supabase as any)
      .from('contact_shares')
      .select('id, shared_with_email, created_at')
      .eq('contact_id', contactId)
      .eq('owner_id', userId)
    setContactShares(prev => ({ ...prev, [contactId]: data ?? [] }))
  }, [supabase, userId])

  const handleSelectContact = useCallback((contact: Contact) => {
    setSelectedContact(contact)
    if (contact.user_id === userId) {
      refreshShares(contact.id)
    }
  }, [userId, refreshShares])

  const handleSaved = useCallback(async (contact?: Contact) => {
    await refreshContacts()
    setShowForm(false)
    setEditingContact(null)
    if (contact) {
      // Re-fetch the saved contact to get latest data
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contact.id)
        .single()
      if (data) setSelectedContact(data as Contact)
    }
  }, [refreshContacts, supabase])

  const handleDelete = useCallback(async (contactId: string) => {
    await supabase.from('contacts').delete().eq('id', contactId)
    setSelectedContact(null)
    await refreshContacts()
  }, [supabase, refreshContacts])

  const handleEdit = useCallback((contact: Contact) => {
    setEditingContact(contact)
    setShowForm(true)
  }, [])

  return (
    <div className="contacts-shell">
      <NavBar profile={profile} />

      <div className="contacts-body">
        <ContactsList
          contacts={contacts}
          userId={userId}
          selectedContactId={selectedContact?.id ?? null}
          search={search}
          onSearch={setSearch}
          onSelectContact={handleSelectContact}
          onNewContact={() => { setEditingContact(null); setShowForm(true) }}
        />

        {selectedContact && (
          <ContactDetail
            contact={selectedContact}
            userId={userId}
            shares={contactShares[selectedContact.id] ?? []}
            onSharesChanged={() => refreshShares(selectedContact.id)}
            onEdit={() => handleEdit(selectedContact)}
            onDelete={() => handleDelete(selectedContact.id)}
            onClose={() => setSelectedContact(null)}
          />
        )}

        {!selectedContact && (
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
        .contacts-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--cream);
          overflow: hidden;
        }
        .contacts-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }
        .contacts-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--text-muted);
        }
        .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .empty-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--deep-brown);
        }
        .empty-desc { font-size: 0.9rem; }
      `}</style>
    </div>
  )
}
