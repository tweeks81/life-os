'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RawCalendarEvent, EVENT_TYPE_LABELS, EVENT_TYPE_COLOURS } from '@/lib/calendar'
import SharePanel, { ShareRecord } from '@/components/tasks/SharePanel'

const EVENT_TYPES = ['birthday', 'anniversary', 'remembrance', 'other'] as const

export default function CalendarEventForm({
  userId,
  event,
  initialShares,
  onSaved,
  onClose,
}: {
  userId: string
  event: RawCalendarEvent | null
  initialShares?: ShareRecord[]
  onSaved: (savedId?: string) => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!event
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedId, setSavedId] = useState<string | null>(event?.id ?? null)
  const [shares, setShares] = useState<ShareRecord[]>(initialShares ?? [])

  const [title, setTitle] = useState(event?.title ?? '')
  const [eventType, setEventType] = useState(event?.event_type ?? 'birthday')
  const [eventDate, setEventDate] = useState(event?.event_date ?? '')
  const [recurs, setRecurs] = useState(event?.recurs_annually ?? true)
  const [notes, setNotes] = useState(event?.notes ?? '')

  const refreshShares = useCallback(async (id: string) => {
    const { data } = await (supabase as any)
      .from('calendar_event_shares')
      .select('id, shared_with_email, created_at')
      .eq('event_id', id)
      .eq('owner_id', userId)
    setShares(data ?? [])
  }, [supabase, userId])

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!eventDate) { setError('Date is required.'); return }
    setSaving(true)
    setError('')

    const payload = {
      title: title.trim(),
      event_type: eventType,
      event_date: eventDate,
      recurs_annually: recurs,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (isEdit) {
      const { error: err } = await (supabase as any)
        .from('calendar_events')
        .update(payload)
        .eq('id', event.id)
      if (err) { setError('Failed to save.'); setSaving(false); return }
      setSavedId(event.id)
    } else {
      const { data, error: err } = await (supabase as any)
        .from('calendar_events')
        .insert({ ...payload, user_id: userId })
        .select()
        .single()
      if (err) { setError('Failed to save.'); setSaving(false); return }
      setSavedId(data.id)
    }

    setSaving(false)
  }

  const isSaved = !!savedId
  const currentEventId = savedId ?? event?.id ?? ''

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit event' : 'Add calendar event'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <label className="label">Event type</label>
            <div className="type-grid">
              {EVENT_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`type-chip ${eventType === t ? 'active' : ''}`}
                  style={eventType === t ? {
                    background: EVENT_TYPE_COLOURS[t] + '20',
                    borderColor: EVENT_TYPE_COLOURS[t],
                    color: EVENT_TYPE_COLOURS[t],
                  } : {}}
                  onClick={() => setEventType(t)}
                >
                  {EVENT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="label">Title <span className="req">*</span></label>
            <input
              className="input-field"
              placeholder={
                eventType === 'birthday' ? "e.g. Grandma's Birthday" :
                eventType === 'anniversary' ? 'e.g. Wedding Anniversary' :
                eventType === 'remembrance' ? 'e.g. Dad — Anniversary' :
                'e.g. School Sports Day'
              }
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-group">
            <label className="label">Date <span className="req">*</span></label>
            <input
              className="input-field"
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              style={{ maxWidth: '220px' }}
            />
            <p className="field-hint">
              {recurs ? 'The year is used to calculate how many years ago this was.' : 'One-time event on this specific date.'}
            </p>
          </div>

          <div className="field-group">
            <label className="recurs-label">
              <input
                type="checkbox"
                checked={recurs}
                onChange={e => setRecurs(e.target.checked)}
                className="recurs-checkbox"
              />
              Repeats every year
            </label>
          </div>

          <div className="field-group">
            <label className="label">Notes</label>
            <textarea
              className="input-field"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes…"
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          {/* Save button inline so user saves before seeing share */}
          {!isSaved && (
            <button className="btn-primary save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save event'}
            </button>
          )}

          {isSaved && !isEdit && (
            <div className="saved-notice">✓ Event saved</div>
          )}

          {/* Share panel — only shown after save */}
          {isSaved && currentEventId && (
            <div className="share-section">
              <SharePanel
                entityId={currentEventId}
                entityType="calendar_event"
                ownerId={userId}
                userId={userId}
                shares={shares}
                onSharesChanged={() => refreshShares(currentEventId)}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => onSaved(savedId ?? undefined)}>
            {isSaved ? 'Done' : 'Cancel'}
          </button>
          {isSaved && (
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 500px; max-height: 92vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1.125rem; font-weight: 600; }
        .modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .modal-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .modal-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
        .type-chip { padding: 0.5rem; border-radius: 8px; border: 1.5px solid var(--border); background: none; cursor: pointer; font-family: var(--font-body); font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); transition: all 0.15s; text-align: center; }
        .type-chip:hover { border-color: var(--warm-brown); color: var(--deep-brown); }
        .field-hint { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem; }
        .recurs-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); cursor: pointer; font-weight: 500; }
        .recurs-checkbox { width: 16px; height: 16px; cursor: pointer; accent-color: var(--deep-brown); }
        .req { color: var(--terracotta); }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #fecaca; }
        .save-btn { width: 100%; }
        .saved-notice { font-size: 0.875rem; color: #16a34a; font-weight: 500; text-align: center; padding: 0.25rem; }
        .share-section { border-top: 1px solid var(--border-light); padding-top: 0.75rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
