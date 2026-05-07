'use client'

import { Vehicle, VEHICLE_TYPE_LABELS, VEHICLE_TYPE_ICONS } from '@/types/vehicles'

export default function VehiclesList({
  vehicles,
  userId,
  selectedId,
  taxedIds,
  insuredIds,
  shares,
  showSold,
  onSelect,
  onNew,
  onToggleShowSold,
}: {
  vehicles: Vehicle[]
  userId: string
  selectedId: string | null
  taxedIds: Set<string>
  insuredIds: Set<string>
  shares: Record<string, any[]>
  showSold: boolean
  onSelect: (v: Vehicle) => void
  onNew: () => void
  onToggleShowSold: () => void
}) {
  const soldVehicles = vehicles.filter(v => v.sold_date != null)
  const visibleVehicles = showSold ? vehicles : vehicles.filter(v => v.sold_date == null)

  return (
    <div className="veh-list">
      <div className="list-header">
        <h2 className="list-title">
          Vehicles <span className="list-count">{visibleVehicles.length}</span>
        </h2>
        <button className="btn-primary new-btn" onClick={onNew}>+ Add</button>
      </div>

      <div className="list-scroll">
        {visibleVehicles.length === 0 ? (
          <div className="list-empty">
            <p>No vehicles yet.</p>
            <p>Add your car to get started.</p>
          </div>
        ) : (
          visibleVehicles.map(v => {
            const sold = v.sold_date != null
            const isTaxed = taxedIds.has(v.id)
            const isInsured = insuredIds.has(v.id)
            const isShared = (shares[v.id] ?? []).length > 0
            const hasWarning = !sold && (!isTaxed || !isInsured)
            return (
              <button
                key={v.id}
                className={`veh-row ${selectedId === v.id ? 'selected' : ''} ${hasWarning ? 'untaxed' : ''} ${sold ? 'sold' : ''}`}
                onClick={() => onSelect(v)}
              >
                <div className="veh-icon">{VEHICLE_TYPE_ICONS[v.vehicle_type]}</div>
                <div className="veh-info">
                  <div className="veh-name-row">
                    <span className="veh-name">{v.name}</span>
                    {sold && <span className="sold-badge">Sold</span>}
                    {v.user_id !== userId && <span className="shared-badge">👥</span>}
                    {isShared && v.user_id === userId && <span className="shared-out-badge" title="Shared with others">👥</span>}
                  </div>
                  <span className="veh-sub">
                    {[v.make, v.model].filter(Boolean).join(' ') || VEHICLE_TYPE_LABELS[v.vehicle_type]}
                  </span>
                  {v.reg_number && <span className="veh-reg">{v.reg_number.toUpperCase()}</span>}
                  {!sold && !isTaxed && <span className="untaxed-badge">⚠ No valid tax</span>}
                  {!sold && !isInsured && <span className="untaxed-badge">⚠ No valid insurance</span>}
                </div>
              </button>
            )
          })
        )}
      </div>

      {soldVehicles.length > 0 && (
        <div className="sold-toggle-row">
          <button className="sold-toggle-btn" onClick={onToggleShowSold}>
            {showSold ? `Hide sold vehicles` : `Show ${soldVehicles.length} sold vehicle${soldVehicles.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      <div className="mobile-bottom-spacer" />

      <style>{`
        .veh-list { width: 260px; flex-shrink: 0; background: white; border-right: 1px solid var(--border-light); display: flex; flex-direction: column; overflow: hidden; }
        .list-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1rem 0.75rem; flex-shrink: 0; }
        .list-title { font-size: 1rem; font-weight: 600; font-family: var(--font-body); display: flex; align-items: center; gap: 0.4rem; }
        .list-count { font-size: 0.75rem; background: var(--parchment); color: var(--warm-brown); padding: 0.1rem 0.4rem; border-radius: 100px; font-weight: 600; }
        .new-btn { font-size: 0.8125rem; padding: 0.4rem 0.875rem; }
        .list-scroll { flex: 1; overflow-y: auto; padding: 0.5rem 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .list-empty { padding: 2rem 1rem; text-align: center; font-size: 0.875rem; color: var(--text-muted); font-style: italic; line-height: 1.8; }
        .veh-row { display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem; border: 1px solid var(--border-light); border-radius: 10px; background: none; cursor: pointer; text-align: left; font-family: var(--font-body); transition: all 0.15s; width: 100%; }
        .veh-row:hover { background: var(--cream-dark); border-color: var(--parchment); }
        .veh-row.selected { background: var(--cream-dark); border-color: var(--warm-brown); box-shadow: 0 0 0 2px rgba(139,107,74,0.12); }
        .veh-row.untaxed { border-color: #fecaca; background: #fff8f8; }
        .veh-row.untaxed:hover { background: #fef2f2; }
        .veh-row.untaxed.selected { border-color: #dc2626; box-shadow: 0 0 0 2px rgba(220,38,38,0.15); }
        .veh-row.sold { opacity: 0.65; }
        .veh-row.sold:hover { opacity: 0.85; }
        .veh-icon { font-size: 1.75rem; width: 44px; height: 44px; background: var(--cream-dark); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .veh-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
        .veh-name-row { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
        .veh-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .shared-badge { font-size: 0.75rem; }
        .veh-sub { font-size: 0.8rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .veh-reg { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; background: #1a1a2e; color: #f5c518; padding: 0.1rem 0.5rem; border-radius: 4px; display: inline-block; width: fit-content; font-family: monospace; }
        .shared-out-badge { font-size: 0.75rem; opacity: 0.6; }
        .untaxed-badge { font-size: 0.7rem; font-weight: 700; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; padding: 0.1rem 0.4rem; border-radius: 4px; display: inline-block; width: fit-content; }
        .sold-badge { font-size: 0.65rem; font-weight: 700; color: #6b7280; background: #f3f4f6; border: 1px solid #d1d5db; padding: 0.1rem 0.4rem; border-radius: 4px; display: inline-block; text-transform: uppercase; letter-spacing: 0.05em; }
        .sold-toggle-row { padding: 0.5rem 0.75rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
        .sold-toggle-btn { width: 100%; font-size: 0.8rem; color: var(--text-muted); background: none; border: 1px solid var(--border-light); border-radius: 8px; padding: 0.4rem 0.75rem; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .sold-toggle-btn:hover { background: var(--cream-dark); color: var(--text-secondary); border-color: var(--parchment); }
        .mobile-bottom-spacer { height: 64px; flex-shrink: 0; }
      `}</style>
    </div>
  )
}
