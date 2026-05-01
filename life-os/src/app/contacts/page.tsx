import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactsShell from '@/components/contacts/ContactsShell'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: contacts },
    { data: profile },
    { data: shareRows },
    { data: linkedRaw },
  ] = await Promise.all([
    supabase.from('contacts').select('*').order('last_name').order('first_name'),
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    (supabase as any).from('contact_shares').select('id, contact_id, shared_with_email, created_at').eq('owner_id', user.id),
    (supabase as any).from('linked_contacts').select('id, user_id, linked_user_id, created_at').eq('user_id', user.id),
  ])

  // Fetch profiles for linked users separately
  const linkedUserIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
  const { data: linkedProfiles } = linkedUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email, avatar_url, date_of_birth').in('id', linkedUserIds)
    : { data: [] }

  const linked = (linkedRaw ?? []).map((l: any) => ({
    ...l,
    profile: (linkedProfiles ?? []).find((p: any) => p.id === l.linked_user_id) ?? null,
  }))

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
      initialLinked={linked ?? []}
      userId={user.id}
      profile={profile}
    />
  )
}