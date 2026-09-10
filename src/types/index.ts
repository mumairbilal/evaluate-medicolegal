export type CaseStatus =
  | 'New Booking'
  | 'Information Required'
  | 'Booking Confirmed'
  | 'Appointment Pending'
  | 'Appointment Scheduled'
  | 'Appointment Completed'
  | 'Documents Pending'
  | 'File Preparation in Progress'
  | 'File Ready'
  | 'Report in Progress'
  | 'Draft Report Submitted'
  | 'QA Review'
  | 'Amendments Required'
  | 'Awaiting Final Approval'
  | 'Final Report Approved'
  | 'Report Delivered'
  | 'On Hold'
  | 'Cancelled'
  | 'Completed'
  | 'Archived'

export interface CaseStatusHistoryItem {
  id: string
  date: string
  from: CaseStatus
  to: CaseStatus
  user: string
  reason?: string
}

export interface CaseRecord {
  ref: string
  bookingRef?: string
  clientRef: string
  patient: string
  client: string
  doctor: string
  caseType: string
  status: CaseStatus
  priority: 'Standard' | 'High' | 'Urgent'
  owner: string
  targetDate: string
  lastUpdated: string
  documents: number
  tasks: number
  qaComments: number
  statusBeforeHold?: CaseStatus
  statusHistory?: CaseStatusHistoryItem[]
}

export interface Patient {
  id: string
  name: string
  dob: string
  email: string
  phone: string
  activeCases: number
  lastAppointment: string
  lastActivity?: string
  status: 'Active' | 'Inactive'
  address?: string
  accessibilityRequirements?: string
  interpreter?: string
  communicationPreferences?: string
  patientWarnings?: string
  additionalNotes?: string
}

export interface Appointment {
  id: string
  caseRef: string
  patient: string
  doctor: string
  date: string
  time: string
  type: string
  location: string
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'Did Not Attend'
  consultationMethod?: string
  interpreterRequired?: boolean
  notes?: string
  outcome?: string
  attendanceStatus?: string
  completionStatus?: string
  followUpActions?: string
  additionalDocumentsRequired?: string
  reportPreparationReadiness?: string
  rescheduleReason?: string
  cancellationReason?: string
  cancelledBy?: string
  followUpRequired?: boolean
  history?: Array<{ id: string; date: string; action: string; detail: string }>
  /** Synthetic calendar-density seed entries are excluded from a case's operational appointment record. */
  calendarOnly?: boolean
}

export type AiStatus = 'Not Started' | 'Processing' | 'Completed' | 'Review Required' | 'Failed' | 'Approved'

export interface DocumentVersion {
  version: string
  date: string
  author: string
  size: string
  changeSummary: string
}

export interface DocumentItem {
  id: string
  name: string
  caseRef: string
  patient: string
  category: string
  uploadedBy: string
  uploadDate: string
  version: string
  size: string
  status: 'Not Started' | 'Processing' | 'Review Required' | 'Approved'
  aiStatus?: AiStatus
  aiSummary?: string
  aiGeneratedAt?: string
  aiSourceRefs?: string[]
  aiError?: string
  aiIssue?: string
  notes?: string
  confidentiality?: 'Standard' | 'Sensitive' | 'Highly Confidential'
  pageCount?: number
  versionHistory?: DocumentVersion[]
  duplicateOf?: string
}

export interface TaskItem {
  id: string
  title: string
  caseRef: string
  owner: string
  dueDate: string
  priority: 'Low' | 'Standard' | 'High'
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled'
  createdBy: string
  createdAt?: string
  description?: string
  taskType?: string
  supportingDocument?: string
  notifyOwner?: boolean
  comments?: Array<{ id: string; author: string; date: string; text: string }>
  activity?: Array<{ id: string; date: string; user: string; action: string }>
}

export interface CommunicationItem {
  id: string
  caseRef: string
  type: 'Email' | 'Phone Call' | 'Internal Note' | 'Client' | 'Patient' | 'Doctor' | 'System Notification'
  from: string
  to: string
  date: string
  subject: string
  summary: string
  internal: boolean
  attachment?: string
  followUpTaskId?: string
}

export interface BookingDocument {
  id: string
  name: string
  category: string
  size: string
  uploadedAt: string
  uploadedBy: string
}

export interface BookingInformationRequest {
  id: string
  recipient: string
  email: string
  subject: string
  requestedItems: string[]
  dueDate?: string
  message: string
  sentAt: string
  status: 'Sent' | 'Resolved'
}

export interface BookingActivity {
  id: string
  date: string
  title: string
  detail: string
}

export interface Booking {
  ref: string
  patient: string
  client: string
  doctor: string
  bookingDate: string
  appointmentDate: string
  appointmentRequired?: boolean
  preferredAppointmentDate?: string
  status: 'Draft' | 'New Booking' | 'Information Required' | 'Appointment Scheduled' | 'Converted to Case' | 'Cancelled'
  owner: string
  priority: 'Standard' | 'High' | 'Urgent'
  source: 'Email' | 'Phone' | 'Portal'
  caseType: string
  missingInformation: 'Yes' | 'No'
  notes?: string
  agreedFee?: string
  reportDueDate?: string
  targetCompletionDate?: string
  appointmentTime?: string
  appointmentType?: string
  appointmentMethod?: string
  appointmentLocation?: string
  interpreterRequired?: boolean
  appointmentNotes?: string
  documents?: BookingDocument[]
  informationRequests?: BookingInformationRequest[]
  activity?: BookingActivity[]
}

export interface ClientContact {
  id: string
  name: string
  role: string
  email: string
  phone: string
}

export interface Client {
  id: string
  name: string
  type: 'Solicitor Firm' | 'Insurer' | 'Direct Instruction'
  primaryContact: string
  email: string
  phone: string
  activeCases: number
  completedCases: number
  lastActivity: string
  status: 'Active' | 'Inactive'
  organisationNumber?: string
  address?: string
  contactPeople?: ClientContact[]
  serviceRequirements?: string
  standardInstructions?: string
  reportDeliveryPreference?: string
  agreedFees?: string
  communicationDetails?: string
  additionalContacts?: string
}

export interface Doctor {
  id: string
  name: string
  speciality: string
  location: string
  activeCases: number
  upcomingAppointments: number
  reportsInProgress: number
  status: 'Active' | 'Inactive'
  availability: 'Available' | 'Limited Availability' | 'Fully Booked' | 'On Leave'
  email?: string
  phone?: string
  professionalDetails?: string
  specialities?: string[]
  appointmentTypes?: string[]
  locations?: string[]
  availabilityNotes?: string
  performanceSummary?: string
  qualifications?: string
  reportTemplates?: string[]
  standardFees?: string
  weeklyAvailability?: string
  availableHours?: string
  blockedPeriods?: string
  leaveDetails?: string
}

export interface ReportComment {
  id: string
  author: string
  date: string
  text: string
}

export interface ReportVersion {
  version: string
  date: string
  author: string
  status: 'Draft' | 'Submitted for QA' | 'Amendments Required' | 'Approved' | 'Delivered'
  changeSummary: string
  qaOutcome: string
  content: string
  fileName?: string
}

export interface ReportItem {
  id: string
  caseRef: string
  patient: string
  doctor: string
  reportType: string
  version: string
  status: 'Draft' | 'Submitted for QA' | 'Amendments Required' | 'Approved' | 'Delivered'
  qaStatus: 'Not Started' | 'In Review' | 'Approved' | 'Returned'
  dueDate: string
  lastUpdated: string
  assignedUser?: string
  template?: string
  content?: string
  saveStatus?: 'Saved' | 'Unsaved changes' | 'Saving'
  sourceDocumentIds?: string[]
  comments?: ReportComment[]
  versions?: ReportVersion[]
  finalApprovedAt?: string
  deliveredAt?: string
  doctorApproved?: boolean
  approvalDeclaration?: boolean
  deliveryRecipient?: string
  deliveryMethod?: string
  deliveryDate?: string
  deliveryNotes?: string
  deliveryAttachment?: string
}

export type QaChecklistStatus = 'Pass' | 'Issue Found' | 'Not Applicable'

export interface QaChecklistItem {
  id: string
  label: string
  status: QaChecklistStatus
  comment?: string
  severity?: 'Low' | 'Moderate' | 'High'
  requiredAction?: string
  reportSection?: string
  resolved?: boolean
}

export interface QaComment {
  id: string
  author: string
  date: string
  text: string
  severity?: 'Low' | 'Moderate' | 'High'
  resolved?: boolean
  resolutionResponse?: string
}

export interface QaReviewHistoryItem {
  id: string
  date: string
  user: string
  action: string
  detail: string
}

export interface QaQueueItem {
  id: string
  reportId?: string
  caseRef: string
  patient: string
  doctor: string
  reportType: string
  submittedDate: string
  dueDate: string
  priority: 'Standard' | 'High' | 'Urgent'
  reviewer: string
  status: 'Not Started' | 'In Review' | 'Returned' | 'Approved'
  checklist?: QaChecklistItem[]
  comments?: QaComment[]
  reviewHistory?: QaReviewHistoryItem[]
}
