import { useMemo, useState } from 'react'
import { Eye } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import PageToolbar from '../components/PageToolbar'
import QaReviewModal from '../components/QaReviewModal'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useTableFilter } from '../hooks/useTableFilter'

const savedViews = [
  { key: 'all', label: 'All QA reviews' },
  { key: 'mine', label: 'My reviews' },
  { key: 'awaiting', label: 'Awaiting review' },
  { key: 'returned', label: 'Returned for amendments' },
  { key: 'approved', label: 'Approved' },
]
const sortOptions = [
  { key: 'priority', label: 'Priority (highest)' },
  { key: 'due', label: 'Due date' },
  { key: 'submitted', label: 'Submission date' },
]

export default function QualityAssurance() {
  const { qaQueue } = usePrototypeData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savedView, setSavedView] = useState('all')
  const [sort, setSort] = useState('priority')

  const base = useMemo(() => qaQueue.filter((q) => {
    if (savedView === 'mine') return q.reviewer === 'Elaine Fitzgerald'
    if (savedView === 'awaiting') return q.status === 'Not Started' || q.status === 'In Review'
    if (savedView === 'returned') return q.status === 'Returned'
    if (savedView === 'approved') return q.status === 'Approved'
    return true
  }), [qaQueue, savedView])

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable } =
    useTableFilter(base, ['caseRef', 'patient', 'doctor', 'reviewer', 'reportType'], [
      { key: 'status', label: 'Review status', options: [...new Set(qaQueue.map((q) => q.status))] },
      { key: 'priority', label: 'Priority', options: [...new Set(qaQueue.map((q) => q.priority))] },
      { key: 'reviewer', label: 'Reviewer', options: [...new Set(qaQueue.map((q) => q.reviewer))] },
      { key: 'doctor', label: 'Doctor', options: [...new Set(qaQueue.map((q) => q.doctor))] },
    ])

  const priorityRank: Record<string, number> = { Urgent: 3, High: 2, Standard: 1 }
  const rows = useMemo(() => [...filtered].sort((a, b) => {
    if (sort === 'priority') return (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0)
    if (sort === 'due') return a.dueDate.localeCompare(b.dueDate)
    return b.submittedDate.localeCompare(a.submittedDate)
  }), [filtered, sort])

  const summary = [
    { label: 'Awaiting review', value: qaQueue.filter((q) => q.status === 'Not Started').length },
    { label: 'In review', value: qaQueue.filter((q) => q.status === 'In Review').length },
    { label: 'Returned for amendments', value: qaQueue.filter((q) => q.status === 'Returned').length },
    { label: 'Approved', value: qaQueue.filter((q) => q.status === 'Approved').length },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summary.map((s) => <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3.5"><p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase mb-1.5">{s.label}</p><p className="text-xl font-semibold text-slate-900">{s.value}</p></div>)}
      </div>

      <PageToolbar
        searchPlaceholder="Search QA by case, patient, doctor, report or reviewer..."
        searchValue={search}
        onSearchChange={setSearch}
        resultCount={rows.length}
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
        <div className="px-4 py-3 border-b border-slate-100"><p className="text-sm font-semibold text-slate-800">QA queue</p><p className="text-xs text-slate-400 mt-0.5">Open a review to access the report, checklist, comments, versions, supporting documents and approval history.</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1040px]">
            <thead><tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide"><th className="px-4 py-3 font-medium">Case</th><th className="px-4 py-3 font-medium">Patient</th><th className="px-4 py-3 font-medium">Doctor</th><th className="px-4 py-3 font-medium">Report type</th><th className="px-4 py-3 font-medium">Submitted</th><th className="px-4 py-3 font-medium">Due date</th><th className="px-4 py-3 font-medium">Priority</th><th className="px-4 py-3 font-medium">Reviewer</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((q) => <tr key={q.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-brand-600">{q.caseRef}</td><td className="px-4 py-3 text-slate-700">{q.patient}</td><td className="px-4 py-3 text-slate-600">{q.doctor}</td><td className="px-4 py-3 text-slate-600">{q.reportType}</td><td className="px-4 py-3 text-slate-500">{q.submittedDate}</td><td className="px-4 py-3 text-slate-500">{q.dueDate}</td><td className="px-4 py-3"><PriorityBadge priority={q.priority} /></td><td className="px-4 py-3 text-slate-600">{q.reviewer}</td><td className="px-4 py-3"><StatusBadge status={q.status} /></td><td className="px-4 py-3 text-right"><button onClick={() => setSelectedId(q.id)} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600"><Eye size={13} /> Review</button></td></tr>)}
              {rows.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">No QA items match the current view.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && <QaReviewModal qaId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
