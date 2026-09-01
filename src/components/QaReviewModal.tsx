import { useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, RotateCcw, Save, UserRoundCog, XCircle } from 'lucide-react'
import Modal from './Modal'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import { cases } from '../data/mockData'
import { roles, useRole } from '../context/RoleContext'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useToast } from '../context/ToastContext'
import type { QaChecklistItem, QaComment } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

export default function QaReviewModal({ qaId, onClose }: { qaId: string; onClose: () => void }) {
  const { qaQueue, updateQaItem, reports, updateReport, documents } = usePrototypeData()
  const { role } = useRole()
  const { showToast } = useToast()
  const item = qaQueue.find((entry) => entry.id === qaId)
  const report = reports.find((entry) => entry.id === item?.reportId) ?? reports.find((entry) => entry.caseRef === item?.caseRef)
  const caseRecord = cases.find((entry) => entry.ref === item?.caseRef)
  const [checklist, setChecklist] = useState<QaChecklistItem[]>(item?.checklist ?? [])
  const [generalComment, setGeneralComment] = useState('')
  const [reviewer, setReviewer] = useState(item?.reviewer ?? 'Unassigned')
  const [confirmAction, setConfirmAction] = useState<'return' | 'approve' | null>(null)

  const supportingDocs = useMemo(() => documents.filter((doc) => doc.caseRef === item?.caseRef && doc.category !== 'Draft Report').slice(0, 8), [documents, item?.caseRef])

  if (!item) return null

  const updateChecklist = (id: string, patch: Partial<QaChecklistItem>) => {
    setChecklist((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry))
  }

  const saveReview = () => {
    updateQaItem(item.id, (current) => ({
      ...current,
      checklist,
      reviewer,
      status: current.status === 'Not Started' ? 'In Review' : current.status,
      reviewHistory: [{ id: `QAH-${Date.now()}`, date: 'Just now', user: role.name, action: 'Review saved', detail: 'QA checklist and review notes saved.' }, ...(current.reviewHistory ?? [])],
    }))
    if (report) updateReport(report.id, (current) => ({ ...current, qaStatus: 'In Review', lastUpdated: 'Just now' }))
    showToast(`QA review saved for ${item.caseRef}.`)
  }

  const addGeneralComment = () => {
    if (!generalComment.trim()) return
    const comment: QaComment = { id: `QAC-${Date.now()}`, author: role.name, date: 'Just now', text: generalComment.trim(), severity: 'Moderate', resolved: false }
    updateQaItem(item.id, (current) => ({ ...current, comments: [comment, ...(current.comments ?? [])] }))
    setGeneralComment('')
  }

  const reassign = () => {
    updateQaItem(item.id, (current) => ({
      ...current,
      reviewer,
      reviewHistory: [{ id: `QAH-${Date.now()}`, date: 'Just now', user: role.name, action: 'Review reassigned', detail: `QA review assigned to ${reviewer}.` }, ...(current.reviewHistory ?? [])],
    }))
    showToast(`QA review assigned to ${reviewer}.`)
  }

  const returnForAmendments = () => {
    const issues = checklist.filter((entry) => entry.status === 'Issue Found')
    if (issues.length === 0) {
      showToast('Mark at least one checklist item as Issue Found before returning the report.')
      setConfirmAction(null)
      return
    }
    const generatedComments: QaComment[] = issues.map((entry) => ({
      id: `QAC-${Date.now()}-${entry.id}`,
      author: role.name,
      date: 'Just now',
      text: `${entry.label}: ${entry.comment || entry.requiredAction || 'Amendment required.'}${entry.reportSection ? ` Section: ${entry.reportSection}.` : ''}`,
      severity: entry.severity ?? 'Moderate',
      resolved: false,
    }))
    updateQaItem(item.id, (current) => ({
      ...current,
      checklist,
      reviewer,
      status: 'Returned',
      comments: [...generatedComments, ...(current.comments ?? [])],
      reviewHistory: [{ id: `QAH-${Date.now()}`, date: 'Just now', user: role.name, action: 'Returned for amendments', detail: `${issues.length} QA issue${issues.length === 1 ? '' : 's'} returned to the report owner.` }, ...(current.reviewHistory ?? [])],
    }))
    if (report) updateReport(report.id, (current) => ({ ...current, status: 'Amendments Required', qaStatus: 'Returned', lastUpdated: 'Just now', versions: (current.versions ?? []).map((version, index) => index === 0 ? { ...version, status: 'Amendments Required', qaOutcome: `Returned with ${issues.length} QA issue${issues.length === 1 ? '' : 's'}` } : version) }))
    setConfirmAction(null)
    showToast(`Report ${item.caseRef} returned for amendments.`)
  }

  const approve = () => {
    const unresolvedIssues = checklist.filter((entry) => entry.status === 'Issue Found' && !entry.resolved)
    if (unresolvedIssues.length > 0) {
      showToast('Resolve or change all Issue Found checklist items before approval.')
      setConfirmAction(null)
      return
    }
    updateQaItem(item.id, (current) => ({
      ...current,
      checklist,
      reviewer,
      status: 'Approved',
      reviewHistory: [{ id: `QAH-${Date.now()}`, date: 'Just now', user: role.name, action: 'Report approved', detail: 'QA checklist complete and report approved.' }, ...(current.reviewHistory ?? [])],
    }))
    if (report) updateReport(report.id, (current) => ({ ...current, status: 'Submitted for QA', qaStatus: 'Approved', lastUpdated: 'Just now', versions: (current.versions ?? []).map((version, index) => index === 0 ? { ...version, status: 'Submitted for QA', qaOutcome: 'QA approved — awaiting final report approval' } : version) }))
    setConfirmAction(null)
    showToast(`QA approved for ${item.caseRef}.`)
  }

  const comments = item.comments ?? []
  const history = item.reviewHistory ?? []
  const versions = report?.versions ?? []

  return (
    <Modal title="QA review workspace" description={`${item.caseRef} · ${item.patient} · ${item.reportType}`} onClose={onClose} width="max-w-7xl">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="flex items-center gap-2"><StatusBadge status={item.status} /><PriorityBadge priority={item.priority} /><span className="text-xs text-slate-500">Due {item.dueDate} · Reviewer: {item.reviewer}</span></div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={saveReview} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 bg-white rounded-lg hover:bg-slate-50"><Save size={13} /> Save review</button>
          <button onClick={() => setConfirmAction('return')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-amber-200 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100"><RotateCcw size={13} /> Return for amendments</button>
          <button onClick={() => setConfirmAction('approve')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"><CheckCircle2 size={13} /> Approve report</button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)] gap-4">
        <div className="space-y-4 min-w-0">
          <Section title="Report preview">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 min-h-[300px] max-h-[440px] overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-6 text-slate-700">
              {report?.content ?? 'No report content is available for this QA item.'}
            </div>
          </Section>

          <Section title="QA checklist">
            <div className="space-y-3">
              {checklist.map((entry, index) => (
                <div key={entry.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0"><p className="text-sm font-medium text-slate-800">{index + 1}. {entry.label}</p></div>
                    <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                      {(['Pass', 'Issue Found', 'Not Applicable'] as const).map((status) => (
                        <button key={status} onClick={() => updateChecklist(entry.id, { status, resolved: status === 'Issue Found' ? false : true })} className={`px-2 py-1 text-[11px] rounded-md ${entry.status === status ? status === 'Pass' ? 'bg-teal-600 text-white' : status === 'Issue Found' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-white' : 'text-slate-500 hover:bg-white'}`}>{status}</button>
                      ))}
                    </div>
                  </div>
                  {entry.status === 'Issue Found' && (
                    <div className="grid md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                      <div className="md:col-span-2"><label className={label}>Comment *</label><textarea className={field} rows={2} value={entry.comment ?? ''} onChange={(e) => updateChecklist(entry.id, { comment: e.target.value })} placeholder="Explain the QA issue clearly." /></div>
                      <div><label className={label}>Severity</label><select className={field} value={entry.severity ?? 'Moderate'} onChange={(e) => updateChecklist(entry.id, { severity: e.target.value as QaChecklistItem['severity'] })}><option>Low</option><option>Moderate</option><option>High</option></select></div>
                      <div><label className={label}>Report section</label><input className={field} value={entry.reportSection ?? ''} onChange={(e) => updateChecklist(entry.id, { reportSection: e.target.value })} placeholder="e.g. 4. Opinion" /></div>
                      <div className="md:col-span-2"><label className={label}>Required action</label><input className={field} value={entry.requiredAction ?? ''} onChange={(e) => updateChecklist(entry.id, { requiredAction: e.target.value })} placeholder="What must be amended?" /></div>
                      <label className="md:col-span-2 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={entry.resolved ?? false} onChange={(e) => updateChecklist(entry.id, { resolved: e.target.checked })} /> Mark this issue resolved</label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-3">
          <Section title="Case information" compact>
            <InfoRow label="Patient" value={item.patient} /><InfoRow label="Doctor" value={item.doctor} /><InfoRow label="Client" value={caseRecord?.client ?? '—'} /><InfoRow label="Case type" value={caseRecord?.caseType ?? '—'} /><InfoRow label="Submission" value={item.submittedDate} />
          </Section>

          <Section title="Reviewer assignment" compact>
            <label className={label}>Assigned reviewer</label>
            <div className="flex gap-2">
              <select className={field} value={reviewer} onChange={(e) => setReviewer(e.target.value)}>
                <option>Unassigned</option>
                {roles.filter((entry) => entry.id === 'quality-assurance' || entry.id === 'system-administrator').map((entry) => <option key={entry.id} value={entry.name}>{entry.name}</option>)}
              </select>
              <button onClick={reassign} className="px-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50" title="Reassign review"><UserRoundCog size={15} /></button>
            </div>
          </Section>

          <Section title="Comments" compact>
            <div className="flex gap-2 mb-3"><input className={field} value={generalComment} onChange={(e) => setGeneralComment(e.target.value)} placeholder="General QA comment..." /><button onClick={addGeneralComment} className="px-3 py-2 text-xs font-medium bg-slate-800 text-white rounded-lg">Add</button></div>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {comments.length === 0 && <p className="text-xs text-slate-400">No QA comments yet.</p>}
              {comments.map((comment) => <div key={comment.id} className="rounded-lg border border-slate-100 p-2.5"><div className="flex items-center gap-2"><span className="text-[10px] font-semibold text-slate-500 uppercase">{comment.severity ?? 'General'}</span>{comment.resolved && <span className="text-[10px] text-teal-700">Resolved</span>}</div><p className="text-xs text-slate-600 mt-1">{comment.text}</p><p className="text-[10px] text-slate-400 mt-1">{comment.author} · {comment.date}</p></div>)}
            </div>
          </Section>

          <Section title="Previous report versions" compact>
            {versions.map((version, index) => <div key={`${version.version}-${index}`} className="py-2 border-b border-slate-100 last:border-0"><div className="flex justify-between"><p className="text-xs font-medium text-slate-700">{version.version}{index === 0 ? ' · Current' : ''}</p><span className="text-[10px] text-slate-400">{version.date}</span></div><p className="text-[11px] text-slate-500 mt-0.5">{version.changeSummary}</p><p className="text-[10px] text-slate-400">QA: {version.qaOutcome}</p></div>)}
          </Section>

          <Section title="Supporting documents" compact>
            {supportingDocs.length === 0 && <p className="text-xs text-slate-400">No supporting documents found.</p>}
            {supportingDocs.map((doc) => <div key={doc.id} className="py-1.5 border-b border-slate-100 last:border-0"><p className="text-xs text-slate-700 truncate">{doc.name}</p><p className="text-[10px] text-slate-400">{doc.category} · {doc.version}</p></div>)}
          </Section>

          <Section title="Review history" compact>
            {history.map((entry) => <div key={entry.id} className="border-l-2 border-slate-200 pl-2.5 py-1"><p className="text-xs font-medium text-slate-700">{entry.action}</p><p className="text-[11px] text-slate-500">{entry.detail}</p><p className="text-[10px] text-slate-400 mt-0.5">{entry.user} · {entry.date}</p></div>)}
          </Section>
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink-900/35" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-5">
            <div className="flex items-start gap-3"><div className={`w-9 h-9 rounded-full flex items-center justify-center ${confirmAction === 'approve' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'}`}>{confirmAction === 'approve' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}</div><div><h3 className="text-sm font-semibold text-slate-900">{confirmAction === 'approve' ? 'Approve this report?' : 'Return this report for amendments?'}</h3><p className="text-xs text-slate-500 mt-1">{confirmAction === 'approve' ? 'This records the QA decision and makes the report eligible for final approval by the authorised report owner.' : 'All Issue Found checklist items will be sent back as amendment comments and retained in QA history.'}</p></div></div>
            <div className="flex justify-end gap-2 mt-5"><button onClick={() => setConfirmAction(null)} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button onClick={confirmAction === 'approve' ? approve : returnForAmendments} className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${confirmAction === 'approve' ? 'bg-brand-600' : 'bg-amber-600'}`}>{confirmAction === 'approve' ? 'Approve report' : 'Return for amendments'}</button></div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Section({ title, compact = false, children }: { title: string; compact?: boolean; children: ReactNode }) {
  return <div className={`rounded-xl border border-slate-200 bg-white ${compact ? 'p-3.5' : 'p-4'}`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">{title}</p>{children}</div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 text-xs py-1"><span className="text-slate-400">{label}</span><span className="text-slate-700 text-right">{value}</span></div>
}
