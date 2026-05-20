'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Avatar from './Avatar'
import { createClient } from '@/lib/supabase/client'

// ── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5"/>
    </svg>
  )
}
function IconTasks() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5h9M8 10h9M8 15h9"/>
      <path d="M3.5 5l1 1 2-2.5"/><path d="M3.5 10l1 1 2-2.5"/><path d="M3.5 15l1 1 2-2.5"/>
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="14" rx="2"/>
      <path d="M2 8h16"/><path d="M6 2v4M14 2v4"/>
      <circle cx="7" cy="12" r="0.75" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="12" r="0.75" fill="currentColor" stroke="none"/>
      <circle cx="13" cy="12" r="0.75" fill="currentColor" stroke="none"/>
    </svg>
  )
}
function IconContacts() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="7" r="3"/>
      <path d="M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
      <path d="M14 4c1.7 0 3 1.3 3 3s-1.3 3-3 3"/>
      <path d="M17.5 18c0-2.5-1.5-4.5-3.5-5.4"/>
    </svg>
  )
}
function IconProperties() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18V9l8-7 8 7v9"/>
      <path d="M7 18v-5h6v5"/>
    </svg>
  )
}
function IconVehicles() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l2-5h10l2 5"/>
      <rect x="2" y="11" width="16" height="5" rx="1.5"/>
      <circle cx="6" cy="17.5" r="1.5"/><circle cx="14" cy="17.5" r="1.5"/>
      <path d="M2 13h1M17 13h1"/>
    </svg>
  )
}
function IconTrips() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 4L2 9l5 2.5L10 18l2.5-5L18 4z"/>
    </svg>
  )
}
function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10 4L6 8l4 4"/>
    </svg>
  )
}
function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 4l4 4-4 4"/>
    </svg>
  )
}

// ── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: IconDashboard },
  { href: '/tasks',     label: 'Tasks',      Icon: IconTasks },
  { href: '/calendar',  label: 'Calendar',   Icon: IconCalendar },
  { href: '/contacts',  label: 'Contacts',   Icon: IconContacts },
  { href: '/properties',label: 'Properties', Icon: IconProperties },
  { href: '/vehicles',  label: 'Vehicles',   Icon: IconVehicles },
  { href: '/trips',     label: 'Trips',      Icon: IconTrips },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function LeftSidebar({
  profile,
  expanded,
  onToggle,
}: {
  profile: { full_name: string | null; avatar_url: string | null } | null
  expanded: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Account'

  return (
    <aside className={`lsb ${expanded ? 'lsb-open' : ''}`}>
      {/* Top: logo + toggle */}
      <div className="lsb-top">
        <Link href="/dashboard" className="lsb-logo">
          <span className="lsb-logo-icon">◎</span>
          <span className="lsb-logo-text">Life OS</span>
        </Link>
        <button className="lsb-toggle" onClick={onToggle} title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
          {expanded ? <IconChevronLeft /> : <IconChevronRight />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="lsb-nav">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`lsb-link ${active ? 'lsb-link-active' : ''}`}
              title={!expanded ? label : undefined}
            >
              <span className="lsb-link-icon"><Icon /></span>
              <span className="lsb-link-label">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: avatar + profile menu */}
      <div className="lsb-bottom">
        <button className="lsb-avatar-btn" onClick={() => setProfileOpen(p => !p)}>
          <Avatar url={profile?.avatar_url} name={profile?.full_name} size={32} />
          <span className="lsb-avatar-name">{firstName}</span>
        </button>
        {profileOpen && (
          <div className="lsb-pmenu">
            <Link href="/profile" className="lsb-pmenu-item" onClick={() => setProfileOpen(false)}>Profile</Link>
            <button className="lsb-pmenu-item lsb-pmenu-out" onClick={handleSignOut}>Sign out</button>
          </div>
        )}
      </div>

      <style>{`
        .lsb {
          position: fixed; top: 0; left: 0; height: 100vh; width: 64px;
          background: white; border-right: 1px solid var(--border-light);
          display: flex; flex-direction: column; z-index: 150;
          transition: width 0.22s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }
        .lsb-open { width: 220px; }

        .lsb-top {
          height: 60px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 0.75rem 0 1rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0;
        }
        .lsb-logo {
          display: flex; align-items: center; gap: 0.5rem;
          text-decoration: none; overflow: hidden; min-width: 0;
        }
        .lsb-logo-icon { font-size: 1.25rem; color: var(--terracotta); flex-shrink: 0; }
        .lsb-logo-text {
          font-family: var(--font-display); font-weight: 600; font-size: 1rem;
          color: var(--deep-brown); white-space: nowrap;
          opacity: 0; width: 0; transition: opacity 0.15s 0.06s, width 0.22s;
        }
        .lsb-open .lsb-logo-text { opacity: 1; width: auto; }
        .lsb-toggle {
          width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-light);
          background: var(--cream); cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: var(--text-muted); flex-shrink: 0; transition: all 0.15s;
        }
        .lsb-toggle:hover { background: var(--cream-dark); color: var(--deep-brown); }

        .lsb-nav {
          flex: 1; display: flex; flex-direction: column;
          padding: 0.625rem 0; gap: 1px; overflow-y: auto; overflow-x: hidden;
        }
        .lsb-link {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 0.625rem 1rem; color: var(--text-secondary); text-decoration: none;
          white-space: nowrap; transition: all 0.13s; position: relative;
        }
        .lsb-link:hover { background: var(--cream); color: var(--deep-brown); }
        .lsb-link-active { background: var(--cream-dark); color: var(--deep-brown); }
        .lsb-link-active::before {
          content: ''; position: absolute; left: 0; top: 8px; bottom: 8px;
          width: 3px; background: var(--terracotta); border-radius: 0 2px 2px 0;
        }
        .lsb-link-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lsb-link-label {
          font-size: 0.875rem; font-weight: 500;
          opacity: 0; width: 0; overflow: hidden;
          transition: opacity 0.12s 0.05s, width 0.22s;
          white-space: nowrap;
        }
        .lsb-open .lsb-link-label { opacity: 1; width: auto; }

        .lsb-bottom {
          padding: 0.75rem; border-top: 1px solid var(--border-light);
          flex-shrink: 0; position: relative;
        }
        .lsb-avatar-btn {
          display: flex; align-items: center; gap: 0.625rem; background: none; border: none;
          cursor: pointer; width: 100%; padding: 0.375rem; border-radius: 8px;
          transition: background 0.15s; overflow: hidden;
        }
        .lsb-avatar-btn:hover { background: var(--cream); }
        .lsb-avatar-name {
          font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          opacity: 0; width: 0; transition: opacity 0.12s 0.05s, width 0.22s;
        }
        .lsb-open .lsb-avatar-name { opacity: 1; width: auto; }

        .lsb-pmenu {
          position: absolute; bottom: calc(100% + 6px); left: 0.75rem;
          background: white; border: 1px solid var(--border-light); border-radius: 10px;
          box-shadow: 0 4px 20px var(--shadow-warm-md); overflow: hidden; min-width: 150px; z-index: 200;
        }
        .lsb-pmenu-item {
          display: block; width: 100%; padding: 0.625rem 1rem; font-size: 0.875rem;
          font-weight: 500; color: var(--text-secondary); text-decoration: none;
          background: none; border: none; cursor: pointer; font-family: var(--font-body);
          text-align: left; transition: background 0.12s;
        }
        .lsb-pmenu-item:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .lsb-pmenu-out { color: var(--terracotta); }
        .lsb-pmenu-out:hover { background: #fef0ec; color: var(--terracotta); }

        @media (max-width: 768px) { .lsb { display: none; } }
      `}</style>
    </aside>
  )
}
