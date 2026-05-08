'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const MORE_LINKS = [
  { href: '/contacts', label: 'Contacts', icon: '👥' },
  { href: '/properties', label: 'Properties', icon: '🏠' },
  { href: '/vehicles', label: 'Vehicles', icon: '🚗' },
  { href: '/trips', label: 'Trips', icon: '✈️' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close menu on navigation
  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const moreIsActive = MORE_LINKS.some(l => isActive(l.href))

  const tabs = [
    { href: '/dashboard', label: 'Home', icon: '⌂' },
    { href: '/tasks', label: 'Tasks', icon: '✓' },
    { href: '/calendar', label: 'Calendar', icon: '◫' },
  ]

  return (
    <>
      {/* More menu overlay */}
      {moreOpen && (
        <div className="more-overlay" onClick={() => setMoreOpen(false)}>
          <div className="more-menu" onClick={e => e.stopPropagation()}>
            <div className="more-menu-title">More</div>
            {MORE_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`more-menu-item ${isActive(link.href) ? 'active' : ''}`}
                onClick={() => setMoreOpen(false)}
              >
                <span className="more-menu-icon">{link.icon}</span>
                <span className="more-menu-label">{link.label}</span>
                {isActive(link.href) && <span className="more-menu-dot" />}
              </Link>
            ))}
          </div>
        </div>
      )}

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

        {/* More button */}
        <button
          className={`mobile-tab more-btn ${moreIsActive ? 'active' : ''}`}
          onClick={() => setMoreOpen(prev => !prev)}
        >
          <span className="mobile-tab-icon">⋯</span>
          <span className="mobile-tab-label">More</span>
        </button>
      </nav>

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
          border: none;
          background: none;
          font-family: var(--font-body);
          cursor: pointer;
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

        .more-btn {
          flex: 1;
        }

        /* More overlay */
        .more-overlay {
          position: fixed;
          inset: 0;
          background: rgba(44, 31, 20, 0.3);
          z-index: 299;
          animation: fadeIn 0.15s ease;
        }

        .more-menu {
          position: absolute;
          bottom: 68px;
          right: 0.75rem;
          width: 220px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(44, 31, 20, 0.18);
          border: 1px solid var(--border-light);
          overflow: hidden;
          animation: slideUpMenu 0.2s ease;
        }

        @keyframes slideUpMenu {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .more-menu-title {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0.75rem 1rem 0.375rem;
        }

        .more-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          text-decoration: none;
          color: var(--text-secondary);
          transition: background 0.12s;
          font-size: 0.9375rem;
          font-weight: 500;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }

        .more-menu-item:last-child {
          border-bottom: none;
        }

        .more-menu-item:hover,
        .more-menu-item:active {
          background: var(--cream-dark);
          color: var(--deep-brown);
        }

        .more-menu-item.active {
          color: var(--terracotta);
          background: #fef0ec;
        }

        .more-menu-icon {
          font-size: 1.125rem;
          width: 24px;
          text-align: center;
          flex-shrink: 0;
        }

        .more-menu-label {
          flex: 1;
        }

        .more-menu-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--terracotta);
          flex-shrink: 0;
        }
      `}</style>
    </>
  )
}
