import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import Avatar from '@/components/Avatar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="dashboard">
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

      <main className="dashboard-main container">
        <header className="dashboard-header animate-fade-up">
          <p className="dashboard-greeting">{greeting},</p>
          <h1 className="dashboard-name">{firstName}</h1>
          <p className="dashboard-date">{new Date().toLocaleDateString('en-GB', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}</p>
        </header>

        <div className="modules-grid animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <Link href="/profile" className="module-card card">
            <div className="module-icon">👤</div>
            <div className="module-content">
              <h3 className="module-title">Profile</h3>
              <p className="module-desc">Your personal info & settings</p>
            </div>
            <span className="module-arrow">→</span>
          </Link>

          <div className="module-card card module-coming-soon">
            <div className="module-icon">✓</div>
            <div className="module-content">
              <h3 className="module-title">Tasks</h3>
              <p className="module-desc">Coming soon</p>
            </div>
            <span className="module-badge">Soon</span>
          </div>

          <div className="module-card card module-coming-soon">
            <div className="module-icon">📅</div>
            <div className="module-content">
              <h3 className="module-title">Calendar</h3>
              <p className="module-desc">Coming soon</p>
            </div>
            <span className="module-badge">Soon</span>
          </div>

          <div className="module-card card module-coming-soon">
            <div className="module-icon">👥</div>
            <div className="module-content">
              <h3 className="module-title">Contacts</h3>
              <p className="module-desc">Coming soon</p>
            </div>
            <span className="module-badge">Soon</span>
          </div>
        </div>
      </main>

      <style>{`
        .dashboard {
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

        .nav-logo-icon {
          font-size: 1.25rem;
        }

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

        .dashboard-main {
          padding-top: 3rem;
          padding-bottom: 4rem;
        }

        .dashboard-header {
          margin-bottom: 2.5rem;
        }

        .dashboard-greeting {
          font-size: 1rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .dashboard-name {
          font-size: 2.5rem;
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 0.5rem;
        }

        .dashboard-date {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }

        .module-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        a.module-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--shadow-warm-md);
          border-color: var(--parchment);
        }

        .module-coming-soon {
          opacity: 0.6;
          cursor: default;
        }

        .module-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          background: var(--cream-dark);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .module-content {
          flex: 1;
          min-width: 0;
        }

        .module-title {
          font-size: 1rem;
          font-weight: 600;
          font-family: var(--font-body);
          margin-bottom: 0.2rem;
        }

        .module-desc {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .module-arrow {
          font-size: 1.125rem;
          color: var(--text-muted);
          transition: transform 0.2s;
        }

        a.module-card:hover .module-arrow {
          transform: translateX(3px);
        }

        .module-badge {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: var(--parchment);
          color: var(--warm-brown);
          padding: 0.2rem 0.5rem;
          border-radius: 100px;
        }
      `}</style>
    </div>
  )
}
