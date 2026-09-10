import { useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Download, FileClock, FileText, History, MessageSquarePlus, Send, Upload, PackageCheck, Trash2 } from 'lucide-react'
import Modal from './Modal'
import StatusBadge from './StatusBadge'
import DeleteRecordModal from './DeleteRecordModal'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useRole } from '../context/RoleContext'
import { useToast } from '../context/ToastContext'
import { useNotifications } from '../context/NotificationContext'
import type { CommunicationItem, QaQueueItem, ReportComment, ReportItem, ReportVersion } from '../types'
import { transitionCaseForEvent } from '../utils/caseWorkflow'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

function nextVersion(version: string) {
  const number = Number.parseInt(version.replace(/\D/g, ''), 10) || 1
  return `v${number + 1}`
}

function toInputDate(value?: string) {
  if (!value || value === '—') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  const yyyy = parsed.getFullYear()
  const mm = String(parsed.getMonth() + 1).padStart(2, '0')
  const dd = String(parsed.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDate(value: string) {
  if (!value) return '—'
  const [yyyy, mm, dd] = value.split('-').map(Number)
  if (!yyyy || !mm || !dd) return value
  return new Date(yyyy, mm - 1, dd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function ReportWorkspaceModal({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const {
    reports, updateReport, removeReport, qaQueue, addQaItem, updateQaItem, documents, addCommunication, cases, updateCase,
  } = usePrototypeData()
  const { role, roles } = useRole()
  const { showToast } = useToast()
  const { pushNotification } = useNotifications()
  const report = reports.find((item) => item.id === reportId)
  const [content, setContent] = useState(report?.content ?? '')
  const [comment, setComment] = useState('')
  const [submitQaOpen, setSubmitQaOpen] = useState(false)
  const [qaReviewer, setQaReviewer] = useState('')
  const [qaPriority, setQaPriority] = useState<QaQueueItem['priority']>('Standard')
  const [qaDueDate, setQaDueDate] = useState('')
  const [qaNotes, setQaNotes] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)
  const [requestRecipient, setRequestRecipient] = useState('Client case handler')
  const [requestSubject, setRequestSubject] = useState('Further information required for report')
  const [requestMessage, setRequestMessage] = useState('Please provide the outstanding information required to complete the report.')
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [doctorApproved, setDoctorApproved] = useState(report?.doctorApproved ?? false)
  const [declaration, setDeclaration] = useState(report?.approvalDeclaration ?? false)
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [deliveryRecipient, setDeliveryRecipient] = useState(report?.deliveryRecipient ?? 'Client case handler')
  const [deliveryMethod, setDeliveryMethod] = useState(report?.deliveryMethod ?? 'Secure email')
  const [deliveryDate, setDeliveryDate] = useState(toInputDate(report?.deliveryDate) || '2026-09-01')
  const [deliveryNotes, setDeliveryNotes] = useState(report?.deliveryNotes ?? '')
  const [deliveryAttachment, setDeliveryAttachment] = useState(report?.deliveryAttachment ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  const caseRecord = cases.find((item) => item.ref === report?.caseRef)
  const sourceDocs = useMemo(() => report ? documents.filter((doc) => report.sourceDocumentIds?.includes(doc.id) || doc.caseRef === report.caseRef) : [], [documents, report])
  const qaItem = qaQueue.find((item) => item.reportId === report?.id || item.caseRef === report?.caseRef)
  const qaReviewers = roles.filter((item) => item.id === 'quality-assurance')

  if (!report) return null

  const versions = report.versions ?? []
  const comments = report.comments ?? []
  const hasChanges = content !== (report.content ?? '')
  const returnedComments = qaItem?.comments ?? []
  const hasQaHistory = qaQueue.some((item) => item.reportId === report.id)
  const canDeleteRole = ['booking-administrator', 'operations-manager', 'system-administrator'].includes(role.id) || (role.id === 'medical-expert' && report.doctor === role.name)
  const deleteBlockedReason = !canDeleteRole
    ? 'Your current role does not have permission to delete report records.'
    : report.status !== 'Draft'
      ? `Only unsubmitted draft reports can be deleted. This report is ${report.status} and its version / approval history must be preserved.`
      : hasQaHistory
        ? 'This draft already has QA history linked to it, so it must be retained for auditability.'
        : undefined

  const save = (summary = 'Draft content saved') => {
    if (!canEditReport) { showToast('This report is read-only for your current role.'); return }
    const changed = content !== (report.content ?? '')
    updateReport(report.id, (current) => ({
      ...current,
      content,
      saveStatus: 'Saved',
      lastUpdated: 'Just now',
      versions: changed ? (current.versions ?? []).map((version, index) => index === 0 ? { ...version, content, changeSummary: summary, date: 'Just now' } : version) : current.versions,
    }))
    showToast(`Report ${report.caseRef} saved.`)
  }

  const addComment = () => {
    if (!canEditReport) { showToast('Report comments can only be added by the assigned medical expert or authorised file-preparation user.'); return }
    if (!comment.trim()) return
    const item: ReportComment = { id: `RC-${Date.now()}`, author: role.name, date: 'Just now', text: comment.trim() }
    updateReport(report.id, (current) => ({ ...current, comments: [item, ...(current.comments ?? [])], lastUpdated: 'Just now' }))
    setComment('')
  }

  const openSubmitQa = () => {
    if (!isAuthorisedReportPreparer) { showToast('Submitting a report to QA is restricted to the assigned medical expert or authorised file-preparation user.'); return }
    if (!reportEditingOpen) { showToast('This submitted or approved report version is locked. Wait for the QA outcome before editing or resubmitting.'); return }
    if (unresolvedQaAmendments.length > 0) { showToast(`Resolve all ${unresolvedQaAmendments.length} outstanding QA amendment${unresolvedQaAmendments.length === 1 ? '' : 's'} before resubmitting.`); return }
    setQaReviewer(qaItem?.reviewer && qaItem.reviewer !== 'Unassigned' ? qaItem.reviewer : (qaReviewers[0]?.name ?? ''))
    setQaPriority(qaItem?.priority ?? caseRecord?.priority ?? 'Standard')
    setQaDueDate(toInputDate(qaItem?.dueDate ?? report.dueDate))
    setQaNotes('')
    setSubmitQaOpen(true)
  }

  const submitQa = () => {
    if (!qaReviewer.trim() || !qaDueDate) {
      showToast('Assigned reviewer and QA due date are required.')
      return
    }
    const isResubmission = report.status === 'Amendments Required' || qaItem?.status === 'Returned'
    const version = isResubmission ? nextVersion(report.version) : report.version
    const formattedDueDate = formatDate(qaDueDate)
    const historyDetail = qaNotes.trim() ? `${version} submitted for QA review. Notes: ${qaNotes.trim()}` : `${version} submitted for QA review.`
    updateReport(report.id, (current) => {
      const submittedVersion: ReportVersion = {
        version, date: 'Just now', author: role.name, status: 'Submitted for QA',
        changeSummary: isResubmission ? 'Amendments completed and new version submitted for QA' : 'Report submitted for QA',
        qaOutcome: 'Awaiting QA review', content,
      }
      return {
        ...current,
        version,
        content,
        dueDate: formattedDueDate,
        status: 'Submitted for QA',
        qaStatus: 'Not Started',
        saveStatus: 'Saved',
        lastUpdated: 'Just now',
        versions: isResubmission ? [submittedVersion, ...(current.versions ?? [])] : (current.versions ?? []).map((item, index) => index === 0 ? submittedVersion : item),
      }
    })
    if (qaItem) {
      updateQaItem(qaItem.id, (current) => ({
        ...current,
        reportId: report.id,
        status: 'Not Started',
        submittedDate: 'Just now',
        dueDate: formattedDueDate,
        priority: qaPriority,
        reviewer: qaReviewer.trim(),
        reviewHistory: [{ id: `QAH-${Date.now()}`, date: 'Just now', user: role.name, action: isResubmission ? 'Report resubmitted' : 'Report submitted for QA', detail: historyDetail }, ...(current.reviewHistory ?? [])],
      }))
    } else {
      const item: QaQueueItem = {
        id: `QA-${Date.now()}`,
        reportId: report.id,
        caseRef: report.caseRef,
        patient: report.patient,
        doctor: report.doctor,
        reportType: report.reportType,
        submittedDate: 'Just now',
        dueDate: formattedDueDate,
        priority: qaPriority,
        reviewer: qaReviewer.trim(),
        status: 'Not Started',
        reviewHistory: [{ id: `QAH-${Date.now()}`, date: 'Just now', user: role.name, action: isResubmission ? 'Report resubmitted' : 'Report submitted for QA', detail: historyDetail }],
      }
      addQaItem(item)
    }
    updateCase(report.caseRef, (current) => transitionCaseForEvent(current, 'report-draft-submitted', role.name, `${version} submitted to the QA queue`))
    pushNotification({
      title: 'New report awaiting QA review',
      caseRef: report.caseRef,
      type: 'Report submitted',
      priority: qaPriority,
      actionPath: `/quality-assurance?case=${encodeURIComponent(report.caseRef)}`,
      detail: `${role.name} submitted ${version} for QA review. Reviewer: ${qaReviewer.trim()}. Due ${formattedDueDate}.`,
      recipientRoleIds: ['quality-assurance'],
      recipientNames: [qaReviewer.trim()],
      dedupeKey: `workflow:qa:${report.caseRef}`,
    })
    setSubmitQaOpen(false)
    showToast(`Report ${report.caseRef} submitted to the QA queue.`)
  }

  const isAuthorisedReportPreparer = (role.id === 'medical-expert' && report.doctor === role.name) || role.id === 'file-preparation'
  const reportEditingOpen = ['Draft', 'Amendments Required'].includes(report.status)
  const canEditReport = isAuthorisedReportPreparer && reportEditingOpen
  const unresolvedQaAmendments = returnedComments.filter((item) => !item.resolved)
  const canSubmitQa = canEditReport && unresolvedQaAmendments.length === 0
  const isQaResubmission = report.status === 'Amendments Required' || qaItem?.status === 'Returned'
  const canFinalApprove = role.id === 'medical-expert' && report.doctor === role.name
  const canRecordDelivery = ['booking-administrator', 'operations-manager'].includes(role.id)
  const approveFinal = () => {
    if (!canFinalApprove) { showToast(`Final medical approval is restricted to the assigned medical expert (${report.doctor}).`); return }
    if (report.qaStatus !== 'Approved') { showToast('Final approval is only available after QA approval.'); return }
    setApprovalOpen(true)
  }
  const confirmFinalApproval = () => {
    if (!doctorApproved || !declaration) { showToast('Doctor approval and the final declaration are required.'); return }
    updateReport(report.id, (current) => ({ ...current, content, status: 'Approved', doctorApproved: true, approvalDeclaration: true, finalApprovedAt: 'Just now', lastUpdated: 'Just now', versions: (current.versions ?? []).map((version, index) => index === 0 ? { ...version, content, status: 'Approved', qaOutcome: 'QA approved — final version', date: 'Just now' } : version) }))
    updateCase(report.caseRef, (current) => transitionCaseForEvent(current, 'final-approved', role.name, `Final ${report.version} medically approved`))
    pushNotification({ title: 'Final report approved', caseRef: report.caseRef, type: 'Report approved', priority: caseRecord?.priority ?? 'Standard', actionPath: `/reports?report=${encodeURIComponent(report.id)}`, detail: `${role.name} completed final medical approval. The approved report is ready for secure delivery.`, recipientRoleIds: ['operations-manager', 'booking-administrator'], dedupeKey: `workflow:ops:${report.caseRef}` })
    setApprovalOpen(false); showToast(`Final report approved for ${report.caseRef}.`)
  }
  const confirmDelivery = () => {
    if (!canRecordDelivery) { showToast('Report delivery can only be recorded by Booking Administration or Operations.'); return }
    if (!deliveryRecipient.trim() || !deliveryDate) { showToast('Recipient and delivery date are required.'); return }
    updateReport(report.id, (current) => ({ ...current, status: 'Delivered', deliveredAt: 'Just now', deliveryRecipient: deliveryRecipient.trim(), deliveryMethod, deliveryDate: formatDate(deliveryDate), deliveryNotes: deliveryNotes.trim(), deliveryAttachment, lastUpdated: 'Just now', versions: (current.versions ?? []).map((version, index) => index === 0 ? { ...version, status: 'Delivered', changeSummary: 'Approved final report delivered', date: 'Just now' } : version) }))
    updateCase(report.caseRef, (current) => transitionCaseForEvent(current, 'report-delivered', role.name, `Final ${report.version} delivered to ${deliveryRecipient.trim()}`))
    pushNotification({ title: 'Final report delivered', caseRef: report.caseRef, type: 'Report delivered', priority: caseRecord?.priority ?? 'Standard', actionPath: `/reports?report=${encodeURIComponent(report.id)}`, detail: `The final report was delivered to ${deliveryRecipient.trim()} by ${deliveryMethod}. The case can be completed once remaining tasks are closed.`, recipientRoleIds: ['operations-manager', 'booking-administrator', 'management'], dedupeKey: `workflow:ops:${report.caseRef}` })
    setDeliveryOpen(false); showToast(`Report delivery recorded for ${report.caseRef}. Case workflow moved to Report Delivered.`)
  }

  const uploadVersion = (file: File | undefined) => {
    if (!file) return
    if (!canEditReport) { showToast('This report is read-only for your current role.'); return }
    const allowed = /\.(doc|docx|pdf|txt)$/i.test(file.name)
    if (!allowed) {
      showToast('Upload a DOC, DOCX, PDF or TXT report file.')
      return
    }
    const version = nextVersion(report.version)
    const record: ReportVersion = {
      version,
      date: 'Just now',
      author: role.name,
      status: 'Draft',
      changeSummary: `Uploaded new version from ${file.name}`,
      qaOutcome: 'Not submitted',
      content,
      fileName: file.name,
    }
    updateReport(report.id, (current) => ({ ...current, version, status: 'Draft', qaStatus: 'Not Started', lastUpdated: 'Just now', versions: [record, ...(current.versions ?? [])] }))
    if (caseRecord?.status === 'Amendments Required') updateCase(report.caseRef, (current) => transitionCaseForEvent(current, 'report-created', role.name, `${version} prepared after QA amendments`))
    showToast(`${version} uploaded for ${report.caseRef}.`)
    if (uploadRef.current) uploadRef.current.value = ''
  }

  const requestInformation = () => {
    if (!requestMessage.trim() || !requestRecipient.trim()) return
    const item: CommunicationItem = {
      id: `C-${Date.now()}`,
      caseRef: report.caseRef,
      type: 'Email',
      from: role.name,
      to: requestRecipient.trim(),
      date: 'Just now',
      subject: requestSubject.trim() || 'Further information required',
      summary: requestMessage.trim(),
      internal: false,
    }
    addCommunication(item)
    setRequestOpen(false)
    showToast(`Information request recorded for ${report.caseRef}.`)
  }

  const markResolved = (commentId: string) => {
    if (!qaItem) return
    const target = (qaItem.comments ?? []).find((item) => item.id === commentId)
    if (target && !target.resolved && !target.resolutionResponse?.trim()) {
      showToast('Add a resolution response before marking this QA amendment resolved.')
      return
    }
    updateQaItem(qaItem.id, (current) => ({ ...current, comments: (current.comments ?? []).map((item) => item.id === commentId ? { ...item, resolved: !item.resolved } : item) }))
  }

  const updateResolutionResponse = (commentId: string, resolutionResponse: string) => {
    if (!qaItem) return
    updateQaItem(qaItem.id, (current) => ({ ...current, comments: (current.comments ?? []).map((item) => item.id === commentId ? { ...item, resolutionResponse, resolved: false } : item) }))
  }

  return (
    <Modal title="Report workspace" description={`${report.caseRef} · ${report.patient} · ${report.reportType}`} onClose={onClose} width="max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={report.status} />
          <StatusBadge status={report.qaStatus} />
          <span className="text-xs text-slate-500">{report.version} · Due {report.dueDate}</span>
          <span className={`text-xs font-medium ${hasChanges ? 'text-amber-600' : 'text-teal-600'}`}>{hasChanges ? 'Unsaved changes' : 'Saved'}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {canEditReport ? <>
            <button onClick={() => save()} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50">Save draft</button>
            <input ref={uploadRef} type="file" accept=".doc,.docx,.pdf,.txt" className="hidden" onChange={(e) => uploadVersion(e.target.files?.[0])} />
            <button onClick={() => uploadRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50"><Upload size={13} /> Upload new version</button>
            <button disabled={!canSubmitQa} onClick={openSubmitQa} title={unresolvedQaAmendments.length > 0 ? 'Resolve every QA amendment first.' : undefined} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed"><Send size={13} /> {isQaResubmission ? 'Resubmit for QA' : 'Submit for QA'}</button>
          </> : <span className="text-xs text-slate-500">{isAuthorisedReportPreparer && !reportEditingOpen ? 'Submitted version locked while QA / approval is in progress' : 'Read-only workflow view'}</span>}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_330px] gap-4">
        <div className="space-y-4 min-w-0">
          {report.status === 'Amendments Required' && returnedComments.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-2">QA amendments</p>
              <div className="space-y-2">
                {returnedComments.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/70 border border-amber-100 px-3 py-2">
                    <div>
                      <div className="flex items-center gap-2"><span className="text-xs font-medium text-slate-700">{item.severity ?? 'Moderate'} severity</span>{item.resolved && <span className="text-[10px] bg-teal-100 text-teal-700 rounded-full px-1.5 py-0.5">Resolved</span>}</div>
                      <p className="text-sm text-slate-600 mt-1">{item.text}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{item.author} · {item.date}</p>
                      <label className="block text-[11px] font-medium text-slate-500 mt-2">Resolution response *</label>
                      <textarea rows={2} readOnly={!canEditReport} className={`${field} mt-1 min-w-[260px] ${!canEditReport ? 'bg-slate-50' : ''}`} value={item.resolutionResponse ?? ''} onChange={(e) => updateResolutionResponse(item.id, e.target.value)} placeholder={canEditReport ? 'Describe how the amendment was resolved in the updated report version' : 'Resolution response'} />
                    </div>
                    {canEditReport && <button onClick={() => markResolved(item.id)} className="text-xs font-medium text-brand-600 hover:text-brand-700 shrink-0">{item.resolved ? 'Reopen' : 'Mark resolved'}</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2"><FileText size={16} className="text-brand-600" /><p className="text-sm font-semibold text-slate-800">Report content</p></div>
              <span className="text-xs text-slate-400">Editable working document</span>
            </div>
            <textarea value={content} readOnly={!canEditReport} onChange={(e) => setContent(e.target.value)} className={`w-full min-h-[520px] resize-y border-0 px-5 py-4 text-sm leading-7 text-slate-700 font-mono focus:outline-none ${!canEditReport ? 'bg-slate-50/60 cursor-default' : ''}`} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3"><MessageSquarePlus size={15} className="text-slate-500" /><p className="text-sm font-semibold text-slate-800">Comments</p></div>
            <div className="flex gap-2">
              <input disabled={!canEditReport} value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} className={field} placeholder={canEditReport ? 'Add a report comment...' : 'Read-only for your current role'} />
              <button disabled={!canEditReport} onClick={addComment} className="px-3 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg disabled:opacity-40">Add</button>
            </div>
            <div className="mt-3 space-y-2">
              {comments.length === 0 && <p className="text-xs text-slate-400">No report comments yet.</p>}
              {comments.map((item) => <div key={item.id} className="border-l-2 border-slate-200 pl-3"><p className="text-sm text-slate-600">{item.text}</p><p className="text-[11px] text-slate-400 mt-0.5">{item.author} · {item.date}</p></div>)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <InfoCard title="Case summary">
            <InfoRow label="Case" value={report.caseRef} />
            <InfoRow label="Patient" value={report.patient} />
            <InfoRow label="Doctor" value={report.doctor} />
            <InfoRow label="Assigned user" value={report.assignedUser ?? report.doctor} />
            <InfoRow label="Template" value={report.template ?? 'Standard Medicolegal Report'} />
          </InfoCard>

          <InfoCard title="Source documents">
            {sourceDocs.length === 0 && <p className="text-xs text-slate-400">No source documents linked.</p>}
            {sourceDocs.slice(0, 8).map((doc) => <div key={doc.id} className="py-1.5 border-b border-slate-100 last:border-0"><p className="text-xs font-medium text-slate-700 truncate">{doc.name}</p><p className="text-[11px] text-slate-400">{doc.category} · {doc.version}</p></div>)}
          </InfoCard>

          <InfoCard title="Workflow actions">
            {canEditReport && <button onClick={() => setRequestOpen(true)} className="w-full text-left text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Request information</button>}
            {report.status !== 'Delivered' && <button onClick={approveFinal} disabled={!canFinalApprove || report.qaStatus !== 'Approved'} title={!canFinalApprove ? `Restricted to ${report.doctor}` : report.qaStatus !== 'Approved' ? 'QA approval is required first.' : undefined} className="w-full inline-flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-brand-50/40 hover:border-brand-200 disabled:opacity-45 disabled:cursor-not-allowed"><CheckCircle2 size={13} /> Approve final report</button>}
            {report.status === 'Approved' && canRecordDelivery && <button onClick={() => setDeliveryOpen(true)} className="w-full inline-flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-brand-50/40 hover:border-brand-200"><PackageCheck size={13} /> Record report delivery</button>}
            <button onClick={() => downloadText(`${report.caseRef}-${report.version}-report.txt`, content)} className="w-full inline-flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"><Download size={13} /> Download current version</button>
            {canDeleteRole && <button onClick={() => setDeleteOpen(true)} className="w-full inline-flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"><Trash2 size={13} /> Delete report</button>}
          </InfoCard>

          <InfoCard title="Version history" icon={<History size={14} />}>
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div key={`${version.version}-${index}`} className={`rounded-lg border p-2.5 ${index === 0 ? 'border-brand-200 bg-brand-50/40' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">{version.version}{index === 0 ? ' · Current' : ''}{version.status === 'Approved' ? ' · Approved final' : ''}</span><span className="text-[10px] text-slate-400">{version.date}</span></div>
                  <p className="text-[11px] text-slate-500 mt-1">{version.author} · {version.status}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{version.changeSummary}</p>
                  <p className="text-[10px] text-slate-400 mt-1">QA: {version.qaOutcome}</p>
                  <button onClick={() => downloadText(`${report.caseRef}-${version.version}-report.txt`, version.content)} className="text-[11px] text-brand-600 font-medium mt-1.5">Download / preview</button>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>
      </div>


      {submitQaOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink-900/30" onClick={() => setSubmitQaOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2"><Send size={16} className="text-brand-600" /><h3 className="text-sm font-semibold text-slate-900">{isQaResubmission ? 'Resubmit report for QA' : 'Submit report for QA'}</h3></div>
            <p className="mt-1 text-xs text-slate-500">Confirm the report version, reviewer, priority and QA deadline before it enters the review queue.</p>
            <div className="mt-4 space-y-3">
              <div><label className={label}>Report version</label><input className={`${field} bg-slate-50`} value={report.status === 'Amendments Required' ? nextVersion(report.version) : report.version} disabled /></div>
              <div><label className={label}>Assigned reviewer *</label><select className={field} value={qaReviewer} onChange={(e) => setQaReviewer(e.target.value)}><option value="">Select reviewer</option>{qaReviewers.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.title}</option>)}</select></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className={label}>Priority *</label><select className={field} value={qaPriority} onChange={(e) => setQaPriority(e.target.value as QaQueueItem['priority'])}><option>Standard</option><option>High</option><option>Urgent</option></select></div>
                <div><label className={label}>Due date *</label><input type="date" className={field} value={qaDueDate} onChange={(e) => setQaDueDate(e.target.value)} /></div>
              </div>
              <div><label className={label}>Notes</label><textarea rows={3} className={field} value={qaNotes} onChange={(e) => setQaNotes(e.target.value)} placeholder="Optional instructions for the QA reviewer" /></div>
              <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2.5 text-xs text-brand-900">Submitting confirms that this version is ready for QA. It will be added to the reviewer queue using the deadline above.</div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setSubmitQaOpen(false)} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button onClick={submitQa} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700">Confirm submission</button></div>
          </div>
        </div>
      )}

      {approvalOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center px-4"><div className="absolute inset-0 bg-ink-900/30" onClick={()=>setApprovalOpen(false)}/><div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl"><h3 className="text-sm font-semibold text-slate-900">Final report approval</h3><p className="mt-1 text-xs text-slate-500">Review the final version and confirm medical approval after QA completion.</p><div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"><div className="flex justify-between"><span className="text-slate-500">Final report preview / version</span><span className="font-medium text-slate-700">{report.version}</span></div><div className="mt-2 flex justify-between"><span className="text-slate-500">QA status</span><StatusBadge status={report.qaStatus}/></div>{returnedComments.some(c=>!c.resolved)&&<p className="mt-3 text-amber-700">Outstanding comment warning: unresolved QA comments remain.</p>}</div><label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={doctorApproved} onChange={e=>setDoctorApproved(e.target.checked)}/><span>I confirm the assigned doctor has approved the final medical content.</span></label><label className="mt-3 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={declaration} onChange={e=>setDeclaration(e.target.checked)}/><span><strong>Approval declaration:</strong> I confirm this is the final approved version for delivery.</span></label><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setApprovalOpen(false)} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button onClick={confirmFinalApproval} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700">Confirm final approval</button></div></div></div>}
      {deliveryOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center px-4"><div className="absolute inset-0 bg-ink-900/30" onClick={()=>setDeliveryOpen(false)}/><div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl"><h3 className="text-sm font-semibold text-slate-900">Report delivery</h3><p className="mt-1 text-xs text-slate-500">Record the recipient, approved final version and secure delivery method.</p><div className="mt-4 space-y-3"><div><label className={label}>Final report version</label><input className={`${field} bg-slate-50`} value={report.version} disabled/></div><div><label className={label}>Recipient *</label><input className={field} value={deliveryRecipient} onChange={e=>setDeliveryRecipient(e.target.value)}/></div><div className="grid grid-cols-2 gap-3"><div><label className={label}>Delivery method</label><select className={field} value={deliveryMethod} onChange={e=>setDeliveryMethod(e.target.value)}><option>Secure email</option><option>Secure portal</option><option>Encrypted download</option><option>Recorded post</option></select></div><div><label className={label}>Delivery date *</label><input type="date" className={field} value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)}/></div></div><div><label className={label}>Delivery notes</label><textarea rows={3} className={field} value={deliveryNotes} onChange={e=>setDeliveryNotes(e.target.value)}/></div><div><label className={label}>Supporting attachment</label><input type="file" className={field} onChange={e=>setDeliveryAttachment(e.target.files?.[0]?.name??'')}/>{deliveryAttachment&&<p className="mt-1 text-xs text-slate-500">{deliveryAttachment}</p>}</div></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setDeliveryOpen(false)} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button onClick={confirmDelivery} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700">Confirm delivery</button></div></div></div>}
      {deleteOpen && <DeleteRecordModal
        title="Delete report"
        recordName={`${report.caseRef} · ${report.reportType} · ${report.version}`}
        impact="This permanently removes the unsubmitted draft report from the prototype. Once a report enters QA or approval, its history must be retained."
        blockedReason={deleteBlockedReason}
        confirmLabel="Delete draft report"
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          removeReport(report.id)
          showToast(`Draft report ${report.caseRef} removed.`)
          setDeleteOpen(false)
          onClose()
        }}
      />}

      {requestOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink-900/30" onClick={() => setRequestOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4"><FileClock size={16} className="text-brand-600" /><h3 className="text-sm font-semibold text-slate-900">Request information</h3></div>
            <div className="space-y-3">
              <div><label className={label}>Recipient *</label><input className={field} value={requestRecipient} onChange={(e) => setRequestRecipient(e.target.value)} /></div>
              <div><label className={label}>Subject</label><input className={field} value={requestSubject} onChange={(e) => setRequestSubject(e.target.value)} /></div>
              <div><label className={label}>Request *</label><textarea className={field} rows={4} value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setRequestOpen(false)} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button onClick={requestInformation} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg">Record request</button></div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function InfoCard({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3.5"><div className="flex items-center gap-1.5 mb-2.5">{icon}<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p></div><div className="space-y-1.5">{children}</div></div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 text-xs"><span className="text-slate-400">{label}</span><span className="text-slate-700 text-right">{value}</span></div>
}
