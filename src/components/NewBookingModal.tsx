import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, FileText, Upload } from 'lucide-react'
import Modal from './Modal'
import type { Booking } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

export default function NewBookingModal({
  onClose,
  onCreate,
  existingCount,
  existingBookings,
}: {
  onClose: () => void
  onCreate: (b: Booking) => void
  existingCount: number
  existingBookings: Booking[]
}) {
  const [step, setStep] = useState(1)
  const [patient, setPatient] = useState('')
  const [client, setClient] = useState('')
  const [doctor, setDoctor] = useState('')
  const [caseType, setCaseType] = useState('Personal Injury — RTA')
  const [priority, setPriority] = useState<Booking['priority']>('Standard')
  const [source, setSource] = useState<Booking['source']>('Email')
  const [notes, setNotes] = useState('')
  const [appointmentRequired, setAppointmentRequired] = useState('Yes')
  const [preferredDate, setPreferredDate] = useState('')
  const [consultationMethod, setConsultationMethod] = useState('In person')
  const [location, setLocation] = useState('Manchester Clinic')
  const [interpreter, setInterpreter] = useState('No')
  const [documents, setDocuments] = useState<string[]>([])
  const [agreedFee, setAgreedFee] = useState('')
  const [reportDueDate, setReportDueDate] = useState('')
  const [targetCompletionDate, setTargetCompletionDate] = useState('')
  const [error, setError] = useState('')
  const [autoSavedAt, setAutoSavedAt] = useState('')
  const draftKey = 'evaluate-new-booking-autosave-v1'

  const steps = ['Booking', 'Client & expert', 'Appointment', 'Documents', 'Fees & deadlines', 'Review']

  const hasUnsavedChanges = Boolean(patient.trim() || client.trim() || doctor.trim() || notes.trim() || documents.length || agreedFee.trim() || reportDueDate || targetCompletionDate || preferredDate)
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const timer = window.setTimeout(() => {
      localStorage.setItem(draftKey, JSON.stringify({ patient, client, doctor, caseType, priority, source, notes, appointmentRequired, preferredDate, consultationMethod, location, interpreter, documents, agreedFee, reportDueDate, targetCompletionDate, step }))
      setAutoSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, 650)
    return () => window.clearTimeout(timer)
  }, [patient, client, doctor, caseType, priority, source, notes, appointmentRequired, preferredDate, consultationMethod, location, interpreter, documents, agreedFee, reportDueDate, targetCompletionDate, step, hasUnsavedChanges])

  const guardedClose = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved booking changes. Close this form and keep only the local auto-saved draft?')) return
    onClose()
  }

  const patientMatch = useMemo(
    () => existingBookings.find((b) => patient.trim() && b.patient.toLowerCase() === patient.trim().toLowerCase()),
    [existingBookings, patient]
  )
  const bookingMatch = useMemo(
    () => existingBookings.find(
      (b) => patient.trim() && client.trim() && b.patient.toLowerCase() === patient.trim().toLowerCase() && b.client.toLowerCase() === client.trim().toLowerCase() && b.status !== 'Cancelled'
    ),
    [existingBookings, patient, client]
  )

  const validateStep1 = () => {
    if (!patient.trim()) {
      setError('Patient name is required.')
      return false
    }
    setError('')
    return true
  }

  const validateStep2 = () => {
    if (!client.trim()) {
      setError('Client is required.')
      return false
    }
    setError('')
    return true
  }

  const validateCurrentStep = () => {
    if (step === 1) return validateStep1()
    if (step === 2) return validateStep2()
    if (step === 3 && appointmentRequired === 'Yes' && !preferredDate) {
      setError('Preferred appointment date is required when an appointment is needed.')
      return false
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return
    setStep((s) => Math.min(s + 1, 6))
  }

  const buildBooking = (status: Booking['status']): Booking => ({
    ref: `BK-2026-${2050 + existingCount}`,
    patient: patient.trim() || 'Draft patient',
    client: client.trim() || 'Not selected',
    doctor: doctor.trim() || 'Unassigned',
    bookingDate: 'Just now',
    appointmentDate: preferredDate || '—',
    status,
    owner: 'Unassigned',
    priority,
    source,
    caseType,
    missingInformation: !patient.trim() || !client.trim() ? 'Yes' : 'No',
    notes: notes.trim(),
    agreedFee: agreedFee.trim(),
    reportDueDate,
    targetCompletionDate,
    appointmentMethod: appointmentRequired === 'Yes' ? consultationMethod : undefined,
    appointmentLocation: appointmentRequired === 'Yes' ? location : undefined,
    interpreterRequired: appointmentRequired === 'Yes' ? interpreter.startsWith('Yes') : false,
    documents: documents.map((name, index) => ({
      id: `BK-DOC-${Date.now()}-${index}`,
      name,
      category: 'Initial document',
      size: 'Pending metadata',
      uploadedAt: 'Just now',
      uploadedBy: 'Administration Team',
    })),
    informationRequests: [],
    activity: [{ id: `BK-ACT-${Date.now()}`, date: 'Just now', title: status === 'Draft' ? 'Booking saved as draft' : 'Booking created', detail: `Instruction captured via ${source.toLowerCase()}.` }],
  })

  const handleCreate = () => {
    if (!validateStep1() || !validateStep2()) return
    localStorage.removeItem(draftKey)
    onCreate(buildBooking('New Booking'))
  }

  const handleDraft = () => {
    localStorage.removeItem(draftKey)
    onCreate(buildBooking('Draft'))
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    setDocuments(Array.from(files).map((file) => file.name))
  }

  return (
    <Modal title="Create booking" description="Capture a new instruction and prepare it for case creation." onClose={guardedClose} width="max-w-3xl">
      <div className="grid grid-cols-6 gap-2 mb-5">
        {steps.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => i + 1 < step && setStep(i + 1)}
            className="text-left min-w-0"
          >
            <div className={`h-1 rounded-full mb-2 ${step >= i + 1 ? 'bg-brand-600' : 'bg-slate-100'}`} />
            <span className={`text-[11px] leading-tight block ${step === i + 1 ? 'text-slate-800 font-medium' : step > i + 1 ? 'text-slate-500' : 'text-slate-400'}`}>
              {s}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className={label}>Patient name *</label>
            <input className={field} value={patient} onChange={(e) => setPatient(e.target.value)} placeholder="e.g. Owen Fitzpatrick" />
          </div>
          {patientMatch && (
            <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Possible duplicate patient</p>
                <p className="mt-0.5">{patientMatch.patient} already appears on booking {patientMatch.ref}. Review the existing record before continuing.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Case type</label>
              <select className={field} value={caseType} onChange={(e) => setCaseType(e.target.value)}>
                <option>Personal Injury — RTA</option>
                <option>Personal Injury — Workplace</option>
                <option>Clinical Negligence</option>
                <option>Employment Liability</option>
              </select>
            </div>
            <div>
              <label className={label}>Booking source</label>
              <select className={field} value={source} onChange={(e) => setSource(e.target.value as Booking['source'])}>
                <option>Email</option>
                <option>Phone</option>
                <option>Portal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className={label}>Client (solicitor / insurer) *</label>
            <input className={field} value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Calder Legal Group" />
          </div>
          {bookingMatch && (
            <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-medium">Possible duplicate booking</p>
                <p className="mt-0.5">An active booking already exists for this patient and client: {bookingMatch.ref} ({bookingMatch.status}).</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Medical expert</label>
              <input className={field} value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="e.g. Dr Amara Osei" />
            </div>
            <div>
              <label className={label}>Priority</label>
              <select className={field} value={priority} onChange={(e) => setPriority(e.target.value as Booking['priority'])}>
                <option>Standard</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Internal notes (optional)</label>
            <textarea className={field} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the team should know about this instruction" />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Appointment required *</label>
              <select className={field} value={appointmentRequired} onChange={(e) => setAppointmentRequired(e.target.value)}>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            <div>
              <label className={label}>Preferred date {appointmentRequired === 'Yes' ? '*' : ''}</label>
              <input type="date" className={field} value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} disabled={appointmentRequired === 'No'} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Consultation method</label>
              <select className={field} value={consultationMethod} onChange={(e) => setConsultationMethod(e.target.value)} disabled={appointmentRequired === 'No'}>
                <option>In person</option>
                <option>Video consultation</option>
                <option>Telephone</option>
              </select>
            </div>
            <div>
              <label className={label}>Location</label>
              <select className={field} value={location} onChange={(e) => setLocation(e.target.value)} disabled={appointmentRequired === 'No'}>
                <option>Manchester Clinic</option>
                <option>Leeds Clinic</option>
                <option>Remote — Video</option>
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Interpreter requirement</label>
            <select className={field} value={interpreter} onChange={(e) => setInterpreter(e.target.value)} disabled={appointmentRequired === 'No'}>
              <option>No</option>
              <option>Yes — details to confirm</option>
            </select>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <label className="block border border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 cursor-pointer">
            <Upload size={22} className="mx-auto text-brand-600 mb-2" />
            <span className="block text-sm font-medium text-slate-700">Upload initial documents</span>
            <span className="block text-xs text-slate-400 mt-1">Select one or multiple files for this booking.</span>
            <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </label>
          {documents.length > 0 && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {documents.map((name) => (
                <div key={name} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">
                  <FileText size={14} className="text-slate-400" /> {name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label}>Agreed fee</label>
              <input className={field} value={agreedFee} onChange={(e) => setAgreedFee(e.target.value)} placeholder="e.g. £850" />
            </div>
            <div>
              <label className={label}>Report due date</label>
              <input type="date" className={field} value={reportDueDate} onChange={(e) => setReportDueDate(e.target.value)} />
            </div>
            <div>
              <label className={label}>Target completion</label>
              <input type="date" className={field} value={targetCompletionDate} onChange={(e) => setTargetCompletionDate(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Financial information is captured here for authorised users and can be reviewed before the booking is created.</p>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-3 text-sm">
          <div className="bg-slate-50 rounded-lg border border-slate-100 p-4 grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex justify-between gap-3"><span className="text-slate-500">Patient</span><span className="font-medium text-slate-800 text-right">{patient || '—'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Case type</span><span className="text-slate-700 text-right">{caseType}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Client</span><span className="text-slate-700 text-right">{client || '—'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Doctor</span><span className="text-slate-700 text-right">{doctor || 'Unassigned'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Appointment</span><span className="text-slate-700 text-right">{appointmentRequired === 'Yes' ? (preferredDate || 'Date required') : 'Not required'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Method</span><span className="text-slate-700 text-right">{appointmentRequired === 'Yes' ? consultationMethod : '—'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Documents</span><span className="text-slate-700 text-right">{documents.length}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Agreed fee</span><span className="text-slate-700 text-right">{agreedFee || '—'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Report due</span><span className="text-slate-700 text-right">{reportDueDate || '—'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Priority</span><span className="text-slate-700 text-right">{priority}</span></div>
            {notes && <div className="col-span-2 pt-2 border-t border-slate-200 text-slate-600">{notes}</div>}
          </div>
          <p className="text-xs text-slate-400">Confirm the details above, then create the booking. You can also save it as a draft and complete it later.</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={() => (step === 1 ? guardedClose() : setStep((s) => s - 1))}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <div className="flex items-center gap-2">
          {autoSavedAt && <span className="hidden md:inline text-[11px] text-slate-400">Auto-saved locally at {autoSavedAt}</span>}
          <button onClick={handleDraft} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg">
            Save as draft
          </button>
          {step < 6 ? (
            <button onClick={handleNext} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
              Save and continue
            </button>
          ) : (
            <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
              Create booking
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
