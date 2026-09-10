import type { CaseRecord, CaseStatus } from '../types'

/** Exact case-status vocabulary from the product PRD. */
export const ALL_CASE_STATUSES: CaseStatus[] = [
  'New Booking',
  'Information Required',
  'Booking Confirmed',
  'Appointment Pending',
  'Appointment Scheduled',
  'Appointment Completed',
  'Documents Pending',
  'File Preparation in Progress',
  'File Ready',
  'Report in Progress',
  'Draft Report Submitted',
  'QA Review',
  'Amendments Required',
  'Awaiting Final Approval',
  'Final Report Approved',
  'Report Delivered',
  'On Hold',
  'Cancelled',
  'Completed',
  'Archived',
]

/** Main forward journey; branch states are handled separately. */
export const CASE_STATUS_ORDER: CaseStatus[] = [
  'New Booking',
  'Information Required',
  'Booking Confirmed',
  'Appointment Pending',
  'Appointment Scheduled',
  'Appointment Completed',
  'Documents Pending',
  'File Preparation in Progress',
  'File Ready',
  'Report in Progress',
  'Draft Report Submitted',
  'QA Review',
  'Amendments Required',
  'Awaiting Final Approval',
  'Final Report Approved',
  'Report Delivered',
  'Completed',
  'Archived',
]

/** Human-readable stages used only to simplify the case overview; the actual case status remains exact. */
export const CASE_JOURNEY_STAGES: Array<{ label: string; statuses: CaseStatus[] }> = [
  { label: 'Booking', statuses: ['New Booking', 'Information Required', 'Booking Confirmed'] },
  { label: 'Appointment', statuses: ['Appointment Pending', 'Appointment Scheduled', 'Appointment Completed'] },
  { label: 'Documents & file', statuses: ['Documents Pending', 'File Preparation in Progress', 'File Ready'] },
  { label: 'Report', statuses: ['Report in Progress', 'Draft Report Submitted'] },
  { label: 'QA', statuses: ['QA Review', 'Amendments Required'] },
  { label: 'Final approval', statuses: ['Awaiting Final Approval', 'Final Report Approved'] },
  { label: 'Delivery', statuses: ['Report Delivered'] },
  { label: 'Complete', statuses: ['Completed', 'Archived'] },
]

export const ALLOWED_CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  'New Booking': ['Information Required', 'Booking Confirmed', 'On Hold', 'Cancelled'],
  'Information Required': ['Booking Confirmed', 'On Hold', 'Cancelled'],
  'Booking Confirmed': ['Appointment Pending', 'Appointment Scheduled', 'Documents Pending', 'On Hold', 'Cancelled'],
  'Appointment Pending': ['Appointment Scheduled', 'On Hold', 'Cancelled'],
  'Appointment Scheduled': ['Appointment Completed', 'On Hold', 'Cancelled'],
  'Appointment Completed': ['Documents Pending', 'File Preparation in Progress', 'On Hold', 'Cancelled'],
  'Documents Pending': ['File Preparation in Progress', 'On Hold', 'Cancelled'],
  'File Preparation in Progress': ['File Ready', 'On Hold', 'Cancelled'],
  'File Ready': ['Report in Progress', 'On Hold', 'Cancelled'],
  'Report in Progress': ['Draft Report Submitted', 'On Hold', 'Cancelled'],
  'Draft Report Submitted': ['QA Review', 'On Hold', 'Cancelled'],
  'QA Review': ['Amendments Required', 'Awaiting Final Approval', 'On Hold', 'Cancelled'],
  'Amendments Required': ['Report in Progress', 'Draft Report Submitted', 'On Hold', 'Cancelled'],
  'Awaiting Final Approval': ['Final Report Approved', 'On Hold', 'Cancelled'],
  'Final Report Approved': ['Report Delivered', 'On Hold', 'Cancelled'],
  'Report Delivered': ['Completed', 'On Hold'],
  'On Hold': [],
  'Cancelled': ['Archived'],
  'Completed': ['Archived'],
  'Archived': [],
}

export type CaseWorkflowEvent =
  | 'booking-confirmed'
  | 'appointment-pending'
  | 'appointment-scheduled'
  | 'appointment-completed'
  | 'documents-pending'
  | 'file-preparation-started'
  | 'file-ready'
  | 'report-created'
  | 'report-draft-submitted'
  | 'report-submitted-qa'
  | 'qa-review-started'
  | 'qa-returned'
  | 'qa-approved'
  | 'final-approved'
  | 'report-delivered'
  | 'case-completed'

export function nextStatusForEvent(current: CaseStatus, event: CaseWorkflowEvent): CaseStatus | null {
  if (['On Hold', 'Completed', 'Archived', 'Cancelled'].includes(current)) return null
  switch (event) {
    case 'booking-confirmed':
      return ['New Booking', 'Information Required'].includes(current) ? 'Booking Confirmed' : null
    case 'appointment-pending':
      return ['New Booking', 'Information Required', 'Booking Confirmed'].includes(current) ? 'Appointment Pending' : null
    case 'appointment-scheduled':
      return ['New Booking', 'Information Required', 'Booking Confirmed', 'Appointment Pending'].includes(current) ? 'Appointment Scheduled' : null
    case 'appointment-completed':
      return current === 'Appointment Scheduled' ? 'Appointment Completed' : null
    case 'documents-pending':
      return ['Booking Confirmed', 'Appointment Completed'].includes(current) ? 'Documents Pending' : null
    case 'file-preparation-started':
      return ['Appointment Completed', 'Documents Pending'].includes(current) ? 'File Preparation in Progress' : null
    case 'file-ready':
      return ['Documents Pending', 'File Preparation in Progress'].includes(current) ? 'File Ready' : null
    case 'report-created':
      return ['File Ready', 'Amendments Required'].includes(current) ? 'Report in Progress' : null
    case 'report-draft-submitted':
      return ['Report in Progress', 'Amendments Required'].includes(current) ? 'Draft Report Submitted' : null
    case 'report-submitted-qa':
    case 'qa-review-started':
      return current === 'Draft Report Submitted' ? 'QA Review' : null
    case 'qa-returned':
      return current === 'QA Review' ? 'Amendments Required' : null
    case 'qa-approved':
      return current === 'QA Review' ? 'Awaiting Final Approval' : null
    case 'final-approved':
      return current === 'Awaiting Final Approval' ? 'Final Report Approved' : null
    case 'report-delivered':
      return current === 'Final Report Approved' ? 'Report Delivered' : null
    case 'case-completed':
      return current === 'Report Delivered' ? 'Completed' : null
  }
}

export function transitionCase(current: CaseRecord, to: CaseStatus, user: string, reason?: string): CaseRecord {
  if (current.status === to) return { ...current, lastUpdated: 'Just now' }
  const from = current.status
  const isResume = current.status === 'On Hold' && to === (current.statusBeforeHold ?? 'New Booking')
  return {
    ...current,
    status: to,
    statusBeforeHold: to === 'On Hold' ? (current.status === 'On Hold' ? current.statusBeforeHold : current.status) : isResume ? undefined : current.statusBeforeHold,
    lastUpdated: 'Just now',
    statusHistory: [
      ...(current.statusHistory ?? []),
      { id: `CS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, date: 'Just now', from, to, user, reason },
    ],
  }
}

export function transitionCaseForEvent(current: CaseRecord, event: CaseWorkflowEvent, user: string, reason: string): CaseRecord {
  const next = nextStatusForEvent(current.status, event)
  return next ? transitionCase(current, next, user, reason) : current
}

export function caseStatusIndex(status: CaseStatus, heldFrom?: CaseStatus) {
  const effective = status === 'On Hold' ? (heldFrom ?? 'New Booking') : status
  const index = CASE_STATUS_ORDER.indexOf(effective)
  return index >= 0 ? index : 0
}

export function caseJourneyStageIndex(status: CaseStatus, heldFrom?: CaseStatus) {
  const effective = status === 'On Hold' ? (heldFrom ?? 'New Booking') : status
  const index = CASE_JOURNEY_STAGES.findIndex((stage) => stage.statuses.includes(effective))
  return index >= 0 ? index : 0
}
