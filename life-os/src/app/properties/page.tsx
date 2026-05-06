import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PropertiesShell from '@/components/properties/PropertiesShell'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: properties },
    { data: profile },
    { data: shareRows },
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .order('is_primary_residence', { ascending: false })
      .order('name', { ascending: true }),
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    (supabase as any)
      .from('property_shares')
      .select('id, property_id, shared_with_email, created_at')
      .eq('owner_id', user.id),
  ])

  const propertyShares: Record<string, any[]> = {}
  for (const row of shareRows ?? []) {
    if (!propertyShares[row.property_id]) propertyShares[row.property_id] = []
    propertyShares[row.property_id].push({
      id: row.id,
      shared_with_email: row.shared_with_email,
      created_at: row.created_at,
    })
  }

  return (
    <PropertiesShell
      initialProperties={properties ?? []}
      initialShares={propertyShares}
      userId={user.id}
      profile={profile}
    />
  )
}
