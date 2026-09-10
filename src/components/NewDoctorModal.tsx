import { useState } from 'react'
import Modal from './Modal'
import type { Doctor } from '../types'
import PhoneInput from './PhoneInput'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'
const locationOptions = ['Manchester Clinic', 'Leeds Clinic', 'London Clinic', 'Remote — Video']
const appointmentOptions = ['Initial Examination', 'Follow-up Examination', 'Video Consultation', 'Records Review']
const reportTemplateOptions = ['Standard Medicolegal Report', 'Personal Injury Report', 'Psychiatric Report', 'Addendum Report']

export default function NewDoctorModal({ onClose, onCreate, existingCount }: { onClose: () => void; onCreate: (d: Doctor) => void; existingCount: number }) {
  const [name, setName] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [location, setLocation] = useState('Manchester Clinic')
  const [locations, setLocations] = useState<string[]>(['Manchester Clinic'])
  const [availability, setAvailability] = useState<Doctor['availability']>('Available')
  const [weeklyAvailability, setWeeklyAvailability] = useState('Monday–Friday')
  const [availableHours, setAvailableHours] = useState('09:00–17:00')
  const [blockedPeriods, setBlockedPeriods] = useState('')
  const [leaveDetails, setLeaveDetails] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>(['Initial Examination'])
  const [reportTemplates, setReportTemplates] = useState<string[]>(['Standard Medicolegal Report'])
  const [standardFees, setStandardFees] = useState('')
  const [error, setError] = useState('')

  const toggle = (value: string, current: string[], setter: (next: string[]) => void) => setter(current.includes(value) ? current.filter((x) => x !== value) : [...current, value])

  const handleSubmit = () => {
    if (!name.trim() || !speciality.trim()) return setError('Doctor name and speciality are required.')
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.')
    if (phone.trim() && phone.replace(/\D/g, '').length < 7) return setError('Enter a valid phone number after selecting the country code.')
    if (!locations.length) return setError('Select at least one location.')
    if (!appointmentTypes.length) return setError('Select at least one appointment type.')
    onCreate({
      id: `DR-${100 + existingCount}`,
      name: name.trim(), speciality: speciality.trim(), qualifications: qualifications.trim(), location,
      locations, availability, weeklyAvailability, availableHours, blockedPeriods: blockedPeriods.trim(), leaveDetails: leaveDetails.trim(),
      email: email.trim(), phone: phone.trim(), appointmentTypes, reportTemplates, standardFees: standardFees.trim(),
      activeCases: 0, upcomingAppointments: 0, reportsInProgress: 0, status: 'Active', specialities: [speciality.trim()],
      professionalDetails: `${speciality.trim()} · ${qualifications.trim() || 'Medical expert panel member'}`,
    })
  }

  return <Modal title="Add doctor" description="Create a complete medical expert profile, availability and report configuration." onClose={onClose} width="max-w-4xl">
    <div className="space-y-5">
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <section><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Professional details</p><div className="grid sm:grid-cols-2 gap-3">
        <div><label className={label}>Doctor name *</label><input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr Helen Marsh" /></div>
        <div><label className={label}>Speciality *</label><input className={field} value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="e.g. Consultant Neurologist" /></div>
        <div className="sm:col-span-2"><label className={label}>Qualifications</label><textarea className={field} rows={2} value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="Qualifications, registrations and accreditations" /></div>
        <div><label className={label}>Email</label><input type="email" className={field} value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="doctor@example.com" /></div>
        <div><label className={label}>Phone</label><PhoneInput value={phone} onChange={(value) => { setPhone(value); setError('') }} /></div>
      </div></section>

      <section className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Locations & appointment types</p>
        <div className="grid sm:grid-cols-2 gap-4"><div><label className={label}>Primary location</label><select className={field} value={location} onChange={(e) => { setLocation(e.target.value); if (!locations.includes(e.target.value)) setLocations([...locations, e.target.value]) }}>{locationOptions.map((x) => <option key={x}>{x}</option>)}</select></div><div><label className={label}>Availability status</label><select className={field} value={availability} onChange={(e) => setAvailability(e.target.value as Doctor['availability'])}><option>Available</option><option>Limited Availability</option><option>Fully Booked</option><option>On Leave</option></select></div></div>
        <div className="mt-3"><label className={label}>Locations</label><div className="flex flex-wrap gap-2">{locationOptions.map((x) => <button type="button" key={x} onClick={() => toggle(x, locations, setLocations)} className={`text-xs px-3 py-1.5 rounded-full border ${locations.includes(x) ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium' : 'border-slate-200 text-slate-500'}`}>{x}</button>)}</div></div>
        <div className="mt-3"><label className={label}>Appointment types</label><div className="flex flex-wrap gap-2">{appointmentOptions.map((x) => <button type="button" key={x} onClick={() => toggle(x, appointmentTypes, setAppointmentTypes)} className={`text-xs px-3 py-1.5 rounded-full border ${appointmentTypes.includes(x) ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium' : 'border-slate-200 text-slate-500'}`}>{x}</button>)}</div></div>
      </section>

      <section className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Availability settings</p><div className="grid sm:grid-cols-2 gap-3">
        <div><label className={label}>Weekly availability</label><input className={field} value={weeklyAvailability} onChange={(e) => setWeeklyAvailability(e.target.value)} placeholder="e.g. Monday–Friday" /></div>
        <div><label className={label}>Available hours</label><input className={field} value={availableHours} onChange={(e) => setAvailableHours(e.target.value)} placeholder="e.g. 09:00–17:00" /></div>
        <div><label className={label}>Blocked periods</label><textarea className={field} rows={2} value={blockedPeriods} onChange={(e) => setBlockedPeriods(e.target.value)} placeholder="Recurring blocks or unavailable periods" /></div>
        <div><label className={label}>Leave</label><textarea className={field} rows={2} value={leaveDetails} onChange={(e) => setLeaveDetails(e.target.value)} placeholder="Leave dates / notes" /></div>
      </div></section>

      <section className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Reports & fees</p>
        <label className={label}>Report templates</label><div className="flex flex-wrap gap-2">{reportTemplateOptions.map((x) => <button type="button" key={x} onClick={() => toggle(x, reportTemplates, setReportTemplates)} className={`text-xs px-3 py-1.5 rounded-full border ${reportTemplates.includes(x) ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium' : 'border-slate-200 text-slate-500'}`}>{x}</button>)}</div>
        <div className="mt-3"><label className={label}>Standard fees</label><input className={field} value={standardFees} onChange={(e) => setStandardFees(e.target.value)} placeholder="Visible to authorised users only" /></div>
      </section>
    </div>
    <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Add doctor</button></div>
  </Modal>
}
