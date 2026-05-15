'use client'

import { useState, useMemo } from 'react'
import { Task, Project, TaskCategory, PRIORITY_LABELS, PRIORITY_COLOURS, PRIORITY_BG, CATEGORY_LABELS, CONTEXT_ICONS } from '@/types/tasks'

type FilterStatus = 'active' | 'completed' | 'all'
type SortMode = 'priority' | 'due_date'
type SourceKey = 'individual' | 'project' | 'trip'

const SOURCE_LABELS: Record<SourceKey, string> = {
  individual: 'Individual',
  project: 'Projects',
  trip: 'Trips',
}
const SOURCE_ICONS: Record<SourceKey, string> = {
  individual: '✦',
  project: '◆',
  trip: '✈',
}

export default function TasksList({
  tasks,
  projects,
  userId,
  selectedProjectId,
  selectedTaskId,
  filterStatus,
  filterContext,
  filterPriority,
  filterCategory,
  stats,
  onSelectTask,
  onFilterStatus,
  onFilterContext,
  onFilterPriority,
  onFilterCategory,
  onNewTask,
}: {
  tasks: Task[]
  projects: Project[]
  userId: string
  selectedProjectId: string | null
  selectedTaskId: string | null
  filterStatus: FilterStatus
  filterContext: string
  filterPriority: string
  filterCategory: string
  stats: { active: number; p1: number; projects: number; completed: number }
  onSelectTask: (t: Task) => void
  onFilterStatus: (s: FilterStatus) => void
  onFilterContext: (c: string) => void
  onFilterPriority: (p: string) => void
  onFilterCategory: (c: string) => void
  onNewTask: () => void
}) {
  const [sort, setSort] = useState<SortMode>('priority')
  const [activeSources, setActiveSources] = useState<Set<SourceKey>>(new Set(['individual', 'project', 'trip']))

  const toggleSource = (key: SourceKey) => {
    setActiveSources(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        // Don't allow deselecting the last one
        if (next.size === 1) return prev
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const getTaskSource = (task: Task): SourceKey => {
    if (!task.project_id || !task.project) return 'individual'
    return (task.project as any).trip_id ? 'trip' : 'project'
  }

  const processed = useMemo(() => {
    let list = [...tasks]

    // Project sidebar filter
    if (selectedProjectId) {
      list = list.filter(t => t.project_id === selectedProjectId)
    }

    // Status filter
    if (filterStatus === 'active') list = list.filter(t => t.status !== 'done')
    else if (filterStatus === 'completed') list = list.filter(t => t.status === 'done')

    // Context filter
    if (filterContext) list = list.filter(t => t.context === filterContext)

    // Priority filter
    if (filterPriority) list = list.filter(t => t.priority === parseInt(filterPriority))

    // Category filter
    if (filterCategory) list = list.filter(t => t.category === filterCategory)

    // Source filter (only when not filtered to a specific project already)
    if (!selectedProjectId) {
      list = list.filter(t => activeSources.has(getTaskSource(t)))
    }

    // Sort
    if (sort === 'priority') {
      list.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
    } else {
      list.sort((a, b) => {
        if (!a.due_date && !b.due_date) return a.priority - b.priority
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        return diff !== 0 ? diff : a.priority - b.priority
      })
    }

    return list
  }, [tasks, selectedProjectId, filterStatus, filterContext, filterPriority, filterCategory, activeSources, sort])

  const hasFilters = filterContext || filterPriority || filterCategory

  return (
    <div className="tasks-list">
      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#dc2626' }}>{stats.p1}</span>
          <span className="stat-label">Urgent</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{stats.projects}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#16a085' }}>{stats.completed}</span>
          <span className="stat-label">Done</span>
        </div>
        <button className="new-task-btn btn-primary" onClick={onNewTask}>+ New Task</button>
      </div>

      {/* Filter / sort bar */}
      <div className="filter-bar">
        {/* Row 1: status + sort */}
        <div className="filter-row">
          <div className="filter-tabs">
            {(['active', 'completed', 'all'] as FilterStatus[]).map(s => (
              <button
                key={s}
                className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
                onClick={() => onFilterStatus(s)}
              >
                {s === 'active' ? 'Active' : s === 'completed' ? 'Completed' : 'All'}
              </button>
            ))}
          </div>

          <div className="sort-toggle">
            <span className="sort-label">Sort:</span>
            <button
              className={`sort-btn ${sort === 'priority' ? 'active' : ''}`}
              onClick={() => setSort('priority')}
            >
              Priority
            </button>
            <button
              className={`sort-btn ${sort === 'due_date' ? 'active' : ''}`}
              onClick={() => setSort('due_date')}
            >
              Due date
            </button>
          </div>
        </div>

        {/* Row 2: source toggles + existing filters */}
        <div className="filter-row">
          {/* Source toggles — hidden when a specific project is selected */}
          {!selectedProjectId && (
            <div className="source-toggles">
              {(['individual', 'project', 'trip'] as SourceKey[]).map(key => (
                <button
                  key={key}
                  className={`source-toggle ${activeSources.has(key) ? 'active' : ''}`}
                  onClick={() => toggleSource(key)}
                >
                  <span>{SOURCE_ICONS[key]}</span>
                  {SOURCE_LABELS[key]}
                </button>
              ))}
            </div>
          )}

          <div className="filter-selects">
            <select className="filter-select" value={filterCategory} onChange={e => onFilterCategory(e.target.value)}>
              <option value="">All categories</option>
              {(Object.entries(CATEGORY_LABELS) as [TaskCategory, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <select className="filter-select" value={filterContext} onChange={e => onFilterContext(e.target.value)}>
              <option value="">All contexts</option>
              <option value="home">🏠 Home</option>
              <option value="calls">📞 Calls</option>
              <option value="shop">🛒 Shop</option>
              <option value="online">💻 Online</option>
              <option value="errand">🚗 Errand</option>
              <option value="anywhere">📍 Anywhere</option>
            </select>
            <select className="filter-select" value={filterPriority} onChange={e => onFilterPriority(e.target.value)}>
              <option value="">All priorities</option>
              <option value="1">P1 Urgent</option>
              <option value="2">P2 High</option>
              <option value="3">P3 Normal</option>
              <option value="4">P4 Low</option>
            </select>
            {hasFilters && (
              <button className="filter-clear" onClick={() => { onFilterCategory(''); onFilterContext(''); onFilterPriority('') }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Flat task list */}
      <div className="tasks-scroll">
        {processed.length === 0 ? (
          <div className="tasks-empty">
            <p className="tasks-empty-icon">✓</p>
            <p className="tasks-empty-title">No tasks here</p>
            <p className="tasks-empty-desc">
              {filterStatus === 'active' ? 'All caught up!' : 'No tasks match these filters.'}
            </p>
          </div>
        ) : (
          <div className="task-flat-list">
            {processed.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                userId={userId}
                selected={task.id === selectedTaskId}
                source={getTaskSource(task)}
                onClick={() => onSelectTask(task)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .tasks-list { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

        /* Stats bar */
        .stats-bar { display: flex; align-items: center; padding: 0.625rem 1.25rem; background: white; border-bottom: 1px solid var(--border-light); flex-shrink: 0; gap: 0; }
        .stat-item { display: flex; flex-direction: column; align-items: center; padding: 0 0.875rem; }
        .stat-value { font-size: 1.25rem; font-weight: 700; font-family: var(--font-display); color: var(--deep-brown); line-height: 1.2; }
        .stat-label { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
        .stat-divider { width: 1px; height: 28px; background: var(--border-light); }
        .new-task-btn { margin-left: auto; font-size: 0.875rem; padding: 0.5rem 1rem; }

        /* Filter bar */
        .filter-bar { display: flex; flex-direction: column; gap: 0; background: var(--cream-dark); border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .filter-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.45rem 1.25rem; flex-wrap: wrap; }
        .filter-row + .filter-row { border-top: 1px solid var(--border-light); }

        /* Status tabs */
        .filter-tabs { display: flex; gap: 2px; background: var(--parchment); border-radius: 8px; padding: 2px; flex-shrink: 0; }
        .filter-tab { padding: 0.28rem 0.7rem; border: none; background: none; border-radius: 6px; font-size: 0.8rem; font-weight: 500; font-family: var(--font-body); color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
        .filter-tab.active { background: white; color: var(--deep-brown); box-shadow: 0 1px 3px var(--shadow-warm); }

        /* Sort toggle */
        .sort-toggle { display: flex; align-items: center; gap: 0.375rem; margin-left: auto; }
        .sort-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .sort-btn { padding: 0.28rem 0.65rem; border: 1px solid var(--border); border-radius: 6px; background: white; font-size: 0.8rem; font-weight: 500; font-family: var(--font-body); color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
        .sort-btn.active { background: var(--deep-brown); color: var(--cream); border-color: var(--deep-brown); }
        .sort-btn:not(.active):hover { border-color: var(--warm-brown); color: var(--deep-brown); }

        /* Source toggles */
        .source-toggles { display: flex; gap: 0.375rem; flex-shrink: 0; }
        .source-toggle { display: flex; align-items: center; gap: 0.3rem; padding: 0.28rem 0.65rem; border: 1.5px solid var(--border); border-radius: 100px; background: white; font-size: 0.78rem; font-weight: 500; font-family: var(--font-body); color: var(--text-muted); cursor: pointer; transition: all 0.15s; }
        .source-toggle.active { background: var(--cream); border-color: var(--warm-brown); color: var(--deep-brown); font-weight: 600; }
        .source-toggle:hover { border-color: var(--warm-brown); }

        /* Existing filter selects */
        .filter-selects { display: flex; align-items: center; gap: 0.4rem; margin-left: auto; flex-wrap: wrap; }
        .filter-select { font-family: var(--font-body); font-size: 0.78rem; color: var(--text-secondary); background: white; border: 1px solid var(--border); border-radius: 6px; padding: 0.28rem 0.5rem; cursor: pointer; outline: none; }
        .filter-select:focus { border-color: var(--warm-brown); }
        .filter-clear { font-size: 0.78rem; color: var(--terracotta); background: none; border: none; cursor: pointer; font-family: var(--font-body); padding: 0.25rem; white-space: nowrap; }

        /* Flat list */
        .tasks-scroll { flex: 1; overflow-y: auto; padding: 0.875rem 1.25rem; }
        .task-flat-list { display: flex; flex-direction: column; gap: 0.3rem; }
        .tasks-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; gap: 0.5rem; }
        .tasks-empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .tasks-empty-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; color: var(--deep-brown); }
        .tasks-empty-desc { font-size: 0.9rem; color: var(--text-muted); }
      `}</style>
    </div>
  )
}

function TaskRow({
  task, userId, selected, source, onClick,
}: {
  task: Task
  userId: string
  selected: boolean
  source: SourceKey
  onClick: () => void
}) {
  const isDone = task.status === 'done'
  const isShared = task.user_id !== userId
  const project = task.project as (Project & { trip_id?: string | null }) | null | undefined

  return (
    <button className={`task-row ${selected ? 'selected' : ''} ${isDone ? 'done' : ''}`} onClick={onClick}>
      {/* Priority colour bar */}
      <div className="task-row-bar" style={{ background: PRIORITY_COLOURS[task.priority] }} />

      <div className="task-row-body">
        <div className="task-row-main">
          <span className="task-row-title">{task.title}</span>
          <div className="task-row-badges">
            {/* Project / trip label */}
            {project && (
              <span
                className="task-source-label"
                style={
                  source === 'trip'
                    ? { background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }
                    : { background: project.colour ? `${project.colour}22` : 'var(--parchment)', color: project.colour ?? 'var(--warm-brown)', borderColor: project.colour ? `${project.colour}55` : 'var(--border)' }
                }
              >
                {source === 'trip' ? '✈' : '◆'} {project.name}
              </span>
            )}
            {task.status === 'in_progress' && <span className="task-status-badge in-progress">In progress</span>}
            {task.status === 'blocked' && <span className="task-status-badge blocked">Blocked</span>}
            {isShared && <span className="task-status-badge shared">👥 Shared</span>}
          </div>
        </div>
        <div className="task-row-meta">
          <span className="meta-pill priority-pill" style={{ color: PRIORITY_COLOURS[task.priority], background: PRIORITY_BG[task.priority] }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <span className="meta-pill">{CONTEXT_ICONS[task.context]}</span>
          {task.due_date && !isDone && (
            <span className={`meta-pill due-pill ${isPastDue(task.due_date) ? 'overdue' : ''}`}>
              📅 {formatDate(task.due_date)}
            </span>
          )}
          {isDone && task.completed_at && (
            <span className="meta-pill done-pill">✓ {formatDate(task.completed_at)}</span>
          )}
        </div>
      </div>

      <style>{`
        .task-row { display: flex; align-items: stretch; background: white; border: 1px solid var(--border-light); border-radius: 9px; cursor: pointer; text-align: left; transition: all 0.13s; width: 100%; overflow: hidden; font-family: var(--font-body); }
        .task-row:hover { border-color: var(--parchment); box-shadow: 0 2px 8px var(--shadow-warm); transform: translateY(-1px); }
        .task-row.selected { border-color: var(--warm-brown); box-shadow: 0 0 0 2px rgba(139,107,74,0.15); }
        .task-row.done { opacity: 0.6; }
        .task-row-bar { width: 3px; flex-shrink: 0; }
        .task-row-body { flex: 1; padding: 0.5rem 0.75rem; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .task-row-main { display: flex; align-items: center; gap: 0.5rem; min-width: 0; flex-wrap: wrap; }
        .task-row-title { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .task-row.done .task-row-title { text-decoration: line-through; color: var(--text-muted); }
        .task-row-badges { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; flex-shrink: 0; }
        .task-source-label { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 100px; border: 1px solid; white-space: nowrap; }
        .task-status-badge { font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 100px; font-weight: 600; white-space: nowrap; }
        .task-status-badge.in-progress { background: #eff6ff; color: #2563eb; }
        .task-status-badge.blocked { background: #fef2f2; color: #dc2626; }
        .task-status-badge.shared { background: #eff6ff; color: #2563eb; }
        .task-row-meta { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; }
        .meta-pill { font-size: 0.7rem; padding: 0.12rem 0.4rem; border-radius: 4px; background: var(--cream-dark); color: var(--text-secondary); font-weight: 500; white-space: nowrap; }
        .priority-pill { font-weight: 600; }
        .due-pill.overdue { background: #fef2f2; color: #dc2626; font-weight: 600; }
        .done-pill { background: #f0fdf4; color: #16a34a; }
      `}</style>
    </button>
  )
}

function isPastDue(dateStr: string) {
  return new Date(dateStr) < new Date()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
