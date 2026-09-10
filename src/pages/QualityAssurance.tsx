import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, UserRoundCog } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import PageToolbar from '../components/PageToolbar'
import QaReviewModal from '../components/QaReviewModal'
import Modal from '../components/Modal'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { roles, useRole } from '../context/RoleContext'
import { useToast } from '../context/ToastContext'
import { useTableFilter } from '../hooks/useTableFilter'
import { useNotifications } from '../context/NotificationContext'
import { transitionCaseForEvent } from '../utils/caseWorkflow'

const savedViews = [
  { key: 'all', label: 'All QA reviews' },
  { key: 'mine', label: 'My reviews' },
  { key: 'awaiting', label: 'New requests' },
  { key: 'inreview', label: 'In review' },
  { key: 'returned', label: 'Returned for amendments' },
  { key: 'approved', label: 'Approved' },
]
const sortOptions = [
  { key: 'priority', label: 'Priority (highest)' },
  { key: 'due', label: 'Due date' },
  { key: 'submitted', label: 'Submission date' },
]

export default function QualityAssurance() {
  const [searchParams] = useSearchParams()
  const scopedCase = searchParams.get('case') ?? ''
  const { qaQueue, updateQaItem, reports, updateReport, updateCase } = usePrototypeData()
  const { role } = useRole()
  const { pushNotification } = useNotifications()
  const { showToast } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savedView, setSavedView] = useState(searchParams.get('view') ?? 'all')
  const [sort, setSort] = useState('priority')
  const [assignId, setAssignId] = useState<string | null>(null)
  const [reviewerDraft, setReviewerDraft] = useState('')

  const base = useMemo(() => qaQueue.filter((q) => {
    if (scopedCase && q.caseRef !== scopedCase) return false
    if (savedView === 'mine') return q.reviewer === role.name || q.reviewer === 'Unassigned'
    if (savedView === 'awaiting') return q.status === 'Not Started'
    if (savedView === 'inreview') return q.status === 'In Review'
    if (savedView === 'returned') return q.status === 'Returned'
    if (savedView === 'approved') return q.status === 'Approved'
    return true
  }), [qaQueue, savedView, scopedCase, role.name])

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
    { label: 'New QA requests', value: qaQueue.filter((q) => q.status === 'Not Started' && (q.reviewer === role.name || q.reviewer === 'Unassigned')).length },
    { label: 'In review', value: qaQueue.filter((q) => q.status === 'In Review' && (q.reviewer === role.name || q.reviewer === 'Unassigned')).length },
    { label: 'Returned for amendments', value: qaQueue.filter((q) => q.status === 'Returned').length },
    { label: 'Approved', value: qaQueue.filter((q) => q.status === 'Approved').length },
  ]

  const scopedQaItem = scopedCase ? qaQueue.find((item) => item.caseRef === scopedCase) : undefined

  const canReview = role.id === 'quality-assurance'
  const canAssign = ['quality-assurance', 'operations-manager', 'system-administrator'].includes(role.id)
  const openReview = (qa: (typeof qaQueue)[number]) => {
    if (!canReview) {
      showToast('QA review actions are restricted to the Quality Assurance role.')
      return
    }
    if (qa.status === 'Not Started') {
      updateQaItem(qa.id, (current) => ({
        ...current,
        status: 'In Review',
        reviewHistory: [{ id: `QAH-${Date.now()}`, date: 'Just now', user: role.name, action: 'QA review started', detail: `QA review started by ${role.name}.` }, ...(current.reviewHistory ?? [])],
      }))
      const linkedReport = reports.find((report) => report.id === qa.reportId) ?? reports.find((report) => report.caseRef === qa.caseRef)
      if (linkedReport) updateReport(linkedReport.id, (current) => ({ ...current, qaStatus: 'In Review', lastUpdated: 'Just now' }))
      updateCase(qa.caseRef, (current) => transitionCaseForEvent(current, 'qa-review-started', role.name, 'Quality assurance review started'))
      pushNotification({
        title: 'QA review in progress', caseRef: qa.caseRef, type: 'QA review started', priority: qa.priority,
        actionPath: `/quality-assurance?case=${encodeURIComponent(qa.caseRef)}`, detail: `You started the ${qa.reportType} review. Complete the checklist, then approve or return it with amendments.`,
        recipientRoleIds: ['quality-assurance'], recipientNames: [role.name], dedupeKey: `workflow:qa:${qa.caseRef}`,
      })
      pushNotification({
        title: 'QA review started', caseRef: qa.caseRef, type: 'QA review started', priority: qa.priority,
        actionPath: `/cases/${qa.caseRef}`, detail: `${role.name} started QA review of ${qa.reportType}.`,
        recipientRoleIds: ['medical-expert'], recipientNames: [qa.doctor], dedupeKey: `workflow:doctor:${qa.caseRef}`,
      })
    }
    setSelectedId(qa.id)
  }

  return (
    <div className="space-y-5">
      {scopedQaItem ? <div className={`rounded-xl border p-4 ${scopedQaItem.status === 'Not Started' ? 'border-brand-200 bg-brand-50/70' : 'border-slate-200 bg-white'}`}><div className="flex items-center justify-between gap-4 flex-wrap"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">{scopedQaItem.status === 'Not Started' ? 'New QA request' : 'QA case context'}</p><p className="text-sm font-semibold text-slate-900 mt-1">{scopedQaItem.caseRef} · {scopedQaItem.patient}</p><p className="text-xs text-slate-500 mt-1">{scopedQaItem.reportType} · {scopedQaItem.doctor} · Reviewer {scopedQaItem.reviewer} · Due {scopedQaItem.dueDate}</p></div><div className="flex items-center gap-2"><PriorityBadge priority={scopedQaItem.priority}/><StatusBadge status={scopedQaItem.status}/>{canReview && scopedQaItem.status === 'Not Started' && <button onClick={() => openReview(scopedQaItem)} className="ml-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700">Start QA review</button>}{canReview && scopedQaItem.status === 'In Review' && <button onClick={() => openReview(scopedQaItem)} className="ml-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-700">Continue review</button>}</div></div></div> : scopedCase ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">No QA request is currently linked to <strong>{scopedCase}</strong>. Submit a draft report to QA before starting a review.</div> : null}
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
              {rows.map((q) => <tr key={q.id} className="hover:bg-slate-50"><td className="px-4 py-3"><Link to={`/cases/${q.caseRef}`} className="font-medium text-brand-600 hover:text-brand-700">{q.caseRef}</Link></td><td className="px-4 py-3 text-slate-700">{q.patient}</td><td className="px-4 py-3 text-slate-600">{q.doctor}</td><td className="px-4 py-3 text-slate-600">{q.reportType}</td><td className="px-4 py-3 text-slate-500">{q.submittedDate}</td><td className="px-4 py-3 text-slate-500">{q.dueDate}</td><td className="px-4 py-3"><PriorityBadge priority={q.priority} /></td><td className="px-4 py-3 text-slate-600">{q.reviewer}</td><td className="px-4 py-3"><StatusBadge status={q.status} /></td><td className="px-4 py-3 text-right"><div className="inline-flex items-center gap-2"><button onClick={() => openReview(q)} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600"><Eye size={13} /> {q.status === 'Not Started' ? 'Start review' : 'Open review'}</button>{canAssign && <button onClick={()=>{setAssignId(q.id);setReviewerDraft(q.reviewer==='Unassigned'?'':q.reviewer)}} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><UserRoundCog size={13}/>{q.reviewer==='Unassigned'?'Assign reviewer':'Reassign'}</button>}</div></td></tr>)}
              {rows.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 text-sm">No QA items match the current view.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && <QaReviewModal qaId={selectedId} onClose={() => setSelectedId(null)} />}
      {assignId && (()=>{const qa=qaQueue.find(item=>item.id===assignId);if(!qa)return null;const reviewers=roles.filter(item=>item.id==='quality-assurance');return <Modal title={qa.reviewer==='Unassigned'?'Assign reviewer':'Reassign QA review'} description={`${qa.caseRef} · ${qa.patient} · current reviewer: ${qa.reviewer}`} onClose={()=>setAssignId(null)}><div><label className="block text-xs font-medium text-slate-500 mb-1.5">Reviewer *</label><select value={reviewerDraft} onChange={e=>setReviewerDraft(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"><option value="">Select reviewer</option>{reviewers.map(item=><option key={item.id} value={item.name}>{item.name} · {item.title}</option>)}</select></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setAssignId(null)} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button disabled={!reviewerDraft} onClick={()=>{updateQaItem(qa.id,current=>({...current,reviewer:reviewerDraft,reviewHistory:[{id:`QAH-${Date.now()}`,date:'Just now',user:role.name,action:qa.reviewer==='Unassigned'?'Reviewer assigned':'Review reassigned',detail:`QA review assigned to ${reviewerDraft}.`},...(current.reviewHistory??[])]}));pushNotification({title:qa.reviewer==='Unassigned'?'QA review assigned':'QA review reassigned',caseRef:qa.caseRef,type:'Report submitted',priority:qa.priority,actionPath:`/quality-assurance?case=${encodeURIComponent(qa.caseRef)}`,detail:`${qa.reportType} is assigned to ${reviewerDraft}.`,recipientRoleIds:['quality-assurance'],recipientNames:[reviewerDraft],dedupeKey:`workflow:qa:${qa.caseRef}`});showToast(`QA review assigned to ${reviewerDraft}.`);setAssignId(null)}} className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg disabled:opacity-40">Confirm assignment</button></div></Modal>})()}
    </div>
  )
}
