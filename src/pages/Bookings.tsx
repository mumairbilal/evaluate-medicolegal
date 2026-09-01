import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import PageToolbar from '../components/PageToolbar'
import NewBookingModal from '../components/NewBookingModal'
import { useTableFilter } from '../hooks/useTableFilter'
import { useToast } from '../context/ToastContext'
import { usePrototypeData } from '../context/PrototypeDataContext'

const sortOptions = [
  { key: 'bookingDate-desc', label: 'Booking date (newest)' },
  { key: 'bookingDate-asc', label: 'Booking date (oldest)' },
  { key: 'appointmentDate-asc', label: 'Appointment date (soonest)' },
  { key: 'patient-asc', label: 'Patient name (A-Z)' },
  { key: 'priority-desc', label: 'Priority (high to low)' },
]
const savedViewDefs = [
  { key: 'all', label: 'All bookings' },
  { key: 'my-bookings', label: 'My bookings' },
  { key: 'missing-info', label: 'Missing information' },
  { key: 'unscheduled', label: 'Awaiting scheduling' },
]
const priorityRank: Record<string, number> = { Urgent: 3, High: 2, Standard: 1 }

export default function Bookings() {
  const { bookings, addBooking } = usePrototypeData()
  const [modalOpen, setModalOpen] = useState(false)
  const [sort, setSort] = useState('bookingDate-desc')
  const [savedView, setSavedView] = useState('all')
  const { showToast } = useToast()

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable } =
    useTableFilter(bookings, ['ref', 'patient', 'client', 'doctor'], [
      { key: 'status', label: 'Status', options: [...new Set(bookings.map((b) => b.status))] },
      { key: 'bookingDate', label: 'Booking date', options: [...new Set(bookings.map((b) => b.bookingDate))] },
      { key: 'appointmentDate', label: 'Appointment date', options: [...new Set(bookings.map((b) => b.appointmentDate))] },
      { key: 'doctor', label: 'Doctor', options: [...new Set(bookings.map((b) => b.doctor))] },
      { key: 'client', label: 'Client', options: [...new Set(bookings.map((b) => b.client))] },
      { key: 'owner', label: 'Owner', options: [...new Set(bookings.map((b) => b.owner))] },
      { key: 'caseType', label: 'Case type', options: [...new Set(bookings.map((b) => b.caseType))] },
      { key: 'priority', label: 'Priority', options: [...new Set(bookings.map((b) => b.priority))] },
      { key: 'missingInformation', label: 'Missing information', options: ['Yes', 'No'] },
      { key: 'source', label: 'Booking source', options: [...new Set(bookings.map((b) => b.source))] },
    ])

  const viewed = useMemo(() => {
    if (savedView === 'missing-info') return filtered.filter((b) => b.missingInformation === 'Yes')
    if (savedView === 'unscheduled') return filtered.filter((b) => b.appointmentDate === '—' && b.status !== 'Cancelled')
    if (savedView === 'my-bookings') return filtered.filter((b) => b.owner !== 'Unassigned')
    return filtered
  }, [filtered, savedView])

  const sorted = useMemo(() => {
    const list = [...viewed]
    const [key, dir] = sort.split('-')
    list.sort((a: any, b: any) => {
      let av = a[key]
      let bv = b[key]
      if (key === 'priority') { av = priorityRank[a.priority] ?? 0; bv = priorityRank[b.priority] ?? 0 }
      if (av === bv) return 0
      const cmp = av > bv ? 1 : -1
      return dir === 'desc' ? -cmp : cmp
    })
    return list
  }, [viewed, sort])


  const exportBookings = () => {
    const headers = ['Reference','Patient','Client','Doctor','Booking date','Appointment date','Status','Owner','Priority','Source','Case type','Missing information']
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = sorted.map((b) => [b.ref,b.patient,b.client,b.doctor,b.bookingDate,b.appointmentDate,b.status,b.owner,b.priority,b.source,b.caseType,b.missingInformation])
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    showToast(`${sorted.length} booking${sorted.length === 1 ? '' : 's'} exported as CSV.`)
  }

  return (
    <div className="space-y-4">
      <PageToolbar
        searchPlaceholder="Search bookings by reference, patient, client or doctor..."
        searchValue={search}
        onSearchChange={setSearch}
        resultCount={sorted.length}
        actionLabel="Create booking"
        onAction={() => setModalOpen(true)}
        filterDefs={filterDefs}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateFilterAvailable={dateFilterAvailable}
        sortOptions={sortOptions}
        activeSort={sort}
        onSortChange={setSort}
        savedViews={savedViewDefs}
        activeSavedView={savedView}
        onSelectSavedView={setSavedView}
        onExport={exportBookings}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold text-slate-900">Booking register</h2><p className="text-xs text-slate-400 mt-0.5">Core instruction, appointment and ownership details in one view.</p></div>
          <span className="text-xs text-slate-400">{sorted.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-2.5 font-medium">Reference</th>
              <th className="px-4 py-2.5 font-medium">Patient / Client</th>
              <th className="px-4 py-2.5 font-medium">Dates</th>
              <th className="px-4 py-2.5 font-medium">Expert / Owner</th>
              <th className="px-4 py-2.5 font-medium">Case type</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((b) => <tr key={b.ref} className="hover:bg-slate-50/70 align-top">
                <td className="px-4 py-3"><Link to={`/bookings/${b.ref}`} className="font-semibold text-brand-600 hover:text-brand-700">{b.ref}</Link><p className="text-[11px] text-slate-400 mt-1">{b.source}</p></td>
                <td className="px-4 py-3"><p className="font-medium text-slate-800">{b.patient}</p><p className="text-xs text-slate-500 mt-0.5">{b.client}</p>{b.missingInformation === 'Yes' && <span className="inline-flex mt-1 text-[10px] font-medium text-amber-700">Missing information</span>}</td>
                <td className="px-4 py-3"><p className="text-xs text-slate-700">Booked {b.bookingDate}</p><p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1"><CalendarClock size={12}/>{b.appointmentDate === '—' ? 'Not scheduled' : b.appointmentDate}</p></td>
                <td className="px-4 py-3"><p className="text-xs text-slate-700">{b.doctor}</p><p className="text-[11px] text-slate-400 mt-1">Owner: {b.owner}</p></td>
                <td className="px-4 py-3 text-xs text-slate-600 max-w-[190px]">{b.caseType}</td>
                <td className="px-4 py-3"><PriorityBadge priority={b.priority}/></td>
                <td className="px-4 py-3"><StatusBadge status={b.status}/></td>
                <td className="px-4 py-3 text-right"><Link to={`/bookings/${b.ref}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">Open <ArrowRight size={13}/></Link></td>
              </tr>)}
              {sorted.length === 0 && <tr><td colSpan={8} className="px-4 py-9 text-center text-slate-400 text-sm">No bookings match the current search or filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <NewBookingModal existingBookings={bookings} existingCount={bookings.length} onClose={() => setModalOpen(false)} onCreate={(b) => { addBooking(b); setModalOpen(false); showToast(b.status === 'Draft' ? 'Booking saved as draft.' : 'Booking created successfully.') }} />}
    </div>
  )
}
