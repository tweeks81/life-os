'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileBottomNav() {
  const pathname = usePathname()

  const tabs = [
    { href: '/dashboard', label: 'Home', icon: '⌂' },
    { href: '/tasks', label: 'Tasks', icon: '✓' },
    { href: '/calendar', label: 'Calendar', icon: '◫' },
    { href: '/contacts', label: 'Contacts', icon: '◎' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`mobile-tab ${isActive(tab.href) ? 'active' : ''}`}
        >
          <span className="mobile-tab-icon">{tab.icon}</span>
          <span className="mobile-tab-label">{tab.label}</span>
        </Link>
      ))}

      <style>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: white;
          border-top: 1px solid var(--border-light);
          display: flex;
          align-items: stretch;
          z-index: 300;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .mobile-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          text-decoration: none;
          color: var(--text-muted);
          transition: color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }

        .mobile-tab.active {
          color: var(--terracotta);
        }

        .mobile-tab-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .mobile-tab-label {
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .mobile-tab:active {
          opacity: 0.7;
        }
      `}</style>
    </nav>
  )
}
