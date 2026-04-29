import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from '@/components/ProfileForm'
import SignOutButton from '@/components/SignOutButton'
import Avatar from '@/components/Avatar'

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
      <nav className="nav">
        <div className="nav-inner container">
          <Link href="/dashboard" className="nav-logo">
            <span className="nav-logo-icon">◎</span>
            <span className="nav-logo-text">Life OS</span>
          </Link>
          <div className="nav-right">
            <Link href="/profile" className="nav-avatar-link">
              <Avatar
                url={profile?.avatar_url}
                name={profile?.full_name}
                size={36}
              />
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="profile-main container">
        <div className="profile-header animate-fade-up">
          <Link href="/dashboard" className="back-link">← Dashboard</Link>
          <h1 className="profile-title">Your Profile</h1>
          <p className="profile-subtitle">Manage your personal information</p>
        </div>

        <div className="profile-content animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <ProfileForm profile={profile} userId={user.id} />
        </div>
      </main>

      <style>{`
        .profile-page {
          min-height: 100vh;
          background: var(--cream);
        }

        .nav {
          background: white;
          border-bottom: 1px solid var(--border-light);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-inner {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--deep-brown);
          text-decoration: none;
        }

        .nav-logo-icon { font-size: 1.25rem; }

        .nav-logo-text {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.125rem;
          letter-spacing: -0.01em;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-avatar-link {
          border-radius: 50%;
          overflow: hidden;
          display: block;
        }

        .profile-main {
          padding-top: 2.5rem;
          padding-bottom: 4rem;
          max-width: 680px;
        }

        .profile-header {
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .back-link {
          font-size: 0.875rem;
          color: var(--text-muted);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-bottom: 0.25rem;
          transition: color 0.15s;
        }

        .back-link:hover {
          color: var(--terracotta);
        }

        .profile-title {
          font-size: 2rem;
          font-weight: 600;
          letter-spacing: -0.03em;
        }

        .profile-subtitle {
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }
      `}</style>
    </div>
  )
}
