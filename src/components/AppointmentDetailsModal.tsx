import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import StatusBadge from './StatusBadge'
import { cases } from '../data/mockData'
import type { Appointment, Doctor } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

function toInputDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatDate(value: string) {
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function timeRange(value: string) {
  const [start = '', end = ''] = value.split('–').map((item) => item.trim())
  return { start, end }
}
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd
}

export default function AppointmentDetailsModal({
  appointment,
  appointments,
  doctors,
  onClose,
  onUpdate,
}: {
  appointment: Appointment
  appointments: Appointment[]
  doctors: Doctor[]
  onClose: () => void
  onUpdate: (next: Appointment) => void
}) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'view' | 'edit' | 'reschedule' | 'outcome'>('view')
  const [doctor, setDoctor] = useState(appointment.doctor)
  const [type, setType] = useState(appointment.type)
  const [date, setDate] = useState(toInputDate(appointment.date))
  const initialTime = timeRange(appointment.time)
  const [start, setStart] = useState(initialTime.start)
  const [end, setEnd] = useState(initialTime.end)
  const [method, setMethod] = useState(appointment.consultationMethod ?? (appointment.location.startsWith('Remote —') ? 'Video' : 'In person'))
  const [location, setLocation] = useState(appointment.location.startsWith('Remote —') ? 'Manchester Clinic — Room 1' : appointment.location)
  const [interpreter, setInterpreter] = useState(Boolean(appointment.interpreterRequired))
  const [notes, setNotes] = useState(appointment.notes ?? '')
  const [outcome, setOutcome] = useState(appointment.outcome ?? '')
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'attended' | 'dna' | null>(null)

  const relatedCase = cases.find((item) => item.ref === appointment.caseRef)
  const history = appointment.history ?? []

  const doctorConflict = useMemo(() => appointments.find((item) => {
    if (item.id === appointment.id || item.status === 'Cancelled' || item.doctor !== doctor || toInputDate(item.date) !== date) return false
    const existing = timeRange(item.time)
    return existing.start && existing.end && start && end && overlaps(start, end, existing.start, existing.end)
  }), [appointments, appointment.id, doctor, date, start, end])

  const duplicateBooking = useMemo(() => appointments.find((item) => {
    if (item.id === appointment.id || item.status === 'Cancelled' || toInputDate(item.date) !== date) return false
    if (item.caseRef !== appointment.caseRef && item.patient !== appointment.patient) return false
    const existing = timeRange(item.time)
    return existing.start && existing.end && start && end && overlaps(start, end, existing.start, existing.end)
  }), [appointments, appointment.id, appointment.caseRef, appointment.patient, date, start, end])

  const withHistory = (next: Appointment, action: string, detail: string): Appointment => ({
    ...next,
    history: [...(appointment.history ?? []), { id: `${appointment.id}-${Date.now()}`, date: '31 Aug 2026 · Just now', action, detail }],
  })

  const saveAppointment = () => {
    if (!doctor || !date || !start || !end || !type) return setError('Doctor, appointment type, date, start time and end time are required.')
    if (end <= start) return setError('End time must be later than the start time.')
    if (doctorConflict) return setError(`${doctor} already has ${doctorConflict.patient} booked at ${doctorConflict.time}. Choose another time or doctor.`)
    if (duplicateBooking) return setError(`${appointment.patient} already has an overlapping appointment (${duplicateBooking.time}). Review the existing booking before continuing.`)
    const resolvedLocation = method === 'Video' ? 'Remote — Video' : method === 'Telephone' ? 'Remote — Telephone' : location
    const next = withHistory({
      ...appointment,
      doctor,
      type,
      date: formatDate(date),
      time: `${start}–${end}`,
      location: resolvedLocation,
      consultationMethod: method,
      interpreterRequired: interpreter,
      notes: notes.trim() || undefined,
      status: mode === 'reschedule' ? 'Scheduled' : appointment.status,
    }, mode === 'reschedule' ? 'Appointment rescheduled' : 'Appointment updated', `${formatDate(date)} · ${start}–${end} · ${doctor}`)
    onUpdate(next)
    setError('')
    setMode('view')
  }

  const applyStatus = (status: Appointment['status'], action: string) => {
    onUpdate(withHistory({ ...appointment, status }, action, `${appointment.patient} · ${appointment.date} · ${appointment.time}`))
    setConfirmAction(null)
  }

  const saveOutcome = () => {
    if (!outcome.trim()) return setError('Enter an appointment outcome before saving.')
    onUpdate(withHistory({ ...appointment, outcome: outcome.trim() }, 'Outcome added', outcome.trim()))
    setError('')
    setMode('view')
  }

  return (
    <Modal title={mode === 'view' ? 'Appointment details' : mode === 'reschedule' ? 'Reschedule appointment' : mode === 'outcome' ? 'Add appointment outcome' : 'Edit appointment'} description={`${appointment.id} · ${appointment.patient}`} onClose={onClose} width="max-w-3xl">
      {error && <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {mode === 'view' ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Info label="Patient" value={appointment.patient} />
            <Info label="Case" value={appointment.caseRef} />
            <Info label="Client" value={relatedCase?.client ?? 'Not recorded'} />
            <Info label="Doctor" value={appointment.doctor} />
            <Info label="Date and time" value={`${appointment.date} · ${appointment.time}`} />
            <Info label="Appointment type" value={appointment.type} />
            <Info label="Location / method" value={`${appointment.location}${appointment.consultationMethod ? ` · ${appointment.consultationMethod}` : ''}`} />
            <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Status</p><div className="mt-1"><StatusBadge status={appointment.status}/></div></div>
            <Info label="Interpreter" value={appointment.interpreterRequired ? 'Required' : 'Not required'} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <section className="border border-slate-200 rounded-xl p-4"><h3 className="text-sm font-semibold text-slate-900">Notes and outcome</h3><p className="text-xs text-slate-500 mt-2 leading-5"><span className="font-medium text-slate-600">Notes:</span> {appointment.notes || 'No notes recorded.'}</p><p className="text-xs text-slate-500 mt-2 leading-5"><span className="font-medium text-slate-600">Outcome:</span> {appointment.outcome || 'No outcome recorded.'}</p></section>
            <section className="border border-slate-200 rounded-xl p-4"><h3 className="text-sm font-semibold text-slate-900">History</h3><div className="mt-2 space-y-2 max-h-36 overflow-y-auto">{history.length ? [...history].reverse().map((item) => <div key={item.id} className="text-xs"><p className="font-medium text-slate-700">{item.action}</p><p className="text-slate-400 mt-0.5">{item.date} · {item.detail}</p></div>) : <p className="text-xs text-slate-400">No appointment history recorded.</p>}</div></section>
          </div>

          {confirmAction && <div className="border border-amber-200 bg-amber-50 rounded-xl p-3"><p className="text-sm font-medium text-amber-900">Confirm {confirmAction === 'cancel' ? 'appointment cancellation' : confirmAction === 'attended' ? 'attendance' : 'did not attend'}?</p><p className="text-xs text-amber-800 mt-1">This updates the appointment status and records the change in history.</p><div className="flex justify-end gap-2 mt-3"><button onClick={() => setConfirmAction(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white/60 rounded-lg">Back</button><button onClick={() => confirmAction === 'cancel' ? applyStatus('Cancelled', 'Appointment cancelled') : confirmAction === 'attended' ? applyStatus('Completed', 'Marked attended') : applyStatus('Did Not Attend', 'Marked did not attend')} className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Confirm</button></div></div>}

          <div className="flex items-center justify-between gap-3 flex-wrap pt-4 border-t border-slate-100">
            <button onClick={() => { onClose(); navigate(`/cases/${appointment.caseRef}`) }} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"><ExternalLink size={13}/> Open case</button>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={() => setMode('edit')} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg">Edit</button>
              <button onClick={() => setMode('reschedule')} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg">Reschedule</button>
              <button onClick={() => setMode('outcome')} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg">Add outcome</button>
              <button onClick={() => setConfirmAction('attended')} disabled={appointment.status === 'Completed'} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-lg">Mark attended</button>
              <button onClick={() => setConfirmAction('dna')} disabled={appointment.status === 'Did Not Attend'} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-lg">Mark did not attend</button>
              <button onClick={() => setConfirmAction('cancel')} disabled={appointment.status === 'Cancelled'} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 rounded-lg">Cancel appointment</button>
            </div>
          </div>
        </div>
      ) : mode === 'outcome' ? (
        <div>
          <label className={label}>Appointment outcome *</label>
          <textarea rows={5} className={field} value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Record attendance outcome, clinical/admin result, or required follow-up..." />
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={() => setMode('view')} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={saveOutcome} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save outcome</button></div>
        </div>
      ) : (
        <div className="space-y-4">
          {(doctorConflict || duplicateBooking) && <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{duplicateBooking ? `Possible duplicate booking: ${duplicateBooking.patient} · ${duplicateBooking.date} · ${duplicateBooking.time}.` : `Doctor conflict: ${doctorConflict?.patient} · ${doctorConflict?.time}.`}</div>}
          <div className="grid sm:grid-cols-2 gap-3"><div><label className={label}>Patient</label><input className={`${field} bg-slate-50`} value={appointment.patient} readOnly /></div><div><label className={label}>Doctor *</label><select className={field} value={doctor} onChange={(e) => setDoctor(e.target.value)}>{doctors.filter((item) => item.status === 'Active').map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div></div>
          <div className="grid sm:grid-cols-2 gap-3"><div><label className={label}>Appointment type *</label><select className={field} value={type} onChange={(e) => setType(e.target.value)}><option>Initial Examination</option><option>Follow-up Examination</option><option>Video Consultation</option><option>Records Review</option></select></div><div><label className={label}>Consultation method</label><select className={field} value={method} onChange={(e) => setMethod(e.target.value)}><option>In person</option><option>Video</option><option>Telephone</option></select></div></div>
          <div className="grid grid-cols-3 gap-3"><div><label className={label}>Date *</label><input className={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div><div><label className={label}>Start time *</label><input className={field} type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div><div><label className={label}>End time *</label><input className={field} type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div></div>
          {method === 'In person' && <div><label className={label}>Location *</label><select className={field} value={location} onChange={(e) => setLocation(e.target.value)}><option>Manchester Clinic — Room 1</option><option>Manchester Clinic — Room 2</option><option>Leeds Clinic — Room 1</option><option>London Clinic — Room 1</option></select></div>}
          <div className="grid sm:grid-cols-2 gap-3 items-end"><label className="flex items-center gap-2 text-sm text-slate-600 pb-2"><input type="checkbox" checked={interpreter} onChange={(e) => setInterpreter(e.target.checked)} /> Interpreter required</label><div><label className={label}>Notes</label><input className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional appointment note" /></div></div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={() => setMode('view')} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={saveAppointment} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">{mode === 'reschedule' ? 'Save new schedule' : 'Save changes'}</button></div>
        </div>
      )}
    </Modal>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="text-sm text-slate-700 mt-1">{value}</p></div>
}
