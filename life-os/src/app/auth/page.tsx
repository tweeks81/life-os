import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignInButton from '@/components/SignInButton'

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const params = await searchParams
  const error = params?.error

  return (
    <main className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
        <div className="auth-bg-circle auth-bg-circle-3" />
      </div>

      <div className="auth-container animate-fade-up">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">◎</span>
          </div>
          <h1 className="auth-title">Life OS</h1>
          <p className="auth-subtitle">
            Your personal operating system.<br />
            <em>Everything in one place.</em>
          </p>
        </div>

        <div className="auth-card card">
          <div className="auth-card-inner">
            <p className="auth-card-label">Welcome back</p>
            <h2 className="auth-card-heading">Sign in to continue</h2>
            <p className="auth-card-desc">
              Life OS is a private, invite-only space. Sign in with your Google
              account to access your dashboard.
            </p>

            {error && (
              <div className="auth-error">
                {error === 'not_allowed'
                  ? "Your email isn't on the access list. Please contact the admin."
                  : error === 'auth_failed'
                  ? 'Authentication failed. Please try again.'
                  : 'Something went wrong. Please try again.'}
              </div>
            )}

            <SignInButton />
          </div>
        </div>

        <p className="auth-footer">
          Life OS is invite-only. Access is managed by the admin.
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: var(--cream);
          padding: 2rem;
        }

        .auth-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .auth-bg-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.35;
        }

        .auth-bg-circle-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #e8c9a0, transparent);
          top: -150px;
          right: -100px;
        }

        .auth-bg-circle-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #c4a882, transparent);
          bottom: -100px;
          left: -80px;
        }

        .auth-bg-circle-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #d4896a40, transparent);
          top: 40%;
          left: 30%;
        }

        .auth-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .auth-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .auth-logo {
          width: 56px;
          height: 56px;
          background: var(--deep-brown);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(61, 43, 31, 0.25);
        }

        .auth-logo-icon {
          font-size: 1.75rem;
          color: var(--cream);
          line-height: 1;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--deep-brown);
        }

        .auth-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.6;
          text-align: center;
        }

        .auth-subtitle em {
          font-style: italic;
          color: var(--warm-brown);
          font-family: var(--font-display);
        }

        .auth-card {
          width: 100%;
          overflow: hidden;
        }

        .auth-card-inner {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-card-label {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--terracotta);
        }

        .auth-card-heading {
          font-size: 1.375rem;
          font-weight: 600;
        }

        .auth-card-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-light);
        }

        .auth-error {
          background: #fef0ec;
          border: 1px solid #f5c8b8;
          color: #8b3a1f;
          border-radius: var(--radius-sm);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .auth-footer {
          font-size: 0.8125rem;
          color: var(--text-muted);
          text-align: center;
        }
      `}</style>
    </main>
  )
}
