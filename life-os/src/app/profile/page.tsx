import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import ProfileForm from '@/components/ProfileForm'
import ConnectionsPanel from '@/components/ConnectionsPanel'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [
    { data: profile },
    { data: linked },
    { data: sentRequests },
    { data: receivedRequests },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    (supabase as any)
      .from('linked_contacts')
      .select('*, profile:profiles!linked_user_id(id, full_name, email, avatar_url, date_of_birth)')
      .eq('user_id', user.id),
    (supabase as any)
      .from('contact_requests')
      .select('*, to_profile:profiles!to_user_id(full_name, email, avatar_url)')
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('contact_requests')
      .select('*, from_profile:profiles!from_user_id(full_name, email, avatar_url)')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

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
