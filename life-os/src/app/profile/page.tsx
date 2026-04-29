import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="profile-page">
      <NavBar profile={profile} />

      <main className="profile-main container">
        <div className="profile-header animate-fade-up">
          <h1 className="profile-title">Your Profile</h1>
          <p className="profile-subtitle">Manage your personal information</p>
        </div>

        <div className="profile-content animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <ProfileForm profile={profile} userId={user.id} />
        </div>
      </main>

      <style>{`
        .profile-page { min-height: 100vh; background: var(--cream); }
        .profile-main { padding-top: 2.5rem; padding-bottom: 4rem; max-width: 680px; }
        .profile-header { margin-bottom: 2rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .profile-title { font-size: 2rem; font-weight: 600; letter-spacing: -0.03em; }
        .profile-subtitle { color: var(--text-secondary); font-size: 0.9375rem; }
      `}</style>
    </div>
  )
}