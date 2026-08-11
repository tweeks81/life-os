'use client'

import { useState } from 'react'
import { Trip } from '@/types/trips'

export default function TripsList({
  trips,
  selectedTripId,
  userId,
  onSelectTrip,
  onNewTrip,
  onToggleComplete,
}: {
  trips: Trip[]
  selectedTripId: string | null
  userId: string
  onSelectTrip: (t: Trip) => void
  onNewTrip: () => void
  onToggleComplete: (trip: Trip) => void
}) {
  const [showCompleted, setShowCompleted] = useState(false)

  const visible = trips.filter(t => !!t.completed === showCompleted)

  return (
    <aside className="trips-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Trips</span>
        <button className="sidebar-add-btn" onClick={onNewTrip} title="New trip">+</button>
      </div>

      <div className="sidebar-toggle">
        <button
          className={`toggle-btn ${!showCompleted ? 'active' : ''}`}
          onClick={() => setShowCompleted(false)}
        >
          Active
        </button>
        <button
          className={`toggle-btn ${showCompleted ? 'active' : ''}`}
          onClick={() => setShowCompleted(true)}
        >
          Completed
        </button>
      </div>

      <div className="sidebar-list">
        {visible.length === 0 && (
          <div className="sidebar-empty">
            {showCompleted
              ? <p>No completed trips yet.</p>
              : <><p>No trips yet.</p><p>Click + to plan your first trip.</p></>
            }
          </div>
        )}
        {visible.map(trip => (
          <div key={trip.id} className="trip-row">
            <button
              className={`trip-item ${selectedTripId === trip.id ? 'trip-item-active' : ''} ${trip.completed ? 'trip-item-completed' : ''}`}
              onClick={() => onSelectTrip(trip)}
            >
              <span className="trip-item-icon">✈</span>
              <div className="trip-item-body">
                <div className="trip-item-name-row">
                  <span className="trip-item-name">{trip.name}</span>
                  {trip.user_id !== userId && <span className="trip-shared-tag">Shared</span>}
                </div>
                {trip.description && (
                  <span className="trip-item-desc">{trip.description}</span>
                )}
              </div>
            </button>
            {trip.user_id === userId && (
              <button
                className={`trip-complete-btn ${trip.completed ? 'is-complete' : ''}`}
                title={trip.completed ? 'Mark as active' : 'Mark as complete'}
                onClick={e => { e.stopPropagation(); onToggleComplete(trip) }}
              >
                {trip.completed ? '↺' : '✓'}
              </button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .trips-sidebar {
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-light);
          background: white;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1rem 0.75rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }
        .sidebar-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .sidebar-add-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: none;
          cursor: pointer;
          font-size: 1.1rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          line-height: 1;
        }
        .sidebar-add-btn:hover { background: var(--cream-dark); color: var(--deep-brown); border-color: var(--border); }
        .sidebar-toggle {
          display: flex;
          padding: 0.5rem 0.625rem 0.375rem;
          gap: 0.25rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
        }
        .toggle-btn {
          flex: 1;
          padding: 0.25rem 0;
          font-size: 0.72rem;
          font-weight: 600;
          border-radius: 5px;
          border: 1px solid var(--border);
          background: none;
          color: var(--text-muted);
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.13s;
        }
        .toggle-btn.active { background: var(--deep-brown); color: var(--cream); border-color: var(--deep-brown); }
        .toggle-btn:not(.active):hover { background: var(--cream-dark); color: var(--deep-brown); }
        .sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem 0.5rem;
        }
        .sidebar-empty {
          padding: 2rem 0.75rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8125rem;
          line-height: 1.6;
        }
        .trip-row {
          display: flex;
          align-items: center;
          gap: 0;
          border-radius: 8px;
          transition: background 0.12s;
        }
        .trip-row:hover { background: var(--cream-dark); }
        .trip-row:hover .trip-complete-btn { opacity: 1; }
        .trip-item {
          flex: 1;
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.625rem 0.5rem 0.625rem 0.75rem;
          border-radius: 8px;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
          font-family: var(--font-body);
          min-width: 0;
        }
        .trip-item:hover { background: none; }
        .trip-item-active { background: var(--cream-dark) !important; }
        .trip-item-active + .trip-complete-btn { opacity: 1; }
        .trip-item-completed .trip-item-name { text-decoration: line-through; color: var(--text-muted); }
        .trip-item-completed .trip-item-icon { opacity: 0.4; }
        .trip-item-icon {
          font-size: 0.875rem;
          margin-top: 1px;
          flex-shrink: 0;
          color: var(--text-muted);
        }
        .trip-item-body {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }
        .trip-item-name-row { display: flex; align-items: center; gap: 0.375rem; min-width: 0; overflow: hidden; }
        .trip-item-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--deep-brown);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }
        .trip-item-active .trip-item-name { color: var(--terracotta); }
        .trip-shared-tag { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--terracotta); background: #fef0ec; border-radius: 3px; padding: 0.0625rem 0.3rem; flex-shrink: 0; }
        .trip-item-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .trip-complete-btn {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.8rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.13s;
          margin-right: 0.25rem;
          font-family: var(--font-body);
        }
        .trip-complete-btn:hover { background: #f0fdf4; color: #16a34a; }
        .trip-complete-btn.is-complete { opacity: 1; color: #16a34a; }
        .trip-complete-btn.is-complete:hover { background: #fff7ed; color: #ea580c; }
      `}</style>
    </aside>
  )
}
