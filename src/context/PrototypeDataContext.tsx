import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  appointments as seedAppointments,
  bookings as seedBookings,
  clients as seedClients,
  doctors as seedDoctors,
  documents as seedDocuments,
  reports as seedReports,
  qaQueue as seedQaQueue,
  tasks as seedTasks,
  communications as seedCommunications,
} from '../data/mockData'
import type {
  Appointment,
  Booking,
  Client,
  CommunicationItem,
  Doctor,
  DocumentItem,
  QaChecklistItem,
  QaQueueItem,
  ReportItem,
  TaskItem,
} from '../types'

const STORAGE_KEY = 'evaluate-medicolegal-prototype-v3'

type PrototypeData = {
  bookings: Booking[]
  clients: Client[]
  doctors: Doctor[]
  appointments: Appointment[]
  documents: DocumentItem[]
  reports: ReportItem[]
  qaQueue: QaQueueItem[]
  tasks: TaskItem[]
  communications: CommunicationItem[]
}

type PrototypeDataContextValue = PrototypeData & {
  addBooking: (booking: Booking) => void
  updateBooking: (ref: string, updater: Booking | ((current: Booking) => Booking)) => void
  addClient: (client: Client) => void
  updateClient: (id: string, updater: Client | ((current: Client) => Client)) => void
  removeClient: (id: string) => void
  addDoctor: (doctor: Doctor) => void
  updateDoctor: (id: string, updater: Doctor | ((current: Doctor) => Doctor)) => void
  removeDoctor: (id: string) => void
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (id: string, updater: Appointment | ((current: Appointment) => Appointment)) => void
  addDocuments: (items: DocumentItem[]) => void
  updateDocument: (id: string, updater: DocumentItem | ((current: DocumentItem) => DocumentItem)) => void
  removeDocument: (id: string) => void
  addReport: (report: ReportItem) => void
  updateReport: (id: string, updater: ReportItem | ((current: ReportItem) => ReportItem)) => void
  removeReport: (id: string) => void
  addQaItem: (item: QaQueueItem) => void
  updateQaItem: (id: string, updater: QaQueueItem | ((current: QaQueueItem) => QaQueueItem)) => void
  addTask: (task: TaskItem) => void
  updateTask: (id: string, updater: TaskItem | ((current: TaskItem) => TaskItem)) => void
  addCommunication: (item: CommunicationItem) => void
  updateCommunication: (id: string, updater: CommunicationItem | ((current: CommunicationItem) => CommunicationItem)) => void
  resetPrototypeData: () => void
}

const PrototypeDataContext = createContext<PrototypeDataContextValue | null>(null)

function defaultBookingActivity(booking: Booking) {
  return [
    {
      id: `${booking.ref}-activity-created`,
      date: `${booking.bookingDate} · 09:18`,
      title: 'Booking created',
      detail: `Instruction received via ${booking.source.toLowerCase()}.`,
    },
    {
      id: `${booking.ref}-activity-reviewed`,
      date: `${booking.bookingDate} · 09:26`,
      title: 'Patient and client details reviewed',
      detail: 'Core booking information checked by the administration team.',
    },
  ]
}

function enrichBookings(items: Booking[]): Booking[] {
  return items.map((booking, index) => ({
    ...booking,
    agreedFee: booking.agreedFee ?? (index < 3 ? '£850.00' : ''),
    appointmentTime: booking.appointmentTime ?? (booking.appointmentDate !== '—' ? '10:00–10:45' : undefined),
    appointmentType: booking.appointmentType ?? (booking.appointmentDate !== '—' ? 'Initial Examination' : undefined),
    appointmentMethod: booking.appointmentMethod ?? (booking.appointmentDate !== '—' ? 'In person' : undefined),
    appointmentLocation: booking.appointmentLocation ?? (booking.appointmentDate !== '—' ? 'Manchester Clinic — Room 1' : undefined),
    documents: booking.documents ?? (index < 3 ? [
      {
        id: `${booking.ref}-DOC-1`,
        name: 'Instruction letter.pdf',
        category: 'Client Instruction',
        size: '420 KB',
        uploadedAt: booking.bookingDate,
        uploadedBy: booking.owner === 'Unassigned' ? 'Administration Team' : booking.owner,
      },
      {
        id: `${booking.ref}-DOC-2`,
        name: 'Patient records.pdf',
        category: 'Medical Records',
        size: '2.4 MB',
        uploadedAt: booking.bookingDate,
        uploadedBy: booking.owner === 'Unassigned' ? 'Administration Team' : booking.owner,
      },
    ] : []),
    informationRequests: booking.informationRequests ?? [],
    activity: booking.activity ?? defaultBookingActivity(booking),
  }))
}

function enrichClients(items: Client[]): Client[] {
  return items.map((client) => ({
    ...client,
    organisationNumber: client.organisationNumber ?? (client.type === 'Direct Instruction' ? 'Not applicable' : `ORG-${client.id.replace(/\D/g, '') || client.id.slice(-2)}`),
    address: client.address ?? (client.type === 'Direct Instruction' ? 'Private client address held on file' : 'Manchester, United Kingdom'),
    contactPeople: client.contactPeople ?? [{
      id: `${client.id}-CONTACT-1`,
      name: client.primaryContact,
      role: client.type === 'Insurer' ? 'Claims Handler' : client.type === 'Solicitor Firm' ? 'Solicitor / Case Handler' : 'Primary Contact',
      email: client.email,
      phone: client.phone,
    }],
    serviceRequirements: client.serviceRequirements ?? 'Standard medicolegal instruction handling with appointment, document and report progress visibility.',
    standardInstructions: client.standardInstructions ?? 'Confirm receipt of instruction, highlight missing records promptly, and keep the client informed of material deadline changes.',
    reportDeliveryPreference: client.reportDeliveryPreference ?? 'Secure digital delivery to the primary contact.',
    agreedFees: client.agreedFees ?? (client.type === 'Direct Instruction' ? 'Fee agreed per instruction' : 'Fee schedule held under client agreement'),
    communicationDetails: client.communicationDetails ?? `Primary communication via ${client.email ? 'email' : 'telephone'}; urgent matters may be escalated by phone.`,
  }))
}

function enrichDoctors(items: Doctor[]): Doctor[] {
  return items.map((doctor, index) => ({
    ...doctor,
    email: doctor.email ?? `${doctor.name.toLowerCase().replace(/^dr\s+/, '').replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.')}@evaluatemedicolegal.co.uk`,
    phone: doctor.phone ?? `+44 161 710 ${String(1200 + index * 37).padStart(4, '0')}`,
    professionalDetails: doctor.professionalDetails ?? `${doctor.speciality}. Independent medicolegal expert on the Evaluate panel.`,
    specialities: doctor.specialities ?? [doctor.speciality],
    appointmentTypes: doctor.appointmentTypes ?? ['Initial Examination', 'Follow-up Examination', 'Records Review'],
    locations: doctor.locations ?? [doctor.location, ...(doctor.location === 'Remote — Video' ? [] : ['Remote — Video'])],
    availabilityNotes: doctor.availabilityNotes ?? (doctor.availability === 'Available' ? 'Accepting new instructions within standard turnaround.' : 'Capacity should be confirmed before assignment.'),
    performanceSummary: doctor.performanceSummary ?? 'Operational performance shown from current prototype case, appointment and report records.',
  }))
}

function enrichAppointments(items: Appointment[]): Appointment[] {
  return items.map((appointment) => ({
    ...appointment,
    consultationMethod: appointment.consultationMethod ?? (appointment.location.startsWith('Remote — Video') ? 'Video' : appointment.location.startsWith('Remote — Telephone') ? 'Telephone' : 'In person'),
    interpreterRequired: appointment.interpreterRequired ?? false,
    history: appointment.history ?? [{
      id: `${appointment.id}-created`,
      date: appointment.date,
      action: 'Appointment scheduled',
      detail: `${appointment.doctor} · ${appointment.time} · ${appointment.location}`,
    }],
  }))
}

function inferPages(size: string, index: number) {
  const mb = Number.parseFloat(size)
  if (size.includes('MB') && Number.isFinite(mb)) return Math.max(3, Math.min(96, Math.round(mb * 3.2)))
  return 4 + index * 2
}

function enrichDocuments(items: DocumentItem[]): DocumentItem[] {
  return items.map((document, index) => {
    const currentVersion = Number.parseInt(document.version.replace(/\D/g, ''), 10) || 1
    const history = document.versionHistory ?? Array.from({ length: currentVersion }, (_, i) => ({
      version: `v${i + 1}`,
      date: i + 1 === currentVersion ? document.uploadDate : `${Math.max(1, 18 + i)} Jul 2026`,
      author: document.uploadedBy,
      size: document.size,
      changeSummary: i + 1 === currentVersion ? 'Current uploaded version' : 'Previous saved version',
    })).reverse()
    const pageCount = document.pageCount ?? inferPages(document.size, index)
    const legacyAiStatus = document.aiSummary === undefined && document.id === 'D-3' ? 'Completed'
      : document.aiSummary === undefined && document.id === 'D-5' ? 'Failed'
      : undefined
    const aiStatus = legacyAiStatus ?? document.aiStatus ?? (document.status === 'Processing' ? 'Processing' : document.status === 'Review Required' ? 'Review Required' : document.status === 'Approved' ? 'Approved' : 'Not Started')
    const shouldHaveSummary = ['Completed', 'Review Required', 'Approved'].includes(aiStatus)
    const midpoint = Math.min(pageCount, Math.max(3, Math.ceil(pageCount / 2)))
    const defaultSourceRefs = pageCount <= 3
      ? [`${document.name} · pp. 1–${pageCount}`]
      : [`${document.name} · pp. 1–${midpoint}`, `${document.name} · pp. ${midpoint + 1}–${pageCount}`]
    return {
      ...document,
      aiStatus,
      aiSummary: document.aiSummary ?? (shouldHaveSummary ? `AI draft for ${document.name}: this ${document.category.toLowerCase()} material should be checked against the original source before it is used in the case workflow.` : ''),
      aiGeneratedAt: document.aiGeneratedAt ?? (shouldHaveSummary ? document.uploadDate : undefined),
      aiSourceRefs: document.aiSourceRefs ?? (shouldHaveSummary ? defaultSourceRefs : []),
      aiError: document.aiError ?? (aiStatus === 'Failed' ? 'Text extraction was incomplete, so the AI summary could not be generated reliably. The source document remains available for manual review.' : undefined),
      confidentiality: document.confidentiality ?? 'Standard',
      pageCount,
      versionHistory: history,
      notes: document.notes ?? '',
    }
  })
}

function reportDraftContent(report: ReportItem) {
  return `MEDICOLEGAL REPORT\n\nCase: ${report.caseRef}\nPatient: ${report.patient}\nMedical expert: ${report.doctor}\nReport type: ${report.reportType}\n\n1. Instructions\nThe expert has reviewed the instruction and the source documents listed in this workspace.\n\n2. Background and history\nDraft clinical and factual summary for authorised review.\n\n3. Opinion\nProfessional opinion to be completed and verified by the assigned medical expert.\n\n4. Declaration\nThis draft is not final until the report workflow and quality assurance process are complete.`
}

function enrichReports(items: ReportItem[]): ReportItem[] {
  return items.map((report) => {
    const content = report.content ?? reportDraftContent(report)
    const currentVersion = report.version || 'v1'
    return {
      ...report,
      assignedUser: report.assignedUser ?? report.doctor,
      template: report.template ?? 'Standard Medicolegal Report',
      content,
      saveStatus: report.saveStatus ?? 'Saved',
      sourceDocumentIds: report.sourceDocumentIds ?? [],
      comments: report.comments ?? [],
      versions: report.versions?.length ? report.versions : [{
        version: currentVersion,
        date: report.lastUpdated,
        author: report.doctor,
        status: report.status,
        changeSummary: 'Current report version',
        qaOutcome: report.qaStatus === 'Returned' ? 'Returned with amendments' : report.qaStatus === 'Approved' ? 'QA approved' : 'Not yet reviewed',
        content,
      }],
    }
  })
}

const defaultChecklist = (): QaChecklistItem[] => [
  { id: `QA-C-${Date.now()}-1`, label: 'Patient and case identifiers are correct', status: 'Pass' },
  { id: `QA-C-${Date.now()}-2`, label: 'Instructions and source material are appropriately reflected', status: 'Pass' },
  { id: `QA-C-${Date.now()}-3`, label: 'Clinical history and chronology are internally consistent', status: 'Pass' },
  { id: `QA-C-${Date.now()}-4`, label: 'Opinion, causation and prognosis are adequately addressed', status: 'Pass' },
  { id: `QA-C-${Date.now()}-5`, label: 'Formatting, declarations and report presentation are complete', status: 'Pass' },
]

function enrichQa(items: QaQueueItem[]): QaQueueItem[] {
  return items.map((item) => ({
    ...item,
    reportId: item.reportId ?? seedReports.find((report) => report.caseRef === item.caseRef)?.id,
    checklist: item.checklist?.length ? item.checklist : defaultChecklist(),
    comments: item.comments ?? (item.status === 'Returned' ? [{
      id: `${item.id}-COMMENT-1`,
      author: item.reviewer === 'Unassigned' ? 'QA Team' : item.reviewer,
      date: item.submittedDate === '—' ? '31 Aug 2026' : item.submittedDate,
      text: 'Please address the outstanding QA amendments before resubmission.',
      severity: 'High',
      resolved: false,
    }] : []),
    reviewHistory: item.reviewHistory ?? [{
      id: `${item.id}-H-1`,
      date: item.submittedDate === '—' ? 'Not submitted' : item.submittedDate,
      user: item.reviewer,
      action: item.status === 'Returned' ? 'Returned for amendments' : item.status === 'Approved' ? 'Approved report' : 'QA item created',
      detail: `Review status: ${item.status}.`,
    }],
  }))
}

function enrichTasks(items: TaskItem[]): TaskItem[] {
  return items.map((task, index) => ({
    ...task,
    createdAt: task.createdAt ?? `${Math.max(20, 27 - index)} Aug 2026`,
    description: task.description ?? 'Complete the required action and update the related case when finished.',
    taskType: task.taskType ?? 'General',
    supportingDocument: task.supportingDocument ?? '',
    notifyOwner: task.notifyOwner ?? true,
    comments: task.comments ?? [],
    activity: task.activity ?? [{ id: `${task.id}-created`, date: task.createdAt ?? `${Math.max(20, 27 - index)} Aug 2026`, user: task.createdBy, action: 'Task created' }],
  }))
}

function enrichCommunications(items: CommunicationItem[]): CommunicationItem[] {
  return items.map((item) => ({ ...item, attachment: item.attachment ?? '', followUpTaskId: item.followUpTaskId ?? '' }))
}

function seededData(): PrototypeData {
  return {
    bookings: enrichBookings(seedBookings),
    clients: enrichClients(seedClients),
    doctors: enrichDoctors(seedDoctors),
    appointments: enrichAppointments(seedAppointments),
    documents: enrichDocuments(seedDocuments),
    reports: enrichReports(seedReports),
    qaQueue: enrichQa(seedQaQueue),
    tasks: enrichTasks(seedTasks),
    communications: enrichCommunications(seedCommunications),
  }
}

function getInitialData(): PrototypeData {
  const fallback = seededData()
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PrototypeData>
        return {
          bookings: enrichBookings(parsed.bookings?.length ? parsed.bookings : fallback.bookings),
          clients: enrichClients(parsed.clients !== undefined ? parsed.clients : fallback.clients),
          doctors: enrichDoctors(parsed.doctors !== undefined ? parsed.doctors : fallback.doctors),
          appointments: enrichAppointments([...(parsed.appointments ?? []), ...fallback.appointments.filter((seed) => !(parsed.appointments ?? []).some((item) => item.id === seed.id))]),
          documents: enrichDocuments(parsed.documents !== undefined ? parsed.documents : fallback.documents),
          reports: enrichReports(parsed.reports !== undefined ? parsed.reports : fallback.reports),
          qaQueue: enrichQa(parsed.qaQueue?.length ? parsed.qaQueue : fallback.qaQueue),
          tasks: enrichTasks([...(parsed.tasks ?? []), ...fallback.tasks.filter((seed) => !(parsed.tasks ?? []).some((item) => item.id === seed.id))]),
          communications: enrichCommunications(parsed.communications?.length ? parsed.communications : fallback.communications),
        }
      }
    } catch {
      // Corrupt prototype state should never block the app; fall back to seeded data.
    }
  }
  return fallback
}

export function PrototypeDataProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => getInitialData(), [])
  const [bookings, setBookings] = useState<Booking[]>(initial.bookings)
  const [clients, setClients] = useState<Client[]>(initial.clients)
  const [doctors, setDoctors] = useState<Doctor[]>(initial.doctors)
  const [appointments, setAppointments] = useState<Appointment[]>(initial.appointments)
  const [documents, setDocuments] = useState<DocumentItem[]>(initial.documents)
  const [reports, setReports] = useState<ReportItem[]>(initial.reports)
  const [qaQueue, setQaQueue] = useState<QaQueueItem[]>(initial.qaQueue)
  const [tasks, setTasks] = useState<TaskItem[]>(initial.tasks)
  const [communications, setCommunications] = useState<CommunicationItem[]>(initial.communications)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ bookings, clients, doctors, appointments, documents, reports, qaQueue, tasks, communications }))
  }, [bookings, clients, doctors, appointments, documents, reports, qaQueue, tasks, communications])

  const value = useMemo<PrototypeDataContextValue>(() => ({
    bookings,
    clients,
    doctors,
    appointments,
    documents,
    reports,
    qaQueue,
    tasks,
    communications,
    addBooking: (booking) => setBookings((current) => [enrichBookings([booking])[0], ...current]),
    updateBooking: (ref, updater) => setBookings((current) => current.map((booking) => booking.ref === ref ? (typeof updater === 'function' ? updater(booking) : updater) : booking)),
    addClient: (client) => setClients((current) => [enrichClients([client])[0], ...current]),
    updateClient: (id, updater) => setClients((current) => current.map((client) => client.id === id ? (typeof updater === 'function' ? updater(client) : updater) : client)),
    removeClient: (id) => setClients((current) => current.filter((client) => client.id !== id)),
    addDoctor: (doctor) => setDoctors((current) => [enrichDoctors([doctor])[0], ...current]),
    updateDoctor: (id, updater) => setDoctors((current) => current.map((doctor) => doctor.id === id ? (typeof updater === 'function' ? updater(doctor) : updater) : doctor)),
    removeDoctor: (id) => setDoctors((current) => current.filter((doctor) => doctor.id !== id)),
    addAppointment: (appointment) => setAppointments((current) => [enrichAppointments([appointment])[0], ...current]),
    updateAppointment: (id, updater) => setAppointments((current) => current.map((appointment) => appointment.id === id ? (typeof updater === 'function' ? updater(appointment) : updater) : appointment)),
    addDocuments: (items) => setDocuments((current) => [...enrichDocuments(items), ...current]),
    updateDocument: (id, updater) => setDocuments((current) => current.map((document) => document.id === id ? (typeof updater === 'function' ? updater(document) : updater) : document)),
    removeDocument: (id) => setDocuments((current) => current.filter((document) => document.id !== id)),
    addReport: (report) => setReports((current) => [enrichReports([report])[0], ...current]),
    updateReport: (id, updater) => setReports((current) => current.map((report) => report.id === id ? enrichReports([typeof updater === 'function' ? updater(report) : updater])[0] : report)),
    removeReport: (id) => setReports((current) => current.filter((report) => report.id !== id)),
    addQaItem: (item) => setQaQueue((current) => [enrichQa([item])[0], ...current]),
    updateQaItem: (id, updater) => setQaQueue((current) => current.map((item) => item.id === id ? enrichQa([typeof updater === 'function' ? updater(item) : updater])[0] : item)),
    addTask: (task) => setTasks((current) => [enrichTasks([task])[0], ...current]),
    updateTask: (id, updater) => setTasks((current) => current.map((task) => task.id === id ? enrichTasks([typeof updater === 'function' ? updater(task) : updater])[0] : task)),
    addCommunication: (item) => setCommunications((current) => [enrichCommunications([item])[0], ...current]),
    updateCommunication: (id, updater) => setCommunications((current) => current.map((item) => item.id === id ? enrichCommunications([typeof updater === 'function' ? updater(item) : updater])[0] : item)),
    resetPrototypeData: () => {
      const reset = seededData()
      setBookings(reset.bookings)
      setClients(reset.clients)
      setDoctors(reset.doctors)
      setAppointments(reset.appointments)
      setDocuments(reset.documents)
      setReports(reset.reports)
      setQaQueue(reset.qaQueue)
      setTasks(reset.tasks)
      setCommunications(reset.communications)
    },
  }), [bookings, clients, doctors, appointments, documents, reports, qaQueue, tasks, communications])

  return <PrototypeDataContext.Provider value={value}>{children}</PrototypeDataContext.Provider>
}

export function usePrototypeData() {
  const context = useContext(PrototypeDataContext)
  if (!context) throw new Error('usePrototypeData must be used within PrototypeDataProvider')
  return context
}
