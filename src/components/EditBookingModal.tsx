import { useMemo, useState } from 'react'
import Modal from './Modal'
import { clients, doctors } from '../data/mockData'
import type { Booking } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

export default function EditBookingModal({
  booking,
  existingBookings,
  onClose,
  onSave,
}: {
  booking: Booking
  existingBookings: Booking[]
  onClose: () => void
  onSave: (booking: Booking) => void
}) {
  const [patient, setPatient] = useState(booking.patient)
  const [client, setClient] = useState(booking.client)
  const [doctor, setDoctor] = useState(booking.doctor)
  const [owner, setOwner] = useState(booking.owner)
  const [caseType, setCaseType] = useState(booking.caseType)
  const [priority, setPriority] = useState<Booking['priority']>(booking.priority)
  const [source, setSource] = useState<Booking['source']>(booking.source)
  const [notes, setNotes] = useState(booking.notes ?? '')
  const [agreedFee, setAgreedFee] = useState(booking.agreedFee ?? '')
  const [reportDueDate, setReportDueDate] = useState(booking.reportDueDate ?? '')
  const [targetCompletionDate, setTargetCompletionDate] = useState(booking.targetCompletionDate ?? '')
  const [error, setError] = useState('')

  const duplicate = useMemo(() => existingBookings.find((item) =>
    item.ref !== booking.ref &&
    item.status !== 'Cancelled' &&
    item.patient.trim().toLowerCase() === patient.trim().toLowerCase() &&
    item.client.trim().toLowerCase() === client.trim().toLowerCase() &&
    item.caseType === caseType
  ), [existingBookings, booking.ref, patient, client, caseType])

  const save = () => {
    if (!patient.trim() || !client.trim()) {
      setError('Patient and client are required.')
      return
    }
    if (duplicate) {
      setError(`This would duplicate active booking ${duplicate.ref} for the same patient, client and case type.`)
      return
    }
    onSave({
      ...booking,
      patient: patient.trim(),
      client: client.trim(),
      doctor,
      owner,
      caseType,
      priority,
      source,
      notes: notes.trim(),
      agreedFee: agreedFee.trim(),
      reportDueDate,
      targetCompletionDate,
      activity: [
        ...(booking.activity ?? []),
        { id: `${booking.ref}-edit-${Date.now()}`, date: '31 Aug 2026 · Just now', title: 'Booking updated', detail: 'Booking details were edited and saved.' },
      ],
    })
  }

  return (
    <Modal title="Edit booking" description={`${booking.ref} · Update the instruction without changing its reference.`} onClose={onClose} width="max-w-3xl">
      <div className="space-y-5">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Instruction</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Patient *</label><input className={field} value={patient} onChange={(e) => { setPatient(e.target.value); setError('') }} /></div>
            <div><label className={label}>Client *</label><input list="booking-client-options" className={field} value={client} onChange={(e) => { setClient(e.target.value); setError('') }} /></div>
            <datalist id="booking-client-options">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
            <div><label className={label}>Case type</label><select className={field} value={caseType} onChange={(e) => setCaseType(e.target.value)}><option>Personal Injury — RTA</option><option>Personal Injury — Workplace</option><option>Clinical Negligence</option><option>Employment Liability</option></select></div>
            <div><label className={label}>Booking source</label><select className={field} value={source} onChange={(e) => setSource(e.target.value as Booking['source'])}><option>Email</option><option>Phone</option><option>Portal</option></select></div>
          </div>
        </section>
        <section className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Assignment</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><label className={label}>Medical expert</label><select className={field} value={doctor} onChange={(e) => setDoctor(e.target.value)}><option>Unassigned</option>{doctors.filter((d) => d.status === 'Active').map((d) => <option key={d.id}>{d.name}</option>)}</select></div>
            <div><label className={label}>Case owner</label><select className={field} value={owner} onChange={(e) => setOwner(e.target.value)}><option>Unassigned</option><option>Priya Nandra</option><option>Marcus Bell</option><option>Hannah Whitfield</option></select></div>
            <div><label className={label}>Priority</label><select className={field} value={priority} onChange={(e) => setPriority(e.target.value as Booking['priority'])}><option>Standard</option><option>High</option><option>Urgent</option></select></div>
          </div>
        </section>
        <section className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Fees & deadlines</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><label className={label}>Agreed fee</label><input className={field} value={agreedFee} onChange={(e) => setAgreedFee(e.target.value)} placeholder="£850.00" /></div>
            <div><label className={label}>Report due date</label><input type="date" className={field} value={reportDueDate} onChange={(e) => setReportDueDate(e.target.value)} /></div>
            <div><label className={label}>Target completion</label><input type="date" className={field} value={targetCompletionDate} onChange={(e) => setTargetCompletionDate(e.target.value)} /></div>
          </div>
          <div className="mt-3"><label className={label}>Internal notes</label><textarea className={field} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </section>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save changes</button></div>
    </Modal>
  )
}
