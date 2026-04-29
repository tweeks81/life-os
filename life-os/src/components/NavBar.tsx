'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Avatar from './Avatar'
import SignOutButton from './SignOutButton'

export default function NavBar({
  profile,
}: {
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Home' },
    { href: '/tasks', label: 'Personal Tasks' },
    { href: '/profile', label: 'Profile' },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <Link href="/dashboard" className="nav-logo">
            <span className="nav-logo-icon">◎</span>
            <span className="nav-logo-text">Life OS</span>
          </Link>
          <div className="nav-links">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${pathname === l.href ? 'nav-link-active' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="navbar-right">
          <Link href="/profile" className="nav-avatar-link">
            <Avatar url={profile?.avatar_url} name={profile?.full_name} size={32} />
          </Link>
          <SignOutButton />
        </div>
      </div>

      <style>{`
        .navbar {
          background: white;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
          z-index: 100;
        }
        .navbar-inner {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
        }
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--deep-brown);
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo-icon { font-size: 1.1rem; }
        .nav-logo-text {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1rem;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .nav-link:hover {
          color: var(--deep-brown);
          background: var(--cream-dark);
        }
        .nav-link-active {
          color: var(--deep-brown);
          background: var(--cream-dark);
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .nav-avatar-link {
          border-radius: 50%;
          display: block;
        }
      `}</style>
    </nav>
  )
}
