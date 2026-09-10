import { useRef, useState } from 'react'
import { Search, SlidersHorizontal, Plus, X, ArrowUpDown, Bookmark, Download, Check, CalendarRange, Save } from 'lucide-react'
import type { ReactNode } from 'react'
import type { FilterDef } from '../hooks/useTableFilter'
import { useDismissable } from '../hooks/useDismissable'

export interface SortOption { key: string; label: string }
export interface SavedView { key: string; label: string }
type CustomSavedView = { key: string; label: string; search: string; filters: Record<string,string[]>; sort?: string; dateRange?: {from:string;to:string} }

export default function PageToolbar<T extends Record<string, any> = any>({
  searchPlaceholder, searchValue, onSearchChange, resultCount, actionLabel, onAction, extra,
  filterDefs, activeFilters, onToggleFilter, onClearFilters, activeFilterCount,
  sortOptions, activeSort, onSortChange, savedViews, activeSavedView, onSelectSavedView, onExport,
  dateRange, onDateRangeChange, dateFilterAvailable = false,
}: {
  searchPlaceholder: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  resultCount?: number
  actionLabel?: string
  onAction?: () => void
  extra?: ReactNode
  filterDefs?: FilterDef<T>[]
  activeFilters?: Record<string, string[]>
  onToggleFilter?: (key: string, value: string) => void
  onClearFilters?: () => void
  activeFilterCount?: number
  sortOptions?: SortOption[]
  activeSort?: string
  onSortChange?: (key: string) => void
  savedViews?: SavedView[]
  activeSavedView?: string
  onSelectSavedView?: (key: string) => void
  onExport?: () => void
  dateRange?: {from:string;to:string}
  onDateRangeChange?: (range:{from:string;to:string}) => void
  dateFilterAvailable?: boolean
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [viewsOpen, setViewsOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const storageKey = `evaluate-saved-views:${searchPlaceholder}`
  const [customViews, setCustomViews] = useState<CustomSavedView[]>(() => {
    try { const raw=localStorage.getItem(storageKey); return raw ? JSON.parse(raw) : [] } catch { return [] }
  })
  const filtersRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const viewsRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  useDismissable(filtersRef, filtersOpen, () => setFiltersOpen(false))
  useDismissable(sortRef, sortOpen, () => setSortOpen(false))
  useDismissable(viewsRef, viewsOpen, () => setViewsOpen(false))
  useDismissable(dateRef, dateOpen, () => setDateOpen(false))
  const hasFilters = filterDefs && filterDefs.length > 0

  const saveCurrentView = () => {
    const name=saveName.trim(); if(!name) return
    const view:CustomSavedView={key:`custom-${Date.now()}`,label:name,search:searchValue??'',filters:activeFilters??{},sort:activeSort,dateRange}
    const next=[...customViews,view]; setCustomViews(next); localStorage.setItem(storageKey,JSON.stringify(next)); setSaveName('')
  }
  const applyCustomView=(view:CustomSavedView)=>{
    onSearchChange?.(view.search); onClearFilters?.()
    Object.entries(view.filters).forEach(([key,values])=>values.forEach(value=>onToggleFilter?.(key,value)))
    if(view.sort)onSortChange?.(view.sort)
    if(view.dateRange)onDateRangeChange?.(view.dateRange)
    setViewsOpen(false)
  }

  return (
    <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder={searchPlaceholder} value={searchValue ?? ''} onChange={(e) => onSearchChange?.(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
        </div>

        {hasFilters && <div className="relative" ref={filtersRef}><button onClick={()=>setFiltersOpen(v=>!v)} className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 ${(activeFilterCount??0)>0?'border-brand-500 text-brand-700 bg-brand-50':'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><SlidersHorizontal size={14}/> Filters {(activeFilterCount??0)>0&&<span className="ml-0.5 bg-brand-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>}</button>{filtersOpen&&<div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 py-3 text-sm z-30"><div className="flex items-center justify-between px-4 pb-2"><p className="font-medium text-slate-800">Filters</p><button onClick={()=>setFiltersOpen(false)} className="text-slate-400"><X size={14}/></button></div><div className="max-h-72 overflow-y-auto">{filterDefs!.map(fd=><div key={String(fd.key)} className="px-4 py-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 mb-1.5">{fd.label}</p><div className="space-y-1">{fd.options.map(opt=><label key={opt} className="flex items-center gap-2 text-slate-700 cursor-pointer"><input type="checkbox" checked={activeFilters?.[String(fd.key)]?.includes(opt)??false} onChange={()=>onToggleFilter?.(String(fd.key),opt)} className="rounded border-slate-300 text-brand-600"/>{opt}</label>)}</div></div>)}</div><div className="px-4 pt-2 border-t border-slate-100"><button onClick={()=>onClearFilters?.()} className="text-xs text-slate-500 hover:text-slate-700 font-medium">Clear all filters</button></div></div>}</div>}

        {dateFilterAvailable && onDateRangeChange && <div className="relative" ref={dateRef}><button onClick={()=>setDateOpen(v=>!v)} className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 ${(dateRange?.from||dateRange?.to)?'border-brand-500 bg-brand-50 text-brand-700':'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><CalendarRange size={14}/> Date range</button>{dateOpen&&<div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 p-3 z-30"><label className="block text-[11px] font-semibold text-slate-500 mb-1">From</label><input type="date" value={dateRange?.from??''} onChange={e=>onDateRangeChange({from:e.target.value,to:dateRange?.to??''})} className="w-full border rounded-md px-2 py-1.5 text-sm mb-2"/><label className="block text-[11px] font-semibold text-slate-500 mb-1">To</label><input type="date" value={dateRange?.to??''} onChange={e=>onDateRangeChange({from:dateRange?.from??'',to:e.target.value})} className="w-full border rounded-md px-2 py-1.5 text-sm"/><button onClick={()=>onDateRangeChange({from:'',to:''})} className="text-xs text-slate-500 mt-2">Clear date range</button></div>}</div>}

        <div className="relative" ref={viewsRef}><button onClick={()=>setViewsOpen(v=>!v)} className="flex items-center gap-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50"><Bookmark size={14}/> {savedViews?.find(v=>v.key===activeSavedView)?.label ?? 'Saved views'}</button>{viewsOpen&&<div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 py-2 text-sm z-30">{savedViews?.map(v=><button key={v.key} onClick={()=>{onSelectSavedView?.(v.key);setViewsOpen(false)}} className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-brand-50/60 hover:text-brand-700 text-slate-700">{v.label}{activeSavedView===v.key&&<Check size={14} className="text-brand-600"/>}</button>)}{customViews.length>0&&<><div className="border-t border-slate-100 my-1"/><p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">My saved views</p>{customViews.map(v=><div key={v.key} className="flex items-center"><button onClick={()=>applyCustomView(v)} className="flex-1 text-left px-3 py-1.5 hover:bg-brand-50/60 hover:text-brand-700 text-slate-700">{v.label}</button><button onClick={()=>{const next=customViews.filter(x=>x.key!==v.key);setCustomViews(next);localStorage.setItem(storageKey,JSON.stringify(next))}} className="p-2 text-slate-300 hover:text-red-500"><X size={13}/></button></div>)}</>}<div className="border-t border-slate-100 mt-1 p-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Save current view</p><div className="flex gap-1.5"><input value={saveName} onChange={e=>setSaveName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveCurrentView()}} placeholder="View name" className="min-w-0 flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-xs"/><button onClick={saveCurrentView} disabled={!saveName.trim()} className="px-2 rounded-md bg-brand-600 text-white disabled:opacity-40"><Save size={13}/></button></div></div></div>}</div>

        {sortOptions&&sortOptions.length>0&&<div className="relative" ref={sortRef}><button onClick={()=>setSortOpen(v=>!v)} className="flex items-center gap-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50"><ArrowUpDown size={14}/> {sortOptions.find(s=>s.key===activeSort)?.label??'Sort'}</button>{sortOpen&&<div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 py-2 text-sm z-30">{sortOptions.map(s=><button key={s.key} onClick={()=>{onSortChange?.(s.key);setSortOpen(false)}} className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-brand-50/60 hover:text-brand-700 text-slate-700">{s.label}{activeSort===s.key&&<Check size={14} className="text-brand-600"/>}</button>)}</div>}</div>}

        {onExport&&<button onClick={onExport} className="flex items-center gap-1.5 text-sm border border-slate-200 text-slate-600 rounded-lg px-3 py-2 hover:bg-slate-50"><Download size={14}/> Export</button>}
        {resultCount!==undefined&&<span className="text-xs text-slate-400 ml-1">{resultCount} results</span>}{extra}
      </div>
      {actionLabel&&<button onClick={onAction} className="self-start shrink-0 flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow-md"><Plus size={16}/> {actionLabel}</button>}
    </div>
  )
}
