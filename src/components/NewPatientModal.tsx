import { useMemo, useState } from 'react'
import Modal from './Modal'
import PhoneInput from './PhoneInput'
import { normalisePatientDob, patientDobToDisplay } from '../utils/patientDate'
import type { Patient } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')

export default function NewPatientModal({
  onClose,
  onCreate,
  existingPatients,
  onUseExisting,
}: {
  onClose: () => void
  onCreate: (p: Patient) => void
  existingPatients: Patient[]
  onUseExisting: (p: Patient) => void
}) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [accessibility, setAccessibility] = useState('')
  const [interpreter, setInterpreter] = useState('')
  const [communicationPreferences, setCommunicationPreferences] = useState('Email')
  const [error, setError] = useState('')
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false)

  const possibleMatch = useMemo(() => {
    const n = normalise(name)
    const d = normalisePatientDob(dob)
    const e = normalise(email)
    const ph = phone.replace(/\D/g, '')
    const a = normalise(address)
    if (!n && !d && !e && !ph && !a) return undefined
    return existingPatients.find((p) => {
      const score = [
        n && normalise(p.name) === n,
        d && normalisePatientDob(p.dob) === d,
        e && normalise(p.email) === e,
        ph && p.phone.replace(/\D/g, '') === ph,
        a && p.address && normalise(p.address) === a,
      ].filter(Boolean).length
      return score >= 1 && ((n && normalise(p.name) === n) || score >= 2)
    })
  }, [name, dob, email, phone, address, existingPatients])

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Patient name is required. Enter the patient’s full name to continue.')
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address, for example name@example.com.')
      return
    }
    if (phone.trim() && phone.replace(/\D/g, '').length < 7) {
      setError('Enter a valid phone number after selecting the country code.')
      return
    }
    if (possibleMatch && !duplicateConfirmed) {
      setError('A possible duplicate patient was found. Review the match before creating a new record.')
      return
    }
    onCreate({
      id: `P-${1001 + existingPatients.length}`,
      name: name.trim(),
      dob: patientDobToDisplay(dob),
      email: email.trim() || '—',
      phone: phone.trim() || '—',
      address: address.trim() || 'Not recorded',
      accessibilityRequirements: accessibility.trim() || 'None recorded',
      interpreter: interpreter.trim() || undefined,
      communicationPreferences,
      activeCases: 0,
      lastAppointment: '—',
      lastActivity: 'Just now',
      status: 'Active',
    })
  }

  return (
    <Modal title="Create patient" description="Add a new patient record. Possible duplicates are checked as you enter details." onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

        {possibleMatch && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-900">Possible duplicate patient</p>
                <p className="text-xs text-amber-700 mt-1">A patient record matches one or more identifying details.</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-white border border-amber-200 text-amber-700">Review required</span>
            </div>
            <div className="mt-3 rounded-lg bg-white border border-amber-100 p-3 text-sm">
              <p className="font-medium text-slate-800">{possibleMatch.name}</p>
              <p className="text-xs text-slate-500 mt-1">{possibleMatch.id} · DOB {possibleMatch.dob}</p>
              <p className="text-xs text-slate-500">{possibleMatch.email} · {possibleMatch.phone}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => onUseExisting(possibleMatch)} className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
                Use existing patient
              </button>
              <button onClick={() => setDuplicateConfirmed(true)} className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg">
                Continue creating new
              </button>
            </div>
            {duplicateConfirmed && <p className="text-xs text-amber-700 mt-2">Confirmed: a separate patient record will be created.</p>}
          </div>
        )}

        <div>
          <label className={label}>Full name *</label>
          <input className={field} value={name} onChange={(e) => { setName(e.target.value); setDuplicateConfirmed(false) }} placeholder="e.g. Grace Adeyemi" />
        </div>
        <div>
          <label className={label}>Date of birth</label>
          <input type="date" max={new Date().toISOString().slice(0, 10)} className={field} value={dob} onChange={(e) => { setDob(e.target.value); setDuplicateConfirmed(false) }} aria-label="Date of birth" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Email</label>
            <input type="email" className={field} value={email} onChange={(e) => { setEmail(e.target.value); setDuplicateConfirmed(false); setError('') }} placeholder="name@example.com" />
          </div>
          <div>
            <label className={label}>Phone</label>
            <PhoneInput value={phone} onChange={(value) => { setPhone(value); setDuplicateConfirmed(false); setError('') }} />
          </div>
        </div>
        <div>
          <label className={label}>Address</label>
          <input className={field} value={address} onChange={(e) => { setAddress(e.target.value); setDuplicateConfirmed(false) }} placeholder="Patient address" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Accessibility requirements</label>
            <input className={field} value={accessibility} onChange={(e) => setAccessibility(e.target.value)} placeholder="e.g. Step-free access" />
          </div>
          <div>
            <label className={label}>Interpreter requirements</label>
            <input className={field} value={interpreter} onChange={(e) => setInterpreter(e.target.value)} placeholder="e.g. Italian" />
          </div>
        </div>
        <div>
          <label className={label}>Communication preference</label>
          <select className={field} value={communicationPreferences} onChange={(e) => setCommunicationPreferences(e.target.value)}>
            <option>Email</option>
            <option>Phone</option>
            <option>SMS</option>
            <option>Email and phone</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Create patient</button>
      </div>
    </Modal>
  )
}
