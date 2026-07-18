'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/app/supabaseClient'
import BrandLogo from '@/components/BrandLogo'

/**
 * Shared app chrome for library, dashboard, sprints, reflections, settings.
 * active: 'library' | 'dashboard' | 'sprints' | 'settings' | null
 */
export default function AppNav({ active = null }) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const current =
    active ||
    (pathname?.startsWith('/dashboard/sprints')
      ? 'sprints'
      : pathname?.startsWith('/dashboard/reflections')
        ? 'dashboard'
        : pathname?.startsWith('/dashboard')
          ? 'dashboard'
          : pathname?.startsWith('/settings')
            ? 'settings'
            : pathname?.startsWith('/library')
              ? 'library'
              : null)

  async function handleSignOut() {
    setMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
  }

  function go(href) {
    setMenuOpen(false)
    router.push(href)
  }

  const items = [
    { id: 'library', label: 'Library', href: '/library' },
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { id: 'sprints', label: 'My Sprints', href: '/dashboard/sprints' },
    { id: 'settings', label: 'Settings', href: '/settings' },
  ]

  return (
    <nav className="glass-nav">
      <div className="nav-content">
        <BrandLogo href="/library" />
        <div
          className="nav-actions"
          style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}
        >
          {items.map(({ id, label, href }) => (
            <button
              key={id}
              type="button"
              className="btn-outline small nav-btn-desktop"
              onClick={() => go(href)}
              aria-current={current === id ? 'page' : undefined}
              style={
                current === id
                  ? {
                      borderColor: 'rgba(23,184,224,0.45)',
                      color: 'var(--brand-teal)',
                    }
                  : undefined
              }
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="btn-outline small nav-btn-desktop"
            onClick={handleSignOut}
          >
            Sign out
          </button>
          <button
            type="button"
            className="nav-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
          {menuOpen && (
            <div className="nav-mobile-menu">
              {items.map(({ id, label, href }) => (
                <button key={id} type="button" onClick={() => go(href)}>
                  {label}
                  {current === id ? ' ·' : ''}
                </button>
              ))}
              <button type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
