import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarClock, ChevronLeft, ChevronRight, Eye, Pencil, FolderPlus, XCircle } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import PageToolbar from '../components/PageToolbar'
import InlineIconAction from '../components/InlineIconAction'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setModalOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])
  const [sort, setSort] = useState('bookingDate-desc')
  const [savedView, setSavedView] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { showToast } = useToast()
  const bookingRows = useMemo(() => bookings.map((b) => ({ ...b, appointmentStatus: b.status === 'Cancelled' ? 'Cancelled' : b.appointmentDate === '—' ? 'Not Scheduled' : 'Scheduled' })), [bookings])

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable } =
    useTableFilter(bookingRows, ['ref', 'patient', 'client', 'doctor'], [
      { key: 'status', label: 'Booking status', options: [...new Set(bookings.map((b) => b.status))] },
      { key: 'appointmentStatus', label: 'Appointment status', options: ['Scheduled','Not Scheduled','Cancelled'] },
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

  useEffect(() => { setPage(1) }, [search, activeFilters, dateRange.from, dateRange.to, savedView, sort])

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

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

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
          <table className="w-full min-w-[980px] table-fixed text-sm">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead><tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wide">
              <th className="px-3 py-2.5 font-medium">Booking reference</th>
              <th className="px-3 py-2.5 font-medium">Patient name</th>
              <th className="px-3 py-2.5 font-medium">Client</th>
              <th className="px-3 py-2.5 font-medium">Doctor</th>
              <th className="px-3 py-2.5 font-medium">Dates</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Owner</th>
              <th className="px-3 py-2.5 font-medium">Priority</th>
              <th className="px-3 py-2.5 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((b) => <tr key={b.ref} className="hover:bg-slate-50/70 align-top">
                <td className="px-3 py-3 truncate"><Link to={`/bookings/${b.ref}`} className="font-semibold text-brand-600 hover:text-brand-700">{b.ref}</Link><p className="text-[11px] text-slate-400 mt-1 truncate">{b.source}</p>{b.missingInformation === 'Yes' && <span className="inline-flex mt-1 text-[10px] font-medium text-amber-700">Missing info</span>}</td>
                <td className="px-3 py-3 font-medium text-slate-800 truncate">{b.patient}</td>
                <td className="px-3 py-3 text-slate-600 truncate" title={b.client}>{b.client}</td>
                <td className="px-3 py-3 text-slate-600 truncate" title={b.doctor}>{b.doctor}</td>
                <td className="px-3 py-3 text-slate-500 text-[12px] leading-4">
                  <p className="truncate">Booked {b.bookingDate}</p>
                  <p className="truncate flex items-center gap-1 mt-0.5"><CalendarClock size={11}/>{b.appointmentDate === '—' ? 'Not scheduled' : b.appointmentDate}</p>
                </td>
                <td className="px-3 py-3"><StatusBadge status={b.status}/></td>
                <td className="px-3 py-3 text-slate-600 truncate" title={b.owner}>{b.owner}</td>
                <td className="px-3 py-3"><PriorityBadge priority={b.priority}/></td>
                <td className="px-3 py-3 text-right"><div className="inline-flex items-center justify-end gap-0.5">
                  <InlineIconAction to={`/bookings/${b.ref}`} label={`Open booking ${b.ref}`} icon={<Eye size={14}/>} tone="brand" />
                  {b.status !== 'Cancelled' && b.status !== 'Converted to Case' && <InlineIconAction to={`/bookings/${b.ref}?action=edit`} label={`Edit booking ${b.ref}`} icon={<Pencil size={14}/>} />}
                  {b.status !== 'Cancelled' && b.status !== 'Converted to Case' && <InlineIconAction to={`/bookings/${b.ref}?action=schedule`} label={`${b.appointmentDate === '—' ? 'Schedule' : 'Reschedule'} appointment for ${b.ref}`} icon={<CalendarClock size={14}/>} />}
                  {b.status !== 'Cancelled' && b.status !== 'Converted to Case' && <InlineIconAction to={`/bookings/${b.ref}?action=convert`} label={`Create case from ${b.ref}`} icon={<FolderPlus size={14}/>} />}
                  {b.status !== 'Cancelled' && b.status !== 'Converted to Case' && <InlineIconAction to={`/bookings/${b.ref}?action=cancel`} label={`Cancel booking ${b.ref}`} icon={<XCircle size={14}/>} tone="danger" />}
                </div></td>
              </tr>)}
              {paged.length === 0 && <tr><td colSpan={9} className="px-4 py-9 text-center text-slate-400 text-sm">No bookings match the current search or filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {sorted.length > pageSize && <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs text-slate-500">Showing {(page-1)*pageSize+1}–{Math.min(page*pageSize,sorted.length)} of {sorted.length}</p><div className="flex items-center gap-2"><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40"><ChevronLeft size={13}/> Previous</button><span className="text-xs font-medium text-slate-600">Page {page} of {pageCount}</span><button onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={page===pageCount} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40">Next <ChevronRight size={13}/></button></div></div>}

      {modalOpen && <NewBookingModal existingBookings={bookings} existingCount={bookings.length} onClose={() => setModalOpen(false)} onCreate={(b) => { addBooking(b); setModalOpen(false); showToast(b.status === 'Draft' ? 'Booking saved as draft.' : 'Booking created successfully. Continue the workflow from the booking record.'); navigate(`/bookings/${b.ref}`) }} />}
    </div>
  )
}
