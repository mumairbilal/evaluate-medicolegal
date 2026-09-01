import { useState } from 'react'
import Modal from './Modal'
import type { Doctor } from '../types'
import PhoneInput from './PhoneInput'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

export default function NewDoctorModal({
  onClose,
  onCreate,
  existingCount,
}: {
  onClose: () => void
  onCreate: (d: Doctor) => void
  existingCount: number
}) {
  const [name, setName] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [location, setLocation] = useState('Manchester Clinic')
  const [availability, setAvailability] = useState<Doctor['availability']>('Available')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>(['Initial Examination'])
  const [error, setError] = useState('')

  const toggleType = (t: string) => {
    setAppointmentTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const handleSubmit = () => {
    if (!name.trim() || !speciality.trim()) {
      setError('Doctor name and speciality are required.')
      return
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (phone.trim() && phone.replace(/\D/g, '').length < 7) {
      setError('Enter a valid phone number after selecting the country code.')
      return
    }
    onCreate({
      id: `DR-${100 + existingCount}`,
      name: name.trim(),
      speciality: speciality.trim(),
      location,
      activeCases: 0,
      upcomingAppointments: 0,
      reportsInProgress: 0,
      status: 'Active',
      availability,
      email: email.trim(),
      phone: phone.trim(),
      specialities: [speciality.trim()],
      appointmentTypes,
      locations: [location],
      professionalDetails: `${speciality.trim()} · Medical expert panel member`,
    })
  }

  return (
    <Modal title="Add doctor" description="Add a doctor or medical expert to the panel." onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className={label}>Doctor name</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr Helen Marsh" />
        </div>
        <div>
          <label className={label}>Speciality</label>
          <input className={field} value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder="e.g. Consultant Neurologist" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className={label}>Email</label><input type="email" className={field} value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="doctor@example.com" /></div>
          <div><label className={label}>Phone</label><PhoneInput value={phone} onChange={(value) => { setPhone(value); setError('') }} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Primary location</label>
            <select className={field} value={location} onChange={(e) => setLocation(e.target.value)}>
              <option>Manchester Clinic</option>
              <option>Leeds Clinic</option>
              <option>London Clinic</option>
              <option>Remote — Video</option>
            </select>
          </div>
          <div>
            <label className={label}>Availability</label>
            <select className={field} value={availability} onChange={(e) => setAvailability(e.target.value as Doctor['availability'])}>
              <option>Available</option>
              <option>Limited Availability</option>
              <option>Fully Booked</option>
              <option>On Leave</option>
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Appointment types offered</label>
          <div className="flex flex-wrap gap-2">
            {['Initial Examination', 'Follow-up Examination', 'Video Consultation', 'Records Review'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  appointmentTypes.includes(t)
                    ? 'bg-brand-50 border-brand-500 text-brand-700 font-medium'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">
          Cancel
        </button>
        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
          Add doctor
        </button>
      </div>
    </Modal>
  )
}
