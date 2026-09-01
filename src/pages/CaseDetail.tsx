import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Check,
  Circle,
  AlertTriangle,
  UserRoundPlus,
  CheckSquare,
  StickyNote,
  Upload,
  CalendarPlus,
  FilePlus2,
  PauseCircle,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react'
import { cases, patients } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import Modal from '../components/Modal'
import NewTaskModal from '../components/NewTaskModal'
import UploadDocumentModal from '../components/UploadDocumentModal'
import NewAppointmentModal from '../components/NewAppointmentModal'
import CreateReportModal from '../components/CreateReportModal'
import ReportWorkspaceModal from '../components/ReportWorkspaceModal'
import { useToast } from '../context/ToastContext'
import { useRole, roles } from '../context/RoleContext'
import type { CaseStatus, CommunicationItem } from '../types'
import { useDismissable } from '../hooks/useDismissable'
import { usePrototypeData } from '../context/PrototypeDataContext'

const stages: CaseStatus[] = [
  'New Booking',
  'Information Required',
  'Appointment Scheduled',
  'File Preparation',
  'Report in Progress',
  'Quality Assurance',
  'Report Delivered',
  'Completed',
]

const tabs = [
  'Overview',
  'Patient',
  'Booking',
  'Appointment',
  'Documents',
  'File Preparation',
  'Reports',
  'Quality Assurance',
  'Tasks',
  'Communication',
  'Activity History',
]

const fieldClass =
  'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'

const actionButton =
  'inline-flex items-center gap-1.5 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-slate-50'

type ActionModal = 'assign' | 'task' | 'note' | 'upload' | 'schedule' | 'report' | 'hold' | 'complete' | null

export default function CaseDetail() {
  const { ref } = useParams()
  const { showToast } = useToast()
  const { role } = useRole()
  const {
    documents: sharedDocuments, addDocuments,
    reports: sharedReports, qaQueue: sharedQaQueue, tasks: sharedTasks, communications: sharedCommunications, appointments: sharedAppointments,
    addTask, addCommunication, addAppointment, updateAppointment,
  } = usePrototypeData()
  const [tab, setTab] = useState('Overview')
  const baseRecord = cases.find((c) => c.ref === ref) ?? cases[0]
  const [status, setStatus] = useState<CaseStatus>(baseRecord.status)
  const [owner, setOwner] = useState(baseRecord.owner)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [actionModal, setActionModal] = useState<ActionModal>(null)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [actionValue, setActionValue] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const caseDocs = sharedDocuments.filter((document) => document.caseRef === baseRecord.ref)
  const caseTasks = sharedTasks.filter((t) => t.caseRef === baseRecord.ref)
  const caseAppointments = sharedAppointments.filter((a) => a.caseRef === baseRecord.ref)
  const caseComms = sharedCommunications.filter((c) => c.caseRef === baseRecord.ref)
  const [rescheduling, setRescheduling] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const moreActionsRef = useRef<HTMLDivElement>(null)
  useDismissable(moreActionsRef, showMoreActions, () => setShowMoreActions(false))
  const record = { ...baseRecord, status, owner }

  const patient = patients.find((p) => p.name === record.patient)
  const appt = caseAppointments.find((a) => a.status === 'Scheduled') ?? caseAppointments[0]
  const caseReports = sharedReports.filter((r) => r.caseRef === record.ref)
  const caseQa = sharedQaQueue.filter((q) => q.caseRef === record.ref)
  const qaIssueCount = caseQa.reduce((total, item) => total + (item.comments ?? []).filter((comment) => !comment.resolved).length, 0)

  const currentIndex = status === 'On Hold' ? Math.max(stages.indexOf(baseRecord.status), 0) : Math.max(stages.indexOf(status), 0)
  const latestReport = caseReports[0]

  const stageDates = useMemo(() => {
    const known: Record<string, string> = {
      'New Booking': '31 Jul',
      'Information Required': record.ref === 'EM-2026-0588' ? '30 Aug' : '01 Aug',
      'Appointment Scheduled': appt?.date ? appt.date.replace(' 2026', '') : '—',
      'File Preparation': record.status === 'File Preparation' || currentIndex > 3 ? '02 Aug' : '—',
      'Report in Progress': currentIndex >= 4 ? '03 Aug' : '—',
      'Quality Assurance': currentIndex >= 5 ? '31 Aug' : '—',
      'Report Delivered': currentIndex >= 6 ? '31 Aug' : '—',
      Completed: currentIndex >= 7 ? '31 Aug' : '—',
    }
    return known
  }, [appt?.date, currentIndex, record.ref, record.status])

  const nextAction = (() => {
    if (status === 'On Hold') return 'Case is on hold. Review the hold reason before resuming workflow.'
    if (status === 'Completed') return 'No further action required. Case is complete.'
    if (status === 'Report Delivered') return 'Confirm remaining tasks and mark the case complete.'
    if (status === 'Report in Progress') return 'Dr Osei to submit draft report for QA.'
    if (status === 'Quality Assurance') return 'QA review due — resolve or approve outstanding review items.'
    if (status === 'File Preparation') return 'Compile PDF bundle and mark file ready.'
    if (status === 'Appointment Scheduled') return 'Complete appointment and update the case outcome.'
    if (status === 'New Booking') return 'Schedule appointment and confirm booking details.'
    return 'Request missing information and clear the case blocker.'
  })()

  const openAction = (action: ActionModal) => {
    setActionValue('')
    setShowMoreActions(false)
    if (action !== 'schedule') setRescheduling(false)
    setActionModal(action)
  }

  const submitAction = () => {
    if (actionModal === 'hold') {
      if (!actionValue.trim()) {
        showToast('Add a hold reason before placing the case on hold.')
        return
      }
      setStatus('On Hold')
      setNotes((prev) => [`Case placed on hold: ${actionValue.trim()}`, ...prev])
      showToast(`Case ${record.ref} placed on hold.`)
    }
    if (actionModal === 'complete') {
      setStatus('Completed')
      if (actionValue.trim()) setNotes((prev) => [`Completion note: ${actionValue.trim()}`, ...prev])
      showToast(`Case ${record.ref} marked complete.`)
    }
    setActionModal(null)
    setActionValue('')
  }

  const addInternalNote = (subject: string, note: string) => {
    const entry: CommunicationItem = {
      id: `C-${Date.now()}`, caseRef: record.ref, type: 'Internal Note', from: role.name, to: 'Internal team',
      date: 'Just now', subject, summary: note, internal: true,
    }
    addCommunication(entry)
    setNotes((prev) => [note, ...prev])
    setActionModal(null)
    showToast(`Internal note added to ${record.ref}.`)
  }


  return (
    <div>
      <Link to="/cases" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft size={15} /> Back to cases
      </Link>

      {/* Case header — PRD 10.1 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-slate-900">{record.ref}</h2>
              <StatusBadge status={record.status} />
              <PriorityBadge priority={record.priority} />
            </div>
            <p className="text-sm text-slate-500">
              {record.patient} · {record.client} · Ref {record.clientRef}
            </p>
          </div>
          <div className="flex gap-5 text-xs">
            <div>
              <p className="text-xs text-slate-400">Doctor</p>
              <p className="font-medium text-slate-700">{record.doctor}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Case owner</p>
              <p className="font-medium text-slate-700">{record.owner}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Target completion</p>
              <p className="font-medium text-slate-700">{record.targetDate}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => showToast('Case edit screen opened in prototype mode.')}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
            >
              Edit case
            </button>
            <button
              onClick={() => setStatusModalOpen(true)}
              className="text-xs bg-brand-600 text-white rounded-lg px-3 py-1.5 hover:bg-brand-700"
            >
              Change status
            </button>
          </div>
        </div>

        {/* Status timeline — PRD 10.2 */}
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex items-start min-w-[880px]">
            {stages.map((s, i) => {
              const isBlocked = status === 'On Hold' && i === currentIndex
              return (
                <div key={s} className="flex items-start flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        isBlocked
                          ? 'bg-red-100 text-red-600 ring-2 ring-red-200'
                          : i < currentIndex
                          ? 'bg-teal-400 text-white'
                          : i === currentIndex
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isBlocked ? <AlertTriangle size={12} /> : i < currentIndex ? <Check size={12} /> : <Circle size={8} fill="currentColor" />}
                    </div>
                    <p className={`text-[10px] text-center w-24 ${i === currentIndex ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                      {s}
                    </p>
                    <p className={`text-[9px] ${isBlocked ? 'text-red-500' : 'text-slate-400'}`}>{isBlocked ? 'Blocked' : stageDates[s]}</p>
                  </div>
                  {i < stages.length - 1 && (
                    <div className={`h-0.5 flex-1 mt-3 ${i < currentIndex ? 'bg-teal-400' : 'bg-slate-100'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Case actions — PRD 10.5 */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 mb-4 flex items-center gap-2 flex-wrap">
        <button className={actionButton} onClick={() => openAction('assign')}><UserRoundPlus size={15} /> Assign user</button>
        <button className={actionButton} onClick={() => openAction('task')}><CheckSquare size={15} /> Add task</button>
        <button className={actionButton} onClick={() => openAction('note')}><StickyNote size={15} /> Add note</button>
        <button className={actionButton} onClick={() => openAction('upload')}><Upload size={15} /> Upload document</button>
        <button className={actionButton} onClick={() => { setRescheduling(false); openAction('schedule') }}><CalendarPlus size={15} /> Schedule appointment</button>
        <div className="relative ml-auto" ref={moreActionsRef}>
          <button className={actionButton} onClick={() => setShowMoreActions((v) => !v)}>
            <MoreHorizontal size={15} /> More actions
          </button>
          {showMoreActions && (
            <div className="absolute right-0 z-20 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5">
              <button onClick={() => openAction('report')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50">
                <FilePlus2 size={15} /> Create report
              </button>
              <button onClick={() => openAction('hold')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 rounded-lg hover:bg-amber-50">
                <PauseCircle size={15} /> Place on hold
              </button>
              <button onClick={() => openAction('complete')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-teal-700 rounded-lg hover:bg-teal-50">
                <CheckCircle2 size={15} /> Mark complete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs — PRD 10.3 */}
      <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto">
        {tabs.map((t) => {
          const counts: Record<string, number> = {
            Documents: caseDocs.length,
            Tasks: caseTasks.length,
            'Quality Assurance': caseQa.length,
            Communication: caseComms.length,
            Reports: caseReports.length,
          }
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs whitespace-nowrap border-b-2 -mb-px ${
                tab === t ? 'border-brand-600 text-brand-600 font-medium' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
              {counts[t] !== undefined && counts[t] > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{counts[t]}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        {tab === 'Overview' && (
          <div className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700 mb-1">Next required action</p>
                <p className="text-sm text-slate-700">{nextAction}</p>
              </div>
              <div className="border border-slate-100 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Important deadline</p>
                <p className="text-sm font-semibold text-slate-800">{record.targetDate}</p>
                <p className="text-xs text-slate-500 mt-1">Target case completion</p>
              </div>
            </div>

            {/* Compact operational overview — PRD 10.4 */}
            <div className="grid lg:grid-cols-3 gap-3">
              <SectionCard title="Workflow">
                <SummaryRow label="Current status" value={record.status} />
                <SummaryRow label="Appointment" value={appt ? `${appt.date} · ${appt.time}` : 'Not scheduled'} />
                <SummaryRow label="Missing information" value={record.status === 'Information Required' ? 'Action required' : 'None outstanding'} />
              </SectionCard>
              <SectionCard title="Ownership & work">
                <SummaryRow label="Case owner" value={record.owner} />
                <SummaryRow label="Doctor" value={record.doctor} />
                <SummaryRow label="Open tasks" value={`${caseTasks.filter((t) => t.status !== 'Completed').length}`} />
              </SectionCard>
              <SectionCard title="Readiness">
                <SummaryRow label="Documents" value={`${caseDocs.length} received`} />
                <SummaryRow label="Report" value={latestReport?.status ?? 'Not started'} />
                <SummaryRow label="QA" value={latestReport?.qaStatus ?? (caseQa.length > 0 ? caseQa[0].status : 'Not Started')} />
              </SectionCard>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-slate-900 mb-3">Case summary</p>
                <div className="space-y-2 text-sm">
                  <SummaryRow label="Case type" value={record.caseType} />
                  <SummaryRow label="Client" value={record.client} />
                  <SummaryRow label="Client reference" value={record.clientRef} />
                  <SummaryRow label="Priority" value={record.priority} />
                  <SummaryRow label="Target completion" value={record.targetDate} />
                </div>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-3">Recent activity</p>
                <div className="space-y-3">
                  {notes.slice(0, 1).map((note, i) => (
                    <ActivityRow key={`${note}-${i}`} title="Internal note added" detail={note} time="Just now" />
                  ))}
                  {caseComms.slice(0, 2).map((c) => (
                    <ActivityRow key={c.id} title={c.subject} detail={`${c.type} · ${c.from}`} time={c.date} />
                  ))}
                  <ActivityRow title={`Case status: ${record.status}`} detail="Workflow status updated" time={record.lastUpdated} />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Patient' && patient && (
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-slate-900 mb-1">Personal details</p>
              <SummaryRow label="Name" value={patient.name} />
              <SummaryRow label="Date of birth" value={patient.dob} />
              <SummaryRow label="Email" value={patient.email} />
              <SummaryRow label="Phone" value={patient.phone} />
              {patient.interpreter && <SummaryRow label="Interpreter" value={patient.interpreter} />}
            </div>
            <div>
              <Link to={`/patients/${patient.id}`} className="text-brand-600 text-sm font-medium">Open full patient profile →</Link>
            </div>
          </div>
        )}

        {tab === 'Booking' && (
          <div className="text-sm space-y-2 max-w-lg">
            <SummaryRow label="Booking reference" value={record.clientRef} />
            <SummaryRow label="Client" value={record.client} />
            <SummaryRow label="Case type" value={record.caseType} />
            <SummaryRow label="Requested completion" value={record.targetDate} />
            <SummaryRow label="Special instructions" value="Standard medicolegal report instruction." />
          </div>
        )}

        {tab === 'Appointment' && (
          <div className="text-sm">
            {appt ? (
              <div className="max-w-lg space-y-2">
                <SummaryRow label="Date" value={appt.date} />
                <SummaryRow label="Time" value={appt.time} />
                <SummaryRow label="Doctor" value={appt.doctor} />
                <SummaryRow label="Type" value={appt.type} />
                <SummaryRow label="Location" value={appt.location} />
                <div className="flex justify-between items-center"><span className="text-slate-500">Status</span><StatusBadge status={appt.status} /></div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setRescheduling(true); setActionModal('schedule') }} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Reschedule</button>
                  <button onClick={() => { if (appt) { updateAppointment(appt.id, (current) => ({ ...current, status: 'Cancelled' as const })); showToast(`Appointment for ${record.patient} cancelled.`) } }} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 text-red-600">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-slate-500 mb-3">No appointment scheduled yet.</p>
                <button onClick={() => openAction('schedule')} className="text-sm bg-brand-600 text-white rounded-lg px-3 py-2 hover:bg-brand-700">Schedule appointment</button>
              </div>
            )}
          </div>
        )}

        {tab === 'Documents' && (
          <div className="divide-y divide-slate-100">
            {caseDocs.length === 0 && <p className="text-sm text-slate-500">No documents uploaded yet.</p>}
            {caseDocs.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-400">{d.category} · {d.version} · {d.size}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}

        {tab === 'File Preparation' && (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="border border-slate-100 rounded-lg p-3">
              <p className="font-semibold text-slate-900 mb-3">Document readiness</p>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Documents received" value={`${caseDocs.length}`} />
                <SummaryRow label="Duplicates flagged" value="0" />
                <SummaryRow label="Missing documents" value={record.status === 'Information Required' ? '1' : '0'} />
              </div>
            </div>
            <div className="border border-slate-100 rounded-lg p-3">
              <p className="font-semibold text-slate-900 mb-3">Prepared bundle</p>
              <p className="text-sm text-slate-600">{caseDocs.some((d) => d.category === 'Prepared Bundle') ? 'Prepared bundle available for review.' : 'Bundle preparation has not been completed yet.'}</p>
              <button onClick={() => showToast('Prepared bundle preview opened.')} className="mt-3 text-sm text-brand-600 font-medium">Preview bundle →</button>
            </div>
            <div className="border border-slate-100 rounded-lg p-3">
              <p className="font-semibold text-slate-900 mb-3">Preparation status</p>
              <StatusBadge status={record.status === 'File Preparation' ? 'Review Required' : caseDocs.length ? 'Approved' : 'Not Started'} />
              <p className="text-xs text-slate-500 mt-2">File preparation remains human-reviewed before the report workflow continues.</p>
            </div>
          </div>
        )}

        {tab === 'Reports' && (
          <div className="divide-y divide-slate-100">
            {caseReports.length === 0 && (
              <div>
                <p className="text-sm text-slate-500 mb-3">No report created yet.</p>
                <button onClick={() => openAction('report')} className="text-sm bg-brand-600 text-white rounded-lg px-3 py-2 hover:bg-brand-700">Create report</button>
              </div>
            )}
            {caseReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.reportType} · {r.version}</p>
                  <p className="text-xs text-slate-400">Due {r.dueDate} · Updated {r.lastUpdated}</p>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={r.status} /><button onClick={() => setSelectedReportId(r.id)} className="text-xs font-medium text-brand-600">Open</button></div>
              </div>
            ))}
          </div>
        )}

        {tab === 'Quality Assurance' && (
          <div className="space-y-3 text-sm">
            {caseQa.length === 0 && <p className="text-slate-500">No QA activity yet.</p>}
            {caseQa.map((qa) => (
              <div key={qa.id} className={`rounded-lg border p-3 ${qa.status === 'Returned' ? 'border-red-100 bg-red-50/60' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between gap-3"><div><p className="font-medium text-slate-800">{qa.reportType}</p><p className="text-xs text-slate-500 mt-1">Reviewer: {qa.reviewer} · Due {qa.dueDate}</p></div><StatusBadge status={qa.status} /></div>
                {(qa.comments ?? []).length > 0 && <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">{(qa.comments ?? []).map((comment) => <div key={comment.id} className="text-xs"><span className={`font-medium ${comment.resolved ? 'text-teal-700' : 'text-red-700'}`}>{comment.resolved ? 'Resolved' : `${comment.severity ?? 'Moderate'} issue`}</span><span className="text-slate-600"> — {comment.text}</span></div>)}</div>}
              </div>
            ))}
            {qaIssueCount > 0 && <p className="text-xs text-red-600">{qaIssueCount} unresolved QA amendment{qaIssueCount === 1 ? '' : 's'} remain.</p>}
            <Link to="/quality-assurance" className="inline-flex text-xs font-medium text-brand-600">Open Quality Assurance workspace →</Link>
          </div>
        )}

        {tab === 'Tasks' && (
          <div className="divide-y divide-slate-100">
            {caseTasks.length === 0 && <p className="text-sm text-slate-500">No tasks yet.</p>}
            {caseTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-400">Owner: {t.owner} · Due {t.dueDate}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}

        {tab === 'Communication' && (
          <div className="space-y-4">
            {caseComms.length === 0 && <p className="text-sm text-slate-500">No communication recorded yet.</p>}
            {caseComms.map((c) => (
              <div key={c.id} className="border-l-2 border-slate-200 pl-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{c.subject}</p>
                  {c.internal && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Internal Only</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{c.from} → {c.to} · {c.date}</p>
                <p className="text-sm text-slate-600 mt-1">{c.summary}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'Activity History' && (
          <div className="space-y-3 text-sm">
            {notes.map((note, i) => (
              <div key={`${note}-${i}`} className="flex justify-between gap-6"><span className="text-slate-600">Internal note: {note}</span><span className="text-xs text-slate-400 shrink-0">Just now</span></div>
            ))}
            <div className="flex justify-between"><span className="text-slate-600">Case status updated to {record.status}</span><span className="text-xs text-slate-400">{record.lastUpdated}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Case created from booking {record.clientRef}</span><span className="text-xs text-slate-400">31 Jul 2026</span></div>
          </div>
        )}
      </div>

      {statusModalOpen && (
        <Modal title="Change case status" description={record.ref} onClose={() => setStatusModalOpen(false)}>
          <div className="space-y-3">
            {[...stages, 'On Hold' as CaseStatus].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s)
                  setStatusModalOpen(false)
                  showToast(`Case ${record.ref} status changed to "${s}".`)
                }}
                className={`w-full flex items-center justify-between text-left text-sm px-3 py-2.5 rounded-lg border ${
                  s === record.status
                    ? 'border-brand-600 bg-brand-50 text-brand-700 font-medium'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {s}
                {s === record.status && <Check size={15} />}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {actionModal === 'assign' && (
        <AssignCaseModal
          recordRef={record.ref}
          currentOwner={record.owner}
          onClose={() => setActionModal(null)}
          onAssign={(nextOwner, assignmentNote) => { setOwner(nextOwner); if (assignmentNote) setNotes((prev) => [`Assignment note: ${assignmentNote}`, ...prev]); setActionModal(null); showToast(`Case ${record.ref} assigned to ${nextOwner}.`) }}
        />
      )}

      {actionModal === 'task' && (
        <NewTaskModal
          existingCount={sharedTasks.length}
          defaultOwner={record.owner === 'Unassigned' ? role.name : record.owner}
          defaultCaseRef={record.ref}
          lockCase
          onClose={() => setActionModal(null)}
          onCreate={(task) => { addTask(task); setActionModal(null); showToast(`Task "${task.title}" added to ${record.ref}.`) }}
        />
      )}

      {actionModal === 'note' && (
        <AddCaseNoteModal recordRef={record.ref} onClose={() => setActionModal(null)} onAdd={addInternalNote} />
      )}

      {actionModal === 'upload' && (
        <UploadDocumentModal
          existingCount={sharedDocuments.length}
          uploadedBy={role.name}
          defaultCaseRef={record.ref}
          defaultPatient={record.patient}
          lockCase
          onClose={() => setActionModal(null)}
          existingDocuments={sharedDocuments}
          onUpload={(newDocs) => { addDocuments(newDocs); setActionModal(null); showToast(`${newDocs.length} document${newDocs.length === 1 ? '' : 's'} uploaded to ${record.ref}.`) }}
        />
      )}

      {actionModal === 'schedule' && (
        <NewAppointmentModal
          existingCount={sharedAppointments.length}
          defaultCaseRef={record.ref}
          defaultPatient={record.patient}
          defaultDoctor={record.doctor === 'Unassigned' ? 'Dr Amara Osei' : record.doctor}
          existingAppointments={sharedAppointments}
          lockCase
          onClose={() => { setActionModal(null); setRescheduling(false) }}
          onCreate={(appointment) => {
            if (rescheduling && appt) updateAppointment(appt.id, (current) => ({ ...current, status: 'Rescheduled' as const }))
            addAppointment(appointment)
            if (status === 'New Booking' || status === 'Information Required') setStatus('Appointment Scheduled')
            setActionModal(null); setRescheduling(false); showToast(`${rescheduling ? 'Appointment rescheduled' : 'Appointment scheduled'} for ${record.patient}.`)
          }}
        />
      )}

      {actionModal === 'report' && <CreateReportModal defaultCaseRef={record.ref} onClose={() => setActionModal(null)} />}
      {selectedReportId && <ReportWorkspaceModal reportId={selectedReportId} onClose={() => setSelectedReportId(null)} />}

      {actionModal && ['hold', 'complete'].includes(actionModal) && (
        <CaseActionModal action={actionModal} record={record} value={actionValue} onValue={setActionValue} onClose={() => setActionModal(null)} onSubmit={submitAction} />
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-slate-100 rounded-lg p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2.5">{title}</p>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5"><span className="text-slate-500">{label}</span><span className="text-slate-700 text-right">{value}</span></div>
}

function ActivityRow({ title, detail, time }: { title: string; detail: string; time: string }) {
  return (
    <div className="flex justify-between gap-4 border-l-2 border-slate-200 pl-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
      </div>
      <p className="text-[10px] text-slate-400 shrink-0">{time}</p>
    </div>
  )
}

function AssignCaseModal({ recordRef, currentOwner, onClose, onAssign }: { recordRef: string; currentOwner: string; onClose: () => void; onAssign: (owner: string, note?: string) => void }) {
  const [selected, setSelected] = useState(currentOwner === 'Unassigned' ? '' : currentOwner)
  const [reason, setReason] = useState('')
  return (
    <Modal title="Assign case owner" description={`${recordRef} · choose the person responsible for the next action.`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Case owner *</label>
          <div className="space-y-2">
            {roles.filter((r) => !['management', 'medical-expert'].includes(r.id)).map((user) => (
              <label key={user.id} className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer ${selected === user.name ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="case-owner" checked={selected === user.name} onChange={() => setSelected(user.name)} />
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-semibold">{user.initials}</div>
                <div className="min-w-0"><p className="text-sm font-medium text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.title}</p></div>
              </label>
            ))}
          </div>
        </div>
        <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Assignment note (optional)</label><textarea className={fieldClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being reassigned?" /></div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button disabled={!selected} onClick={() => selected && onAssign(selected, reason.trim() || undefined)} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg">Assign case</button></div>
    </Modal>
  )
}

function AddCaseNoteModal({ recordRef, onClose, onAdd }: { recordRef: string; onClose: () => void; onAdd: (subject: string, note: string) => void }) {
  const [subject, setSubject] = useState('Case note')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  return (
    <Modal title="Add internal note" description={`${recordRef} · notes are visible to authorised internal users only.`} onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Note type</label><select className={fieldClass} value={subject} onChange={(e) => setSubject(e.target.value)}><option>Case note</option><option>Clinical administration note</option><option>Client instruction note</option><option>Follow-up note</option></select></div>
        <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Internal note *</label><textarea className={fieldClass} rows={5} value={note} onChange={(e) => { setNote(e.target.value); setError('') }} placeholder="Record the relevant case update, decision or follow-up..." /></div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500"><span className="font-medium text-slate-700">Internal Only</span> · This entry will also appear in Communication and Activity History.</div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={() => { if (!note.trim()) { setError('Enter a note before saving.'); return } onAdd(subject, note.trim()) }} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save note</button></div>
    </Modal>
  )
}

function CaseActionModal({
  action,
  record,
  value,
  onValue,
  onClose,
  onSubmit,
}: {
  action: Exclude<ActionModal, null>
  record: { ref: string; patient: string; doctor: string; status: CaseStatus }
  value: string
  onValue: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const config = {
    assign: { title: 'Assign user', description: `Assign ownership for ${record.ref}.`, label: 'Case owner', placeholder: 'e.g. Priya Nandra', confirm: 'Assign user' },
    task: { title: 'Add task', description: `Create a task linked to ${record.ref}.`, label: 'Task title', placeholder: 'e.g. Request missing GP records', confirm: 'Add task' },
    note: { title: 'Add note', description: `Add an internal case note to ${record.ref}.`, label: 'Internal note', placeholder: 'Enter case note...', confirm: 'Add note' },
    upload: { title: 'Upload document', description: `Add a document to ${record.ref}.`, label: 'Document name', placeholder: 'e.g. Updated GP Records.pdf', confirm: 'Add document' },
    schedule: { title: 'Schedule appointment', description: `${record.patient} · ${record.ref}`, label: 'Appointment date and time', placeholder: 'e.g. 08 Sep 2026 · 10:30', confirm: 'Schedule appointment' },
    report: { title: 'Create report', description: `Start a report for ${record.ref}.`, label: 'Report template', placeholder: 'Medicolegal Report', confirm: 'Create report' },
    hold: { title: 'Place case on hold', description: 'This pauses normal case progression until the hold is removed.', label: 'Reason for hold', placeholder: 'Enter reason...', confirm: 'Place on hold' },
    complete: { title: 'Complete case', description: 'Confirm that final report delivery and remaining case work have been completed.', label: 'Completion note', placeholder: 'Optional completion note', confirm: 'Mark complete' },
  }[action]

  return (
    <Modal title={config.title} description={config.description} onClose={onClose}>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1.5">{config.label}</label>
        {action === 'assign' ? (
          <select className={fieldClass} value={value} onChange={(e) => onValue(e.target.value)}>
            <option value="">Select owner...</option>
            <option>Priya Nandra</option>
            <option>Dr Amara Osei</option>
            <option>E. Fitzgerald</option>
            <option>F. Chen</option>
            <option>Admin Team</option>
          </select>
        ) : action === 'note' || action === 'hold' || action === 'complete' ? (
          <textarea className={fieldClass} rows={4} value={value} onChange={(e) => onValue(e.target.value)} placeholder={config.placeholder} />
        ) : (
          <input className={fieldClass} value={value} onChange={(e) => onValue(e.target.value)} placeholder={config.placeholder} />
        )}
        {(action === 'hold' || action === 'complete') && (
          <div className={`mt-3 rounded-lg border p-3 text-xs ${action === 'hold' ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-teal-100 bg-teal-50 text-teal-700'}`}>
            {action === 'hold'
              ? 'The case timeline will show the current stage as blocked until the case is resumed.'
              : 'This is a sensitive workflow action and requires explicit confirmation.'}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button
          onClick={onSubmit}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${action === 'hold' ? 'bg-amber-600 hover:bg-amber-700' : action === 'complete' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-brand-600 hover:bg-brand-700'}`}
        >
          {config.confirm}
        </button>
      </div>
    </Modal>
  )
}
