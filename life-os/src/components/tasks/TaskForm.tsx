'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Project, CATEGORY_LABELS, CONTEXT_LABELS, URGENCY_LABELS, EFFORT_LABELS, PRIORITY_LABELS, PRIORITY_COLOURS, PRIORITY_BG } from '@/types/tasks'

export default function TaskForm({
  projects,
  userId,
  defaultProjectId,
  onSaved,
  onClose,
}: {
  projects: Project[]
  userId: string
  defaultProjectId: string | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('home')
  const [context, setContext] = useState('anywhere')
  const [urgency, setUrgency] = useState(3)
  const [effort, setEffort] = useState(2)
  const [projectId, setProjectId] = useState(defaultProjectId ?? '')
  const [dueDate, setDueDate] = useState('')

  const score = (urgency * 3) + effort
  const priority = score <= 6 ? 1 : score <= 9 ? 2 : score <= 12 ? 3 : 4

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from('tasks').insert({
      user_id: userId,
      title,
      description: description || null,
      category,
      context,
      urgency,
      effort,
      status: 'open',
      project_id: projectId || null,
      due_date: dueDate || null,
    })

    if (err) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    onSaved()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">New task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <label className="label">Title <span style={{color:'var(--terracotta)'}}>*</span></label>
            <input
              className="input-field"
              placeholder="Short task name"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-group">
            <label className="label">Description</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Full details, requirements, links…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-row">
            <div className="field-group">
              <label className="label">Category</label>
              <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="label">Context</label>
              <select className="input-field" value={context} onChange={e => setContext(e.target.value)}>
                {Object.entries(CONTEXT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field-group">
              <label className="label">Urgency</label>
              <select className="input-field" value={urgency} onChange={e => setUrgency(Number(e.target.value))}>
                {Object.entries(URGENCY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="label">Effort</label>
              <select className="input-field" value={effort} onChange={e => setEffort(Number(e.target.value))}>
                {Object.entries(EFFORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="label">Priority (calculated)</label>
            <div
              className="priority-preview"
              style={{ color: PRIORITY_COLOURS[priority], background: PRIORITY_BG[priority] }}
            >
              {PRIORITY_LABELS[priority]}
            </div>
          </div>

          <div className="form-row">
            <div className="field-group">
              <label className="label">Project</label>
              <select className="input-field" value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">No project</option>
                {projects.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="label">Due date</label>
              <input className="input-field" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Create task'}
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
          max-width: 560px;
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

        .modal-close:hover {
          background: var(--cream-dark);
          color: var(--deep-brown);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .priority-preview {
          padding: 0.5rem 0.875rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 700;
          display: inline-block;
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
