import { useMemo, useState } from 'react'
import Modal from './Modal'
import { doctors } from '../data/mockData'
import type { Booking } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

function formatDate(value: string) {
  if (!value) return '—'
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function normaliseDate(value: string) {
  if (!value || value === '—') return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function overlaps(aStart:string,aEnd:string,bStart:string,bEnd:string){ return aStart < bEnd && bStart < aEnd }

export default function BookingAppointmentModal({ booking, bookings, onClose, onSave }:{ booking:Booking; bookings:Booking[]; onClose:()=>void; onSave:(b:Booking)=>void }) {
  const [doctor, setDoctor] = useState(booking.doctor === 'Unassigned' || booking.doctor === '—' ? 'Dr Amara Osei' : booking.doctor)
  const [type, setType] = useState(booking.appointmentType ?? 'Initial Examination')
  const [method, setMethod] = useState(booking.appointmentMethod ?? 'In person')
  const [date, setDate] = useState(normaliseDate(booking.appointmentDate))
  const existingTimes = (booking.appointmentTime ?? '').split('–').map((x) => x.trim())
  const [start, setStart] = useState(existingTimes[0] ?? '')
  const [end, setEnd] = useState(existingTimes[1] ?? '')
  const [location, setLocation] = useState(booking.appointmentLocation ?? 'Manchester Clinic — Room 1')
  const [interpreter, setInterpreter] = useState(Boolean(booking.interpreterRequired))
  const [notes, setNotes] = useState(booking.appointmentNotes ?? '')
  const [error, setError] = useState('')

  const conflict = useMemo(() => bookings.find((item) => {
    if (item.ref === booking.ref || item.status === 'Cancelled' || item.doctor !== doctor || normaliseDate(item.appointmentDate) !== date) return false
    const [s='',e=''] = (item.appointmentTime ?? '').split('–').map((x) => x.trim())
    return s && e && start && end && overlaps(start,end,s,e)
  }), [bookings, booking.ref, doctor, date, start, end])

  const save = () => {
    if (!date || !start || !end || !doctor) return setError('Doctor, date, start time and end time are required.')
    if (end <= start) return setError('End time must be later than start time.')
    if (conflict) return setError(`${doctor} already has ${conflict.patient} booked at ${conflict.appointmentTime}. Choose another time or doctor.`)
    onSave({
      ...booking,
      doctor,
      appointmentDate: formatDate(date),
      appointmentTime: `${start}–${end}`,
      appointmentType: type,
      appointmentMethod: method,
      appointmentLocation: method === 'Video' ? 'Remote — Video' : method === 'Telephone' ? 'Remote — Telephone' : location,
      interpreterRequired: interpreter,
      appointmentNotes: notes.trim(),
      status: 'Appointment Scheduled',
      activity: [...(booking.activity ?? []), { id:`${booking.ref}-appointment-${Date.now()}`, date:'31 Aug 2026 · Just now', title: booking.appointmentDate === '—' ? 'Appointment scheduled' : 'Appointment rescheduled', detail:`${doctor} · ${formatDate(date)} · ${start}–${end}.` }],
    })
  }

  return <Modal title={booking.appointmentDate === '—' ? 'Schedule appointment' : 'Reschedule appointment'} description={`${booking.ref} · ${booking.patient}`} onClose={onClose} width="max-w-2xl">
    <div className="space-y-4">
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      {conflict && !error && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Potential diary conflict with {conflict.patient} at {conflict.appointmentTime}.</p>}
      <div className="grid sm:grid-cols-2 gap-3"><div><label className={label}>Patient</label><input className={`${field} bg-slate-50`} value={booking.patient} readOnly /></div><div><label className={label}>Doctor *</label><select className={field} value={doctor} onChange={(e)=>{setDoctor(e.target.value);setError('')}}>{doctors.filter((d)=>d.status==='Active').map((d)=><option key={d.id}>{d.name}</option>)}</select></div></div>
      <div className="grid sm:grid-cols-2 gap-3"><div><label className={label}>Appointment type</label><select className={field} value={type} onChange={(e)=>setType(e.target.value)}><option>Initial Examination</option><option>Follow-up Examination</option><option>Records Review</option></select></div><div><label className={label}>Consultation method</label><select className={field} value={method} onChange={(e)=>setMethod(e.target.value)}><option>In person</option><option>Video</option><option>Telephone</option></select></div></div>
      <div className="grid grid-cols-3 gap-3"><div><label className={label}>Date *</label><input type="date" className={field} value={date} onChange={(e)=>{setDate(e.target.value);setError('')}} /></div><div><label className={label}>Start *</label><input type="time" className={field} value={start} onChange={(e)=>setStart(e.target.value)} /></div><div><label className={label}>End *</label><input type="time" className={field} value={end} onChange={(e)=>setEnd(e.target.value)} /></div></div>
      {method === 'In person' && <div><label className={label}>Location *</label><select className={field} value={location} onChange={(e)=>setLocation(e.target.value)}><option>Manchester Clinic — Room 1</option><option>Manchester Clinic — Room 2</option><option>Leeds Clinic — Room 1</option><option>London Clinic — Room 1</option></select></div>}
      <div className="grid sm:grid-cols-2 gap-3 items-end"><label className="flex items-center gap-2 text-sm text-slate-600 pb-2"><input type="checkbox" checked={interpreter} onChange={(e)=>setInterpreter(e.target.checked)} /> Interpreter required</label><div><label className={label}>Appointment notes</label><input className={field} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Optional note" /></div></div>
    </div>
    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save appointment</button></div>
  </Modal>
}
