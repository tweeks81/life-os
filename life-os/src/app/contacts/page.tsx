import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactsShell from '@/components/contacts/ContactsShell'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: contacts }, { data: profile }, { data: shareRows }] = await Promise.all([
    supabase
      .from('contacts')
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true }),
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    (supabase as any)
      .from('contact_shares')
      .select('id, contact_id, shared_with_email, created_at')
      .eq('owner_id', user.id),
  ])

  const contactShares: Record<string, any[]> = {}
  for (const row of shareRows ?? []) {
    if (!contactShares[row.contact_id]) contactShares[row.contact_id] = []
    contactShares[row.contact_id].push({
      id: row.id,
      shared_with_email: row.shared_with_email,
      created_at: row.created_at,
    })
  }

  return (
    <ContactsShell
      initialContacts={contacts ?? []}
      initialContactShares={contactShares}
      userId={user.id}
      profile={profile}
    />
  )
}
