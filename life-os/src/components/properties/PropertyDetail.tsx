'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  Property, PropertyPurchase, PropertyMortgage, PropertyUtility, PropertyCouncilTax,
  PropertyAsset, AssetNote, AssetType,
  UtilityType, MortgageProductType,
  PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, MORTGAGE_PRODUCT_LABELS,
  UTILITY_TYPE_LABELS, UTILITY_TYPE_ICONS,
  ASSET_TYPE_LABELS, ASSET_TYPE_ICONS,
  formatAddress,
} from '@/types/properties'
import SharePanel, { ShareRecord } from '@/components/tasks/SharePanel'
import PropertyPurchaseSection from './PropertyPurchaseSection'
import MortgageForm from './MortgageForm'
import UtilityForm from './UtilityForm'
import CouncilTaxForm from './CouncilTaxForm'
import AssetForm from './AssetForm'

type Tab = 'info' | 'mortgage' | 'utilities' | 'council-tax' | 'assets'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'info', label: 'Info', icon: '🏠' },
  { id: 'mortgage', label: 'Mortgage', icon: '🏦' },
  { id: 'utilities', label: 'Utilities', icon: '⚡' },
  { id: 'council-tax', label: 'Council Tax', icon: '🏛' },
  { id: 'assets', label: 'Assets', icon: '📦' },
]

function isMortgageExpired(endDate: string | null): boolean {
  if (!endDate) return false
  const exp = new Date(endDate + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return exp < now
}

function isMortgageExpiringSoon(endDate: string | null, days = 90): boolean {
  if (!endDate) return false
  const exp = new Date(endDate + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function PropertyDetail({
  property,
  userId,
  shares,
  purchase,
  onSharesChanged,
  onSavePurchase,
  onEdit,
  onDelete,
  onClose,
}: {
  property: Property
  userId: string
  shares: ShareRecord[]
  purchase: PropertyPurchase | null
  onSharesChanged: () => void
  onSavePurchase: (data: Omit<PropertyPurchase, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const supabase = createClient()
  const isOwner = property.user_id === userId
  const isShared = !isOwner
  const fullAddress = formatAddress(property)

  const [tab, setTab] = useState<Tab>('info')

  const [mortgages, setMortgages] = useState<PropertyMortgage[]>([])
  const [showMortgageForm, setShowMortgageForm] = useState(false)
  const [editingMortgage, setEditingMortgage] = useState<PropertyMortgage | null>(null)
  const [deletingMortgageId, setDeletingMortgageId] = useState<string | null>(null)

  const [utilities, setUtilities] = useState<PropertyUtility[]>([])
  const [showUtilityForm, setShowUtilityForm] = useState(false)
  const [editingUtility, setEditingUtility] = useState<PropertyUtility | null>(null)
  const [deletingUtilityId, setDeletingUtilityId] = useState<string | null>(null)

  const [councilTaxRecords, setCouncilTaxRecords] = useState<PropertyCouncilTax[]>([])
  const [showCouncilTaxForm, setShowCouncilTaxForm] = useState(false)
  const [editingCouncilTax, setEditingCouncilTax] = useState<PropertyCouncilTax | null>(null)
  const [deletingCouncilTaxId, setDeletingCouncilTaxId] = useState<string | null>(null)

  const [assets, setAssets] = useState<PropertyAsset[]>([])
  const [showAssetForm, setShowAssetForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<PropertyAsset | null>(null)
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null)
  const [assetNotes, setAssetNotes] = useState<Record<string, AssetNote[]>>({})
  const [newNoteText, setNewNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const loadMortgages = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('property_mortgages')
      .select('*')
      .eq('property_id', property.id)
      .order('end_date', { ascending: false, nullsFirst: true })
      .order('start_date', { ascending: false })
    setMortgages(data ?? [])
  }, [supabase, property.id])

  const loadUtilities = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('property_utilities')
      .select('*')
      .eq('property_id', property.id)
      .order('utility_type', { ascending: true })
    setUtilities(data ?? [])
  }, [supabase, property.id])

  const loadCouncilTax = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('property_council_tax')
      .select('*')
      .eq('property_id', property.id)
      .order('period_start', { ascending: false, nullsFirst: true })
    setCouncilTaxRecords(data ?? [])
  }, [supabase, property.id])

  const loadAssets = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('property_assets')
      .select('*')
      .eq('property_id', property.id)
      .order('asset_type', { ascending: true })
      .order('name', { ascending: true })
    setAssets(data ?? [])
  }, [supabase, property.id])

  const loadAssetNotes = useCallback(async (assetId: string) => {
    const { data } = await (supabase as any)
      .from('property_asset_notes')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
    setAssetNotes(prev => ({ ...prev, [assetId]: data ?? [] }))
  }, [supabase])

  // Load everything on mount
  useEffect(() => {
    loadMortgages()
    loadUtilities()
    loadCouncilTax()
    loadAssets()
  }, [loadMortgages, loadUtilities, loadCouncilTax, loadAssets])

  useEffect(() => {
    if (tab === 'mortgage') loadMortgages()
    if (tab === 'utilities') loadUtilities()
    if (tab === 'council-tax') loadCouncilTax()
    if (tab === 'assets') loadAssets()
  }, [tab, loadMortgages, loadUtilities, loadCouncilTax, loadAssets])

  // Reset when a different property is selected
  useEffect(() => {
    setTab('info')
    setMortgages([])
    setUtilities([])
    setCouncilTaxRecords([])
    setAssets([])
    setAssetNotes({})
    setExpandedAssetId(null)
  }, [property.id])

  const handleDelete = () => {
    if (confirm(`Delete "${property.name}"? This cannot be undone.`)) onDelete()
  }

  const handleDeleteMortgage = async (id: string) => {
    if (!confirm('Delete this mortgage record?')) return
    setDeletingMortgageId(id)
    await (supabase as any).from('property_mortgages').delete().eq('id', id)
    setDeletingMortgageId(null)
    loadMortgages()
  }

  const handleDeleteUtility = async (id: string) => {
    if (!confirm('Delete this utility?')) return
    setDeletingUtilityId(id)
    await (supabase as any).from('property_utilities').delete().eq('id', id)
    setDeletingUtilityId(null)
    loadUtilities()
  }

  const handleDeleteCouncilTax = async (id: string) => {
    if (!confirm('Delete this council tax record?')) return
    setDeletingCouncilTaxId(id)
    await (supabase as any).from('property_council_tax').delete().eq('id', id)
    setDeletingCouncilTaxId(null)
    loadCouncilTax()
  }

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Delete this asset and all its notes?')) return
    setDeletingAssetId(id)
    await (supabase as any).from('property_assets').delete().eq('id', id)
    setDeletingAssetId(null)
    if (expandedAssetId === id) setExpandedAssetId(null)
    loadAssets()
  }

  const handleExpandAsset = (id: string) => {
    if (expandedAssetId === id) {
      setExpandedAssetId(null)
    } else {
      setExpandedAssetId(id)
      setNewNoteText('')
      loadAssetNotes(id)
    }
  }

  const handleAddNote = async (assetId: string) => {
    if (!newNoteText.trim()) return
    setSavingNote(true)
    await (supabase as any).from('property_asset_notes').insert({
      asset_id: assetId,
      property_id: property.id,
      user_id: userId,
      note: newNoteText.trim(),
    })
    setNewNoteText('')
    setSavingNote(false)
    loadAssetNotes(assetId)
  }

  const handleDeleteNote = async (noteId: string, assetId: string) => {
    if (!confirm('Delete this note?')) return
    await (supabase as any).from('property_asset_notes').delete().eq('id', noteId)
    loadAssetNotes(assetId)
  }

  // Determine "current" mortgage — non-expired with latest end_date, or most recent if all expired
  const activeMortgage = mortgages.find(m => !isMortgageExpired(m.end_date)) ?? mortgages[0] ?? null
  const historyMortgages = mortgages.filter(m => m !== activeMortgage)

  // Current council tax = most recent non-expired (period_end >= today or no period_end)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const activeCouncilTax = councilTaxRecords.find(r =>
    !r.period_end || new Date(r.period_end + 'T00:00:00') >= today
  ) ?? councilTaxRecords[0] ?? null
  const historyCouncilTax = councilTaxRecords.filter(r => r !== activeCouncilTax)

  return (
    <div className="prop-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-left">
          <span className="detail-type-icon">{PROPERTY_TYPE_ICONS[property.property_type]}</span>
          <div className="detail-title-block">
            <h2 className="detail-title">{property.name}</h2>
            <div className="detail-badges">
              {property.is_primary_residence && (
                <span className="primary-badge">⌂ Primary residence</span>
              )}
              {isShared && (
                <span className="shared-badge">👥 Shared with you</span>
              )}
            </div>
          </div>
        </div>
        <div className="detail-header-right">
          {isOwner && (
            <>
              <button className="btn-secondary detail-btn" onClick={onEdit}>Edit</button>
              <button className="detail-delete-btn" onClick={handleDelete} title="Delete">🗑</button>
            </>
          )}
          <button className="detail-close mobile-only" onClick={onClose} style={{ display: 'none', width: 'auto', padding: '0 0.75rem', fontSize: '0.875rem', borderRadius: '8px', color: 'var(--terracotta)', borderColor: 'transparent', background: 'none' }}>← Back</button>
          <button className="detail-close desktop-only" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="prop-tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`prop-tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="prop-tab-icon">{t.icon}</span>
            <span className="prop-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="detail-scroll">

        {/* ── INFO TAB ── */}
        {tab === 'info' && (
          <>
            {/* Photo */}
            {property.photo_url && (
              <div className="detail-photo-wrap">
                <Image
                  src={property.photo_url}
                  alt={property.name}
                  width={600}
                  height={280}
                  className="detail-photo"
                  unoptimized
                />
              </div>
            )}

            {/* Core info */}
            <div className="detail-section">
              <div className="detail-field">
                <span className="field-icon">🏠</span>
                <div className="field-content">
                  <span className="field-label">Type</span>
                  <span className="field-value">{PROPERTY_TYPE_LABELS[property.property_type]}</span>
                </div>
              </div>

              {property.year_built && (
                <div className="detail-field">
                  <span className="field-icon">📅</span>
                  <div className="field-content">
                    <span className="field-label">Year built</span>
                    <span className="field-value">{property.year_built}</span>
                  </div>
                </div>
              )}

              {fullAddress && (
                <div className="detail-field">
                  <span className="field-icon">📍</span>
                  <div className="field-content">
                    <span className="field-label">Address</span>
                    <div className="field-value address-block">
                      {property.address_line1 && <div>{property.address_line1}</div>}
                      {property.address_line2 && <div>{property.address_line2}</div>}
                      {property.address_town && <div>{property.address_town}</div>}
                      {property.address_city && <div>{property.address_city}</div>}
                      {property.address_postcode && <div>{property.address_postcode}</div>}
                      {property.address_country && property.address_country !== 'United Kingdom' && (
                        <div>{property.address_country}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {property.notes && (
              <div className="detail-section">
                <div className="section-heading">Notes</div>
                <p className="notes-text">{property.notes}</p>
              </div>
            )}

            {/* Purchase details */}
            <div className="detail-section">
              <PropertyPurchaseSection
                purchase={purchase}
                isOwner={isOwner}
                propertyId={property.id}
                userId={userId}
                onSave={onSavePurchase}
              />
            </div>

            {/* Mortgage snapshot */}
            {activeMortgage && (
              <div className="detail-section">
                <div className="section-heading">Mortgage</div>
                <div className="mort-snapshot">
                  <div className="mort-snap-header">
                    <span className="mort-snap-lender">{activeMortgage.lender}</span>
                    {activeMortgage.product_type && (
                      <span className="mort-snap-product">{MORTGAGE_PRODUCT_LABELS[activeMortgage.product_type]}</span>
                    )}
                  </div>
                  <div className="mort-snap-rows">
                    {activeMortgage.interest_rate != null && (
                      <MortSnapRow icon="%" label="Interest rate" value={`${activeMortgage.interest_rate}%`} />
                    )}
                    {activeMortgage.monthly_payment != null && (
                      <MortSnapRow icon="£" label="Monthly payment" value={
                        new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(activeMortgage.monthly_payment)
                      } />
                    )}
                    {activeMortgage.end_date && (
                      <MortSnapRow
                        icon="📅"
                        label="Renews"
                        value={fmtDate(activeMortgage.end_date)}
                        status={isMortgageExpired(activeMortgage.end_date) ? 'expired' : isMortgageExpiringSoon(activeMortgage.end_date) ? 'warning' : 'ok'}
                      />
                    )}
                  </div>
                  {isMortgageExpiringSoon(activeMortgage.end_date) && !isMortgageExpired(activeMortgage.end_date) && (
                    <div className="mort-snap-warn">⚠ Renewal due within 3 months</div>
                  )}
                </div>
              </div>
            )}

            {/* Utilities snapshot */}
            {utilities.length > 0 && (
              <div className="detail-section">
                <div className="section-heading">Utilities</div>
                <div className="util-snapshot">
                  {utilities.map(u => (
                    <div key={u.id} className="util-snap-row">
                      <span className="util-snap-icon">{UTILITY_TYPE_ICONS[u.utility_type]}</span>
                      <span className="util-snap-label">{UTILITY_TYPE_LABELS[u.utility_type]}</span>
                      <span className="util-snap-provider">{u.provider}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Council tax snapshot */}
            {activeCouncilTax && (
              <div className="detail-section">
                <div className="section-heading">Council Tax</div>
                <div className="ct-snapshot">
                  <div className="ct-snap-row">
                    <span className="ct-snap-icon">🏛</span>
                    <span className="ct-snap-label">Council</span>
                    <span className="ct-snap-value">{activeCouncilTax.council_name}</span>
                  </div>
                  <div className="ct-snap-row">
                    <span className="ct-snap-icon">🔤</span>
                    <span className="ct-snap-label">Band</span>
                    <span className="ct-snap-value">
                      <span className="ct-band-badge">{activeCouncilTax.band}</span>
                    </span>
                  </div>
                  {activeCouncilTax.annual_charge != null && (
                    <div className="ct-snap-row">
                      <span className="ct-snap-icon">£</span>
                      <span className="ct-snap-label">Annual cost</span>
                      <span className="ct-snap-value">
                        {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(activeCouncilTax.annual_charge)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sharing */}
            {isOwner && (
              <div className="detail-section">
                <SharePanel
                  entityId={property.id}
                  entityType={'property' as any}
                  ownerId={property.user_id}
                  userId={userId}
                  shares={shares}
                  onSharesChanged={onSharesChanged}
                />
              </div>
            )}
          </>
        )}

        {/* ── MORTGAGE TAB ── */}
        {tab === 'mortgage' && (
          <div className="tab-content">
            {isOwner && (
              <button
                className="add-record-btn"
                onClick={() => { setEditingMortgage(null); setShowMortgageForm(true) }}
              >
                + Add mortgage
              </button>
            )}

            {mortgages.length === 0 ? (
              <div className="empty-tab">No mortgage records yet.</div>
            ) : (
              <>
                {/* Current deal */}
                {activeMortgage && (
                  <div>
                    <div className="mort-group-label">Current deal</div>
                    <MortgageCard
                      mortgage={activeMortgage}
                      isOwner={isOwner}
                      deleting={deletingMortgageId === activeMortgage.id}
                      onEdit={() => { setEditingMortgage(activeMortgage); setShowMortgageForm(true) }}
                      onDelete={() => handleDeleteMortgage(activeMortgage.id)}
                    />
                  </div>
                )}

                {/* History */}
                {historyMortgages.length > 0 && (
                  <div>
                    <div className="mort-group-label">History</div>
                    <div className="mort-history-list">
                      {historyMortgages.map(m => (
                        <MortgageCard
                          key={m.id}
                          mortgage={m}
                          isOwner={isOwner}
                          deleting={deletingMortgageId === m.id}
                          onEdit={() => { setEditingMortgage(m); setShowMortgageForm(true) }}
                          onDelete={() => handleDeleteMortgage(m.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── UTILITIES TAB ── */}
        {tab === 'utilities' && (
          <div className="tab-content">
            {isOwner && (
              <button
                className="add-record-btn"
                onClick={() => { setEditingUtility(null); setShowUtilityForm(true) }}
              >
                + Add utility
              </button>
            )}

            {utilities.length === 0 ? (
              <div className="empty-tab">No utilities recorded yet.</div>
            ) : (
              <div className="util-list">
                {utilities.map(u => (
                  <div key={u.id} className="util-card">
                    <div className="util-card-header">
                      <div className="util-card-left">
                        <span className="util-card-icon">{UTILITY_TYPE_ICONS[u.utility_type]}</span>
                        <div className="util-card-info">
                          <span className="util-card-type">{UTILITY_TYPE_LABELS[u.utility_type]}</span>
                          <span className="util-card-provider">{u.provider}</span>
                        </div>
                      </div>
                      {isOwner && (
                        <div className="util-card-actions">
                          <button
                            className="mort-edit-btn"
                            onClick={() => { setEditingUtility(u); setShowUtilityForm(true) }}
                            disabled={deletingUtilityId === u.id}
                          >
                            Edit
                          </button>
                          <button
                            className="mort-delete-btn"
                            onClick={() => handleDeleteUtility(u.id)}
                            disabled={deletingUtilityId === u.id}
                          >
                            🗑
                          </button>
                        </div>
                      )}
                    </div>
                    {u.notes && <p className="util-card-notes">{u.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COUNCIL TAX TAB ── */}
        {tab === 'council-tax' && (
          <div className="tab-content">
            {isOwner && (
              <button
                className="add-record-btn"
                onClick={() => { setEditingCouncilTax(null); setShowCouncilTaxForm(true) }}
              >
                + Add council tax
              </button>
            )}

            {councilTaxRecords.length === 0 ? (
              <div className="empty-tab">No council tax records yet.</div>
            ) : (
              <>
                {activeCouncilTax && (
                  <div>
                    <div className="mort-group-label">Current</div>
                    <CouncilTaxCard
                      record={activeCouncilTax}
                      isOwner={isOwner}
                      deleting={deletingCouncilTaxId === activeCouncilTax.id}
                      onEdit={() => { setEditingCouncilTax(activeCouncilTax); setShowCouncilTaxForm(true) }}
                      onDelete={() => handleDeleteCouncilTax(activeCouncilTax.id)}
                    />
                  </div>
                )}
                {historyCouncilTax.length > 0 && (
                  <div>
                    <div className="mort-group-label">History</div>
                    <div className="mort-history-list">
                      {historyCouncilTax.map(r => (
                        <CouncilTaxCard
                          key={r.id}
                          record={r}
                          isOwner={isOwner}
                          deleting={deletingCouncilTaxId === r.id}
                          onEdit={() => { setEditingCouncilTax(r); setShowCouncilTaxForm(true) }}
                          onDelete={() => handleDeleteCouncilTax(r.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── ASSETS TAB ── */}
        {tab === 'assets' && (
          <div className="tab-content">
            {isOwner && (
              <button className="add-record-btn" onClick={() => { setEditingAsset(null); setShowAssetForm(true) }}>
                + Add asset
              </button>
            )}

            {assets.length === 0 ? (
              <div className="empty-tab">No assets recorded yet.</div>
            ) : (
              <div className="asset-list">
                {assets.map(a => {
                  const isExpanded = expandedAssetId === a.id
                  const notes = assetNotes[a.id] ?? []
                  return (
                    <div key={a.id} className={`asset-card ${isExpanded ? 'expanded' : ''}`}>
                      {/* Card header — always visible */}
                      <div className="asset-card-header" onClick={() => handleExpandAsset(a.id)}>
                        <div className="asset-card-left">
                          <span className="asset-icon">{ASSET_TYPE_ICONS[a.asset_type]}</span>
                          <div className="asset-info">
                            <span className="asset-name">{a.name}</span>
                            <span className="asset-meta">
                              {ASSET_TYPE_LABELS[a.asset_type]}
                              {(a.make || a.model) && ` · ${[a.make, a.model].filter(Boolean).join(' ')}`}
                            </span>
                          </div>
                        </div>
                        <div className="asset-card-right">
                          {isOwner && (
                            <div className="asset-actions" onClick={e => e.stopPropagation()}>
                              <button className="mort-edit-btn" onClick={() => { setEditingAsset(a); setShowAssetForm(true) }} disabled={deletingAssetId === a.id}>Edit</button>
                              <button className="mort-delete-btn" onClick={() => handleDeleteAsset(a.id)} disabled={deletingAssetId === a.id}>🗑</button>
                            </div>
                          )}
                          <span className="asset-chevron">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="asset-detail">
                          {/* Fields */}
                          <div className="asset-fields">
                            {a.purchase_date && (
                              <div className="asset-field">
                                <span className="asset-field-label">Purchased / installed</span>
                                <span className="asset-field-value">{fmtDate(a.purchase_date)}</span>
                              </div>
                            )}
                            {a.serial_number && (
                              <div className="asset-field">
                                <span className="asset-field-label">Serial number</span>
                                <span className="asset-field-value asset-serial">{a.serial_number}</span>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          <div className="asset-notes-section">
                            <div className="asset-notes-heading">Maintenance notes</div>

                            {/* Add note form — owners only */}
                            {isOwner && (
                              <div className="asset-note-add">
                                <textarea
                                  className="asset-note-input"
                                  value={newNoteText}
                                  onChange={e => setNewNoteText(e.target.value)}
                                  placeholder="Add a maintenance note, service record, repair…"
                                  rows={2}
                                />
                                <button
                                  className="asset-note-save-btn"
                                  onClick={() => handleAddNote(a.id)}
                                  disabled={savingNote || !newNoteText.trim()}
                                >
                                  {savingNote ? 'Saving…' : 'Add note'}
                                </button>
                              </div>
                            )}

                            {/* Existing notes */}
                            {notes.length === 0 ? (
                              <p className="asset-notes-empty">No notes yet.</p>
                            ) : (
                              <div className="asset-notes-list">
                                {notes.map(n => (
                                  <div key={n.id} className="asset-note">
                                    <div className="asset-note-header">
                                      <span className="asset-note-date">{fmtDateTime(n.created_at)}</span>
                                      {isOwner && (
                                        <button className="asset-note-delete" onClick={() => handleDeleteNote(n.id, a.id)}>✕</button>
                                      )}
                                    </div>
                                    <p className="asset-note-text">{n.note}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mortgage form modal */}
      {showMortgageForm && (
        <MortgageForm
          propertyId={property.id}
          userId={userId}
          mortgage={editingMortgage}
          onSaved={() => { setShowMortgageForm(false); setEditingMortgage(null); loadMortgages() }}
          onClose={() => { setShowMortgageForm(false); setEditingMortgage(null) }}
        />
      )}

      {showUtilityForm && (
        <UtilityForm
          propertyId={property.id}
          userId={userId}
          utility={editingUtility}
          onSaved={() => { setShowUtilityForm(false); setEditingUtility(null); loadUtilities() }}
          onClose={() => { setShowUtilityForm(false); setEditingUtility(null) }}
        />
      )}

      {showCouncilTaxForm && (
        <CouncilTaxForm
          propertyId={property.id}
          userId={userId}
          record={editingCouncilTax}
          onSaved={() => { setShowCouncilTaxForm(false); setEditingCouncilTax(null); loadCouncilTax() }}
          onClose={() => { setShowCouncilTaxForm(false); setEditingCouncilTax(null) }}
        />
      )}

      {showAssetForm && (
        <AssetForm
          propertyId={property.id}
          userId={userId}
          asset={editingAsset}
          onSaved={() => { setShowAssetForm(false); setEditingAsset(null); loadAssets() }}
          onClose={() => { setShowAssetForm(false); setEditingAsset(null) }}
        />
      )}

      <style>{`
        .prop-detail {
          flex: 1;
          background: white;
          border-left: 1px solid var(--border-light);
          box-shadow: -4px 0 24px var(--shadow-warm-md);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideIn 0.22s ease;
          max-width: 520px;
        }
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
          gap: 0.75rem;
        }
        .detail-header-left {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          flex: 1;
          min-width: 0;
        }
        .detail-type-icon {
          font-size: 1.75rem;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          background: var(--cream-dark);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .detail-title-block { min-width: 0; }
        .detail-title {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 0.2rem;
        }
        .detail-badges { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .primary-badge {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: var(--deep-brown);
          color: var(--cream);
          padding: 0.15rem 0.5rem;
          border-radius: 5px;
          display: inline-block;
        }
        .shared-badge {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.15rem 0.45rem;
          border-radius: 5px;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          display: inline-block;
        }
        .detail-header-right {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .detail-btn { font-size: 0.8125rem; padding: 0.375rem 0.875rem; }
        .detail-delete-btn {
          width: 32px; height: 32px;
          border-radius: 8px; border: 1px solid var(--border);
          background: none; cursor: pointer; font-size: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .detail-delete-btn:hover { background: #fef2f2; border-color: #fecaca; }
        .detail-close {
          width: 32px; height: 32px;
          border-radius: 8px; border: 1px solid var(--border);
          background: none; cursor: pointer; color: var(--text-muted);
          font-size: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .detail-close:hover { background: var(--cream-dark); color: var(--deep-brown); }

        /* Tab bar */
        .prop-tab-bar {
          display: flex;
          border-bottom: 1px solid var(--border-light);
          flex-shrink: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .prop-tab-bar::-webkit-scrollbar { display: none; }
        .prop-tab-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 0.625rem 1rem;
          border: none;
          background: none;
          cursor: pointer;
          font-family: var(--font-body);
          color: var(--text-muted);
          transition: all 0.15s;
          border-bottom: 2px solid transparent;
          flex-shrink: 0;
        }
        .prop-tab-btn:hover { color: var(--deep-brown); background: var(--cream); }
        .prop-tab-btn.active { color: var(--deep-brown); border-bottom-color: var(--deep-brown); }
        .prop-tab-icon { font-size: 1rem; }
        .prop-tab-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; }

        .detail-scroll {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .detail-photo-wrap {
          flex-shrink: 0;
          height: 200px;
          overflow: hidden;
        }
        .detail-photo {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }
        .detail-section {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .section-heading {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .detail-field {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .field-icon {
          font-size: 0.9rem;
          margin-top: 0.1rem;
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }
        .field-content { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .field-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          font-weight: 600;
        }
        .field-value {
          font-size: 0.9rem;
          color: var(--text-primary);
          font-weight: 500;
        }
        .address-block {
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.7;
          font-weight: 400;
        }
        .notes-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          white-space: pre-wrap;
        }
        /* Mortgage snapshot on info tab */
        .mort-snapshot { display: flex; flex-direction: column; gap: 0.5rem; }
        .mort-snap-header { display: flex; flex-direction: column; gap: 0.15rem; }
        .mort-snap-lender { font-size: 0.9375rem; font-weight: 700; color: var(--deep-brown); }
        .mort-snap-product { font-size: 0.8rem; color: var(--text-secondary); }
        .mort-snap-rows { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--border-light); border-radius: 10px; overflow: hidden; }
        .mort-snap-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.875rem; background: white; border-bottom: 1px solid var(--border-light); }
        .mort-snap-row:last-child { border-bottom: none; }
        .mort-snap-row.ok { background: #f0fdf4; }
        .mort-snap-row.warning { background: #fffbeb; }
        .mort-snap-row.expired { background: #fef2f2; }
        .mort-snap-icon { font-size: 0.875rem; width: 20px; text-align: center; flex-shrink: 0; color: var(--text-muted); }
        .mort-snap-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); width: 110px; flex-shrink: 0; }
        .mort-snap-value { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); flex: 1; }
        .mort-snap-row.warning .mort-snap-value { color: #b45309; font-weight: 700; }
        .mort-snap-row.expired .mort-snap-value { color: #dc2626; font-weight: 700; }
        .mort-snap-warn { font-size: 0.8rem; font-weight: 600; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.35rem 0.625rem; }

        /* Mortgage tab */
        .tab-content { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .add-record-btn {
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 1rem; background: var(--deep-brown); color: var(--cream);
          border: none; border-radius: 8px; font-family: var(--font-body);
          font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.15s; width: fit-content;
        }
        .add-record-btn:hover { background: var(--terracotta); }
        .empty-tab { text-align: center; padding: 2.5rem 1rem; font-size: 0.875rem; color: var(--text-muted); font-style: italic; }
        .mort-group-label {
          font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .mort-history-list { display: flex; flex-direction: column; gap: 0.625rem; }

        /* Utilities snapshot on info tab */
        .util-snapshot { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--border-light); border-radius: 10px; overflow: hidden; }
        .util-snap-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.875rem; background: white; border-bottom: 1px solid var(--border-light); }
        .util-snap-row:last-child { border-bottom: none; }
        .util-snap-icon { font-size: 1rem; width: 22px; text-align: center; flex-shrink: 0; }
        .util-snap-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); width: 80px; flex-shrink: 0; }
        .util-snap-provider { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); flex: 1; }

        /* Council tax snapshot on info tab */
        .ct-snapshot { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--border-light); border-radius: 10px; overflow: hidden; }
        .ct-snap-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.875rem; background: white; border-bottom: 1px solid var(--border-light); }
        .ct-snap-row:last-child { border-bottom: none; }
        .ct-snap-icon { font-size: 0.875rem; width: 22px; text-align: center; flex-shrink: 0; color: var(--text-muted); }
        .ct-snap-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); width: 80px; flex-shrink: 0; }
        .ct-snap-value { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); flex: 1; }
        .ct-band-badge { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: var(--deep-brown); color: var(--cream); font-weight: 700; font-size: 0.875rem; border-radius: 6px; }

        /* Council tax tab cards */
        .ct-card { border: 1px solid var(--border-light); border-radius: 10px; padding: 0.875rem; background: var(--cream); display: flex; flex-direction: column; gap: 0.5rem; }
        .ct-card.ct-expired { border-color: #d1d5db; background: #f9fafb; opacity: 0.8; }
        .ct-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
        .ct-card-main { display: flex; flex-direction: column; gap: 0.15rem; }
        .ct-card-council { font-size: 1rem; font-weight: 700; color: var(--deep-brown); }
        .ct-card-band { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.8rem; color: var(--text-secondary); }
        .ct-card-band-badge { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: var(--deep-brown); color: var(--cream); font-weight: 700; font-size: 0.75rem; border-radius: 5px; }
        .ct-card-actions { display: flex; gap: 0.375rem; align-items: center; flex-shrink: 0; }
        .ct-card-notes { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; font-style: italic; border-top: 1px solid var(--border-light); padding-top: 0.375rem; }

        /* Utilities tab */
        .util-list { display: flex; flex-direction: column; gap: 0.625rem; }
        .util-card { border: 1px solid var(--border-light); border-radius: 10px; padding: 0.875rem; background: var(--cream); display: flex; flex-direction: column; gap: 0.5rem; }
        .util-card-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .util-card-left { display: flex; align-items: center; gap: 0.625rem; flex: 1; min-width: 0; }
        .util-card-icon { font-size: 1.5rem; flex-shrink: 0; width: 36px; height: 36px; background: white; border: 1px solid var(--border-light); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .util-card-info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .util-card-type { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
        .util-card-provider { font-size: 0.9375rem; font-weight: 600; color: var(--deep-brown); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .util-card-actions { display: flex; gap: 0.375rem; align-items: center; flex-shrink: 0; }
        .util-card-notes { font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; border-top: 1px solid var(--border-light); padding-top: 0.5rem; white-space: pre-wrap; }

        /* Assets tab */
        .asset-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .asset-card { border: 1px solid var(--border-light); border-radius: 12px; background: white; overflow: hidden; transition: box-shadow 0.15s; }
        .asset-card.expanded { box-shadow: 0 2px 12px var(--shadow-warm); }
        .asset-card-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.75rem 0.875rem; cursor: pointer; user-select: none; }
        .asset-card-header:hover { background: var(--cream); }
        .asset-card-left { display: flex; align-items: center; gap: 0.625rem; flex: 1; min-width: 0; }
        .asset-icon { font-size: 1.375rem; width: 36px; height: 36px; background: var(--cream-dark); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .asset-info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .asset-name { font-size: 0.9rem; font-weight: 600; color: var(--deep-brown); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .asset-meta { font-size: 0.75rem; color: var(--text-muted); }
        .asset-card-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .asset-actions { display: flex; gap: 0.25rem; }
        .asset-chevron { font-size: 0.65rem; color: var(--text-muted); width: 16px; text-align: center; }
        .asset-detail { border-top: 1px solid var(--border-light); padding: 0.875rem; display: flex; flex-direction: column; gap: 0.875rem; background: var(--cream); }
        .asset-fields { display: flex; flex-direction: column; gap: 0.25rem; }
        .asset-field { display: flex; align-items: baseline; gap: 0.5rem; font-size: 0.8125rem; }
        .asset-field-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); width: 130px; flex-shrink: 0; }
        .asset-field-value { color: var(--text-primary); font-weight: 500; }
        .asset-serial { font-family: monospace; font-size: 0.8rem; }
        .asset-notes-section { display: flex; flex-direction: column; gap: 0.625rem; }
        .asset-notes-heading { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }
        .asset-note-add { display: flex; flex-direction: column; gap: 0.375rem; }
        .asset-note-input { padding: 0.5rem 0.625rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.8125rem; font-family: var(--font-body); background: white; color: var(--text-primary); width: 100%; box-sizing: border-box; resize: vertical; min-height: 56px; }
        .asset-note-input:focus { outline: none; border-color: var(--terracotta); }
        .asset-note-save-btn { align-self: flex-end; padding: 0.35rem 0.875rem; border-radius: 7px; border: none; background: var(--deep-brown); color: var(--cream); font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: background 0.15s; }
        .asset-note-save-btn:disabled { opacity: 0.4; cursor: default; }
        .asset-note-save-btn:not(:disabled):hover { background: var(--terracotta); }
        .asset-notes-empty { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; }
        .asset-notes-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .asset-note { background: white; border: 1px solid var(--border-light); border-radius: 8px; padding: 0.625rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .asset-note-header { display: flex; align-items: center; justify-content: space-between; }
        .asset-note-date { font-size: 0.7rem; font-weight: 600; color: var(--text-muted); }
        .asset-note-delete { background: none; border: none; cursor: pointer; font-size: 0.7rem; color: var(--text-muted); padding: 0.1rem 0.25rem; border-radius: 4px; transition: all 0.13s; }
        .asset-note-delete:hover { color: #dc2626; background: #fef2f2; }
        .asset-note-text { font-size: 0.8125rem; color: var(--text-primary); line-height: 1.55; white-space: pre-wrap; }
      `}</style>
    </div>
  )
}

function MortgageCard({
  mortgage, isOwner, deleting, onEdit, onDelete,
}: {
  mortgage: PropertyMortgage
  isOwner: boolean
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const expired = isMortgageExpired(mortgage.end_date)
  const expiringSoon = !expired && isMortgageExpiringSoon(mortgage.end_date)

  const cardClass = `mort-card${expired ? ' mort-expired' : expiringSoon ? ' mort-warning' : ''}`

  const fmtMoney = (v: number | null) =>
    v == null ? null : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(v)

  return (
    <div className={cardClass}>
      <div className="mort-card-header">
        <div className="mort-lender-block">
          <span className="mort-lender">{mortgage.lender}</span>
          {mortgage.product_type && (
            <span className="mort-product">{MORTGAGE_PRODUCT_LABELS[mortgage.product_type]}</span>
          )}
        </div>
        {isOwner && (
          <div className="mort-actions">
            <button className="mort-edit-btn" onClick={onEdit} disabled={deleting}>Edit</button>
            <button className="mort-delete-btn" onClick={onDelete} disabled={deleting}>🗑</button>
          </div>
        )}
      </div>

      <div className="mort-fields">
        {mortgage.interest_rate != null && (
          <MortgageField label="Rate" value={`${mortgage.interest_rate}%`} />
        )}
        {mortgage.monthly_payment != null && (
          <MortgageField label="Monthly" value={fmtMoney(mortgage.monthly_payment)!} />
        )}
        {mortgage.start_date && (
          <MortgageField label="Started" value={fmtDate(mortgage.start_date)} />
        )}
        {mortgage.end_date && (
          <MortgageField
            label={expired ? 'Ended' : 'Renews'}
            value={fmtDate(mortgage.end_date)}
            highlight={expired ? 'expired' : expiringSoon ? 'warning' : undefined}
          />
        )}
      </div>

      {expiringSoon && !expired && (
        <div className="mort-expiry-warning">
          ⚠ Renewal due within 3 months — consider remortgaging
        </div>
      )}

      {mortgage.notes && (
        <p className="mort-notes">{mortgage.notes}</p>
      )}

      <style>{`
        .mort-card { border: 1px solid var(--border-light); border-radius: 10px; padding: 0.875rem; background: var(--cream); display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0; }
        .mort-card.mort-expired { border-color: #d1d5db; background: #f9fafb; opacity: 0.8; }
        .mort-card.mort-warning { border-color: #fde68a; background: #fffef5; }
        .mort-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
        .mort-lender-block { display: flex; flex-direction: column; gap: 0.15rem; }
        .mort-lender { font-size: 1rem; font-weight: 700; color: var(--deep-brown); }
        .mort-product { font-size: 0.8rem; color: var(--text-secondary); }
        .mort-actions { display: flex; gap: 0.375rem; align-items: center; flex-shrink: 0; }
        .mort-edit-btn { font-size: 0.75rem; color: var(--text-muted); background: white; border: 1px solid var(--border); border-radius: 5px; padding: 0.2rem 0.5rem; cursor: pointer; font-family: var(--font-body); transition: all 0.12s; }
        .mort-edit-btn:hover { color: var(--deep-brown); border-color: var(--warm-brown); }
        .mort-edit-btn:disabled { opacity: 0.4; cursor: default; }
        .mort-delete-btn { font-size: 0.8rem; background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 0.2rem; transition: color 0.12s; }
        .mort-delete-btn:hover { color: #dc2626; }
        .mort-delete-btn:disabled { opacity: 0.4; cursor: default; }
        .mort-fields { display: flex; flex-wrap: wrap; gap: 0.375rem; }
        .mort-field { font-size: 0.75rem; background: white; padding: 0.2rem 0.5rem; border-radius: 5px; border: 1px solid var(--border-light); }
        .mort-field-label { color: var(--text-muted); margin-right: 0.25rem; }
        .mort-field-value { font-weight: 500; color: var(--text-primary); }
        .mort-field-value.expired { color: #6b7280; }
        .mort-field-value.warning { color: #b45309; font-weight: 700; }
        .mort-expiry-warning { font-size: 0.8rem; font-weight: 600; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 0.375rem 0.625rem; }
        .mort-notes { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; font-style: italic; border-top: 1px solid var(--border-light); padding-top: 0.375rem; }
      `}</style>
    </div>
  )
}

function MortgageField({ label, value, highlight }: { label: string; value: string; highlight?: 'expired' | 'warning' }) {
  return (
    <div className="mort-field">
      <span className="mort-field-label">{label}:</span>
      <span className={`mort-field-value ${highlight ?? ''}`}>{value}</span>
    </div>
  )
}

function MortSnapRow({ icon, label, value, status = 'ok' }: {
  icon: string; label: string; value: string; status?: 'ok' | 'warning' | 'expired'
}) {
  return (
    <div className={`mort-snap-row ${status}`}>
      <span className="mort-snap-icon">{icon}</span>
      <span className="mort-snap-label">{label}</span>
      <span className="mort-snap-value">{value}</span>
    </div>
  )
}

function CouncilTaxCard({
  record, isOwner, deleting, onEdit, onDelete,
}: {
  record: PropertyCouncilTax
  isOwner: boolean
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const todayMs = new Date().setHours(0, 0, 0, 0)
  const isExpired = record.period_end
    ? new Date(record.period_end + 'T00:00:00').getTime() < todayMs
    : false

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const fmtMoney = (v: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(v)

  return (
    <div className={`ct-card${isExpired ? ' ct-expired' : ''}`}>
      <div className="ct-card-header">
        <div className="ct-card-main">
          <span className="ct-card-council">{record.council_name}</span>
          <span className="ct-card-band">
            Band <span className="ct-card-band-badge">{record.band}</span>
          </span>
        </div>
        {isOwner && (
          <div className="ct-card-actions">
            <button className="mort-edit-btn" onClick={onEdit} disabled={deleting}>Edit</button>
            <button className="mort-delete-btn" onClick={onDelete} disabled={deleting}>🗑</button>
          </div>
        )}
      </div>

      <div className="mort-fields">
        {record.annual_charge != null && (
          <div className="mort-field">
            <span className="mort-field-label">Annual charge:</span>
            <span className="mort-field-value">{fmtMoney(record.annual_charge)}</span>
          </div>
        )}
        {record.period_start && (
          <div className="mort-field">
            <span className="mort-field-label">From:</span>
            <span className="mort-field-value">{fmt(record.period_start)}</span>
          </div>
        )}
        {record.period_end && (
          <div className="mort-field">
            <span className="mort-field-label">To:</span>
            <span className={`mort-field-value${isExpired ? ' expired' : ''}`}>{fmt(record.period_end)}</span>
          </div>
        )}
      </div>

      {record.notes && <p className="ct-card-notes">{record.notes}</p>}
    </div>
  )
}
