'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import Avatar from './Avatar'
import { createClient } from '@/lib/supabase/client'

export default function NavBar({
  profile,
}: {
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const links = [
    { href: '/dashboard', label: 'Home' },
    { href: '/tasks', label: 'Personal Tasks' },
  ]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

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
          <div className="avatar-menu-wrapper" ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Account menu"
            >
              <Avatar url={profile?.avatar_url} name={profile?.full_name} size={32} />
            </button>

            {menuOpen && (
              <div className="avatar-dropdown">
                <div className="dropdown-user">
                  <Avatar url={profile?.avatar_url} name={profile?.full_name} size={36} />
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{profile?.full_name ?? 'My Account'}</span>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <Link
                  href="/profile"
                  className="dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="dropdown-item-icon">👤</span>
                  Profile
                </Link>
                <button className="dropdown-item dropdown-signout" onClick={handleSignOut}>
                  <span className="dropdown-item-icon">→</span>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .navbar {
          background: white;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
          z-index: 100;
          position: relative;
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
        }
        .avatar-menu-wrapper {
          position: relative;
        }
        .avatar-btn {
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 50%;
          padding: 0;
          display: block;
          transition: opacity 0.15s, transform 0.15s;
        }
        .avatar-btn:hover {
          opacity: 0.85;
          transform: scale(1.05);
        }
        .avatar-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 210px;
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          box-shadow: 0 8px 30px var(--shadow-warm-md);
          overflow: hidden;
          animation: dropDown 0.15s ease;
          z-index: 200;
        }
        @keyframes dropDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-user {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1rem;
        }
        .dropdown-user-info {
          min-width: 0;
          flex: 1;
        }
        .dropdown-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--deep-brown);
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .dropdown-divider {
          height: 1px;
          background: var(--border-light);
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.12s;
          text-align: left;
        }
        .dropdown-item:hover {
          background: var(--cream-dark);
          color: var(--deep-brown);
        }
        .dropdown-item-icon {
          font-size: 0.9rem;
          width: 18px;
          text-align: center;
          flex-shrink: 0;
        }
        .dropdown-signout { color: var(--terracotta); }
        .dropdown-signout:hover { background: #fef0ec; color: var(--terracotta); }
      `}</style>
    </nav>
  )
}
