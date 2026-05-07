'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Vehicle, VehicleMot, VehicleService, VehicleMaintenance, VehiclePolicy, VehicleTax,
  VEHICLE_TYPE_LABELS, VEHICLE_TYPE_ICONS,
  SERVICE_TYPE_LABELS, POLICY_TYPE_LABELS, COVERAGE_TYPE_LABELS, TAX_DURATION_LABELS,
  isExpired, isExpiringSoon
} from '@/types/vehicles'
import SharePanel, { ShareRecord } from '@/components/tasks/SharePanel'
import MotForm from './MotForm'
import ServiceForm from './ServiceForm'
import MaintenanceForm from './MaintenanceForm'
import PolicyForm from './PolicyForm'
import TaxForm from './TaxForm'

type Tab = 'info' | 'mot' | 'service' | 'maintenance' | 'policies' | 'tax'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'info', label: 'Info', icon: '🚗' },
  { id: 'mot', label: 'MOT', icon: '✅' },
  { id: 'service', label: 'Service', icon: '🔧' },
  { id: 'maintenance', label: 'Maintenance', icon: '🛠' },
  { id: 'policies', label: 'Policies', icon: '🛡' },
  { id: 'tax', label: 'Tax', icon: '📋' },
]

export default function VehicleDetail({
  vehicle, userId, shares, onSharesChanged, onEdit, onDelete, onClose,
}: {
  vehicle: Vehicle
  userId: string
  shares: ShareRecord[]
  onSharesChanged: () => void
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isOwner = vehicle.user_id === userId
  const [tab, setTab] = useState<Tab>('info')
  const [mots, setMots] = useState<VehicleMot[]>([])
  const [services, setServices] = useState<VehicleService[]>([])
  const [maintenance, setMaintenance] = useState<VehicleMaintenance[]>([])
  const [policies, setPolicies] = useState<VehiclePolicy[]>([])
  const [taxRecords, setTaxRecords] = useState<VehicleTax[]>([])
  const [showMotForm, setShowMotForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [showPolicyForm, setShowPolicyForm] = useState(false)
  const [showTaxForm, setShowTaxForm] = useState(false)
  const [editingMot, setEditingMot] = useState<VehicleMot | null>(null)
  const [editingService, setEditingService] = useState<VehicleService | null>(null)
  const [editingMaintenance, setEditingMaintenance] = useState<VehicleMaintenance | null>(null)
  const [editingPolicy, setEditingPolicy] = useState<VehiclePolicy | null>(null)
  const [editingTax, setEditingTax] = useState<VehicleTax | null>(null)

  const loadTab = useCallback(async (t: Tab) => {
    if (t === 'mot') {
      const { data } = await (supabase as any).from('vehicle_mots').select('*').eq('vehicle_id', vehicle.id).order('test_date', { ascending: false })
      setMots(data ?? [])
    } else if (t === 'service') {
      const { data } = await (supabase as any).from('vehicle_services').select('*').eq('vehicle_id', vehicle.id).order('service_date', { ascending: false })
      setServices(data ?? [])
    } else if (t === 'maintenance') {
      const { data } = await (supabase as any).from('vehicle_maintenance').select('*').eq('vehicle_id', vehicle.id).order('work_date', { ascending: false })
      setMaintenance(data ?? [])
    } else if (t === 'policies') {
      const { data } = await (supabase as any).from('vehicle_policies').select('*').eq('vehicle_id', vehicle.id).order('end_date', { ascending: false })
      setPolicies(data ?? [])
    } else if (t === 'tax') {
      const { data } = await (supabase as any).from('vehicle_tax').select('*').eq('vehicle_id', vehicle.id).order('expiry_date', { ascending: false })
      setTaxRecords(data ?? [])
    }
  }, [supabase, vehicle.id])

  useEffect(() => {
    loadTab(tab)
  }, [tab, loadTab])

  const handleDelete = () => {
    if (confirm(`Delete "${vehicle.name}"? All MOTs, services, and records will also be deleted.`)) onDelete()
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const fmtCost = (n: number | null) => n != null ? `£${n.toFixed(2)}` : null

  // Next MOT expiry
  const nextMot = mots.length > 0 ? mots[0] : null
  const nextPolicy = policies.find(p => p.policy_type === 'insurance' && !isExpired(p.end_date))
  const currentTax = taxRecords.find(t => !isExpired(t.expiry_date))
  const taxExpired = taxRecords.length > 0 && !currentTax

  return (
    <div className="veh-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <span className="detail-icon">{VEHICLE_TYPE_ICONS[vehicle.vehicle_type]}</span>
          <div className="detail-title-block">
            <h2 className="detail-title">{vehicle.name}</h2>
            <div className="detail-meta">
              {vehicle.reg_number && <span className="reg-plate">{vehicle.reg_number.toUpperCase()}</span>}
              {vehicle.user_id !== userId && <span className="shared-badge">👥 Shared</span>}
            </div>
          </div>
        </div>
        <div className="detail-header-right">
          {isOwner && <button className="btn-secondary detail-btn" onClick={onEdit}>Edit</button>}
          {isOwner && <button className="detail-delete-btn" onClick={handleDelete}>🗑</button>}
          <button className="detail-close mobile-only" onClick={onClose} style={{ display: 'none', width: 'auto', padding: '0 0.75rem', fontSize: '0.875rem', borderRadius: '8px', color: 'var(--terracotta)', borderColor: 'transparent', background: 'none' }}>← Back</button>
          <button className="detail-close desktop-only" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="detail-scroll">
        {/* INFO TAB */}
        {tab === 'info' && (
          <div className="tab-content">
            <div className="info-grid">
              <InfoField label="Type" value={VEHICLE_TYPE_LABELS[vehicle.vehicle_type]} />
              {vehicle.make && <InfoField label="Make" value={vehicle.make} />}
              {vehicle.model && <InfoField label="Model" value={vehicle.model} />}
              {vehicle.year && <InfoField label="Year" value={vehicle.year.toString()} />}
              {vehicle.colour && <InfoField label="Colour" value={vehicle.colour} />}
              {vehicle.reg_number && <InfoField label="Registration" value={vehicle.reg_number.toUpperCase()} mono />}
            </div>

            {/* Quick status */}
            <div className="status-cards">
              {nextMot && (
                <div className={`status-card ${isExpired(nextMot.expiry_date) ? 'expired' : isExpiringSoon(nextMot.expiry_date) ? 'warning' : 'ok'}`}>
                  <span className="status-card-icon">✅</span>
                  <div>
                    <div className="status-card-label">MOT</div>
                    <div className="status-card-value">
                      {isExpired(nextMot.expiry_date) ? 'EXPIRED' : `Expires ${fmt(nextMot.expiry_date)}`}
                    </div>
                  </div>
                </div>
              )}
              {(currentTax || taxExpired) && (
                <div className={`status-card ${taxExpired ? 'expired' : isExpiringSoon(currentTax!.expiry_date, 30) ? 'warning' : 'ok'}`}>
                  <span className="status-card-icon">📋</span>
                  <div>
                    <div className="status-card-label">Tax</div>
                    <div className="status-card-value">
                      {taxExpired ? 'NO VALID TAX' : `Expires ${fmt(currentTax!.expiry_date)}`}
                    </div>
                  </div>
                </div>
              )}
              {nextPolicy && (
                <div className={`status-card ${isExpiringSoon(nextPolicy.end_date, 30) ? 'warning' : 'ok'}`}>
                  <span className="status-card-icon">🛡</span>
                  <div>
                    <div className="status-card-label">Insurance</div>
                    <div className="status-card-value">Expires {fmt(nextPolicy.end_date)}</div>
                  </div>
                </div>
              )}
            </div>

            {vehicle.notes && (
              <div className="notes-block">
                <div className="notes-label">Notes</div>
                <p className="notes-text">{vehicle.notes}</p>
              </div>
            )}

            {isOwner && (
              <SharePanel
                entityId={vehicle.id}
                entityType="vehicle"
                ownerId={vehicle.user_id}
                userId={userId}
                shares={shares}
                onSharesChanged={onSharesChanged}
              />
            )}
          </div>
        )}

        {/* MOT TAB */}
        {tab === 'mot' && (
          <div className="tab-content">
            {isOwner && (
              <button className="add-record-btn" onClick={() => { setEditingMot(null); setShowMotForm(true) }}>
                + Add MOT
              </button>
            )}
            {mots.length === 0 ? (
              <EmptyTab label="No MOT records yet." />
            ) : (
              mots.map(mot => (
                <div key={mot.id} className={`record-card ${isExpired(mot.expiry_date) ? 'record-expired' : isExpiringSoon(mot.expiry_date) ? 'record-warning' : ''}`}>
                  <div className="record-header">
                    <div className="record-title-row">
                      <span className={`record-status-dot ${mot.passed ? 'pass' : 'fail'}`} />
                      <span className="record-title">{mot.passed ? 'Pass' : 'Fail'} — {fmt(mot.test_date)}</span>
                    </div>
                    {isOwner && (
                      <div className="record-actions">
                        <button className="record-edit-btn" onClick={() => { setEditingMot(mot); setShowMotForm(true) }}>Edit</button>
                        <button className="record-delete-btn" onClick={async () => { if (confirm('Delete this MOT record?')) { await (supabase as any).from('vehicle_mots').delete().eq('id', mot.id); loadTab('mot') } }}>🗑</button>
                      </div>
                    )}
                  </div>
                  <div className="record-fields">
                    <RecordField label="Expires" value={fmt(mot.expiry_date)} highlight={isExpired(mot.expiry_date) ? 'expired' : isExpiringSoon(mot.expiry_date) ? 'warning' : undefined} />
                    {mot.garage_name && <RecordField label="Garage" value={mot.garage_name} />}
                    {mot.cost != null && <RecordField label="Cost" value={fmtCost(mot.cost)!} />}
                    {mot.mileage != null && <RecordField label="Mileage" value={`${mot.mileage.toLocaleString()} mi`} />}
                  </div>
                  {mot.notes && <p className="record-notes">{mot.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* SERVICE TAB */}
        {tab === 'service' && (
          <div className="tab-content">
            {isOwner && (
              <button className="add-record-btn" onClick={() => { setEditingService(null); setShowServiceForm(true) }}>
                + Add service
              </button>
            )}
            {services.length === 0 ? (
              <EmptyTab label="No service records yet." />
            ) : (
              services.map(svc => (
                <div key={svc.id} className="record-card">
                  <div className="record-header">
                    <span className="record-title">{svc.service_type ? SERVICE_TYPE_LABELS[svc.service_type] : 'Service'} — {fmt(svc.service_date)}</span>
                    {isOwner && (
                      <div className="record-actions">
                        <button className="record-edit-btn" onClick={() => { setEditingService(svc); setShowServiceForm(true) }}>Edit</button>
                        <button className="record-delete-btn" onClick={async () => { if (confirm('Delete this service record?')) { await (supabase as any).from('vehicle_services').delete().eq('id', svc.id); loadTab('service') } }}>🗑</button>
                      </div>
                    )}
                  </div>
                  <div className="record-fields">
                    {svc.garage_name && <RecordField label="Garage" value={svc.garage_name} />}
                    {svc.cost != null && <RecordField label="Cost" value={fmtCost(svc.cost)!} />}
                    {svc.mileage != null && <RecordField label="Mileage" value={`${svc.mileage.toLocaleString()} mi`} />}
                  </div>
                  {svc.notes && <p className="record-notes">{svc.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* MAINTENANCE TAB */}
        {tab === 'maintenance' && (
          <div className="tab-content">
            {isOwner && (
              <button className="add-record-btn" onClick={() => { setEditingMaintenance(null); setShowMaintenanceForm(true) }}>
                + Add maintenance
              </button>
            )}
            {maintenance.length === 0 ? (
              <EmptyTab label="No maintenance records yet." />
            ) : (
              maintenance.map(m => (
                <div key={m.id} className="record-card">
                  <div className="record-header">
                    <span className="record-title">{m.description} — {fmt(m.work_date)}</span>
                    {isOwner && (
                      <div className="record-actions">
                        <button className="record-edit-btn" onClick={() => { setEditingMaintenance(m); setShowMaintenanceForm(true) }}>Edit</button>
                        <button className="record-delete-btn" onClick={async () => { if (confirm('Delete this record?')) { await (supabase as any).from('vehicle_maintenance').delete().eq('id', m.id); loadTab('maintenance') } }}>🗑</button>
                      </div>
                    )}
                  </div>
                  <div className="record-fields">
                    {m.garage_name && <RecordField label="Garage" value={m.garage_name} />}
                    {m.cost != null && <RecordField label="Cost" value={fmtCost(m.cost)!} />}
                    {m.mileage != null && <RecordField label="Mileage" value={`${m.mileage.toLocaleString()} mi`} />}
                  </div>
                  {m.notes && <p className="record-notes">{m.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAX TAB */}
        {tab === 'tax' && (
          <div className="tab-content">
            {isOwner && (
              <button className="add-record-btn" onClick={() => { setEditingTax(null); setShowTaxForm(true) }}>
                + Add tax
              </button>
            )}
            {taxExpired && (
              <div className="tax-warning">
                ⚠ No valid tax found for this vehicle. Please add a current tax record.
              </div>
            )}
            {taxRecords.length === 0 ? (
              <EmptyTab label="No tax records yet." />
            ) : (
              taxRecords.map(t => (
                <div key={t.id} className={`record-card ${isExpired(t.expiry_date) ? 'record-expired' : isExpiringSoon(t.expiry_date) ? 'record-warning' : ''}`}>
                  <div className="record-header">
                    <span className="record-title">{TAX_DURATION_LABELS[t.duration]} — from {fmt(t.start_date)}</span>
                    {isOwner && (
                      <div className="record-actions">
                        <button className="record-edit-btn" onClick={() => { setEditingTax(t); setShowTaxForm(true) }}>Edit</button>
                        <button className="record-delete-btn" onClick={async () => { if (confirm('Delete this tax record?')) { await (supabase as any).from('vehicle_tax').delete().eq('id', t.id); loadTab('tax') } }}>🗑</button>
                      </div>
                    )}
                  </div>
                  <div className="record-fields">
                    <RecordField label="Expires" value={fmt(t.expiry_date)} highlight={isExpired(t.expiry_date) ? 'expired' : isExpiringSoon(t.expiry_date) ? 'warning' : undefined} />
                    {t.cost != null && <RecordField label="Cost" value={fmtCost(t.cost)!} />}
                  </div>
                  {t.notes && <p className="record-notes">{t.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* POLICIES TAB */}
        {tab === 'policies' && (
          <div className="tab-content">
            {isOwner && (
              <button className="add-record-btn" onClick={() => { setEditingPolicy(null); setShowPolicyForm(true) }}>
                + Add policy
              </button>
            )}
            {policies.length === 0 ? (
              <EmptyTab label="No policies yet." />
            ) : (
              policies.map(pol => (
                <div key={pol.id} className={`record-card ${isExpired(pol.end_date) ? 'record-expired' : isExpiringSoon(pol.end_date) ? 'record-warning' : ''}`}>
                  <div className="record-header">
                    <div>
                      <span className="record-title">{POLICY_TYPE_LABELS[pol.policy_type]}</span>
                      {pol.insurer && <span className="record-subtitle"> — {pol.insurer}</span>}
                    </div>
                    {isOwner && (
                      <div className="record-actions">
                        <button className="record-edit-btn" onClick={() => { setEditingPolicy(pol); setShowPolicyForm(true) }}>Edit</button>
                        <button className="record-delete-btn" onClick={async () => { if (confirm('Delete this policy?')) { await (supabase as any).from('vehicle_policies').delete().eq('id', pol.id); loadTab('policies') } }}>🗑</button>
                      </div>
                    )}
                  </div>
                  <div className="record-fields">
                    {pol.coverage_type && <RecordField label="Coverage" value={COVERAGE_TYPE_LABELS[pol.coverage_type]} />}
                    {pol.policy_number && <RecordField label="Policy no." value={pol.policy_number} />}
                    <RecordField label="Start" value={fmt(pol.start_date)} />
                    <RecordField label="End" value={fmt(pol.end_date)} highlight={isExpired(pol.end_date) ? 'expired' : isExpiringSoon(pol.end_date) ? 'warning' : undefined} />
                    {pol.cost != null && <RecordField label="Cost" value={fmtCost(pol.cost)!} />}
                    {pol.auto_renews && <RecordField label="Auto-renews" value="Yes" />}
                  </div>
                  {pol.notes && <p className="record-notes">{pol.notes}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sub-forms */}
      {showMotForm && <MotForm vehicleId={vehicle.id} userId={userId} mot={editingMot} onSaved={() => { loadTab('mot'); setShowMotForm(false); setEditingMot(null) }} onClose={() => { setShowMotForm(false); setEditingMot(null) }} />}
      {showServiceForm && <ServiceForm vehicleId={vehicle.id} userId={userId} service={editingService} onSaved={() => { loadTab('service'); setShowServiceForm(false); setEditingService(null) }} onClose={() => { setShowServiceForm(false); setEditingService(null) }} />}
      {showMaintenanceForm && <MaintenanceForm vehicleId={vehicle.id} userId={userId} maintenance={editingMaintenance} onSaved={() => { loadTab('maintenance'); setShowMaintenanceForm(false); setEditingMaintenance(null) }} onClose={() => { setShowMaintenanceForm(false); setEditingMaintenance(null) }} />}
      {showPolicyForm && <PolicyForm vehicleId={vehicle.id} userId={userId} policy={editingPolicy} onSaved={() => { loadTab('policies'); setShowPolicyForm(false); setEditingPolicy(null) }} onClose={() => { setShowPolicyForm(false); setEditingPolicy(null) }} />}
      {showTaxForm && <TaxForm vehicleId={vehicle.id} userId={userId} tax={editingTax} onSaved={() => { loadTab('tax'); setShowTaxForm(false); setEditingTax(null) }} onClose={() => { setShowTaxForm(false); setEditingTax(null) }} />}

      <style>{`
        .veh-detail { flex: 1; background: white; border-left: 1px solid var(--border-light); box-shadow: -4px 0 24px var(--shadow-warm-md); display: flex; flex-direction: column; overflow: hidden; animation: slideIn 0.22s ease; max-width: 560px; }
        @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .detail-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; gap: 0.75rem; }
        .detail-header-left { display: flex; align-items: center; gap: 0.875rem; flex: 1; min-width: 0; }
        .detail-icon { font-size: 1.75rem; width: 48px; height: 48px; background: var(--cream-dark); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .detail-title-block { min-width: 0; }
        .detail-title { font-size: 1.125rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 0.2rem; }
        .detail-meta { display: flex; align-items: center; gap: 0.5rem; }
        .reg-plate { font-size: 0.8rem; font-weight: 700; letter-spacing: 0.05em; background: #1a1a2e; color: #f5c518; padding: 0.15rem 0.6rem; border-radius: 4px; font-family: monospace; }
        .shared-badge { font-size: 0.72rem; font-weight: 600; background: #eff6ff; color: #2563eb; padding: 0.15rem 0.4rem; border-radius: 4px; }
        .detail-header-right { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
        .detail-btn { font-size: 0.8125rem; padding: 0.375rem 0.875rem; }
        .detail-delete-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .detail-delete-btn:hover { background: #fef2f2; border-color: #fecaca; }
        .detail-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .detail-close:hover { background: var(--cream-dark); color: var(--deep-brown); }
        .tab-bar { display: flex; border-bottom: 1px solid var(--border-light); flex-shrink: 0; overflow-x: auto; scrollbar-width: none; }
        .tab-bar::-webkit-scrollbar { display: none; }
        .tab-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0.625rem 0.875rem; border: none; background: none; cursor: pointer; font-family: var(--font-body); color: var(--text-muted); transition: all 0.15s; border-bottom: 2px solid transparent; flex-shrink: 0; }
        .tab-btn:hover { color: var(--deep-brown); background: var(--cream); }
        .tab-btn.active { color: var(--deep-brown); border-bottom-color: var(--deep-brown); }
        .tab-icon { font-size: 1rem; }
        .tab-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; }
        .detail-scroll { flex: 1; overflow-y: auto; }
        .tab-content { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }
        .info-field { background: var(--cream); border-radius: 8px; border: 1px solid var(--border-light); padding: 0.5rem 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; }
        .info-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
        .info-value { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); }
        .info-value.mono { font-family: monospace; font-size: 1rem; letter-spacing: 0.05em; }
        .status-cards { display: flex; gap: 0.625rem; }
        .status-card { flex: 1; display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.75rem; border-radius: 10px; border: 1px solid var(--border-light); background: var(--cream); }
        .status-card.ok { border-color: #bbf7d0; background: #f0fdf4; }
        .status-card.warning { border-color: #fde68a; background: #fffbeb; }
        .status-card.expired { border-color: #fecaca; background: #fef2f2; }
        .status-card-icon { font-size: 1.25rem; }
        .status-card-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .status-card-value { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); }
        .status-card.expired .status-card-value { color: #dc2626; }
        .status-card.warning .status-card-value { color: #b45309; }
        .notes-block { background: var(--cream); border-radius: 8px; border: 1px solid var(--border-light); padding: 0.75rem; }
        .notes-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.375rem; }
        .notes-text { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; }
        .add-record-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; background: var(--deep-brown); color: var(--cream); border: none; border-radius: 8px; font-family: var(--font-body); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.15s; width: fit-content; }
        .add-record-btn:hover { background: var(--terracotta); }
        .record-card { border: 1px solid var(--border-light); border-radius: 10px; padding: 0.875rem; background: var(--cream); display: flex; flex-direction: column; gap: 0.5rem; }
        .record-card.record-expired { border-color: #fecaca; background: #fef9f9; }
        .record-card.record-warning { border-color: #fde68a; background: #fffef5; }
        .record-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .record-title-row { display: flex; align-items: center; gap: 0.5rem; }
        .record-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .record-status-dot.pass { background: #16a34a; }
        .record-status-dot.fail { background: #dc2626; }
        .record-title { font-size: 0.9rem; font-weight: 600; color: var(--deep-brown); }
        .record-subtitle { font-size: 0.875rem; color: var(--text-secondary); font-weight: 400; }
        .record-actions { display: flex; gap: 0.375rem; align-items: center; }
        .record-edit-btn { font-size: 0.75rem; color: var(--text-muted); background: white; border: 1px solid var(--border); border-radius: 5px; padding: 0.2rem 0.5rem; cursor: pointer; font-family: var(--font-body); transition: all 0.12s; }
        .record-edit-btn:hover { color: var(--deep-brown); border-color: var(--warm-brown); }
        .record-delete-btn { font-size: 0.75rem; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0.2rem; transition: color 0.12s; }
        .record-delete-btn:hover { color: #dc2626; }
        .record-fields { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .record-field { font-size: 0.75rem; background: white; padding: 0.2rem 0.5rem; border-radius: 5px; border: 1px solid var(--border-light); }
        .record-field-label { color: var(--text-muted); margin-right: 0.25rem; }
        .record-field-value { font-weight: 500; color: var(--text-primary); }
        .record-field-value.expired { color: #dc2626; font-weight: 700; }
        .record-field-value.warning { color: #b45309; font-weight: 700; }
        .record-notes { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; font-style: italic; border-top: 1px solid var(--border-light); padding-top: 0.375rem; }
        .empty-tab { text-align: center; padding: 2.5rem 1rem; font-size: 0.875rem; color: var(--text-muted); font-style: italic; }
        .tax-warning { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 0.875rem 1rem; font-size: 0.875rem; font-weight: 600; color: #dc2626; line-height: 1.5; }
      `}</style>
    </div>
  )
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="info-field">
      <span className="info-label">{label}</span>
      <span className={`info-value ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
  )
}

function RecordField({ label, value, highlight }: { label: string; value: string; highlight?: 'expired' | 'warning' }) {
  return (
    <div className="record-field">
      <span className="record-field-label">{label}:</span>
      <span className={`record-field-value ${highlight ?? ''}`}>{value}</span>
    </div>
  )
}

function EmptyTab({ label }: { label: string }) {
  return <div className="empty-tab">{label}</div>
}
