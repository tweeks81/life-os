'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Profile = {
  id: string
  email: string
  full_name: string | null
  date_of_birth: string | null
  avatar_url: string | null
  updated_at: string
  created_at: string
} | null

export default function ProfileForm({
  profile,
  userId,
}: {
  profile: Profile
  userId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [dob, setDob] = useState(profile?.date_of_birth ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 3 MB.' })
      return
    }

    setUploading(true)
    setMessage(null)

    const ext = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' })
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        date_of_birth: dob || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' })
    } else {
      setMessage({ type: 'success', text: 'Profile saved!' })
      router.refresh()
    }
  }

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="profile-form card">
      {/* Avatar section */}
      <div className="avatar-section">
        <div className="avatar-wrapper">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              width={96}
              height={96}
              className="avatar-img"
              unoptimized
            />
          ) : (
            <div className="avatar-placeholder">
              <span>{initials}</span>
            </div>
          )}
          {uploading && (
            <div className="avatar-uploading">
              <span className="upload-spinner" />
            </div>
          )}
        </div>
        <div className="avatar-info">
          <p className="avatar-label">Profile photo</p>
          <p className="avatar-hint">JPG, PNG or WebP · Max 3 MB</p>
          <button
            className="btn-secondary avatar-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            type="button"
          >
            {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      <div className="form-divider" />

      {/* Fields */}
      <div className="form-fields">
        <div className="field-group">
          <label className="label" htmlFor="email">Email address</label>
          <input
            id="email"
            className="input-field"
            type="email"
            value={profile?.email ?? ''}
            disabled
            style={{ opacity: 0.65, cursor: 'not-allowed' }}
          />
          <p className="field-hint">Your email is tied to your Google account and can't be changed here.</p>
        </div>

        <div className="field-group">
          <label className="label" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            className="input-field"
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="label" htmlFor="dob">Date of birth</label>
          <input
            id="dob"
            className="input-field"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
      </div>

      {message && (
        <div className={`form-message form-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="form-footer">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <style>{`
        .profile-form {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .avatar-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-img {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border-light);
        }

        .avatar-placeholder {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: var(--parchment);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--warm-brown);
        }

        .avatar-uploading {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-spinner {
          width: 24px;
          height: 24px;
          border: 2.5px solid var(--border);
          border-top-color: var(--warm-brown);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .avatar-info {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .avatar-label {
          font-weight: 500;
          font-size: 0.9375rem;
          color: var(--text-primary);
        }

        .avatar-hint {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .avatar-upload-btn {
          margin-top: 0.25rem;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          width: fit-content;
        }

        .form-divider {
          height: 1px;
          background: var(--border-light);
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .field-hint {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin-top: 0.125rem;
        }

        .form-message {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }

        .form-message-success {
          background: #edf7ed;
          border: 1px solid #b8ddb8;
          color: #1e5c1e;
        }

        .form-message-error {
          background: #fef0ec;
          border: 1px solid #f5c8b8;
          color: #8b3a1f;
        }

        .form-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-light);
        }
      `}</style>
    </div>
  )
}
