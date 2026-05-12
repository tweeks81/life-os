'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TripTask } from '@/types/trips'

const PRIORITY_COLOUR: Record<number, string> = {
  1: '#dc2626', 2: '#ea580c', 3: '#2563eb', 4: '#6b7280',
}
const PRIORITY_LABEL: Record<number, string> = {
  1: 'Urgent', 2: 'High', 3: 'Normal', 4: 'Low',
}

function formatDueDate(d: string): { label: string; overdue: boolean } {
  const due = new Date(d); due.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { label: 'Due today', overdue: false }
  if (diff === 1) return { label: 'Due tomorrow', overdue: false }
  return { label: due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), overdue: false }
}

export default function TripTasksSection({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: {
  tasks: TripTask[]
  onAddTask: (title: string, urgency: number, dueDate: string | null) => Promise<string | null>
  onToggleTask: (id: string, status: string) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [urgency, setUrgency] = useState(3)
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!title.trim()) return
    setSaving(true)
    setSaveError(null)
    const err = await onAddTask(title.trim(), urgency, dueDate || null)
    setSaving(false)
    if (err) {
      setSaveError(err)
    } else {
      setTitle(''); setUrgency(3); setDueDate(''); setShowForm(false)
    }
  }

  const open = tasks.filter(t => t.status !== 'done')
  const done = tasks.filter(t => t.status === 'done')

  return (
    <div className="tts-wrap">
      <div className="tts-header">
        <div className="tts-title-row">
          <span className="tts-title">To Do</span>
          {tasks.length > 0 && (
            <span className="tts-count">{open.length}/{tasks.length}</span>
          )}
        </div>
        {!showForm && (
          <button className="tts-add-btn" onClick={() => setShowForm(true)}>+ Add task</button>
        )}
      </div>

      {showForm && (
        <div className="tts-form">
          <input
            className="tts-input"
            placeholder="Task title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            autoFocus
          />
          <div className="tts-form-row">
            <div className="tts-priority-group">
              {([1, 2, 3, 4] as const).map(p => (
                <button
                  key={p}
                  className={`tts-priority-btn ${urgency === p ? 'tts-priority-active' : ''}`}
                  style={urgency === p ? { background: PRIORITY_COLOUR[p], borderColor: PRIORITY_COLOUR[p], color: 'white' } : { borderColor: PRIORITY_COLOUR[p], color: PRIORITY_COLOUR[p] }}
                  onClick={() => setUrgency(p)}
                >
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
            <input
              type="date"
              className="tts-date-input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          {saveError && <p className="tts-save-error">⚠ {saveError}</p>}
          <div className="tts-form-actions">
            <button className="tts-save-btn" onClick={handleAdd} disabled={!title.trim() || saving}>
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button className="tts-cancel-btn" onClick={() => { setShowForm(false); setTitle(''); setUrgency(3); setDueDate(''); setSaveError(null) }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showForm && (
        <p className="tts-empty">No tasks yet. Click &quot;Add task&quot; to add a reminder.</p>
      )}

      {open.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          confirmDelete={confirmDelete}
          onToggle={() => onToggleTask(task.id, task.status)}
          onDelete={() => onDeleteTask(task.id)}
          onConfirmDelete={() => setConfirmDelete(task.id)}
          onCancelDelete={() => setConfirmDelete(null)}
        />
      ))}

      {done.length > 0 && (
        <div className="tts-done-section">
          <div className="tts-done-label">Completed</div>
          {done.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              confirmDelete={confirmDelete}
              onToggle={() => onToggleTask(task.id, task.status)}
              onDelete={() => onDeleteTask(task.id)}
              onConfirmDelete={() => setConfirmDelete(task.id)}
              onCancelDelete={() => setConfirmDelete(null)}
            />
          ))}
        </div>
      )}

      <style>{`
        .tts-wrap { background: white; border: 1px solid var(--border-light); border-radius: 10px; padding: 0.875rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .tts-header { display: flex; align-items: center; justify-content: space-between; }
        .tts-title-row { display: flex; align-items: center; gap: 0.5rem; }
        .tts-title { font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }
        .tts-count { font-size: 0.6875rem; font-weight: 600; background: var(--cream-dark); color: var(--text-muted); border-radius: 10px; padding: 0.0625rem 0.4rem; }
        .tts-add-btn { font-size: 0.8125rem; font-weight: 500; color: var(--terracotta); background: none; border: none; cursor: pointer; font-family: var(--font-body); padding: 0; transition: color 0.15s; }
        .tts-add-btn:hover { color: var(--deep-brown); }
        .tts-empty { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; padding: 0.25rem 0; }
        .tts-form { display: flex; flex-direction: column; gap: 0.5rem; background: var(--cream); border-radius: 8px; padding: 0.75rem; }
        .tts-input { width: 100%; padding: 0.4375rem 0.625rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.875rem; font-family: var(--font-body); background: white; color: var(--text-primary); box-sizing: border-box; }
        .tts-input:focus { outline: none; border-color: var(--terracotta); }
        .tts-form-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .tts-priority-group { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .tts-priority-btn { font-size: 0.6875rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 12px; border: 1.5px solid; background: white; cursor: pointer; font-family: var(--font-body); transition: all 0.12s; }
        .tts-date-input { font-size: 0.8125rem; font-family: var(--font-body); border: 1px solid var(--border); border-radius: 6px; padding: 0.3rem 0.5rem; background: white; color: var(--text-secondary); }
        .tts-date-input:focus { outline: none; border-color: var(--terracotta); }
        .tts-form-actions { display: flex; gap: 0.5rem; }
        .tts-save-btn { padding: 0.375rem 0.875rem; border-radius: 6px; border: none; background: var(--terracotta); color: white; font-size: 0.8125rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .tts-save-btn:disabled { opacity: 0.5; cursor: default; }
        .tts-save-btn:not(:disabled):hover { background: var(--deep-brown); }
        .tts-cancel-btn { padding: 0.375rem 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: white; font-size: 0.8125rem; font-weight: 500; color: var(--text-muted); cursor: pointer; font-family: var(--font-body); }
        .tts-cancel-btn:hover { background: var(--cream-dark); }
        .tts-save-error { font-size: 0.8125rem; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 0.375rem 0.625rem; margin: 0; }
        .tts-task-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.4375rem 0.25rem; border-radius: 6px; transition: background 0.12s; }
        .tts-task-row:hover { background: var(--cream); }
        .tts-task-row:hover .tts-task-del { opacity: 1; }
        .tts-checkbox { width: 17px; height: 17px; border-radius: 50%; border: 2px solid var(--border); background: white; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; font-size: 0.625rem; color: white; }
        .tts-checkbox-done { background: #22c55e; border-color: #22c55e; }
        .tts-checkbox:hover:not(.tts-checkbox-done) { border-color: #22c55e; }
        .tts-task-body { flex: 1; min-width: 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .tts-task-title { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
        .tts-task-title-done { text-decoration: line-through; color: var(--text-muted); }
        .tts-task-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .tts-task-due { font-size: 0.6875rem; font-weight: 600; }
        .tts-task-due-ok { color: var(--text-muted); }
        .tts-task-due-overdue { color: #dc2626; }
        .tts-task-del { font-size: 0.75rem; color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 0.125rem 0.25rem; border-radius: 4px; opacity: 0; transition: all 0.12s; font-family: var(--font-body); }
        .tts-task-del:hover { background: #fef2f2; color: #dc2626; }
        .tts-del-confirm { font-size: 0.75rem; font-weight: 600; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; padding: 0.15rem 0.4rem; cursor: pointer; font-family: var(--font-body); }
        .tts-del-cancel { font-size: 0.75rem; color: var(--text-muted); background: white; border: 1px solid var(--border); border-radius: 4px; padding: 0.15rem 0.4rem; cursor: pointer; font-family: var(--font-body); }
        .tts-done-section { display: flex; flex-direction: column; gap: 0.25rem; border-top: 1px solid var(--border-light); padding-top: 0.5rem; margin-top: 0.25rem; }
        .tts-done-label { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .tts-tasks-link { font-size: 0.75rem; color: var(--text-muted); text-decoration: none; padding: 0.125rem 0; display: inline-block; }
        .tts-tasks-link:hover { color: var(--terracotta); }
      `}</style>
    </div>
  )
}

function TaskRow({
  task,
  confirmDelete,
  onToggle,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  task: TripTask
  confirmDelete: string | null
  onToggle: () => void
  onDelete: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}) {
  const isDone = task.status === 'done'
  const colour = PRIORITY_COLOUR[task.priority] ?? '#6b7280'
  const due = task.due_date ? formatDueDate(task.due_date) : null
  const isConfirming = confirmDelete === task.id

  return (
    <div className="tts-task-row">
      <button
        className={`tts-checkbox ${isDone ? 'tts-checkbox-done' : ''}`}
        onClick={onToggle}
        title={isDone ? 'Mark open' : 'Mark done'}
      >
        {isDone && '✓'}
      </button>
      <div className="tts-task-body">
        <div className={`tts-task-dot`} style={{ background: colour }} />
        <span className={`tts-task-title ${isDone ? 'tts-task-title-done' : ''}`}>{task.title}</span>
        {due && !isDone && (
          <span className={`tts-task-due ${due.overdue ? 'tts-task-due-overdue' : 'tts-task-due-ok'}`}>
            {due.overdue ? '⚠ ' : ''}{due.label}
          </span>
        )}
      </div>
      {isConfirming ? (
        <>
          <button className="tts-del-confirm" onClick={onDelete}>Delete</button>
          <button className="tts-del-cancel" onClick={onCancelDelete}>Cancel</button>
        </>
      ) : (
        <button className="tts-task-del" onClick={onConfirmDelete} title="Delete task">✕</button>
      )}
    </div>
  )
}
