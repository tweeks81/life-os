'use client'

import { useMemo } from 'react'
import { Task, Project, PRIORITY_LABELS, PRIORITY_COLOURS, PRIORITY_BG, CATEGORY_LABELS, CONTEXT_ICONS } from '@/types/tasks'

type FilterStatus = 'active' | 'completed' | 'all'

export default function TasksList({
  tasks,
  projects,
  userId,
  selectedProjectId,
  selectedTaskId,
  filterStatus,
  filterContext,
  filterPriority,
  stats,
  onSelectTask,
  onFilterStatus,
  onFilterContext,
  onFilterPriority,
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
  stats: { active: number; p1: number; projects: number; completed: number }
  onSelectTask: (t: Task) => void
  onFilterStatus: (s: FilterStatus) => void
  onFilterContext: (c: string) => void
  onFilterPriority: (p: string) => void
  onNewTask: () => void
}) {
  const filtered = useMemo(() => {
    let list = [...tasks]

    // Project filter
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

    return list
  }, [tasks, selectedProjectId, filterStatus, filterContext, filterPriority])

  // Group by project
  const grouped = useMemo(() => {
    const withProject = filtered.filter(t => t.project_id)
    const withoutProject = filtered.filter(t => !t.project_id)

    const projectGroups: Record<string, { project: Project; tasks: Task[] }> = {}
    for (const task of withProject) {
      if (!task.project_id) continue
      if (!projectGroups[task.project_id]) {
        const project = projects.find(p => p.id === task.project_id)
        if (project) projectGroups[task.project_id] = { project, tasks: [] }
      }
      if (projectGroups[task.project_id]) {
        projectGroups[task.project_id].tasks.push(task)
      }
    }

    return { projectGroups: Object.values(projectGroups), ungrouped: withoutProject }
  }, [filtered, projects])

  const hasFilters = filterContext || filterPriority

  return (
    <div className="tasks-list">
      {/* Stats bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{stats.active}</span>
          <span className="stat-label">Active tasks</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#dc2626' }}>{stats.p1}</span>
          <span className="stat-label">Urgent (P1)</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{stats.projects}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#16a085' }}>{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <button className="new-task-btn btn-primary" onClick={onNewTask}>
          + New Task
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
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
        <div className="filter-selects">
          <select
            className="filter-select"
            value={filterContext}
            onChange={e => onFilterContext(e.target.value)}
          >
            <option value="">All contexts</option>
            <option value="home">🏠 Home</option>
            <option value="calls">📞 Calls</option>
            <option value="shop">🛒 Shop</option>
            <option value="online">💻 Online</option>
            <option value="errand">🚗 Errand</option>
            <option value="anywhere">📍 Anywhere</option>
          </select>
          <select
            className="filter-select"
            value={filterPriority}
            onChange={e => onFilterPriority(e.target.value)}
          >
            <option value="">All priorities</option>
            <option value="1">P1 Urgent</option>
            <option value="2">P2 High</option>
            <option value="3">P3 Normal</option>
            <option value="4">P4 Low</option>
          </select>
          {hasFilters && (
            <button className="filter-clear" onClick={() => { onFilterContext(''); onFilterPriority('') }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Task groups */}
      <div className="tasks-scroll">
        {filtered.length === 0 ? (
          <div className="tasks-empty">
            <p className="tasks-empty-icon">✓</p>
            <p className="tasks-empty-title">No tasks here</p>
            <p className="tasks-empty-desc">
              {filterStatus === 'active' ? 'All caught up!' : 'No tasks match these filters.'}
            </p>
          </div>
        ) : (
          <>
            {/* Ungrouped tasks */}
            {grouped.ungrouped.length > 0 && (
              <div className="task-group">
                {grouped.projectGroups.length > 0 && (
                  <div className="group-header">
                    <span className="group-name">Individual Tasks</span>
                    <span className="group-count">{grouped.ungrouped.length}</span>
                  </div>
                )}
                {grouped.ungrouped.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userId={userId}
                    selected={task.id === selectedTaskId}
                    onClick={() => onSelectTask(task)}
                  />
                ))}
              </div>
            )}

            {/* Project groups */}
            {grouped.projectGroups.map(({ project, tasks: ptasks }) => (
              <div key={project.id} className="task-group">
                <div className="group-header">
                  <span
                    className="group-dot"
                    style={{ background: project.colour ?? '#8b6b4a' }}
                  />
                  <span className="group-name">{project.name}</span>
                  <span className="group-count">{ptasks.length}</span>
                </div>
                {ptasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userId={userId}
                    selected={task.id === selectedTaskId}
                    onClick={() => onSelectTask(task)}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      <style>{`
        .tasks-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .stats-bar {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0.75rem 1.25rem;
          background: white;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 1rem;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          font-family: var(--font-display);
          color: var(--deep-brown);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 500;
        }

        .stat-divider {
          width: 1px;
          height: 28px;
          background: var(--border-light);
        }

        .new-task-btn {
          margin-left: auto;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1.25rem;
          background: var(--cream-dark);
          border-bottom: 1px solid var(--border-light);
          gap: 1rem;
          flex-shrink: 0;
        }

        .filter-tabs {
          display: flex;
          gap: 2px;
          background: var(--parchment);
          border-radius: 8px;
          padding: 2px;
        }

        .filter-tab {
          padding: 0.3rem 0.75rem;
          border: none;
          background: none;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          font-family: var(--font-body);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }

        .filter-tab.active {
          background: white;
          color: var(--deep-brown);
          box-shadow: 0 1px 3px var(--shadow-warm);
        }

        .filter-selects {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-select {
          font-family: var(--font-body);
          font-size: 0.8125rem;
          color: var(--text-secondary);
          background: white;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0.3rem 0.6rem;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }

        .filter-select:focus {
          border-color: var(--warm-brown);
        }

        .filter-clear {
          font-size: 0.8rem;
          color: var(--terracotta);
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-body);
          padding: 0.25rem;
        }

        .tasks-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .task-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .group-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          margin-bottom: 0.125rem;
        }

        .group-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .group-name {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .group-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: var(--parchment);
          padding: 0.1rem 0.4rem;
          border-radius: 100px;
        }

        .tasks-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          gap: 0.5rem;
        }

        .tasks-empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .tasks-empty-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--deep-brown);
        }

        .tasks-empty-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}

function TaskCard({ task, userId, selected, onClick }: { task: Task; userId: string; selected: boolean; onClick: () => void }) {
  const isDone = task.status === 'done'
  const isShared = task.user_id !== userId

  return (
    <button className={`task-card ${selected ? 'selected' : ''} ${isDone ? 'done' : ''}`} onClick={onClick}>
      <div className="task-card-left">
        <div
          className="task-priority-bar"
          style={{ background: PRIORITY_COLOURS[task.priority] }}
        />
        <div className="task-card-body">
          <div className="task-card-top">
            <span className="task-title">{task.title}</span>
            {task.status === 'in_progress' && <span className="status-badge in-progress">In progress</span>}
            {task.status === 'blocked' && <span className="status-badge blocked">Blocked</span>}
            {isShared && <span className="status-badge shared">👥 Shared</span>}
          </div>
          <div className="task-card-meta">
            <span
              className="meta-badge priority-badge"
              style={{ color: PRIORITY_COLOURS[task.priority], background: PRIORITY_BG[task.priority] }}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
            <span className="meta-badge category-badge">{CATEGORY_LABELS[task.category]}</span>
            <span className="meta-badge">{CONTEXT_ICONS[task.context]}</span>
            {task.due_date && !isDone && (
              <span className={`meta-badge due-date ${isPastDue(task.due_date) ? 'overdue' : ''}`}>
                📅 {formatDate(task.due_date)}
              </span>
            )}
            {isDone && task.completed_at && (
              <span className="meta-badge completed-date">
                ✓ {formatDate(task.completed_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .task-card {
          display: flex;
          align-items: stretch;
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          width: 100%;
          overflow: hidden;
          font-family: var(--font-body);
        }
        .task-card:hover {
          border-color: var(--parchment);
          box-shadow: 0 2px 10px var(--shadow-warm);
          transform: translateY(-1px);
        }
        .task-card.selected {
          border-color: var(--warm-brown);
          box-shadow: 0 0 0 2px rgba(139,107,74,0.15);
        }
        .task-card.done {
          opacity: 0.65;
        }
        .task-card-left {
          display: flex;
          align-items: stretch;
          flex: 1;
          min-width: 0;
        }
        .task-priority-bar {
          width: 3px;
          flex-shrink: 0;
          border-radius: 10px 0 0 10px;
        }
        .task-card-body {
          flex: 1;
          padding: 0.625rem 0.875rem;
          min-width: 0;
        }
        .task-card-top {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.375rem;
        }
        .task-title {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .task-card.done .task-title {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        .task-card-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .meta-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          background: var(--cream-dark);
          color: var(--text-secondary);
          font-weight: 500;
          white-space: nowrap;
        }
        .priority-badge {
          font-weight: 600;
        }
        .category-badge {
          background: var(--parchment);
          color: var(--warm-brown);
        }
        .due-date.overdue {
          background: #fef2f2;
          color: #dc2626;
        }
        .completed-date {
          background: #f0fdf4;
          color: #16a34a;
        }
        .status-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.5rem;
          border-radius: 100px;
          font-weight: 600;
        }
        .status-badge.in-progress {
          background: #eff6ff;
          color: #2563eb;
        }
        .status-badge.blocked {
          background: #fef2f2;
          color: #dc2626;
        }
        .status-badge.shared {
          background: #eff6ff;
          color: #2563eb;
        }
      `}</style>
    </button>
  )
}

function isPastDue(dateStr: string) {
  return new Date(dateStr) < new Date()
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
