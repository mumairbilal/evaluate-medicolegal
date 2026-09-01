import { useMemo, useState } from 'react'
import { Mail, Phone, StickyNote, MessageCircle, Bell, Paperclip, Eye } from 'lucide-react'
import PageToolbar from '../components/PageToolbar'
import AddCommunicationModal from '../components/AddCommunicationModal'
import CommunicationDetailsModal from '../components/CommunicationDetailsModal'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useTableFilter } from '../hooks/useTableFilter'

const icons: Record<string, any> = {
  Email: Mail,
  'Phone Call': Phone,
  'Internal Note': StickyNote,
  Client: MessageCircle,
  Patient: MessageCircle,
  Doctor: MessageCircle,
  'System Notification': Bell,
}

const savedViews = [
  { key: 'all', label: 'All communication' },
  { key: 'internal', label: 'Internal notes' },
  { key: 'external', label: 'External communication' },
  { key: 'system', label: 'System activity' },
]
const sortOptions = [
  { key: 'recent', label: 'Most recent' },
  { key: 'case', label: 'Case reference' },
  { key: 'type', label: 'Communication type' },
]

export default function Communication() {
  const { communications } = usePrototypeData()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savedView, setSavedView] = useState('all')
  const [sort, setSort] = useState('recent')

  const visible = useMemo(() => communications.filter((item) => {
    if (savedView === 'internal') return item.internal && item.type !== 'System Notification'
    if (savedView === 'external') return !item.internal
    if (savedView === 'system') return item.type === 'System Notification'
    return true
  }), [communications, savedView])

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable } =
    useTableFilter(visible, ['caseRef', 'from', 'to', 'subject', 'summary'], [
      { key: 'type', label: 'Communication type', options: [...new Set(communications.map((c) => c.type))] },
      { key: 'caseRef', label: 'Case', options: [...new Set(communications.map((c) => c.caseRef))] },
    ])

  const rows = useMemo(() => [...filtered].sort((a, b) => {
    if (sort === 'case') return a.caseRef.localeCompare(b.caseRef)
    if (sort === 'type') return a.type.localeCompare(b.type)
    return b.id.localeCompare(a.id)
  }), [filtered, sort])

  return (
    <div>
      <PageToolbar
        searchPlaceholder="Search communication by case, sender, recipient, subject or notes..."
        searchValue={search}
        onSearchChange={setSearch}
        resultCount={rows.length}
        actionLabel="Add communication"
        onAction={() => setAddOpen(true)}
        filterDefs={filterDefs}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateFilterAvailable={dateFilterAvailable}
        savedViews={savedViews}
        activeSavedView={savedView}
        onSelectSavedView={setSavedView}
        sortOptions={sortOptions}
        activeSort={sort}
        onSortChange={setSort}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100"><p className="text-sm font-semibold text-slate-800">Communication timeline</p><p className="text-xs text-slate-400 mt-0.5">Emails, calls, internal notes, patient/client/doctor contact and system activity are recorded together with clear visibility labels.</p></div>
        <div className="p-4 space-y-1">
          {rows.map((c, index) => {
            const Icon = icons[c.type] ?? MessageCircle
            return <div key={c.id} className="group flex gap-3 py-3 relative">
              {index < rows.length - 1 && <div className="absolute left-[15px] top-10 bottom-[-12px] w-px bg-slate-100" />}
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 relative z-[1]"><Icon size={14} className="text-slate-500" /></div>
              <div className="flex-1 border-b border-slate-100 pb-4 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium text-slate-800">{c.subject}</p>{c.internal && <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Internal Only</span>}{!c.internal && <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">External</span>}{c.attachment && <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Paperclip size={10} /> {c.attachment}</span>}</div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.from} → {c.to} · <span className="text-brand-600 font-medium">{c.caseRef}</span> · {c.type}</p>
                  </div>
                  <div className="flex items-center gap-3"><span className="text-xs text-slate-400">{c.date}</span><button onClick={() => setSelectedId(c.id)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 opacity-70 group-hover:opacity-100"><Eye size={12} /> Details</button></div>
                </div>
                <p className="text-sm text-slate-600 mt-1.5 leading-6">{c.summary}</p>
                {c.followUpTaskId && <p className="text-[11px] text-brand-600 mt-1.5">Follow-up task linked: {c.followUpTaskId}</p>}
              </div>
            </div>
          })}
          {rows.length === 0 && <p className="text-center text-slate-400 text-sm py-10">No communication matches the current search, filters or view.</p>}
        </div>
      </div>

      {addOpen && <AddCommunicationModal onClose={() => setAddOpen(false)} />}
      {selectedId && <CommunicationDetailsModal communicationId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
