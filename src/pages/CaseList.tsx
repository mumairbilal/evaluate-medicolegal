import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { cases as initialCases } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import PageToolbar from '../components/PageToolbar'
import NewCaseModal from '../components/NewCaseModal'
import { useTableFilter } from '../hooks/useTableFilter'
import { FileText, CheckSquare, MessageSquareWarning } from 'lucide-react'
import type { CaseRecord } from '../types'

export default function CaseList() {
  const [cases, setCases] = useState<CaseRecord[]>(initialCases)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModalOpen(true)
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable, tableSortOptions, activeTableSort, setActiveTableSort } =
    useTableFilter(cases, ['ref', 'patient', 'client', 'clientRef', 'doctor'], [
      {
        key: 'status',
        label: 'Status',
        options: [...new Set(cases.map((c) => c.status))],
      },
      {
        key: 'priority',
        label: 'Priority',
        options: ['Standard', 'High', 'Urgent'],
      },
      {
        key: 'owner',
        label: 'Owner',
        options: [...new Set(cases.map((c) => c.owner))],
      },
    ])

  return (
    <div>
      <PageToolbar
        searchPlaceholder="Search cases by reference, patient, or client..."
        searchValue={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
        actionLabel="Create case"
        onAction={() => setModalOpen(true)}
        filterDefs={filterDefs}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateFilterAvailable={dateFilterAvailable}
        sortOptions={tableSortOptions}
        activeSort={activeTableSort}
        onSortChange={setActiveTableSort}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Case reference</th>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Target date</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.ref} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/cases/${c.ref}`} className="font-medium text-brand-600">
                    {c.ref}
                  </Link>
                  <p className="text-xs text-slate-400">{c.clientRef}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{c.patient}</td>
                <td className="px-4 py-3 text-slate-600">{c.client}</td>
                <td className="px-4 py-3 text-slate-600">{c.doctor}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-slate-600">{c.owner}</td>
                <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                <td className="px-4 py-3 text-slate-500">{c.targetDate}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1 text-xs"><FileText size={12} />{c.documents}</span>
                    <span className="flex items-center gap-1 text-xs"><CheckSquare size={12} />{c.tasks}</span>
                    {c.qaComments > 0 && (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <MessageSquareWarning size={12} />{c.qaComments}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-sm">
                  No cases match your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {modalOpen && (
        <NewCaseModal
          existingCases={cases}
          onClose={() => setModalOpen(false)}
          onOpenExisting={(c) => { setModalOpen(false); navigate(`/cases/${c.ref}`) }}
          onCreate={(c) => {
            setCases((prev) => [c, ...prev])
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
