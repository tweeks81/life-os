'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Project, DEFAULT_PROJECT_COLOURS } from '@/types/tasks'

export default function ProjectForm({
  userId,
  project,
  onSaved,
  onClose,
}: {
  userId: string
  project: Project | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!project
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState(project?.status ?? 'active')
  const [colour, setColour] = useState(project?.colour ?? DEFAULT_PROJECT_COLOURS[0])
  const [targetDate, setTargetDate] = useState(project?.target_date ?? '')

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError('')

    if (isEdit) {
      const { error: err } = await supabase
        .from('projects')
        .update({
          name,
          description: description || null,
          status,
          colour,
          target_date: targetDate || null,
          completed_at: status === 'completed' && project.status !== 'completed'
            ? new Date().toISOString()
            : project.completed_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    } else {
      const { error: err } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name,
          description: description || null,
          status,
          colour,
          target_date: targetDate || null,
        })
      if (err) { setError('Failed to save.'); setSaving(false); return }
    }

    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit project' : 'New project'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <label className="label">Project name <span style={{color:'var(--terracotta)'}}>*</span></label>
            <input
              className="input-field"
              placeholder='e.g. "Kitchen renovation"'
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-group">
            <label className="label">Description</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Scope, goals, background…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="field-group">
            <label className="label">Colour</label>
            <div className="colour-picker">
              {DEFAULT_PROJECT_COLOURS.map(c => (
                <button
                  key={c}
                  className={`colour-swatch ${colour === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColour(c)}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="field-group">
              <label className="label">Status</label>
              <select className="input-field" value={status} onChange={e => setStatus(e.target.value as any)}>
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="field-group">
              <label className="label">Target date</label>
              <input className="input-field" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(44,31,20,0.35);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.15s ease;
        }
        .modal-box {
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.2s ease;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }
        .modal-title {
          font-size: 1.125rem;
          font-weight: 600;
        }
        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .modal-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .colour-picker {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .colour-swatch {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
        }
        .colour-swatch:hover {
          transform: scale(1.15);
        }
        .colour-swatch.selected {
          border-color: var(--deep-brown);
          transform: scale(1.15);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .form-error {
          font-size: 0.875rem;
          color: #dc2626;
          background: #fef2f2;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #fecaca;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-light);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
