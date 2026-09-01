import { useMemo, useState } from 'react'
import Modal from './Modal'
import { cases } from '../data/mockData'
import type { Appointment } from '../types'
import { usePrototypeData } from '../context/PrototypeDataContext'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

function formatDate(value: string) {
  if (!value) return ''
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function normaliseDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeRange(value: string) {
  const [start = '', end = ''] = value.split('–').map((v) => v.trim())
  return { start, end }
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd
}

export default function NewAppointmentModal({
  onClose,
  onCreate,
  existingCount,
  defaultCaseRef = '',
  defaultPatient = '',
  defaultDoctor = 'Dr Amara Osei',
  lockCase = false,
  existingAppointments = [],
}: {
  onClose: () => void
  onCreate: (a: Appointment) => void
  existingCount: number
  defaultCaseRef?: string
  defaultPatient?: string
  defaultDoctor?: string
  lockCase?: boolean
  existingAppointments?: Appointment[]
}) {
  const { doctors } = usePrototypeData()
  const [caseRef, setCaseRef] = useState(defaultCaseRef)
  const [doctor, setDoctor] = useState(defaultDoctor || 'Dr Amara Osei')
  const [type, setType] = useState('Initial Examination')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('Manchester Clinic — Room 1')
  const [consultationMethod, setConsultationMethod] = useState('In person')
  const [interpreterRequired, setInterpreterRequired] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const selectedCase = cases.find((c) => c.ref === caseRef)
  const patientName = selectedCase?.patient ?? defaultPatient ?? 'Unknown patient'

  const conflict = useMemo(() => {
    if (!date || !startTime || !endTime || !doctor) return undefined
    return existingAppointments.find((a) => {
      if (a.status === 'Cancelled' || a.doctor !== doctor || normaliseDate(a.date) !== date) return false
      const existing = timeRange(a.time)
      return existing.start && existing.end && overlaps(startTime, endTime, existing.start, existing.end)
    })
  }, [date, startTime, endTime, doctor, existingAppointments])

  const duplicateBooking = useMemo(() => {
    if (!date || !startTime || !endTime || (!caseRef && !patientName)) return undefined
    return existingAppointments.find((a) => {
      if (a.status === 'Cancelled' || normaliseDate(a.date) !== date) return false
      if (a.caseRef !== caseRef && a.patient !== patientName) return false
      const existing = timeRange(a.time)
      return existing.start && existing.end && overlaps(startTime, endTime, existing.start, existing.end)
    })
  }, [date, startTime, endTime, caseRef, patientName, existingAppointments])

  const handleSubmit = () => {
    if (!caseRef || !date || !startTime || !endTime) {
      setError('Case, date, start time and end time are required.')
      return
    }
    if (endTime <= startTime) {
      setError('End time must be later than the start time.')
      return
    }
    if (conflict) {
      setError(`${doctor} already has ${conflict.patient} booked at ${conflict.time} on this date. Choose another time or doctor.`)
      return
    }
    if (duplicateBooking) {
      setError(`${patientName} already has an overlapping appointment at ${duplicateBooking.time}. Review the existing booking before creating another.`)
      return
    }
    setError('')
    onCreate({
      id: `A-${100 + existingCount}`,
      caseRef,
      patient: patientName,
      doctor,
      date: formatDate(date),
      time: `${startTime}–${endTime}`,
      type,
      location: consultationMethod === 'Video' ? 'Remote — Video' : consultationMethod === 'Telephone' ? 'Remote — Telephone' : location,
      status: 'Scheduled',
      consultationMethod,
      interpreterRequired,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Modal title="Schedule appointment" description="Schedule the case appointment and check for diary conflicts and duplicates." onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {(conflict || duplicateBooking) && !error && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{duplicateBooking ? `Possible duplicate booking: ${duplicateBooking.patient} · ${duplicateBooking.time}.` : `Potential doctor conflict: ${conflict?.patient} · ${conflict?.time}.`}</p>}

        <div>
          <label className={label}>Case *</label>
          <select className={`${field} disabled:bg-slate-50 disabled:text-slate-500`} value={caseRef} onChange={(e) => setCaseRef(e.target.value)} disabled={lockCase}>
            {!lockCase && <option value="">Select a case...</option>}
            {cases.map((c) => <option key={c.ref} value={c.ref}>{c.ref} — {c.patient}</option>)}
            {defaultCaseRef && !cases.some((c) => c.ref === defaultCaseRef) && <option value={defaultCaseRef}>{defaultCaseRef} — {defaultPatient}</option>}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Patient</label>
            <input className={`${field} bg-slate-50`} value={patientName} readOnly />
          </div>
          <div>
            <label className={label}>Doctor *</label>
            <select className={field} value={doctor} onChange={(e) => setDoctor(e.target.value)}>
              {doctors.filter((item) => item.status === 'Active').map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Appointment type</label>
            <select className={field} value={type} onChange={(e) => setType(e.target.value)}>
              <option>Initial Examination</option><option>Follow-up Examination</option><option>Records Review</option>
            </select>
          </div>
          <div>
            <label className={label}>Consultation method</label>
            <select className={field} value={consultationMethod} onChange={(e) => setConsultationMethod(e.target.value)}>
              <option>In person</option><option>Video</option><option>Telephone</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Date *</label>
            <input className={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className={label}>Start *</label>
            <input className={field} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className={label}>End *</label>
            <input className={field} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>

        {consultationMethod === 'In person' && (
          <div>
            <label className={label}>Location *</label>
            <select className={field} value={location} onChange={(e) => setLocation(e.target.value)}>
              <option>Manchester Clinic — Room 1</option><option>Manchester Clinic — Room 2</option><option>London Clinic — Room 1</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 items-end">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer pb-2">
            <input type="checkbox" checked={interpreterRequired} onChange={(e) => setInterpreterRequired(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30" />
            Interpreter required
          </label>
          <div>
            <label className={label}>Notes</label>
            <input className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional appointment note" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Schedule appointment</button>
      </div>
    </Modal>
  )
}
