import { useMemo, useState } from 'react'

export interface FilterDef<T> {
  key: keyof T
  label: string
  options: string[]
}

function parseDate(value: unknown): number | null {
  const raw = String(value ?? '').trim()
  if (!raw || raw === '—' || /just now|today|yesterday|ago|week|month/i.test(raw)) return null
  const iso = Date.parse(raw)
  if (Number.isNaN(iso)) return null
  return iso
}

export function useTableFilter<T extends Record<string, any>>(
  data: T[],
  searchKeys: (keyof T)[],
  filterDefs: FilterDef<T>[]
) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [activeTableSort, setActiveTableSort] = useState('default')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[key] ?? []
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [key]: next }
    })
  }

  const clearFilters = () => { setActiveFilters({}); setDateRange({ from: '', to: '' }) }
  const activeFilterCount = Object.values(activeFilters).reduce((sum, v) => sum + v.length, 0) + (dateRange.from || dateRange.to ? 1 : 0)
  const primarySortKey = searchKeys[0]
  const tableSortOptions = [
    { key: 'default', label: 'Default order' },
    { key: 'az', label: 'A–Z' },
    { key: 'za', label: 'Z–A' },
  ]

  const inferredDateKey = useMemo(() => {
    const first = data[0]
    if (!first) return null
    const keys = Object.keys(first)
    const preferred = ['bookingDate','appointmentDate','uploadDate','dueDate','lastUpdated','targetDate','submittedDate','createdAt','date','lastActivity','lastLogin']
    return preferred.find((key) => keys.includes(key)) ?? keys.find((key) => /date|updated|activity|login/i.test(key)) ?? null
  }, [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = dateRange.from ? new Date(`${dateRange.from}T00:00:00`).getTime() : null
    const to = dateRange.to ? new Date(`${dateRange.to}T23:59:59`).getTime() : null
    const rows = data.filter((item) => {
      const matchesSearch = q === '' || searchKeys.some((k) => String(item[k] ?? '').toLowerCase().includes(q))
      const matchesFilters = Object.entries(activeFilters).every(([key, values]) => {
        if (!values || values.length === 0) return true
        return values.includes(String(item[key as keyof T]))
      })
      let matchesDate = true
      if (inferredDateKey && (from || to)) {
        const parsed = parseDate(item[inferredDateKey])
        if (parsed !== null) matchesDate = (!from || parsed >= from) && (!to || parsed <= to)
      }
      return matchesSearch && matchesFilters && matchesDate
    })
    if (activeTableSort === 'default' || !primarySortKey) return rows
    return [...rows].sort((a, b) => {
      const av = String(a[primarySortKey] ?? '').toLocaleLowerCase()
      const bv = String(b[primarySortKey] ?? '').toLocaleLowerCase()
      return activeTableSort === 'az' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [data, search, activeFilters, searchKeys, activeTableSort, primarySortKey, dateRange, inferredDateKey])

  return {
    search, setSearch, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, filterDefs,
    tableSortOptions, activeTableSort, setActiveTableSort,
    dateRange, setDateRange, dateFilterAvailable: Boolean(inferredDateKey && data.some((item) => parseDate(item[inferredDateKey]) !== null)), inferredDateKey,
  }
}
