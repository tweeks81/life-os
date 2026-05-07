'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VehiclePolicy, CoverageType, COVERAGE_TYPE_LABELS } from '@/types/vehicles'

const COVERAGE_TYPES: CoverageType[] = ['comprehensive', 'third_party_fire_theft', 'third_party', 'other']

interface LinkedPerson {
  id: string
  name: string
  email: string
}

const INCLUSIONS = [
  { key: 'includes_courtesy_car', label: 'Courtesy car' },
  { key: 'includes_breakdown', label: 'Breakdown cover' },
  { key: 'includes_legal_cover', label: 'Legal cover' },
  { key: 'includes_personal_accident', label: 'Personal accident' },
  { key: 'includes_windscreen', label: 'Windscreen cover' },
  { key: 'includes_european_cover', label: 'European cover' },
  { key: 'includes_no_claims_protection', label: 'No claims protection' },
]

export default function InsuranceForm({
  vehicleId,
  userId,
  policy,
  onSaved,
  onClose,
}: {
  vehicleId: string
  userId: string
  policy: VehiclePolicy | null
  onSaved: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isEdit = !!policy
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [linkedPeople, setLinkedPeople] = useState<LinkedPerson[]>([])

  // Form fields
  const [insurer, setInsurer] = useState(policy?.insurer ?? '')
  const [policyNumber, setPolicyNumber] = useState(policy?.policy_number ?? '')
  const [coverageType, setCoverageType] = useState<CoverageType | ''>(policy?.coverage_type ?? 'comprehensive')
  const [startDate, setStartDate] = useState(policy?.start_date ?? '')
  const [endDate, setEndDate] = useState(policy?.end_date ?? '')
  const [cost, setCost] = useState(policy?.cost?.toString() ?? '')
  const [excess, setExcess] = useState(policy?.excess?.toString() ?? '')
  const [autoRenews, setAutoRenews] = useState(policy?.auto_renews ?? false)
  const [policyHolder, setPolicyHolder] = useState(policy?.policy_holder ?? 'me')
  const [namedDrivers, setNamedDrivers] = useState<string[]>(policy?.named_drivers ?? [])
  const [inclusions, setInclusions] = useState<Record<string, boolean>>({
    includes_courtesy_car: policy?.includes_courtesy_car ?? false,
    includes_breakdown: policy?.includes_breakdown ?? false,
    includes_legal_cover: policy?.includes_legal_cover ?? false,
    includes_personal_accident: policy?.includes_personal_accident ?? false,
    includes_windscreen: policy?.includes_windscreen ?? false,
    includes_european_cover: policy?.includes_european_cover ?? false,
    includes_no_claims_protection: policy?.includes_no_claims_protection ?? false,
  })
  const [notes, setNotes] = useState(policy?.notes ?? '')

  // Fetch linked contacts
  useEffect(() => {
    ;(async () => {
      const { data: linkedRaw } = await (supabase as any)
        .from('linked_contacts')
        .select('linked_user_id')
        .eq('user_id', userId)
      const linkedIds = (linkedRaw ?? []).map((l: any) => l.linked_user_id)
      if (linkedIds.length === 0) return
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', linkedIds)
      setLinkedPeople((profiles ?? []).map((p: any) => ({
        id: p.id,
        name: p.full_name ?? p.email,
        email: p.email,
      })))
    })()
  }, [supabase, userId])

  // Auto-calculate end date (1 year from start)
  const handleStartDateChange = (val: string) => {
    setStartDate(val)
    if (val && !endDate) {
      const d = new Date(val)
      d.setFullYear(d.getFullYear() + 1)
      d.setDate(d.getDate() - 1)
      setEndDate(d.toISOString().split('T')[0])
    }
  }

  const toggleNamedDriver = (id: string) => {
    setNamedDrivers(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  const toggleInclusion = (key: string) => {
    setInclusions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    if (!startDate || !endDate) { setError('Start and end dates are required.'); return }
    if (!insurer.trim()) { setError('Provider name is required.'); return }
    setSaving(true); setError('')

    const payload = {
      vehicle_id: vehicleId,
      user_id: userId,
      policy_type: 'insurance',
      insurer: insurer.trim(),
      policy_number: policyNumber.trim() || null,
      coverage_type: coverageType || null,
      start_date: startDate,
      end_date: endDate,
      cost: cost ? parseFloat(cost) : null,
      excess: excess ? parseFloat(excess) : null,
      auto_renews: autoRenews,
      policy_holder: policyHolder,
      named_drivers: namedDrivers.length > 0 ? namedDrivers : null,
      ...inclusions,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (isEdit) {
      const { error: err } = await (supabase as any).from('vehicle_policies').update(payload).eq('id', policy.id)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    } else {
      const { error: err } = await (supabase as any).from('vehicle_policies').insert(payload)
      if (err) { setError('Failed to save.'); setSaving(false); return }
    }
    onSaved()
  }

  const allPeople = [
    { id: 'me', name: 'Myself' },
    ...linkedPeople,
  ]

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit insurance' : 'Add insurance'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Provider */}
          <div className="form-section-label">Provider</div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Provider <span className="req">*</span></label>
              <input className="input-field" value={insurer} onChange={e => setInsurer(e.target.value)} placeholder="e.g. Admiral, Aviva, Churchill" autoFocus />
            </div>
            <div className="field-group">
              <label className="label">Policy number</label>
              <input className="input-field" value={policyNumber} onChange={e => setPolicyNumber(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="field-group">
            <label className="label">Coverage type</label>
            <select className="input-field" value={coverageType} onChange={e => setCoverageType(e.target.value as CoverageType)}>
              <option value="">Not specified</option>
              {COVERAGE_TYPES.map(t => <option key={t} value={t}>{COVERAGE_TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          {/* Dates & cost */}
          <div className="form-section-label">Dates & cost</div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Start date <span className="req">*</span></label>
              <input className="input-field" type="date" value={startDate} onChange={e => handleStartDateChange(e.target.value)} />
            </div>
            <div className="field-group">
              <label className="label">End date <span className="req">*</span></label>
              <input className="input-field" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="field-group">
              <label className="label">Annual cost (£)</label>
              <input className="input-field" type="number" step="0.01" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div className="field-group">
              <label className="label">Excess (£)</label>
              <input className="input-field" type="number" step="0.01" min="0" value={excess} onChange={e => setExcess(e.target.value)} placeholder="e.g. 250" />
            </div>
          </div>
          <label className="checkbox-label">
            <input type="checkbox" checked={autoRenews} onChange={e => setAutoRenews(e.target.checked)} className="checkbox-input" />
            Auto-renews
          </label>

          {/* Policy holder */}
          <div className="form-section-label">Policy holder</div>
          <div className="people-grid">
            {allPeople.map(p => (
              <button
                key={p.id}
                type="button"
                className={`person-chip ${policyHolder === p.id ? 'active' : ''}`}
                onClick={() => setPolicyHolder(p.id)}
              >
                <span className="person-avatar">{p.name[0].toUpperCase()}</span>
                <span className="person-name">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Named drivers */}
          {allPeople.length > 1 && (
            <>
              <div className="form-section-label">Named drivers</div>
              <div className="people-grid">
                {allPeople.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`person-chip ${namedDrivers.includes(p.id) ? 'active' : ''}`}
                    onClick={() => toggleNamedDriver(p.id)}
                  >
                    <div className="person-check">{namedDrivers.includes(p.id) ? '✓' : ''}</div>
                    <span className="person-avatar">{p.name[0].toUpperCase()}</span>
                    <span className="person-name">{p.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* What's included */}
          <div className="form-section-label">What's included</div>
          <div className="inclusions-grid">
            {INCLUSIONS.map(inc => (
              <label key={inc.key} className={`inclusion-chip ${inclusions[inc.key] ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={inclusions[inc.key]}
                  onChange={() => toggleInclusion(inc.key)}
                  style={{ display: 'none' }}
                />
                <span className="inclusion-check">{inclusions[inc.key] ? '✓' : ''}</span>
                <span className="inclusion-label">{inc.label}</span>
              </label>
            ))}
          </div>

          {/* Notes */}
          <div className="field-group">
            <label className="label">Notes</label>
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes…" style={{ resize: 'vertical' }} />
          </div>

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add insurance'}
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(44,31,20,0.35); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        .modal-box { width: 100%; max-width: 560px; max-height: 92vh; display: flex; flex-direction: column; animation: fadeUp 0.2s ease; }
        .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); flex-shrink: 0; }
        .modal-title { font-size: 1.125rem; font-weight: 600; }
        .modal-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-muted); font-size: 0.875rem; display: flex; align-items: center; justify-content: center; }
        .modal-close:hover { background: var(--cream-dark); }
        .modal-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .form-section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); padding-bottom: 0.25rem; border-bottom: 1px solid var(--border-light); margin-top: 0.25rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; cursor: pointer; color: var(--text-secondary); }
        .checkbox-input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--deep-brown); }
        .people-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .person-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; border: 1.5px solid var(--border); border-radius: 100px; background: none; cursor: pointer; font-family: var(--font-body); transition: all 0.12s; }
        .person-chip.active { background: var(--deep-brown); border-color: var(--deep-brown); color: var(--cream); }
        .person-chip.active .person-avatar { background: rgba(255,255,255,0.2); color: white; }
        .person-avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--parchment); color: var(--warm-brown); font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .person-name { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
        .person-chip.active .person-name { color: var(--cream); }
        .person-check { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--border); background: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; transition: all 0.12s; }
        .person-chip.active .person-check { background: white; color: var(--deep-brown); border-color: white; }
        .inclusions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.375rem; }
        .inclusion-chip { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border: 1.5px solid var(--border-light); border-radius: 8px; cursor: pointer; transition: all 0.12s; background: var(--cream); }
        .inclusion-chip.active { background: #f0fdf4; border-color: #86efac; }
        .inclusion-check { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--border); background: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #16a34a; flex-shrink: 0; transition: all 0.12s; }
        .inclusion-chip.active .inclusion-check { background: #16a34a; color: white; border-color: #16a34a; }
        .inclusion-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }
        .inclusion-chip.active .inclusion-label { color: #166534; }
        .req { color: var(--terracotta); }
        .form-error { font-size: 0.875rem; color: #dc2626; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid #fecaca; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-light); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
