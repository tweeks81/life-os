import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContactsShell from '@/components/contacts/ContactsShell'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Fetch profile first — needed for self-contact creation
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Ensure a self-contact row exists for this user
  const { data: existingSelf } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_self', true)
    .maybeSingle()

  if (!existingSelf) {
    const nameParts = (profile?.full_name ?? '').trim().split(' ')
    const firstName = nameParts[0] || 'Me'
    const lastName = nameParts.slice(1).join(' ') || null
    await supabase.from('contacts').insert({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      email: user.email ?? null,
      is_self: true,
    })
  }

  const [
    { data: contacts },
    { data: shareRows },
    { data: linkedRaw },
    { data: nameOverrides },
    { data: relationships },
  ] = await Promise.all([
    supabase.from('contacts').select('*').order('first_name').order('last_name'),
    (supabase as any).from('contact_shares').select('id, contact_id, shared_with_email, created_at').eq('owner_id', user.id),
    (supabase as any).from('linked_contacts').select('id, user_id, linked_user_id, created_at').eq('user_id', user.id),
    (supabase as any).from('contact_name_overrides').select('id, contact_id, linked_user_id, first_name, last_name').eq('user_id', user.id),
    (supabase as any).from('contact_relationships').select('id, contact_a_id, contact_b_id, b_role').eq('user_id', user.id),
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
      initialNameOverrides={nameOverrides ?? []}
      initialRelationships={relationships ?? []}
      userId={user.id}
      profile={profile}
    />
  )
}
