'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface CityResult {
  id: number
  name: string
  admin1: string | null
  country: string
  latitude: number
  longitude: number
  displayName: string
}

export interface CityValue {
  name: string
  lat: number
  lon: number
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Type a city, e.g. Paris, Dubai, New York…',
  inputClassName = '',
}: {
  value: CityValue | null
  onChange: (val: CityValue | null) => void
  placeholder?: string
  inputClassName?: string
}) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<CityResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync input if value changes externally
  useEffect(() => {
    setQuery(value?.name ?? '')
  }, [value?.name])

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=10&language=en&format=json`
      )
      const data = await res.json()
      const items: CityResult[] = (data.results ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        admin1: r.admin1 ?? null,
        country: r.country ?? '',
        latitude: r.latitude,
        longitude: r.longitude,
        displayName: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
      }))
      setResults(items)
      setOpen(items.length > 0)
      setActiveIdx(-1)
    } catch {}
    setLoading(false)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    // Clear value when user types
    if (value) onChange(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 280)
  }

  const handleSelect = (r: CityResult) => {
    setQuery(r.displayName)
    setResults([])
    setOpen(false)
    setActiveIdx(-1)
    onChange({ name: r.displayName, lat: r.latitude, lon: r.longitude })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(results[activeIdx]) }
    else if (e.key === 'Escape') { setOpen(false); setActiveIdx(-1) }
  }

  const handleBlur = () => {
    // Small delay so click on dropdown item registers first
    setTimeout(() => { setOpen(false); setActiveIdx(-1) }, 160)
  }

  const handleClear = () => {
    setQuery('')
    onChange(null)
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  const isSelected = !!value && query === value.name

  return (
    <div className="cac-wrap">
      <div className="cac-input-row">
        <input
          ref={inputRef}
          className={`cac-input ${inputClassName}`}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <span className="cac-spinner">⟳</span>}
        {isSelected && !loading && (
          <span className="cac-check" title="Destination set">✓</span>
        )}
        {query && !loading && (
          <button className="cac-clear" type="button" onMouseDown={handleClear} tabIndex={-1}>✕</button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="cac-dropdown">
          {results.map((r, i) => (
            <button
              key={r.id}
              className={`cac-item ${i === activeIdx ? 'active' : ''}`}
              type="button"
              onMouseDown={() => handleSelect(r)}
            >
              <span className="cac-item-name">{r.name}</span>
              <span className="cac-item-region">
                {[r.admin1, r.country].filter(Boolean).join(', ')}
              </span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        .cac-wrap { position: relative; width: 100%; }
        .cac-input-row { position: relative; display: flex; align-items: center; }
        .cac-input { padding: 0.4375rem 2.25rem 0.4375rem 0.625rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: var(--font-body); background: white; color: var(--text-primary); width: 100%; box-sizing: border-box; }
        .cac-input:focus { outline: none; border-color: var(--terracotta); }
        .cac-spinner { position: absolute; right: 0.625rem; color: var(--text-muted); font-size: 0.875rem; animation: spin 0.8s linear infinite; pointer-events: none; }
        .cac-check { position: absolute; right: 1.75rem; color: #16a34a; font-size: 0.875rem; font-weight: 700; pointer-events: none; }
        .cac-clear { position: absolute; right: 0.5rem; background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.75rem; padding: 0.25rem; line-height: 1; border-radius: 4px; }
        .cac-clear:hover { color: var(--deep-brown); background: var(--cream-dark); }
        .cac-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: white; border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 200; overflow: hidden; max-height: 260px; overflow-y: auto; }
        .cac-item { display: flex; align-items: baseline; gap: 0.5rem; width: 100%; padding: 0.5rem 0.875rem; text-align: left; background: none; border: none; cursor: pointer; font-family: var(--font-body); border-bottom: 1px solid var(--border-light); transition: background 0.1s; }
        .cac-item:last-child { border-bottom: none; }
        .cac-item:hover, .cac-item.active { background: var(--cream); }
        .cac-item-name { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); flex-shrink: 0; }
        .cac-item-region { font-size: 0.78rem; color: var(--text-muted); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
