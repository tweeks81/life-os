import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import ProfileForm from '@/components/ProfileForm'
import ConnectionsPanel from '@/components/ConnectionsPanel'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch linked contacts with profile data
  const { data: linkedRaw } = await (supabase as any)
    .from('linked_contacts')
    .select('id, user_id, linked_user_id, created_at')
    .eq('user_id', user.id)

  // Fetch profiles for linked users
  const linkedUserIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
  const { data: linkedProfiles } = linkedUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email, avatar_url, date_of_birth').in('id', linkedUserIds)
    : { data: [] }

  const linked = (linkedRaw ?? []).map((l: any) => ({
    ...l,
    profile: (linkedProfiles ?? []).find((p: any) => p.id === l.linked_user_id) ?? null,
  }))

  // Fetch sent requests with recipient profiles
  const { data: sentRaw } = await (supabase as any)
    .from('contact_requests')
    .select('id, from_user_id, to_user_id, status, created_at')
    .eq('from_user_id', user.id)
    .order('created_at', { ascending: false })

  const toUserIds = (sentRaw ?? []).map((r: any) => r.to_user_id)
  const { data: toProfiles } = toUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', toUserIds)
    : { data: [] }

  const sentRequests = (sentRaw ?? []).map((r: any) => ({
    ...r,
    to_profile: (toProfiles ?? []).find((p: any) => p.id === r.to_user_id) ?? null,
  }))

  // Fetch received pending requests with sender profiles
  const { data: receivedRaw } = await (supabase as any)
    .from('contact_requests')
    .select('id, from_user_id, to_user_id, status, created_at')
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const fromUserIds = (receivedRaw ?? []).map((r: any) => r.from_user_id)
  const { data: fromProfiles } = fromUserIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', fromUserIds)
    : { data: [] }

  const receivedRequests = (receivedRaw ?? []).map((r: any) => ({
    ...r,
    from_profile: (fromProfiles ?? []).find((p: any) => p.id === r.from_user_id) ?? null,
  }))

  return (
    <div className="profile-page">
      <NavBar profile={profile} />

      <main className="profile-main container">
        <div className="profile-header animate-fade-up">
          <h1 className="profile-title">Your Profile</h1>
          <p className="profile-subtitle">Manage your personal information and connections</p>
        </div>

        <div className="profile-sections animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <ProfileForm profile={profile} userId={user.id} />

          <ConnectionsPanel
            userId={user.id}
            initialLinked={linked ?? []}
            initialSentRequests={sentRequests ?? []}
            initialReceivedRequests={receivedRequests ?? []}
            onLinksChanged={() => {}}
          />
        </div>
      </main>

      <style>{`
        .profile-page { min-height: 100vh; background: var(--cream); }
        .profile-main { padding-top: 2.5rem; padding-bottom: 4rem; max-width: 680px; }
        .profile-header { margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .profile-title { font-size: 2rem; font-weight: 600; letter-spacing: -0.03em; }
        .profile-subtitle { color: var(--text-secondary); font-size: 0.9375rem; }
        .profile-sections { display: flex; flex-direction: column; gap: 1.5rem; }
      `}</style>
    </div>
  )
}