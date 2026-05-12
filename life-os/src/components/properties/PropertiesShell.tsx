'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Property, PropertyPurchase } from '@/types/properties'
import { ShareRecord } from '@/components/tasks/SharePanel'
import NavBar from '../NavBar'
import PropertiesList from './PropertiesList'
import PropertyDetail from './PropertyDetail'
import PropertyForm from './PropertyForm'

export default function PropertiesShell({
  initialProperties,
  initialShares,
  userId,
  profile,
}: {
  initialProperties: Property[]
  initialShares: Record<string, ShareRecord[]>
  userId: string
  profile: { full_name: string | null; avatar_url: string | null } | null
}) {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [shares, setShares] = useState<Record<string, ShareRecord[]>>(initialShares)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [purchase, setPurchase] = useState<PropertyPurchase | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)

  const refreshProperties = useCallback(async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('is_primary_residence', { ascending: false })
      .order('name', { ascending: true })
    if (data) setProperties(data as Property[])
  }, [supabase])

  const refreshShares = useCallback(async (propertyId: string) => {
    const { data } = await (supabase as any)
      .from('property_shares')
      .select('id, shared_with_email, created_at')
      .eq('property_id', propertyId)
      .eq('owner_id', userId)
    setShares(prev => ({ ...prev, [propertyId]: data ?? [] }))
  }, [supabase, userId])

  const loadPurchase = useCallback(async (propertyId: string) => {
    const { data } = await (supabase as any)
      .from('property_purchase')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle()
    setPurchase(data ?? null)
  }, [supabase])

  const handleSavePurchase = useCallback(async (data: Omit<PropertyPurchase, 'id' | 'created_at' | 'updated_at'>) => {
    await (supabase as any)
      .from('property_purchase')
      .upsert(data, { onConflict: 'property_id' })
    await loadPurchase(data.property_id)
  }, [supabase, loadPurchase])

  const handleSelectProperty = useCallback((property: Property) => {
    setSelectedProperty(property)
    loadPurchase(property.id)
    if (property.user_id === userId) {
      refreshShares(property.id)
    }
  }, [userId, refreshShares, loadPurchase])

  const handleSaved = useCallback(async (property?: Property) => {
    await refreshProperties()
    setShowForm(false)
    setEditingProperty(null)
    if (property) {
      const { data } = await supabase.from('properties').select('*').eq('id', property.id).single()
      if (data) setSelectedProperty(data as Property)
    }
  }, [refreshProperties, supabase])

  const handleDelete = useCallback(async (propertyId: string) => {
    await supabase.from('properties').delete().eq('id', propertyId)
    setSelectedProperty(null)
    setPurchase(null)
    await refreshProperties()
  }, [supabase, refreshProperties])

  return (
    <div className="properties-shell">
      <NavBar profile={profile} />

      <div className="properties-body">
        <PropertiesList
          properties={properties}
          userId={userId}
          selectedId={selectedProperty?.id ?? null}
          onSelectProperty={handleSelectProperty}
          onNewProperty={() => { setEditingProperty(null); setShowForm(true) }}
        />

        {selectedProperty ? (
          <PropertyDetail
            property={selectedProperty}
            userId={userId}
            shares={shares[selectedProperty.id] ?? []}
            purchase={purchase}
            onSharesChanged={() => refreshShares(selectedProperty.id)}
            onSavePurchase={handleSavePurchase}
            onEdit={() => { setEditingProperty(selectedProperty); setShowForm(true) }}
            onDelete={() => handleDelete(selectedProperty.id)}
            onClose={() => { setSelectedProperty(null); setPurchase(null) }}
          />
        ) : (
          <div className="properties-empty">
            <span className="empty-icon">🏠</span>
            <p className="empty-title">Select a property</p>
            <p className="empty-desc">Choose a property from the list, or add a new one.</p>
          </div>
        )}
      </div>

      {showForm && (
        <PropertyForm
          userId={userId}
          property={editingProperty}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditingProperty(null) }}
        />
      )}

      <style>{`
        .properties-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--cream);
          overflow: hidden;
        }
        .properties-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .properties-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--text-muted);
        }
        .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .empty-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--deep-brown);
        }
        .empty-desc { font-size: 0.9rem; }
      `}</style>
    </div>
  )
}
