import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Trash2 } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PageToolbar from '../components/PageToolbar'
import CreateReportModal from '../components/CreateReportModal'
import ReportWorkspaceModal from '../components/ReportWorkspaceModal'
import DeleteRecordModal from '../components/DeleteRecordModal'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useTableFilter } from '../hooks/useTableFilter'
import { useRole } from '../context/RoleContext'
import { useToast } from '../context/ToastContext'
import type { ReportItem } from '../types'
import InlineIconAction from '../components/InlineIconAction'

const sortOptions = [
  { key: 'updated', label: 'Last updated (recent)' },
  { key: 'due', label: 'Due date' },
  { key: 'case', label: 'Case reference' },
]
const savedViews = [
  { key: 'all', label: 'All reports' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'qa', label: 'Awaiting / in QA' },
  { key: 'amendments', label: 'Amendments required' },
  { key: 'approved', label: 'Approved reports' },
]

function exportCsv(rows: any[]) {
  const headers = ['Case reference', 'Patient', 'Doctor', 'Report type', 'Version', 'Report status', 'QA status', 'Due date', 'Last updated', 'Assigned user']
  const data = rows.map((r) => [r.caseRef, r.patient, r.doctor, r.reportType, r.version, r.status, r.qaStatus, r.dueDate, r.lastUpdated, r.assignedUser ?? ''])
  const csv = [headers, ...data].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'evaluate-reports.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}

export default function Reports() {
  const { reports, qaQueue, removeReport } = usePrototypeData()
  const { role } = useRole()
  const { showToast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sort, setSort] = useState('updated')
  const [savedView, setSavedView] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<ReportItem | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const canDeleteReportRole = ['booking-administrator', 'operations-manager', 'system-administrator'].includes(role.id)
  const canCreateReport = ['medical-expert', 'file-preparation'].includes(role.id)
  useEffect(() => {
    const reportId = searchParams.get('report')
    if (reportId && reports.some((item) => item.id === reportId)) setSelectedId(reportId)
  }, [searchParams, reports])

  const closeWorkspace = () => {
    setSelectedId(null)
    if (searchParams.has('report')) {
      const next = new URLSearchParams(searchParams)
      next.delete('report')
      setSearchParams(next, { replace: true })
    }
  }

  const savedFiltered = useMemo(() => reports.filter((report) => {
    if (savedView === 'drafts') return report.status === 'Draft'
    if (savedView === 'qa') return report.status === 'Submitted for QA' || report.qaStatus === 'In Review'
    if (savedView === 'amendments') return report.status === 'Amendments Required'
    if (savedView === 'approved') return report.status === 'Approved' || report.status === 'Delivered'
    return true
  }), [reports, savedView])

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable } =
    useTableFilter(savedFiltered, ['caseRef', 'patient', 'doctor', 'reportType', 'assignedUser'], [
      { key: 'status', label: 'Report status', options: [...new Set(reports.map((r) => r.status))] },
      { key: 'qaStatus', label: 'QA status', options: [...new Set(reports.map((r) => r.qaStatus))] },
      { key: 'doctor', label: 'Doctor', options: [...new Set(reports.map((r) => r.doctor))] },
    ])

  const rows = useMemo(() => [...filtered].sort((a, b) => {
    if (sort === 'case') return a.caseRef.localeCompare(b.caseRef)
    if (sort === 'due') return a.dueDate.localeCompare(b.dueDate)
    return b.id.localeCompare(a.id)
  }), [filtered, sort])

  return (
    <div>
      <PageToolbar
        searchPlaceholder="Search reports by case, patient, doctor, type or assignee..."
        searchValue={search}
        onSearchChange={setSearch}
        resultCount={rows.length}
        actionLabel={canCreateReport ? "Create report" : undefined}
        onAction={canCreateReport ? () => setCreateOpen(true) : undefined}
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
        savedViews={savedViews}
        activeSavedView={savedView}
        onSelectSavedView={setSavedView}
        onExport={() => exportCsv(rows)}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Report register</p>
          <p className="text-xs text-slate-400 mt-0.5">Report name/version opens the report workspace. Case reference opens the central case record.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1120px]">
            <thead><tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Case</th><th className="px-4 py-3 font-medium">Patient</th><th className="px-4 py-3 font-medium">Doctor</th><th className="px-4 py-3 font-medium">Report type</th><th className="px-4 py-3 font-medium">Version</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">QA status</th><th className="px-4 py-3 font-medium">Due date</th><th className="px-4 py-3 font-medium">Last updated</th><th className="px-4 py-3 font-medium">Assigned user</th><th className="px-4 py-3 font-medium text-right">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><Link to={`/cases/${r.caseRef}`} className="font-medium text-brand-600 hover:text-brand-700" title={`Open case ${r.caseRef}`}>{r.caseRef}</Link></td><td className="px-4 py-3 text-slate-700">{r.patient || 'Not recorded'}</td><td className="px-4 py-3 text-slate-600">{r.doctor || 'Unassigned'}</td><td className="px-4 py-3 text-slate-600"><button onClick={() => setSelectedId(r.id)} className="font-medium text-left hover:text-brand-700" title={`Open ${r.reportType} ${r.version}`}>{r.reportType || 'Untitled report'}</button></td><td className="px-4 py-3 text-slate-500"><button onClick={() => setSelectedId(r.id)} className="hover:text-brand-700" title={`Open report ${r.id}`}>{r.version || 'Version not recorded'}</button></td><td className="px-4 py-3"><StatusBadge status={r.status} /></td><td className="px-4 py-3"><StatusBadge status={r.qaStatus} /></td><td className="px-4 py-3 text-slate-500">{r.dueDate || 'Not set'}</td><td className="px-4 py-3 text-slate-500">{r.lastUpdated || 'Not recorded'}</td><td className="px-4 py-3 text-slate-600">{r.assignedUser ?? r.doctor ?? 'Unassigned'}</td><td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-1"><InlineIconAction label={`Open report ${r.id}`} icon={<Eye size={14}/>} onClick={() => setSelectedId(r.id)} tone="brand" />{canDeleteReportRole && r.status === 'Draft' && <InlineIconAction label={`Delete draft report ${r.id}`} icon={<Trash2 size={14}/>} onClick={() => setDeleteTarget(r)} tone="danger" />}</div></td>
              </tr>)}
              {rows.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-slate-400 text-sm">No reports match the current search, filters or saved view.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && <DeleteRecordModal
        title="Delete draft report"
        recordName={`${deleteTarget.caseRef} · ${deleteTarget.reportType} · ${deleteTarget.version}`}
        impact="This permanently removes the unsubmitted draft from the prototype report register."
        blockedReason={qaQueue.some((item) => item.reportId === deleteTarget.id) ? 'This draft has QA history and must be retained for auditability.' : undefined}
        confirmLabel="Delete draft report"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          removeReport(deleteTarget.id)
          showToast(`Draft report ${deleteTarget.caseRef} removed.`)
          setDeleteTarget(null)
        }}
      />}

      {createOpen && <CreateReportModal onClose={() => setCreateOpen(false)} />}
      {selectedId && <ReportWorkspaceModal reportId={selectedId} onClose={closeWorkspace} />}
    </div>
  )
}
