'use client'

import { Project } from '@/types/tasks'

export default function TasksSidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onNewProject,
  onEditProject,
  totalActiveTasks,
}: {
  projects: Project[]
  selectedProjectId: string | null
  onSelectProject: (id: string | null) => void
  onNewProject: () => void
  onEditProject: (p: Project) => void
  totalActiveTasks: number
}) {
  const activeProjects = projects.filter(p => p.status === 'active')
  const otherProjects = projects.filter(p => p.status !== 'active')

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <button
          className={`sidebar-item sidebar-all ${selectedProjectId === null ? 'active' : ''}`}
          onClick={() => onSelectProject(null)}
        >
          <span className="sidebar-item-icon">📋</span>
          <span className="sidebar-item-label">All Tasks</span>
          <span className="sidebar-item-count">{totalActiveTasks}</span>
        </button>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-heading">
          <span>Projects</span>
          <button className="sidebar-add-btn" onClick={onNewProject} title="New project">+</button>
        </div>

        {activeProjects.length === 0 && (
          <p className="sidebar-empty">No projects yet</p>
        )}

        {activeProjects.map(project => (
          <ProjectItem
            key={project.id}
            project={project}
            selected={selectedProjectId === project.id}
            onSelect={() => onSelectProject(project.id)}
            onEdit={() => onEditProject(project)}
          />
        ))}
      </div>

      {otherProjects.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-heading">
            <span>Archived / On hold</span>
          </div>
          {otherProjects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              selected={selectedProjectId === project.id}
              onSelect={() => onSelectProject(project.id)}
              onEdit={() => onEditProject(project)}
              muted
            />
          ))}
        </div>
      )}

      <style>{`
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          background: white;
          border-right: 1px solid var(--border-light);
          overflow-y: auto;
          padding: 0.75rem 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin-bottom: 0.75rem;
        }

        .sidebar-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.25rem 0.5rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .sidebar-add-btn {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid var(--border);
          background: none;
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .sidebar-add-btn:hover {
          background: var(--cream-dark);
          color: var(--deep-brown);
          border-color: var(--warm-brown);
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.625rem;
          border-radius: 8px;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.15s;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-family: var(--font-body);
        }

        .sidebar-item:hover {
          background: var(--cream-dark);
          color: var(--deep-brown);
        }

        .sidebar-item.active {
          background: var(--cream-dark);
          color: var(--deep-brown);
          font-weight: 500;
        }

        .sidebar-item-icon {
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .sidebar-item-label {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sidebar-item-count {
          font-size: 0.75rem;
          background: var(--parchment);
          color: var(--warm-brown);
          padding: 0.1rem 0.4rem;
          border-radius: 100px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .sidebar-empty {
          font-size: 0.8125rem;
          color: var(--text-muted);
          padding: 0.375rem 0.625rem;
          font-style: italic;
        }
      `}</style>
    </aside>
  )
}

function ProjectItem({
  project,
  selected,
  onSelect,
  onEdit,
  muted,
}: {
  project: Project
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  muted?: boolean
}) {
  return (
    <div className={`proj-item ${selected ? 'active' : ''} ${muted ? 'muted' : ''}`}>
      <button className="proj-item-btn" onClick={onSelect}>
        <span
          className="proj-dot"
          style={{ background: project.colour ?? '#8b6b4a' }}
        />
        <span className="proj-name">{project.name}</span>
        {(project.open_task_count ?? 0) > 0 && (
          <span className="sidebar-item-count">{project.open_task_count}</span>
        )}
      </button>
      <button className="proj-edit-btn" onClick={onEdit} title="Edit project">
        ···
      </button>

      <style>{`
        .proj-item {
          display: flex;
          align-items: center;
          border-radius: 8px;
          transition: all 0.15s;
        }
        .proj-item:hover {
          background: var(--cream-dark);
        }
        .proj-item.active {
          background: var(--cream-dark);
        }
        .proj-item.muted .proj-name {
          opacity: 0.55;
        }
        .proj-item-btn {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.625rem;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-body);
          font-size: 0.875rem;
          color: var(--text-secondary);
          min-width: 0;
        }
        .proj-item.active .proj-item-btn {
          color: var(--deep-brown);
          font-weight: 500;
        }
        .proj-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .proj-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .proj-edit-btn {
          padding: 0.375rem 0.5rem;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 0.875rem;
          border-radius: 6px;
          opacity: 0;
          transition: all 0.15s;
          margin-right: 0.25rem;
          letter-spacing: 0.05em;
        }
        .proj-item:hover .proj-edit-btn {
          opacity: 1;
        }
        .proj-edit-btn:hover {
          background: var(--parchment);
          color: var(--deep-brown);
        }
        .sidebar-item-count {
          font-size: 0.75rem;
          background: var(--parchment);
          color: var(--warm-brown);
          padding: 0.1rem 0.4rem;
          border-radius: 100px;
          font-weight: 600;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
