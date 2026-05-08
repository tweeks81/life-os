'use client'

import { Trip } from '@/types/trips'

export default function TripsList({
  trips,
  selectedTripId,
  userId,
  onSelectTrip,
  onNewTrip,
}: {
  trips: Trip[]
  selectedTripId: string | null
  userId: string
  onSelectTrip: (t: Trip) => void
  onNewTrip: () => void
}) {
  return (
    <aside className="trips-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Trips</span>
        <button className="sidebar-add-btn" onClick={onNewTrip} title="New trip">+</button>
      </div>

      <div className="sidebar-list">
        {trips.length === 0 && (
          <div className="sidebar-empty">
            <p>No trips yet.</p>
            <p>Click + to plan your first trip.</p>
          </div>
        )}
        {trips.map(trip => (
          <button
            key={trip.id}
            className={`trip-item ${selectedTripId === trip.id ? 'trip-item-active' : ''}`}
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
        .sidebar-add-btn:hover {
          background: var(--cream-dark);
          color: var(--deep-brown);
          border-color: var(--border);
        }
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
        .trip-item {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.625rem 0.75rem;
          border-radius: 8px;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.12s;
          font-family: var(--font-body);
        }
        .trip-item:hover { background: var(--cream-dark); }
        .trip-item-active { background: var(--cream-dark); }
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
      `}</style>
    </aside>
  )
}
