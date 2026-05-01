'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ContactRequest, LinkedContact } from '@/types/linked-contacts'
import Avatar from '../Avatar'

export default function ConnectionsPanel({
  userId,
  initialLinked,
  initialSentRequests,
  initialReceivedRequests,
  onLinksChanged,
}: {
  userId: string
  initialLinked: LinkedContact[]
  initialSentRequests: ContactRequest[]
  initialReceivedRequests: ContactRequest[]
  onLinksChanged: () => void
}) {
  const supabase = createClient()
  const [linked, setLinked] = useState<LinkedContact[]>(initialLinked)
  const [sent, setSent] = useState<ContactRequest[]>(initialSentRequests)
  const [received, setReceived] = useState<ContactRequest[]>(initialReceivedRequests)
  const [searchEmail, setSearchEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendSuccess, setSendSuccess] = useState('')
  const [confirmUnlink, setConfirmUnlink] = useState<LinkedContact | null>(null)

  const refresh = async () => {
    const [{ data: linkedData }, { data: sentData }, { data: receivedData }] = await Promise.all([
      (supabase as any)
        .from('linked_contacts')
        .select('*, profile:profiles!linked_user_id(id, full_name, email, avatar_url, date_of_birth)')
        .eq('user_id', userId),
      (supabase as any)
        .from('contact_requests')
        .select('*, to_profile:profiles!to_user_id(full_name, email, avatar_url)')
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false }),
      (supabase as any)
        .from('contact_requests')
        .select('*, from_profile:profiles!from_user_id(full_name, email, avatar_url)')
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])
    if (linkedData) setLinked(linkedData)
    if (sentData) setSent(sentData)
    if (receivedData) setReceived(receivedData)
    onLinksChanged()
  }

  const handleSendRequest = async () => {
    const email = searchEmail.trim().toLowerCase()
    if (!email) return
    setSendError('')
    setSendSuccess('')
    setSearching(true)

    // Find the user by email
    const { data: targetProfile } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', email)
      .single()

    if (!targetProfile) {
      setSendError('No Life OS user found with that email address.')
      setSearching(false)
      return
    }

    if (targetProfile.id === userId) {
      setSendError("That's your own email address.")
      setSearching(false)
      return
    }

    // Check if already linked
    const alreadyLinked = linked.some(l => l.linked_user_id === targetProfile.id)
    if (alreadyLinked) {
      setSendError('You are already connected with this person.')
      setSearching(false)
      return
    }

    // Check if request already sent
    const alreadySent = sent.some(r => r.to_user_id === targetProfile.id && r.status === 'pending')
    if (alreadySent) {
      setSendError('You have already sent a request to this person.')
      setSearching(false)
      return
    }

    const { error } = await (supabase as any)
      .from('contact_requests')
      .insert({ from_user_id: userId, to_user_id: targetProfile.id })

    if (error) {
      setSendError('Failed to send request. Please try again.')
    } else {
      setSendSuccess(`Request sent to ${targetProfile.full_name ?? email}!`)
      setSearchEmail('')
      await refresh()
    }
    setSearching(false)
  }

  const handleAccept = async (request: ContactRequest) => {
    // Update request status
    await (supabase as any)
      .from('contact_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id)

    // Create two-way link
    await (supabase as any).from('linked_contacts').insert([
      { user_id: userId, linked_user_id: request.from_user_id, request_id: request.id },
      { user_id: request.from_user_id, linked_user_id: userId, request_id: request.id },
    ])

    await refresh()
  }

  const handleReject = async (request: ContactRequest) => {
    await (supabase as any)
      .from('contact_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id)
    await refresh()
  }

  const handleUnlink = async (link: LinkedContact) => {
    // Remove both directions
    await (supabase as any)
      .from('linked_contacts')
      .delete()
      .or(`and(user_id.eq.${userId},linked_user_id.eq.${link.linked_user_id}),and(user_id.eq.${link.linked_user_id},linked_user_id.eq.${userId})`)

    // Also clean up the request record
    await (supabase as any)
      .from('contact_requests')
      .delete()
      .or(`and(from_user_id.eq.${userId},to_user_id.eq.${link.linked_user_id}),and(from_user_id.eq.${link.linked_user_id},to_user_id.eq.${userId})`)

    setConfirmUnlink(null)
    await refresh()
  }

  const pendingReceived = received.filter(r => r.status === 'pending')
  const rejectedSent = sent.filter(r => r.status === 'rejected')

  return (
    <div className="connections-panel card">
      <div className="panel-header">
        <h2 className="panel-title">Connections</h2>
        <p className="panel-desc">Link your Life OS account with family & friends.</p>
      </div>

      {/* Send request */}
      <div className="panel-section">
        <div className="section-label">Add a connection</div>
        <div className="send-row">
          <input
            className="input-field"
            type="email"
            placeholder="Enter their Life OS email address"
            value={searchEmail}
            onChange={e => { setSearchEmail(e.target.value); setSendError(''); setSendSuccess('') }}
            onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
          />
          <button
            className="btn-primary send-btn"
            onClick={handleSendRequest}
            disabled={searching || !searchEmail.trim()}
          >
            {searching ? '…' : 'Send request'}
          </button>
        </div>
        {sendError && <p className="feedback-error">{sendError}</p>}
        {sendSuccess && <p className="feedback-success">{sendSuccess}</p>}
      </div>

      {/* Incoming requests */}
      {pendingReceived.length > 0 && (
        <div className="panel-section">
          <div className="section-label">Pending requests ({pendingReceived.length})</div>
          {pendingReceived.map(req => (
            <div key={req.id} className="request-row">
              <Avatar
                url={req.from_profile?.avatar_url}
                name={req.from_profile?.full_name}
                size={36}
              />
              <div className="request-info">
                <span className="request-name">{req.from_profile?.full_name ?? req.from_profile?.email}</span>
                <span className="request-email">{req.from_profile?.email}</span>
              </div>
              <div className="request-actions">
                <button className="btn-primary accept-btn" onClick={() => handleAccept(req)}>Accept</button>
                <button className="btn-secondary reject-btn" onClick={() => handleReject(req)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Linked contacts */}
      <div className="panel-section">
        <div className="section-label">
          Connected ({linked.length})
        </div>
        {linked.length === 0 ? (
          <p className="empty-msg">No connections yet. Send a request above.</p>
        ) : (
          linked.map(link => (
            <div key={link.id} className="linked-row">
              <Avatar
                url={link.profile?.avatar_url}
                name={link.profile?.full_name}
                size={36}
              />
              <div className="linked-info">
                <span className="linked-name">{link.profile?.full_name ?? link.profile?.email}</span>
                <span className="linked-email">{link.profile?.email}</span>
              </div>
              <button
                className="unlink-btn"
                onClick={() => setConfirmUnlink(link)}
                title="Remove connection"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Sent requests */}
      {sent.filter(r => r.status === 'pending').length > 0 && (
        <div className="panel-section">
          <div className="section-label">Sent requests</div>
          {sent.filter(r => r.status === 'pending').map(req => (
            <div key={req.id} className="sent-row">
              <div className="sent-info">
                <span className="sent-name">{req.to_profile?.full_name ?? req.to_profile?.email}</span>
                <span className="sent-email">{req.to_profile?.email}</span>
              </div>
              <span className="status-pill pending">Awaiting response</span>
            </div>
          ))}
        </div>
      )}

      {/* Rejected requests */}
      {rejectedSent.length > 0 && (
        <div className="panel-section">
          <div className="section-label">Declined requests</div>
          {rejectedSent.map(req => (
            <div key={req.id} className="sent-row">
              <div className="sent-info">
                <span className="sent-name">{req.to_profile?.full_name ?? req.to_profile?.email}</span>
                <span className="sent-email">{req.to_profile?.email}</span>
              </div>
              <span className="status-pill rejected">Declined</span>
            </div>
          ))}
        </div>
      )}

      {/* Unlink confirmation modal */}
      {confirmUnlink && (
        <div className="confirm-backdrop" onClick={() => setConfirmUnlink(null)}>
          <div className="confirm-box card" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-title">Remove connection?</h3>
            <p className="confirm-msg">
              This will remove your connection with <strong>{confirmUnlink.profile?.full_name ?? confirmUnlink.profile?.email}</strong>.
              They will no longer appear as a linked contact, and you will no longer appear in their connections.
            </p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmUnlink(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleUnlink(confirmUnlink)}>Remove connection</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .connections-panel {
          padding: 1.75rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .panel-header {
          margin-bottom: 1.25rem;
        }
        .panel-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .panel-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .panel-section {
          padding: 1rem 0;
          border-top: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .section-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.125rem;
        }
        .send-row {
          display: flex;
          gap: 0.5rem;
        }
        .send-btn {
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .feedback-error {
          font-size: 0.8125rem;
          color: #dc2626;
        }
        .feedback-success {
          font-size: 0.8125rem;
          color: #16a34a;
        }
        .request-row, .linked-row, .sent-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          background: var(--cream);
          border-radius: 10px;
          border: 1px solid var(--border-light);
        }
        .request-info, .linked-info, .sent-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .request-name, .linked-name, .sent-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .request-email, .linked-email, .sent-email {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .request-actions {
          display: flex;
          gap: 0.375rem;
          flex-shrink: 0;
        }
        .accept-btn {
          font-size: 0.8125rem;
          padding: 0.35rem 0.75rem;
        }
        .reject-btn {
          font-size: 0.8125rem;
          padding: 0.35rem 0.75rem;
        }
        .unlink-btn {
          font-size: 0.8rem;
          color: var(--text-muted);
          background: none;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.3rem 0.625rem;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .unlink-btn:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }
        .status-pill {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 100px;
          flex-shrink: 0;
        }
        .status-pill.pending {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .status-pill.rejected {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .empty-msg {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-style: italic;
        }
        /* Confirm modal */
        .confirm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(44,31,20,0.35);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .confirm-box {
          max-width: 400px;
          width: 100%;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .confirm-title {
          font-size: 1rem;
          font-weight: 600;
        }
        .confirm-msg {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-light);
        }
        .btn-danger {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.625rem 1.25rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-danger:hover { background: #b91c1c; }
      `}</style>
    </div>
  )
}
