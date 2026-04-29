'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <button className="signout-btn" onClick={handleSignOut} type="button">
      Sign out
      <style>{`
        .signout-btn {
          font-family: var(--font-body);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.375rem 0;
          transition: color 0.15s;
        }
        .signout-btn:hover {
          color: var(--terracotta);
        }
      `}</style>
    </button>
  )
}
