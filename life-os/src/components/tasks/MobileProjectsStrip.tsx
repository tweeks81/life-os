'use client'

import { Project } from '@/types/tasks'

export default function MobileProjectsStrip({
  projects,
  selectedProjectId,
  onSelectProject,
}: {
  projects: Project[]
  selectedProjectId: string | null
  onSelectProject: (id: string | null) => void
}) {
  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <div className="mobile-projects-strip">
      <button
        className={`project-chip ${selectedProjectId === null ? 'active' : ''}`}
        onClick={() => onSelectProject(null)}
      >
        All
      </button>
      {activeProjects.map(p => (
        <button
          key={p.id}
          className={`project-chip ${selectedProjectId === p.id ? 'active' : ''}`}
          onClick={() => onSelectProject(p.id)}
          style={selectedProjectId === p.id ? {
            background: (p.colour ?? '#8b6b4a') + '22',
            borderColor: p.colour ?? '#8b6b4a',
            color: p.colour ?? '#8b6b4a',
          } : {}}
        >
          <span
            className="project-chip-dot"
            style={{ background: p.colour ?? '#8b6b4a' }}
          />
          {p.name}
        </button>
      ))}

      <style>{`
        .mobile-projects-strip {
          flex-shrink: 0;
          flex-direction: row;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          overflow-x: auto;
          background: white;
          border-bottom: 1px solid var(--border-light);
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .mobile-projects-strip::-webkit-scrollbar {
          display: none;
        }

        .project-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          border: 1.5px solid var(--border);
          background: none;
          font-family: var(--font-body);
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }

        .project-chip.active {
          background: var(--deep-brown);
          border-color: var(--deep-brown);
          color: var(--cream);
        }

        .project-chip-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
