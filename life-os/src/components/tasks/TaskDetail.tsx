'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Task, TaskAction, Project,
  CATEGORY_LABELS, CONTEXT_LABELS, URGENCY_LABELS, EFFORT_LABELS,
  PRIORITY_LABELS, PRIORITY_COLOURS, PRIORITY_BG,
  ACTION_TYPE_LABELS, ActionType
} from '@/types/tasks'
import SharePanel, { ShareRecord } from './SharePanel'

export default function TaskDetail({
  task,
  actions,
  loadingActions,
  projects,
  userId,
  shares,
  onSharesChanged,
  onClose,
  onTaskSaved,
  onActionAdded,
  onDelete,
}: {
  task: Task
  actions: TaskAction[]
  loadingActions: boolean
  projects: Project[]
  userId: string
  shares: ShareRecord[]
  onSharesChanged: () => void
  onClose: () => void
  onTaskSaved: (t: Task) => void
  onActionAdded: (taskId: string) => void
  onDelete: () => void
}) {
  const supabase = createClient()
  const isOwner = task.user_id === userId
  const isShared = !isOwner
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [savingAction, setSavingAction] = useState(false)
  const [showActionForm, setShowActionForm] = useState(false)

  // Edit state
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [category, setCategory] = useState(task.category)
  const [context, setContext] = useState(task.context)
  const [urgency, setUrgency] = useState(task.urgency)
  const [effort, setEffort] = useState(task.effort)
  const [status, setStatus] = useState(task.status)
  const [projectId, setProjectId] = useState(task.project_id ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')

  // Compute preview priority
  const previewScore = (urgency * 3) + effort
  const previewPriority = previewScore <= 6 ? 1 : previewScore <= 9 ? 2 : previewScore <= 12 ? 3 : 4

  // Action form state
  const [actionType, setActionType] = useState<ActionType>('note')
  const [actionSummary, setActionSummary] = useState('')
  const [actionNotes, setActionNotes] = useState('')
  const [actionContact, setActionContact] = useState('')
  const [actionOrg, setActionOrg] = useState('')
  const [actionOutcome, setActionOutcome] = useState('')
  const [actionDate, setActionDate] = useState(() => new Date().toISOString().slice(0, 16))

  const handleSave = async () => {
    setSaving(true)
    const wasNotDone = task.status !== 'done'
    const nowDone = status === 'done'

    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        title,
        description: description || null,
        category,
        context,
        urgency,
        effort,
        status,
        project_id: projectId || null,
        due_date: dueDate || null,
        completed_at: nowDone && wasNotDone ? new Date().toISOString() : task.completed_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id)
      .select('*, project:projects(id, name, colour)')
      .single()

    if (!error && updated) {
      // If just marked done, insert resolved action
      if (wasNotDone && nowDone) {
        await supabase.from('task_actions').insert({
          task_id: task.id,
          user_id: userId,
          action_type: 'resolved',
          summary: 'Task marked as complete',
          actioned_at: new Date().toISOString(),
        })
      }
      onTaskSaved(updated as Task)
      setEditing(false)
    }
    setSaving(false)
  }

  const handleAddAction = async () => {
    if (!actionSummary.trim()) return
    setSavingAction(true)

    await supabase.from('task_actions').insert({
      task_id: task.id,
      user_id: userId,
      action_type: actionType,
      summary: actionSummary,
      notes: actionNotes || null,
      contact_name: actionContact || null,
      contact_organisation: actionOrg || null,
      outcome: actionOutcome || null,
      actioned_at: new Date(actionDate).toISOString(),
    })

    // Reset form
    setActionSummary('')
    setActionNotes('')
    setActionContact('')
    setActionOrg('')
    setActionOutcome('')
    setActionDate(new Date().toISOString().slice(0, 16))
    setShowActionForm(false)
    setSavingAction(false)
    onActionAdded(task.id)
  }

  return (
    <div className="detail-overlay">
      <div className="detail-panel">
        {/* Header */}
        <div className="detail-header">
          <div className="detail-header-left">
            <span
              className="detail-priority-badge"
              style={{ color: PRIORITY_COLOURS[task.priority], background: PRIORITY_BG[task.priority] }}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
            {isShared && (
              <span className="shared-badge">👥 Shared with you</span>
            )}
          </div>
          <div className="detail-header-right">
            {!editing && !confirmDelete && isOwner && (
              <button className="btn-secondary detail-btn" onClick={() => setEditing(true)}>Edit</button>
            )}
            {!editing && !confirmDelete && isOwner && (
              <button className="detail-delete-btn" onClick={() => setConfirmDelete(true)}>Delete</button>
            )}
            {confirmDelete && (
              <>
                <span className="delete-confirm-label">Delete this task?</span>
                <button className="btn-danger detail-btn" onClick={onDelete}>Yes, delete</button>
                <button className="btn-secondary detail-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </>
            )}
            <button className="detail-close mobile-only" onClick={onClose} style={{display:'none'}}>← Back</button>
            <button className="detail-close desktop-only" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="detail-scroll">
          {/* Task fields */}
          {editing ? (
            <div className="detail-edit">
              <div className="field-group">
                <label className="label">Title</label>
                <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="field-group">
                <label className="label">Description</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Full details, requirements, links…"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="edit-row">
                <div className="field-group">
                  <label className="label">Category</label>
                  <select className="input-field" value={category} onChange={e => setCategory(e.target.value as any)}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="label">Context</label>
                  <select className="input-field" value={context} onChange={e => setContext(e.target.value as any)}>
                    {Object.entries(CONTEXT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="edit-row">
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
                  style={{ color: PRIORITY_COLOURS[previewPriority], background: PRIORITY_BG[previewPriority] }}
                >
                  {PRIORITY_LABELS[previewPriority]}
                </div>
              </div>

              <div className="edit-row">
                <div className="field-group">
                  <label className="label">Status</label>
                  <select className="input-field" value={status} onChange={e => setStatus(e.target.value as any)}>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="label">Due date</label>
                  <input className="input-field" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="field-group">
                <label className="label">Project</label>
                <select className="input-field" value={projectId} onChange={e => setProjectId(e.target.value)}>
                  <option value="">No project</option>
                  {projects.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="edit-actions">
                <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="detail-view">
              <h2 className="detail-title">{task.title}</h2>

              {task.description && (
                <p className="detail-description">{task.description}</p>
              )}

              <div className="detail-meta-grid">
                <div className="meta-item">
                  <span className="meta-key">Category</span>
                  <span className="meta-val">{CATEGORY_LABELS[task.category]}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Context</span>
                  <span className="meta-val">{CONTEXT_LABELS[task.context]}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Urgency</span>
                  <span className="meta-val">{URGENCY_LABELS[task.urgency]}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Effort</span>
                  <span className="meta-val">{EFFORT_LABELS[task.effort]}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Status</span>
                  <span className="meta-val">{task.status.replace('_', ' ')}</span>
                </div>
                {task.due_date && (
                  <div className="meta-item">
                    <span className="meta-key">Due</span>
                    <span className="meta-val">{new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                {task.project && (
                  <div className="meta-item">
                    <span className="meta-key">Project</span>
                    <span className="meta-val">
                      <span className="proj-dot" style={{ background: (task.project as any).colour ?? '#8b6b4a' }} />
                      {(task.project as any).name}
                    </span>
                  </div>
                )}
                {task.completed_at && (
                  <div className="meta-item">
                    <span className="meta-key">Completed</span>
                    <span className="meta-val">{new Date(task.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {isOwner && (
                <SharePanel
                  entityId={task.id}
                  entityType="task"
                  ownerId={task.user_id}
                  userId={userId}
                  shares={shares}
                  onSharesChanged={onSharesChanged}
                />
              )}
            </div>
          )}

          {/* Action log */}
          <div className="action-log">
            <div className="action-log-header">
              <h3 className="action-log-title">Activity log</h3>
              {!showActionForm && (
                <button className="btn-secondary action-add-btn" onClick={() => setShowActionForm(true)}>
                  + Add action
                </button>
              )}
            </div>

            {/* Add action form */}
            {showActionForm && (
              <div className="action-form card">
                <div className="field-group">
                  <label className="label">Action type</label>
                  <select className="input-field" value={actionType} onChange={e => setActionType(e.target.value as ActionType)}>
                    {Object.entries(ACTION_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label className="label">Summary <span style={{color:'var(--terracotta)'}}>*</span></label>
                  <input
                    className="input-field"
                    placeholder="One-line description of what was done"
                    value={actionSummary}
                    onChange={e => setActionSummary(e.target.value)}
                  />
                </div>
                <div className="edit-row">
                  <div className="field-group">
                    <label className="label">Contact name</label>
                    <input className="input-field" value={actionContact} onChange={e => setActionContact(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="field-group">
                    <label className="label">Organisation</label>
                    <input className="input-field" value={actionOrg} onChange={e => setActionOrg(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="field-group">
                  <label className="label">Notes</label>
                  <textarea className="input-field" rows={3} value={actionNotes} onChange={e => setActionNotes(e.target.value)} placeholder="Full detail of what was discussed, agreed, decided…" style={{ resize: 'vertical' }} />
                </div>
                <div className="edit-row">
                  <div className="field-group">
                    <label className="label">Outcome</label>
                    <input className="input-field" value={actionOutcome} onChange={e => setActionOutcome(e.target.value)} placeholder='e.g. "Quote received"' />
                  </div>
                  <div className="field-group">
                    <label className="label">Date & time</label>
                    <input className="input-field" type="datetime-local" value={actionDate} onChange={e => setActionDate(e.target.value)} />
                  </div>
                </div>
                <div className="edit-actions">
                  <button className="btn-secondary" onClick={() => setShowActionForm(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleAddAction} disabled={savingAction || !actionSummary.trim()}>
                    {savingAction ? 'Saving…' : 'Add to log'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions list */}
            {loadingActions ? (
              <div className="actions-loading">Loading…</div>
            ) : actions.length === 0 ? (
              <p className="actions-empty">No actions logged yet.</p>
            ) : (
              <div className="actions-timeline">
                {actions.map(action => (
                  <ActionEntry key={action.id} action={action} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .detail-overlay {
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 440px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.25s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .detail-panel {
          flex: 1;
          background: white;
          border-left: 1px solid var(--border-light);
          box-shadow: -4px 0 24px var(--shadow-warm-md);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        .detail-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .detail-btn {
          font-size: 0.8125rem;
          padding: 0.375rem 0.875rem;
        }

        .detail-delete-btn {
          font-size: 0.8125rem;
          padding: 0.375rem 0.875rem;
          border-radius: 8px;
          border: 1px solid #fecaca;
          background: none;
          color: #dc2626;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s;
        }
        .detail-delete-btn:hover { background: #fef2f2; }

        .btn-danger {
          font-size: 0.8125rem;
          padding: 0.375rem 0.875rem;
          border-radius: 8px;
          border: none;
          background: #dc2626;
          color: white;
          cursor: pointer;
          font-family: var(--font-body);
          font-weight: 600;
          transition: background 0.15s;
        }
        .btn-danger:hover { background: #b91c1c; }

        .delete-confirm-label {
          font-size: 0.8125rem;
          color: #dc2626;
          font-weight: 500;
          white-space: nowrap;
        }

        .detail-close {
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

        .detail-close:hover {
          background: var(--cream-dark);
          color: var(--deep-brown);
        }

        .detail-priority-badge {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.25rem 0.625rem;
          border-radius: 6px;
        }

        .detail-header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .shared-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          background: #eff6ff;
          color: #2563eb;
        }

        .detail-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .detail-view {}

        .detail-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          line-height: 1.35;
        }

        .detail-description {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1rem;
          padding: 0.875rem;
          background: var(--cream);
          border-radius: 8px;
          border: 1px solid var(--border-light);
        }

        .detail-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.625rem;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding: 0.5rem 0.75rem;
          background: var(--cream);
          border-radius: 8px;
          border: 1px solid var(--border-light);
        }

        .meta-key {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .meta-val {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .proj-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .detail-edit {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .edit-row {
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

        .edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-light);
        }

        .action-log {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          border-top: 1px solid var(--border-light);
          padding-top: 1.25rem;
        }

        .action-log-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .action-log-title {
          font-size: 0.9375rem;
          font-weight: 600;
          font-family: var(--font-body);
        }

        .action-add-btn {
          font-size: 0.8125rem;
          padding: 0.375rem 0.75rem;
        }

        .action-form {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          background: var(--cream);
          border: 1px solid var(--border-light);
        }

        .actions-loading, .actions-empty {
          font-size: 0.875rem;
          color: var(--text-muted);
          padding: 1rem 0;
          font-style: italic;
        }

        .actions-timeline {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  )
}

function ActionEntry({ action }: { action: TaskAction }) {
  const label = ACTION_TYPE_LABELS[action.action_type] ?? action.action_type

  const formattedDate = new Date(action.actioned_at).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="action-entry">
      <div className="action-entry-header">
        <span className="action-type-label">{label}</span>
        <span className="action-date">{formattedDate}</span>
      </div>
      <p className="action-summary">{action.summary}</p>
      {(action.contact_name || action.contact_organisation) && (
        <p className="action-contact">
          {[action.contact_name, action.contact_organisation].filter(Boolean).join(' · ')}
        </p>
      )}
      {action.outcome && (
        <span className="action-outcome">{action.outcome}</span>
      )}
      {action.notes && (
        <p className="action-notes">{action.notes}</p>
      )}

      <style>{`
        .action-entry {
          padding: 0.75rem;
          background: var(--cream);
          border-radius: 8px;
          border: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .action-entry-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .action-type-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--warm-brown);
          background: var(--parchment);
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
        .action-date {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .action-summary {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .action-contact {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .action-outcome {
          font-size: 0.75rem;
          background: #eff6ff;
          color: #2563eb;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
          font-weight: 500;
        }
        .action-notes {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.5;
          border-top: 1px solid var(--border-light);
          padding-top: 0.3rem;
          margin-top: 0.15rem;
        }
      `}</style>
    </div>
  )
}
