import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  Check,
  Circle,
  UserRoundPlus,
  CheckSquare,
  StickyNote,
  Upload,
  CalendarPlus,
  FilePlus2,
  PauseCircle,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  Pencil,
  TriangleAlert,
  MessageSquarePlus,
  CalendarClock,
  XCircle,
} from 'lucide-react'
import { patients } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import Modal from '../components/Modal'
import NewTaskModal from '../components/NewTaskModal'
import TaskDetailsModal from '../components/TaskDetailsModal'
import InlineIconAction from '../components/InlineIconAction'
import UploadDocumentModal from '../components/UploadDocumentModal'
import NewAppointmentModal from '../components/NewAppointmentModal'
import AppointmentDetailsModal from '../components/AppointmentDetailsModal'
import CreateReportModal from '../components/CreateReportModal'
import ReportWorkspaceModal from '../components/ReportWorkspaceModal'
import EditPatientModal from '../components/EditPatientModal'
import AddCommunicationModal from '../components/AddCommunicationModal'
import { useToast } from '../context/ToastContext'
import { useRole, roles } from '../context/RoleContext'
import type { CaseStatus, CommunicationItem } from '../types'
import { ALLOWED_CASE_TRANSITIONS, transitionCase, transitionCaseForEvent } from '../utils/caseWorkflow'
import { useDismissable } from '../hooks/useDismissable'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useNotifications } from '../context/NotificationContext'
import { loadPatients, upsertPatient } from '../utils/patientStorage'

const tabs = ['Overview', 'Patient', 'Booking', 'Appointment', 'Documents', 'File Preparation', 'Reports', 'Quality Assurance', 'Tasks', 'Communication', 'Activity History']
const actionButton = 'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors'
const fieldClass = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
type ActionModal = 'assign' | 'task' | 'note' | 'upload' | 'schedule' | 'report' | 'hold' | 'complete' | 'archive' | null

function toInputDate(value: string) {
  if (!value || value === 'Not set' || value === '—') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value: string) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CaseDetail() {
  const { ref } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  const { role } = useRole()
  const { pushNotification } = useNotifications()
  const {
    cases: sharedCases, bookings: sharedBookings, clients: sharedClients, doctors: sharedDoctors,
    documents: sharedDocuments, addDocuments,
    reports: sharedReports, qaQueue: sharedQaQueue, tasks: sharedTasks, communications: sharedCommunications, appointments: sharedAppointments,
    addTask, addCommunication, addAppointment, updateAppointment, updateCase,
  } = usePrototypeData()
  const [tab, setTab] = useState('Overview')
  const requestedRecord = sharedCases.find((c) => c.ref === ref)
  const baseRecord = requestedRecord ?? sharedCases[0]
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusReason, setStatusReason] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | ''>('')
  const [editCaseOpen, setEditCaseOpen] = useState(false)
  const [actionModal, setActionModal] = useState<ActionModal>(null)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [actionValue, setActionValue] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const caseDocs = sharedDocuments.filter((document) => document.caseRef === baseRecord.ref)
  const caseTasks = sharedTasks.filter((t) => t.caseRef === baseRecord.ref)
  const caseAppointments = sharedAppointments.filter((a) => a.caseRef === baseRecord.ref && !a.calendarOnly)
  const caseComms = sharedCommunications.filter((c) => c.caseRef === baseRecord.ref)
  const [rescheduling, setRescheduling] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [patientEditOpen, setPatientEditOpen] = useState(false)
  const [communicationOpen, setCommunicationOpen] = useState(false)
  const [patientRevision, setPatientRevision] = useState(0)
  const moreActionsRef = useRef<HTMLDivElement>(null)
  useDismissable(moreActionsRef, showMoreActions, () => setShowMoreActions(false))
  const record = baseRecord
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'schedule') {
      setRescheduling(false)
      setActionModal('schedule')
      const next = new URLSearchParams(searchParams)
      next.delete('action')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])
  useEffect(() => {
    const requestedTab = searchParams.get('tab')
    if (requestedTab && tabs.includes(requestedTab)) setTab(requestedTab)
  }, [searchParams])

  void patientRevision
  const storedPatients = loadPatients(patients)
  const patient = storedPatients.find((p) => p.name === record.patient) ?? patients.find((p) => p.name === record.patient)
  const linkedBooking = record.bookingRef ? sharedBookings.find((item) => item.ref === record.bookingRef) : undefined
  const linkedClient = sharedClients.find((item) => item.name === record.client)
  const linkedDoctor = sharedDoctors.find((item) => item.name === record.doctor)
  const appt = (['New Booking', 'Information Required', 'Booking Confirmed', 'Appointment Pending', 'Appointment Scheduled'] as CaseStatus[]).includes(record.status)
    ? (caseAppointments.find((a) => a.status === 'Scheduled') ?? caseAppointments[0])
    : (caseAppointments.find((a) => a.status === 'Completed') ?? caseAppointments.find((a) => a.status === 'Scheduled') ?? caseAppointments[0])
  const caseReports = sharedReports.filter((r) => r.caseRef === record.ref)
  const caseQa = sharedQaQueue.filter((q) => q.caseRef === record.ref)
  const qaIssueCount = caseQa.reduce((total, item) => total + (item.comments ?? []).filter((comment) => !comment.resolved).length, 0)

  const currentWorkflowStatus = record.status === 'On Hold' ? (record.statusBeforeHold ?? 'New Booking') : record.status

  if (!requestedRecord) {
    return <div className="bg-white border border-slate-200 rounded-xl p-8 text-center"><p className="text-sm font-medium text-slate-800">Case not found</p><p className="text-xs text-slate-400 mt-1">The requested case reference is not available. No fallback case has been opened.</p><Link to="/cases" className="inline-flex mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">Back to cases</Link></div>
  }

  const latestReport = caseReports[0]

  const nextAction = (() => {
    const messages: Partial<Record<CaseStatus, string>> = {
      'New Booking': 'Validate the booking details and confirm the assigned doctor.',
      'Information Required': 'Resolve the missing instruction information before progressing.',
      'Booking Confirmed': 'Confirm whether an appointment is required and move the case into appointment scheduling.',
      'Appointment Pending': 'Schedule the assigned doctor using the live calendar and conflict checks.',
      'Appointment Scheduled': 'Complete the appointment and record the outcome.',
      'Appointment Completed': 'Review received documents and start file preparation.',
      'Documents Pending': 'Obtain or confirm the required source documents, then start file preparation.',
      'File Preparation in Progress': 'Organise the source documents, review AI assistance and confirm the prepared bundle.',
      'File Ready': `${record.doctor} can review the prepared file and create the draft report.`,
      'Report in Progress': `${record.doctor} should complete the draft report and submit it for QA.`,
      'Draft Report Submitted': 'The draft has been submitted; continue into the QA review queue.',
      'QA Review': 'Complete the QA checklist, then approve or return the report for amendments.',
      'Amendments Required': 'Resolve all QA amendments and resubmit a new report version.',
      'Awaiting Final Approval': 'The report passed QA and now requires final medical approval.',
      'Final Report Approved': 'Record secure delivery of the approved final report.',
      'Report Delivered': 'Complete or cancel any remaining tasks, then close the case.',
      'On Hold': 'Review the hold reason and resume the previous workflow stage when ready.',
      'Cancelled': 'The case is cancelled. Preserve its history or archive it when appropriate.',
      'Completed': 'No operational work remains. The completed case history is retained.',
      'Archived': 'This case is archived and read-only for normal workflow purposes.',
    }
    return messages[record.status] ?? 'Continue the next permitted workflow action.'
  })()

  const preparedBundleReady = caseDocs.some((document) => document.category === 'Prepared Bundle' && document.status === 'Approved')
  const appointmentSatisfied = linkedBooking?.appointmentRequired === false || caseAppointments.some((appointment) => appointment.status === 'Completed')
  const filePreparationSatisfied = preparedBundleReady || caseReports.length > 0
  const qaApproved = caseReports.some((report) => report.qaStatus === 'Approved' || ['Approved', 'Delivered'].includes(report.status))
  const finalApproved = caseReports.some((report) => ['Approved', 'Delivered'].includes(report.status))
  const deliveredReport = caseReports.some((report) => report.status === 'Delivered')
  const openTaskCount = caseTasks.filter((task) => !['Completed', 'Cancelled'].includes(task.status)).length
  const completionChecks = [
    { label: 'Appointment completed / not required', complete: appointmentSatisfied },
    { label: 'Documents and file preparation complete', complete: filePreparationSatisfied },
    { label: 'Quality assurance approved', complete: qaApproved },
    { label: 'Final medical approval recorded', complete: finalApproved },
    { label: 'Final report delivery recorded', complete: deliveredReport },
    { label: 'No outstanding tasks', complete: openTaskCount === 0 },
  ]
  const completionReady = completionChecks.every((item) => item.complete)
  const caseClosed = ['Completed', 'Archived', 'Cancelled'].includes(record.status)
  const caseArchived = record.status === 'Archived'
  const transitionBlockReason = (status: CaseStatus) => {
    const hasScheduledAppointment = caseAppointments.some((appointment) => appointment.status === 'Scheduled')
    const hasCompletedAppointment = caseAppointments.some((appointment) => appointment.status === 'Completed')
    const hasReport = caseReports.length > 0
    const hasSubmittedReport = caseReports.some((report) => ['Submitted for QA', 'Amendments Required', 'Approved', 'Delivered'].includes(report.status))
    const hasQaReview = caseQa.length > 0
    const hasReturnedQa = caseQa.some((qa) => qa.status === 'Returned')

    if (status === 'Appointment Scheduled' && !hasScheduledAppointment) return 'Schedule the appointment from this case first.'
    if (status === 'Appointment Completed' && !hasCompletedAppointment) return 'Complete the appointment and record its outcome first.'
    if (status === 'File Ready' && !preparedBundleReady) return 'Confirm an approved prepared bundle in File Preparation first.'
    if (status === 'Report in Progress' && !hasReport) return 'Create the draft report from this case first.'
    if (status === 'Draft Report Submitted' && !hasSubmittedReport) return 'Submit the draft from the report workspace first.'
    if (status === 'QA Review' && !hasQaReview) return 'Submit the report to QA so a review item exists first.'
    if (status === 'Amendments Required' && !hasReturnedQa) return 'QA must return the report with amendments first.'
    if (status === 'Awaiting Final Approval' && !qaApproved) return 'QA must approve the current report first.'
    if (status === 'Final Report Approved' && !finalApproved) return 'Complete the final medical approval in the report workspace first.'
    if (status === 'Report Delivered' && !deliveredReport) return 'Record report delivery in the report workspace first.'
    if (status === 'Completed' && (!deliveredReport || openTaskCount > 0)) return !deliveredReport ? 'Record final report delivery first.' : `Complete or cancel ${openTaskCount} open task${openTaskCount === 1 ? '' : 's'} first.`
    return ''
  }
  const allowedTransitions = record.status === 'On Hold' ? [record.statusBeforeHold ?? 'New Booking'] : ALLOWED_CASE_TRANSITIONS[record.status]
  const manualTransitions = record.status === 'On Hold'
    ? allowedTransitions
    : allowedTransitions.filter((status) => ['Information Required', 'Booking Confirmed', 'Appointment Pending', 'Documents Pending', 'Cancelled'].includes(status))

  const openAction = (action: ActionModal) => {
    setActionValue('')
    setShowMoreActions(false)
    if (action !== 'schedule') setRescheduling(false)
    setActionModal(action)
  }

  const submitAction = (meta?: { expectedReviewDate?: string }) => {
    if (actionModal === 'hold') {
      if (!actionValue.trim()) {
        showToast('Add a hold reason before placing the case on hold.')
        return
      }
      const reviewDate = meta?.expectedReviewDate ? formatDate(meta.expectedReviewDate) : ''
      const holdDetail = `${actionValue.trim()}${reviewDate ? ` · Review ${reviewDate}` : ''}`
      updateCase(record.ref, (current) => transitionCase(current, 'On Hold', role.name, holdDetail))
      setNotes((prev) => [`Case placed on hold: ${holdDetail}`, ...prev])
      showToast(`Case ${record.ref} placed on hold.`)
    }
    if (actionModal === 'complete') {
      if (record.status !== 'Report Delivered' || !completionReady) {
        const outstanding = completionChecks.filter((item) => !item.complete).map((item) => item.label.toLowerCase())
        showToast(`Case cannot be completed yet.${outstanding.length ? ` Outstanding: ${outstanding.join(', ')}.` : ''}`)
        return
      }
      updateCase(record.ref, (current) => transitionCase(current, 'Completed', role.name, actionValue.trim() || 'Case completion confirmed'))
      if (actionValue.trim()) setNotes((prev) => [`Completion note: ${actionValue.trim()}`, ...prev])
      pushNotification({ title: 'Case completed', caseRef: record.ref, type: 'Case completed', priority: record.priority, actionPath: `/cases/${record.ref}`, detail: 'All required actions are complete. The full case history remains available to authorised users.', recipientRoleIds: ['operations-manager', 'management', 'booking-administrator'], dedupeKey: `workflow:ops:${record.ref}` })
      showToast(`Case ${record.ref} marked complete.`)
    }
    if (actionModal === 'archive') {
      if (!['Completed', 'Cancelled'].includes(record.status)) {
        showToast('Only completed or cancelled cases can be archived.')
        return
      }
      if (!actionValue.trim()) {
        showToast('Add an archive note before archiving the case.')
        return
      }
      updateCase(record.ref, (current) => transitionCase(current, 'Archived', role.name, actionValue.trim()))
      setNotes((prev) => [`Archive note: ${actionValue.trim()}`, ...prev])
      showToast(`Case ${record.ref} archived. Its full history remains available to authorised users.`)
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

  const canEditCase = ['booking-administrator', 'operations-manager', 'system-administrator'].includes(role.id)
  const canManageStatus = ['booking-administrator', 'operations-manager', 'system-administrator'].includes(role.id)
  const canChangeStatus = canManageStatus && manualTransitions.length > 0
  const canAssignUser = ['booking-administrator', 'operations-manager', 'system-administrator'].includes(role.id)
  const canSchedule = ['booking-administrator', 'operations-manager'].includes(role.id)
  const canUploadDocument = ['booking-administrator', 'operations-manager', 'file-preparation', 'medical-expert'].includes(role.id)
  const canCreateTask = !['management'].includes(role.id)
  const canAddNote = !['management'].includes(role.id)
  const canWorkReport = (role.id === 'medical-expert' && record.doctor === role.name) || role.id === 'file-preparation'
  const canPerformQa = role.id === 'quality-assurance'
  const canCompleteCase = ['booking-administrator', 'operations-manager'].includes(role.id)
  const canArchiveCase = ['booking-administrator', 'operations-manager', 'system-administrator'].includes(role.id) && ['Completed', 'Cancelled'].includes(record.status)

  const responsibleForNextAction = (() => {
    if (record.status === 'On Hold') return record.owner
    if (['New Booking', 'Information Required', 'Booking Confirmed', 'Appointment Pending', 'Appointment Scheduled'].includes(record.status)) return 'Booking Administration'
    if (['Appointment Completed', 'Documents Pending', 'File Preparation in Progress'].includes(record.status)) return 'File Preparation / Operations'
    if (['File Ready', 'Report in Progress', 'Amendments Required'].includes(record.status)) return record.doctor
    if (['Draft Report Submitted', 'QA Review'].includes(record.status)) return caseQa[0]?.reviewer && caseQa[0].reviewer !== 'Unassigned' ? caseQa[0].reviewer : 'Quality Assurance'
    if (record.status === 'Awaiting Final Approval') return record.doctor
    if (record.status === 'Final Report Approved') return 'Booking Administration / Operations'
    if (record.status === 'Report Delivered') return record.owner
    if (['Completed', 'Cancelled'].includes(record.status)) return 'Operations / authorised administrator'
    return 'Read-only'
  })()

  const appointmentCheckpoint = linkedBooking?.appointmentRequired === false
    ? { state: 'Not required' as const, detail: 'Booking confirms that no appointment is required for this instruction' }
    : appt
      ? (appt.status === 'Completed' ? { state: 'Complete' as const, detail: `${appt.date} · ${appt.time}` } : { state: appt.status as string, detail: `${appt.date} · ${appt.time}` })
      : { state: 'Pending' as const, detail: 'No appointment recorded' }
  const fileCheckpoint = preparedBundleReady
    ? { state: 'File ready' as const, detail: `${caseDocs.length} document${caseDocs.length === 1 ? '' : 's'} · approved prepared bundle` }
    : caseReports.length > 0
      ? { state: 'Complete' as const, detail: 'File preparation was completed before report drafting began' }
      : caseDocs.length > 0
        ? { state: record.status === 'File Preparation in Progress' ? 'In preparation' : 'Pending', detail: `${caseDocs.length} document${caseDocs.length === 1 ? '' : 's'} received · bundle not yet confirmed` }
        : { state: 'Pending' as const, detail: 'No case documents received' }
  const reportCheckpoint = latestReport
    ? { state: finalApproved ? 'Final approved' : latestReport.status === 'Submitted for QA' && qaApproved ? 'QA approved' : latestReport.status, detail: `${latestReport.reportType} · ${latestReport.version}` }
    : { state: 'Not started' as const, detail: 'No report created' }
  const qaCheckpoint = caseQa[0]
    ? {
        state: caseQa[0].status === 'Not Started' ? 'QA requested' : caseQa[0].status === 'Returned' ? 'Amendments required' : caseQa[0].status,
        detail: caseQa[0].status === 'Approved'
          ? `${caseQa[0].reviewer} approved the QA review · final medical approval is next`
          : caseQa[0].status === 'Returned'
            ? `${caseQa[0].reviewer} returned the report · ${qaIssueCount} open amendment${qaIssueCount === 1 ? '' : 's'}`
            : `${caseQa[0].reviewer} · due ${caseQa[0].dueDate}`,
      }
    : { state: 'Not started' as const, detail: 'No QA request submitted' }
  const deliveryCheckpoint = deliveredReport
    ? { state: 'Delivered' as const, detail: latestReport?.deliveryRecipient ? `${latestReport.deliveryRecipient} · ${latestReport.deliveryDate ?? 'date recorded'}` : 'Final report delivery recorded' }
    : { state: finalApproved ? 'Ready to deliver' as const : 'Pending' as const, detail: finalApproved ? 'Final medical approval recorded' : 'Final approval required before delivery' }

  const timelineSection = (
    <section className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Case timeline</p>
          <p className="text-xs text-slate-500 mt-0.5">Current status first, followed by the most recent recorded changes and earlier workflow milestones.</p>
        </div>
        <button onClick={() => setTab('Activity History')} className="text-xs font-medium text-brand-600 hover:text-brand-700">View full history</button>
      </div>
      <div className="px-4 py-4">
        <div className="relative ml-2 border-l border-slate-200 pl-5 space-y-5">
          <TimelineItem title={`Current status · ${record.status}`} date={record.lastUpdated || 'Date not recorded'} detail={nextAction} current />
          {(record.statusHistory ?? []).filter((item) => item.to !== record.status).slice(-4).reverse().map((item) => <TimelineItem key={item.id} title={`${item.from} → ${item.to}`} date={item.date || 'Date not recorded'} detail={`${item.user || 'User not recorded'}${item.reason ? ` · ${item.reason}` : ''}`} />)}
          {latestReport?.deliveryDate && <TimelineItem title="Final report delivered" date={latestReport.deliveryDate} detail={`${latestReport.deliveryRecipient || 'Recipient not recorded'} · ${latestReport.deliveryMethod || 'Delivery method not recorded'}`} />}
          {caseQa[0] && <TimelineItem title={`Quality assurance · ${caseQa[0].status}`} date={caseQa[0].submittedDate || 'Date not recorded'} detail={`Reviewer: ${caseQa[0].reviewer || 'Not assigned'} · Due ${caseQa[0].dueDate || 'Not recorded'}`} alert={caseQa[0].status === 'Returned'} />}
          {latestReport && <TimelineItem title={`Report · ${latestReport.status}`} date={latestReport.lastUpdated || 'Date not recorded'} detail={`${latestReport.reportType || 'Report type not recorded'} · ${latestReport.version || 'Version not recorded'} · QA ${latestReport.qaStatus || 'Not started'}`} />}
          {caseDocs.some((item) => item.category === 'Prepared Bundle') && <TimelineItem title="File preparation completed" date={caseDocs.find((item) => item.category === 'Prepared Bundle')?.uploadDate ?? 'Date not recorded'} detail="Prepared bundle is available for doctor review." />}
          {caseDocs.length > 0 && <TimelineItem title="Documents received" date={caseDocs[0]?.uploadDate ?? 'Date not recorded'} detail={`${caseDocs.length} document${caseDocs.length === 1 ? '' : 's'} linked to this case.`} />}
          {appt && <TimelineItem title={`Appointment ${appt.status.toLowerCase()}`} date={`${appt.date || 'Date not recorded'}${appt.time ? ` · ${appt.time}` : ''}`} detail={`${appt.doctor || 'Doctor not assigned'} · ${appt.type || 'Type not recorded'} · ${appt.location || 'Location not recorded'}`} />}
          <TimelineItem title="Case record created" date={linkedBooking?.bookingDate ?? 'Date not recorded'} detail={linkedBooking ? `Booking ${linkedBooking.ref} linked to the case record.` : `Case ${record.ref} is available as the central case record.`} />
        </div>
      </div>
    </section>
  )

  return (
    <div>
      <Link to="/cases" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft size={15} /> Back to cases
      </Link>

      {/* Case identity and single source-of-truth status */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-slate-900">{record.ref}</h2>
              <StatusBadge status={record.status} />
              <PriorityBadge priority={record.priority} />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{record.patient}</span>
              <span>·</span>
              <span>{record.client || 'Direct instruction'}</span>
              <span>·</span><span>Ref {record.clientRef}</span>
              {linkedBooking && <><span>·</span><span>Booking {linkedBooking.ref}</span></>}
            </div>
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
          {!caseClosed && (canEditCase || canChangeStatus) && <div className="flex gap-2">
            {canEditCase && <button onClick={() => setEditCaseOpen(true)} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Edit case</button>}
            {canChangeStatus && <button onClick={() => setStatusModalOpen(true)} className="text-xs bg-brand-600 text-white rounded-lg px-3 py-1.5 hover:bg-brand-700">Change status</button>}
          </div>}
        </div>

        {record.status === 'On Hold' && <div className="mt-4 border-t border-slate-100 pt-3"><div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">This case is on hold from <strong>{currentWorkflowStatus}</strong>. The hold reason and review date are preserved in Activity History; resume only when the blocker is resolved.</div></div>}
      </div>

      {/* Case actions stay explicit: icon + text buttons. Inline table actions elsewhere remain icon-only. */}
      {!caseClosed && <div className="bg-white rounded-xl border border-slate-200 px-3 py-2.5 mb-4 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mr-1">Case actions</span>
        {canAssignUser && <button type="button" className={actionButton} onClick={() => openAction('assign')}><UserRoundPlus size={15}/> Assign user</button>}
        {canCreateTask && <button type="button" className={actionButton} onClick={() => openAction('task')}><CheckSquare size={15}/> Add task</button>}
        {canAddNote && <button type="button" className={actionButton} onClick={() => openAction('note')}><StickyNote size={15}/> Add note</button>}
        {canUploadDocument && <button type="button" className={actionButton} onClick={() => openAction('upload')}><Upload size={15}/> Upload document</button>}
        {canSchedule && <button type="button" className={actionButton} onClick={() => { setRescheduling(false); openAction('schedule') }}><CalendarPlus size={15}/> Schedule appointment</button>}
        {(canWorkReport || canCompleteCase || canChangeStatus) && <div className="relative ml-auto" ref={moreActionsRef}>
          <button type="button" className={actionButton} onClick={() => setShowMoreActions((v) => !v)} aria-expanded={showMoreActions}><MoreHorizontal size={16}/> More actions</button>
          {showMoreActions && <div className="absolute right-0 z-20 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5">
            {canWorkReport && <button disabled={!['File Ready', 'Report in Progress', 'Amendments Required', 'Awaiting Final Approval'].includes(record.status)} onClick={() => caseReports[0] ? setSelectedReportId(caseReports[0].id) : openAction('report')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><FilePlus2 size={15}/> {caseReports[0] ? 'Open report' : 'Create report'}</button>}
            {canManageStatus && record.status !== 'On Hold' && <button onClick={() => openAction('hold')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-700 rounded-lg hover:bg-amber-50"><PauseCircle size={15}/> Place on hold</button>}
            {canCompleteCase && <button disabled={record.status !== 'Report Delivered' || !completionReady} title={record.status !== 'Report Delivered' ? 'Final report delivery must be recorded first.' : !completionReady ? 'Resolve the outstanding completion checklist first.' : undefined} onClick={() => openAction('complete')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-teal-700 rounded-lg hover:bg-teal-50 disabled:opacity-40 disabled:cursor-not-allowed"><CheckCircle2 size={15}/> Complete case</button>}
          </div>}
        </div>}
      </div>}
      {caseClosed && <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-4 flex-wrap"><div><p className="text-sm font-medium text-slate-800">{record.status} case — full history retained</p><p className="text-xs text-slate-500 mt-1">{caseArchived ? 'This archived case is read-only. Authorised users can still review its complete record and audit history.' : 'Operational work is closed. The full case history remains available and the case can now be archived by an authorised user.'}</p></div>{canArchiveCase && <button onClick={() => openAction('archive')} className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">Archive case</button>}</div>}

      {/* Complete case record */}
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
            {timelineSection}

            <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)] gap-4">
              <section className={`rounded-xl border p-4 ${record.status === 'On Hold' || record.status === 'Cancelled' ? 'border-amber-200 bg-amber-50/60' : 'border-brand-100 bg-brand-50/40'}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">What happens now</p>
                <p className="text-base font-semibold text-slate-900 mt-2 leading-6">{nextAction}</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200/70">
                  <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Responsible</p><p className="text-sm font-medium text-slate-700 mt-1">{responsibleForNextAction}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Target completion</p><p className="text-sm font-medium text-slate-700 mt-1">{record.targetDate}</p></div>
                </div>
                {!caseClosed && <div className="mt-3 flex flex-wrap gap-2">
                  {['New Booking','Booking Confirmed','Appointment Pending'].includes(record.status) && canSchedule && <button onClick={() => openAction('schedule')} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Schedule appointment</button>}
                  {record.status === 'Information Required' && canAddNote && <button onClick={() => setCommunicationOpen(true)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Record / request information</button>}
                  {record.status === 'Appointment Scheduled' && appt && <button onClick={() => setSelectedAppointmentId(appt.id)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Record appointment outcome</button>}
                  {['Appointment Completed','Documents Pending','File Preparation in Progress'].includes(record.status) && role.id === 'file-preparation' && <Link onClick={() => updateCase(record.ref, (current) => transitionCaseForEvent(current, 'file-preparation-started', role.name, 'File preparation workspace opened'))} to={`/documents?case=${record.ref}&view=preparation`} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Open file preparation</Link>}
                  {(['File Ready','Report in Progress','Amendments Required'] as CaseStatus[]).includes(record.status) && canWorkReport && <button onClick={() => caseReports[0] ? setSelectedReportId(caseReports[0].id) : openAction('report')} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">{record.status === 'Amendments Required' ? 'Resolve QA amendments' : caseReports[0] ? 'Open report' : 'Create report'}</button>}
                  {(['Draft Report Submitted','QA Review'] as CaseStatus[]).includes(record.status) && canPerformQa && <Link to={`/quality-assurance?case=${record.ref}`} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">{record.status === 'Draft Report Submitted' ? 'Start QA review' : 'Continue QA review'}</Link>}
                  {record.status === 'Awaiting Final Approval' && role.id === 'medical-expert' && record.doctor === role.name && <button onClick={() => latestReport && setSelectedReportId(latestReport.id)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Final medical approval</button>}
                  {record.status === 'Final Report Approved' && ['booking-administrator','operations-manager'].includes(role.id) && <button onClick={() => latestReport && setSelectedReportId(latestReport.id)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Record report delivery</button>}
                  {record.status === 'On Hold' && canChangeStatus && <button onClick={() => setStatusModalOpen(true)} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700">Resume case</button>}
                  {record.status === 'Report Delivered' && canCompleteCase && <button disabled={!completionReady} onClick={() => openAction('complete')} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 disabled:bg-slate-300">Complete case</button>}
                </div>}
                {record.status === 'Draft Report Submitted' && !canPerformQa && <p className="mt-3 text-xs text-slate-500">The report is in the assigned Quality Assurance queue. Your role does not need to take a QA decision.</p>}
                {record.status === 'QA Review' && !canPerformQa && <p className="mt-3 text-xs text-slate-500">Quality Assurance is actively reviewing the report. The next hand-off will be either amendments or final medical approval.</p>}
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-3">Case details</p>
                <div className="space-y-2.5 text-sm">
                  <SummaryRow label="Patient" value={record.patient}/><SummaryRow label="Client" value={record.client}/><SummaryRow label="Doctor" value={record.doctor}/><SummaryRow label="Case owner" value={record.owner}/><SummaryRow label="Priority" value={record.priority}/><SummaryRow label="Case type" value={record.caseType}/>
                </div>
              </section>
            </div>

            {record.status === 'Report Delivered' && <section className={`rounded-xl border p-4 ${completionReady ? 'border-teal-200 bg-teal-50/50' : 'border-amber-200 bg-amber-50/60'}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-800">Case completion check</p><p className="text-xs text-slate-500 mt-1">The case can only be marked complete after every required action has finished.</p></div><span className={`text-xs font-semibold ${completionReady ? 'text-teal-700' : 'text-amber-700'}`}>{completionChecks.filter((item) => item.complete).length}/{completionChecks.length} complete</span></div><div className="grid md:grid-cols-2 gap-x-6 gap-y-2 mt-3">{completionChecks.map((item) => <div key={item.label} className="flex items-center gap-2 text-xs"><span className={`w-4 h-4 rounded-full flex items-center justify-center ${item.complete ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>{item.complete ? <Check size={10}/> : <Circle size={7}/>}</span><span className={item.complete ? 'text-slate-600' : 'text-slate-800 font-medium'}>{item.label}</span></div>)}</div></section>}

            <section className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3 mb-3"><p className="font-semibold text-slate-900">Recent activity</p><span className="text-xs text-slate-400">Full history is available in Activity History</span></div>
              <div className="space-y-3">
                {notes.slice(0, 1).map((note, i) => <ActivityRow key={`${note}-${i}`} title="Internal note added" detail={note} time="Just now"/>)}
                {caseComms.slice(0, 2).map((communication) => <ActivityRow key={communication.id} title={communication.subject} detail={`${communication.type} · ${communication.from}`} time={communication.date}/>)}
                <ActivityRow title={`Status · ${record.status}`} detail={record.statusHistory?.slice(-1)[0]?.reason ?? 'Current case workflow status'} time={record.lastUpdated}/>
              </div>
            </section>
          </div>
        )}

        {tab === 'Patient' && (
          <div className="space-y-4 text-sm">
            {!patient && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><strong>Patient profile details are incomplete.</strong> The case still identifies {record.patient}; missing fields are shown as placeholders instead of leaving this tab blank.</div>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-semibold text-slate-800">Patient information</p><p className="text-xs text-slate-500 mt-0.5">Case-linked patient details, requirements and communication preferences.</p></div>
              <div className="flex items-center gap-1.5">
                <InlineIconAction label="Edit patient fields" icon={<Pencil size={14}/>} onClick={() => setPatientEditOpen(true)} disabled={!patient} />
                <InlineIconAction label="Add patient warning or note" icon={<TriangleAlert size={14}/>} onClick={() => setPatientEditOpen(true)} disabled={!patient} tone="warning" />
                <InlineIconAction label="Record patient communication" icon={<MessageSquarePlus size={14}/>} onClick={() => setCommunicationOpen(true)} tone="brand" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <SectionCard title="Personal & contact details">
                <SummaryRow label="Name" value={patient?.name || record.patient || 'Not recorded'} />
                <SummaryRow label="Date of birth" value={patient?.dob || 'Not recorded'} />
                <SummaryRow label="Email" value={patient?.email || 'Not recorded'} />
                <SummaryRow label="Phone" value={patient?.phone || 'Not recorded'} />
                <SummaryRow label="Address" value={patient?.address || 'Not recorded'} />
              </SectionCard>
              <SectionCard title="Requirements & case context">
                <SummaryRow label="Accessibility" value={patient?.accessibilityRequirements || 'None recorded'} />
                <SummaryRow label="Interpreter" value={patient?.interpreter || 'Not required / not recorded'} />
                <SummaryRow label="Communication preference" value={patient?.communicationPreferences || 'Not recorded'} />
                <SummaryRow label="Patient warnings" value={patient?.patientWarnings || 'No warnings recorded'} />
                <SummaryRow label="Related cases" value={sharedCases.filter((item) => item.patient === record.patient).map((item) => item.ref).join(', ') || 'No related cases'} />
              </SectionCard>
            </div>
          </div>
        )}

        {tab === 'Booking' && (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] gap-5 text-sm">
            <SectionCard title="Original instruction">
              <SummaryRow label="Booking reference" value={record.bookingRef ?? 'Legacy / not linked'} />
              <SummaryRow label="Instruction date" value={linkedBooking?.bookingDate ?? 'Not recorded'} />
              <SummaryRow label="Client" value={record.client} />
              <SummaryRow label="Case type" value={record.caseType} />
              <SummaryRow label="Medical speciality" value={linkedDoctor?.speciality ?? 'Not recorded'} />
              <SummaryRow label="Appointment requirement" value={linkedBooking ? (linkedBooking.appointmentRequired === false ? 'Not required' : `Required${linkedBooking.preferredAppointmentDate ? ` · preferred ${linkedBooking.preferredAppointmentDate}` : ''}`) : 'Not recorded'} />
              <SummaryRow label="Requested completion" value={linkedBooking?.targetCompletionDate ?? record.targetDate} />
              <SummaryRow label="Agreed fee" value={linkedBooking?.agreedFee ?? 'Restricted / not recorded'} />
              <SummaryRow label="Special instructions" value={linkedBooking?.notes ?? 'Standard medicolegal report instruction.'} />
            </SectionCard>
            <SectionCard title="Booking history">
              {(linkedBooking?.activity ?? []).slice(-5).reverse().map((item) => <ActivityRow key={item.id} title={item.title} detail={item.detail} time={item.date} />)}
              {!(linkedBooking?.activity?.length) && <p className="text-xs text-slate-400">No booking history is available for this record.</p>}
            </SectionCard>
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
                <SummaryRow label="Consultation method" value={appt.consultationMethod ?? 'Not recorded'} />
                <SummaryRow label="Interpreter" value={appt.interpreterRequired ? 'Required' : 'Not required'} />
                <SummaryRow label="Attendance" value={appt.status === 'Completed' ? 'Attended' : appt.status === 'Did Not Attend' ? 'Did not attend' : 'Pending'} />
                <SummaryRow label="Outcome" value={appt.outcome ?? 'Not recorded'} />
                <div className="flex justify-between items-center"><span className="text-slate-500">Status</span><StatusBadge status={appt.status} /></div>
                {(appt.history ?? []).length > 0 && <div className="pt-3 mt-3 border-t border-slate-100"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Appointment history</p><div className="space-y-2">{(appt.history ?? []).slice(0,5).map((item) => <ActivityRow key={item.id} title={item.action} detail={item.detail} time={item.date} />)}</div></div>}
                <div className="flex gap-1.5 mt-4">
                  <InlineIconAction label="Open appointment" icon={<Eye size={14}/>} onClick={() => appt && setSelectedAppointmentId(appt.id)} tone="brand" />
                  <InlineIconAction label="Reschedule appointment" icon={<CalendarClock size={14}/>} onClick={() => { setRescheduling(true); setActionModal('schedule') }} />
                  <InlineIconAction label="Cancel appointment" icon={<XCircle size={14}/>} onClick={() => { if (appt) { updateAppointment(appt.id, (current) => ({ ...current, status: 'Cancelled' as const })); showToast(`Appointment for ${record.patient} cancelled.`) } }} tone="danger" />
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
              <Link
                key={d.id}
                to={`/documents?case=${record.ref}&doc=${d.id}`}
                className="flex items-center justify-between py-3 -mx-1 px-1 rounded-lg hover:bg-slate-50 group"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 group-hover:text-brand-700 group-hover:underline">{d.name}</p>
                  <p className="text-xs text-slate-400">{d.category} · {d.version} · {d.size}</p>
                </div>
                <StatusBadge status={d.status} />
              </Link>
            ))}
            <div className="pt-3"><button onClick={() => openAction('upload')} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">Upload document</button></div>
          </div>
        )}

        {tab === 'File Preparation' && (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="border border-slate-100 rounded-lg p-3">
              <p className="font-semibold text-slate-900 mb-3">Document status</p>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Documents received" value={`${caseDocs.length}`} />
                <SummaryRow label="Duplicates flagged" value="0" />
                <SummaryRow label="Missing documents" value={record.status === 'Information Required' ? '1' : '0'} />
              </div>
            </div>
            <div className="border border-slate-100 rounded-lg p-3">
              <p className="font-semibold text-slate-900 mb-3">Prepared bundle</p>
              <p className="text-sm text-slate-600">{caseDocs.some((d) => d.category === 'Prepared Bundle') ? 'Prepared bundle available for review.' : 'Bundle preparation has not been completed yet.'}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Link to={`/documents?case=${record.ref}&view=preparation`} className="inline-flex rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">{caseDocs.some((d) => d.category === 'Prepared Bundle') ? 'Review bundle / preparation' : 'Start file preparation'}</Link></div>
            </div>
            <div className="border border-slate-100 rounded-lg p-3">
              <p className="font-semibold text-slate-900 mb-3">Preparation status</p>
              <StatusBadge status={record.status === 'File Preparation in Progress' ? 'Review Required' : caseDocs.length ? 'Approved' : 'Not Started'} />
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
                  <button onClick={() => setSelectedReportId(r.id)} className="text-sm font-medium text-slate-800 hover:text-brand-700 text-left" title={`Open report ${r.id}`}>{r.reportType || 'Untitled report'} · {r.version || 'Version not recorded'}</button>
                  <p className="text-xs text-slate-400">Due {r.dueDate} · Updated {r.lastUpdated}</p>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={r.status} /><InlineIconAction label={`Open ${r.reportType} ${r.version}`} icon={<Eye size={14}/>} onClick={() => setSelectedReportId(r.id)} tone="brand" /></div>
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
            {canPerformQa ? <Link to={`/quality-assurance?case=${record.ref}`} className="inline-flex rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">Open QA review</Link> : <p className="text-xs text-slate-500">QA decisions are completed by the Quality Assurance team. This tab remains visible as case history.</p>}
          </div>
        )}

        {tab === 'Tasks' && (
          <div className="divide-y divide-slate-100">
            {caseTasks.length === 0 && <p className="text-sm text-slate-500">No tasks yet.</p>}
            {caseTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <button onClick={() => setSelectedTaskId(t.id)} className="text-sm font-medium text-slate-800 hover:text-brand-700 text-left">{t.title || 'Untitled task'}</button>
                  <p className="text-xs text-slate-400">Task {t.id} · Owner: {t.owner || 'Unassigned'} · Due {t.dueDate || 'Not recorded'}</p>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={t.status} /><InlineIconAction label={`Open task ${t.id}`} icon={<Eye size={14}/>} onClick={() => setSelectedTaskId(t.id)} tone="brand" /></div>
              </div>
            ))}
            <div className="pt-3"><button onClick={() => openAction('task')} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">Create task</button></div>
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
            <button onClick={() => setCommunicationOpen(true)} className="inline-flex rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">Add communication</button>
          </div>
        )}

        {tab === 'Activity History' && (
          <div className="space-y-3 text-sm">
            {notes.map((note, i) => (
              <div key={`${note}-${i}`} className="flex justify-between gap-6"><span className="text-slate-600">Internal note: {note}</span><span className="text-xs text-slate-400 shrink-0">Just now</span></div>
            ))}
            {[...(record.statusHistory ?? [])].reverse().map((item) => <div key={item.id} className="flex justify-between gap-4"><span className="text-slate-600">Status: {item.from} → {item.to}{item.reason ? ` · ${item.reason}` : ''}</span><span className="text-xs text-slate-400 shrink-0">{item.date}</span></div>)}
            {(record.statusHistory ?? []).length === 0 && <div className="flex justify-between"><span className="text-slate-600">Current status: {record.status}</span><span className="text-xs text-slate-400">{record.lastUpdated}</span></div>}
            <div className="flex justify-between"><span className="text-slate-600">Case created from booking {record.bookingRef ?? record.clientRef}</span><span className="text-xs text-slate-400">31 Jul 2026</span></div>
          </div>
        )}
      </div>

      {statusModalOpen && (
        <Modal title="Change case status" description={`${record.ref} · controlled workflow transition`} onClose={() => { setStatusModalOpen(false); setSelectedStatus(''); setStatusReason('') }}>
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 flex items-center justify-between gap-3">
              <div><p className="text-[11px] uppercase tracking-wide text-slate-400">Current status</p><p className="text-sm font-medium text-slate-800 mt-0.5">{record.status}</p></div>
              <StatusBadge status={record.status} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Allowed next status *</label>
              <div className="space-y-2">{manualTransitions.map((item) => { const blocked = transitionBlockReason(item); return <button type="button" key={item} disabled={Boolean(blocked)} onClick={() => setSelectedStatus(item)} className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${selectedStatus === item ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-55`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-800">{item}</span>{selectedStatus === item && <Check size={14} className="text-brand-600"/>}</div>{blocked ? <p className="text-[11px] text-amber-700 mt-1">{blocked}</p> : <p className="text-[11px] text-slate-400 mt-1">Valid next stage in the controlled case journey.</p>}</button> })}</div>
              <p className="text-[11px] text-slate-400 mt-2">Appointment, file preparation, report, QA, final approval, delivery and completion statuses are set by their dedicated workflow actions. Manual status changes are limited to administrative branch states.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Reason / workflow note {selectedStatus === 'On Hold' ? '*' : '(optional)'}</label>
              <textarea rows={3} className={fieldClass} value={statusReason} onChange={(e) => setStatusReason(e.target.value)} placeholder="Why is the case moving to this stage?" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
            <button onClick={() => { setStatusModalOpen(false); setSelectedStatus(''); setStatusReason('') }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button disabled={!selectedStatus || (selectedStatus === 'On Hold' && !statusReason.trim())} onClick={() => {
              if (!selectedStatus) return
              const from = record.status
              updateCase(record.ref, (current) => transitionCase(current, selectedStatus, role.name, statusReason.trim() || undefined))
              setStatusModalOpen(false); setSelectedStatus(''); setStatusReason(''); showToast(`Case ${record.ref} moved from ${from} to ${selectedStatus}.`)
            }} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 rounded-lg">Update status</button>
          </div>
        </Modal>
      )}

      {editCaseOpen && <EditCaseModal record={record} doctors={sharedDoctors} clients={sharedClients} onClose={() => setEditCaseOpen(false)} onSave={(updates) => { updateCase(record.ref, (current) => ({ ...current, ...updates, lastUpdated: 'Just now' })); setEditCaseOpen(false); showToast(`Case ${record.ref} updated.`) }} />}

      {actionModal === 'assign' && (
        <AssignCaseModal
          recordRef={record.ref}
          currentOwner={record.owner}
          onClose={() => setActionModal(null)}
          onAssign={(nextOwner, assignmentNote) => { updateCase(record.ref, (current) => ({ ...current, owner: nextOwner, lastUpdated: 'Just now' })); if (assignmentNote) setNotes((prev) => [`Assignment note: ${assignmentNote}`, ...prev]); setActionModal(null); showToast(`Case ${record.ref} assigned to ${nextOwner}.`) }}
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
          defaultDoctor={record.doctor === 'Unassigned' ? '' : record.doctor}
          existingAppointments={sharedAppointments}
          lockCase
          onClose={() => { setActionModal(null); setRescheduling(false) }}
          onCreate={(appointment) => {
            if (rescheduling && appt) updateAppointment(appt.id, (current) => ({ ...current, status: 'Rescheduled' as const }))
            addAppointment(appointment)
            updateCase(record.ref, (current) => transitionCaseForEvent(current, 'appointment-scheduled', role.name, 'Appointment scheduled through case calendar'))
            setActionModal(null); setRescheduling(false); showToast(`${rescheduling ? 'Appointment rescheduled' : 'Appointment scheduled'} for ${record.patient}.`)
          }}
        />
      )}

      {selectedAppointmentId && (() => { const selectedAppointment = sharedAppointments.find((item) => item.id === selectedAppointmentId); return selectedAppointment ? <AppointmentDetailsModal appointment={selectedAppointment} appointments={sharedAppointments} doctors={sharedDoctors} onClose={() => setSelectedAppointmentId(null)} onUpdate={(next) => { const previous = sharedAppointments.find((item) => item.id === next.id); updateAppointment(next.id, next); if (next.status === 'Completed' && previous?.status !== 'Completed') updateCase(record.ref, (current) => transitionCaseForEvent(current, 'appointment-completed', role.name, 'Appointment completed and outcome recorded')); showToast(next.status === 'Completed' && previous?.status !== 'Completed' ? 'Appointment completed. Case moved to Appointment Completed.' : 'Appointment updated.'); }} /> : null })()}
      {actionModal === 'report' && <CreateReportModal defaultCaseRef={record.ref} onClose={() => setActionModal(null)} />}
      {selectedReportId && <ReportWorkspaceModal reportId={selectedReportId} onClose={() => setSelectedReportId(null)} />}
      {selectedTaskId && <TaskDetailsModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
      {patientEditOpen && patient && <EditPatientModal patient={patient} onClose={() => setPatientEditOpen(false)} onSave={(next) => { upsertPatient(next, patients); setPatientRevision((value) => value + 1); setPatientEditOpen(false); showToast('Patient details updated.'); }} />}
      {communicationOpen && <AddCommunicationModal defaultCaseRef={record.ref} onClose={() => setCommunicationOpen(false)} />}

      {actionModal && ['hold', 'complete', 'archive'].includes(actionModal) && (
        <CaseActionModal action={actionModal} record={record} value={actionValue} onValue={setActionValue} onClose={() => setActionModal(null)} onSubmit={submitAction} completionChecks={completionChecks} />
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
  const display = value?.trim() ? value : 'Not recorded'
  return <div className="flex justify-between gap-5"><span className="text-slate-500">{label}</span><span className={`text-right ${display === 'Not recorded' ? 'text-slate-400 italic' : 'text-slate-700'}`}>{display}</span></div>
}


function TimelineItem({ title, date, detail, current = false, alert = false }: { title: string; date: string; detail: string; current?: boolean; alert?: boolean }) {
  return (
    <div className="relative">
      <span className={`absolute -left-[26px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${alert ? 'bg-red-500' : current ? 'bg-brand-600' : 'bg-slate-300'}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><p className={`text-sm font-medium ${current ? 'text-brand-700' : 'text-slate-800'}`}>{title}</p><p className="text-xs text-slate-500 mt-0.5">{detail || 'No additional details recorded.'}</p></div>
        <span className="text-[11px] text-slate-400 shrink-0">{date || 'Date not recorded'}</span>
      </div>
    </div>
  )
}

function WorkflowCheckpoint({ label, state, detail, alert = false }: { label: string; state: string; detail: string; alert?: boolean }) {
  const positive = ['Complete', 'File ready', 'Approved', 'Final approved', 'Delivered', 'Clear'].includes(state)
  const active = ['Scheduled', 'In preparation', 'In Review', 'QA requested', 'Ready to deliver', 'Submitted for QA', 'Report in Progress'].includes(state)
  return <div className="grid sm:grid-cols-[170px_150px_minmax(0,1fr)] gap-2 sm:gap-4 px-4 py-3 items-center"><p className="text-xs font-medium text-slate-600">{label}</p><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${alert ? 'bg-amber-50 text-amber-700' : positive ? 'bg-teal-50 text-teal-700' : active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{state}</span><p className="text-xs text-slate-500">{detail}</p></div>
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


function EditCaseModal({ record, doctors, clients, onClose, onSave }: {
  record: import('../types').CaseRecord
  doctors: import('../types').Doctor[]
  clients: import('../types').Client[]
  onClose: () => void
  onSave: (updates: Partial<import('../types').CaseRecord>) => void
}) {
  const [doctor, setDoctor] = useState(record.doctor === 'Unassigned' ? '' : record.doctor)
  const [client, setClient] = useState(record.client.startsWith('Direct /') ? '' : record.client)
  const [owner, setOwner] = useState(record.owner)
  const [priority, setPriority] = useState(record.priority)
  const [targetDate, setTargetDate] = useState(toInputDate(record.targetDate))
  const [caseType, setCaseType] = useState(record.caseType)
  const [error, setError] = useState('')
  const activeDoctors = doctors.filter((item) => item.status === 'Active')
  const activeClients = clients.filter((item) => item.status === 'Active')
  return (
    <Modal title="Edit case" description={`${record.ref} · update operational ownership and case details.`} onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Assigned doctor / medical expert *</label><select className={fieldClass} value={doctor} onChange={(e) => { setDoctor(e.target.value); setError('') }}><option value="">Select doctor</option>{activeDoctors.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.speciality} · {item.availability}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Client / instructing organisation (optional)</label><select className={fieldClass} value={client} onChange={(e) => setClient(e.target.value)}><option value="">Direct instruction / no client</option>{activeClients.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.type}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Case owner</label><select className={fieldClass} value={owner} onChange={(e) => setOwner(e.target.value)}><option>Unassigned</option>{roles.filter((item) => !['management'].includes(item.id)).map((item) => <option key={item.id} value={item.name}>{item.name} · {item.title}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Priority</label><select className={fieldClass} value={priority} onChange={(e) => setPriority(e.target.value as import('../types').CaseRecord['priority'])}><option>Standard</option><option>High</option><option>Urgent</option></select></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Case type</label><select className={fieldClass} value={caseType} onChange={(e) => setCaseType(e.target.value)}><option>Personal Injury — RTA</option><option>Personal Injury — Workplace</option><option>Clinical Negligence</option><option>Employment Liability</option></select></div>
          <div><label className="block text-xs font-medium text-slate-500 mb-1.5">Target completion</label><input type="date" className={fieldClass} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-500"><strong className="text-slate-700">Record roles:</strong> Patient = person assessed. Client = optional instructing organisation. Doctor = required medical expert assigned to the case.</div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={() => { if (!doctor) { setError('Assigned doctor / medical expert is required.'); return } onSave({ doctor, client: client || 'Direct / no instructing organisation', owner, priority, targetDate: targetDate ? formatDate(targetDate) : 'Not set', caseType }) }} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save case</button></div>
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
  completionChecks = [],
}: {
  action: Exclude<ActionModal, null>
  record: { ref: string; patient: string; doctor: string; status: CaseStatus }
  value: string
  onValue: (value: string) => void
  onClose: () => void
  onSubmit: (meta?: { expectedReviewDate?: string }) => void
  completionChecks?: Array<{ label: string; complete: boolean }>
}) {
  const [expectedReviewDate, setExpectedReviewDate] = useState('')
  const config = {
    assign: { title: 'Assign user', description: `Assign ownership for ${record.ref}.`, label: 'Case owner', placeholder: 'e.g. Priya Nandra', confirm: 'Assign user' },
    task: { title: 'Add task', description: `Create a task linked to ${record.ref}.`, label: 'Task title', placeholder: 'e.g. Request missing GP records', confirm: 'Add task' },
    note: { title: 'Add note', description: `Add an internal case note to ${record.ref}.`, label: 'Internal note', placeholder: 'Enter case note...', confirm: 'Add note' },
    upload: { title: 'Upload document', description: `Add a document to ${record.ref}.`, label: 'Document name', placeholder: 'e.g. Updated GP Records.pdf', confirm: 'Add document' },
    schedule: { title: 'Schedule appointment', description: `${record.patient} · ${record.ref}`, label: 'Appointment date and time', placeholder: 'e.g. 08 Sep 2026 · 10:30', confirm: 'Schedule appointment' },
    report: { title: 'Create report', description: `Start a report for ${record.ref}.`, label: 'Report template', placeholder: 'Medicolegal Report', confirm: 'Create report' },
    hold: { title: 'Place case on hold', description: 'This pauses normal case progression until the hold is removed.', label: 'Reason for hold', placeholder: 'Enter reason...', confirm: 'Place on hold' },
    complete: { title: 'Complete case', description: 'Confirm that final report delivery and remaining case work have been completed.', label: 'Completion note', placeholder: 'Optional completion note', confirm: 'Mark complete' },
    archive: { title: 'Archive case', description: 'Archive this closed case while retaining its complete authorised history and audit trail.', label: 'Archive note *', placeholder: 'Explain why this closed case is being archived...', confirm: 'Archive case' },
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
        ) : action === 'note' || action === 'hold' || action === 'complete' || action === 'archive' ? (
          <textarea className={fieldClass} rows={4} value={value} onChange={(e) => onValue(e.target.value)} placeholder={config.placeholder} />
        ) : (
          <input className={fieldClass} value={value} onChange={(e) => onValue(e.target.value)} placeholder={config.placeholder} />
        )}
        {action === 'hold' && <div className="mt-3"><label className="block text-xs font-medium text-slate-500 mb-1.5">Expected review date</label><input type="date" className={fieldClass} value={expectedReviewDate} onChange={(e) => setExpectedReviewDate(e.target.value)} /></div>}
        {action === 'complete' && <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700 mb-2">Completion checklist</p><div className="space-y-1.5">{completionChecks.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-600">{item.label}</span><span className={item.complete ? 'font-medium text-teal-700' : 'font-medium text-red-600'}>{item.complete ? 'Confirmed' : 'Outstanding'}</span></div>)}</div></div>}
        {(action === 'hold' || action === 'complete' || action === 'archive') && (
          <div className={`mt-3 rounded-lg border p-3 text-xs ${action === 'hold' ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-teal-100 bg-teal-50 text-teal-700'}`}>
            {action === 'hold'
              ? 'The hold reason and expected review date remain traceable in the case history.'
              : action === 'archive'
                ? 'Archiving closes normal workflow actions but preserves the complete case history for authorised users.'
                : 'Completion is only permitted after final approval, delivery and clearance of outstanding tasks.'}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button
          onClick={() => onSubmit(action === 'hold' ? { expectedReviewDate } : undefined)}
          disabled={action === 'archive' && !value.trim()}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:bg-slate-300 ${action === 'hold' ? 'bg-amber-600 hover:bg-amber-700' : action === 'complete' || action === 'archive' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-brand-600 hover:bg-brand-700'}`}
        >
          {config.confirm}
        </button>
      </div>
    </Modal>
  )
}
