import { useState } from 'react'
import Modal from './Modal'
import PhoneInput from './PhoneInput'
import { patientDobToDisplay, patientDobToInput } from '../utils/patientDate'
import type { Patient } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

export default function EditPatientModal({ patient, onClose, onSave }: { patient: Patient; onClose: () => void; onSave: (patient: Patient) => void }) {
  const [draft, setDraft] = useState(patient)
  const [dobInput, setDobInput] = useState(() => patientDobToInput(patient.dob))
  const [error, setError] = useState('')
  const update = (key: keyof Patient, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  const save = () => {
    if (!draft.name.trim()) {
      setError('Patient name is required.')
      return
    }
    if (draft.email.trim() && draft.email !== '—' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError('Enter a valid email address, for example name@example.com.')
      return
    }
    if (draft.phone.trim() && draft.phone !== '—' && draft.phone.replace(/\D/g, '').length < 7) {
      setError('Enter a valid phone number after selecting the country code.')
      return
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      dob: patientDobToDisplay(dobInput),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      lastActivity: 'Just now',
    })
  }

  return (
    <Modal title="Edit patient" description="Update patient details and communication requirements." onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Full name *</label><input className={field} value={draft.name} onChange={(e) => update('name', e.target.value)} /></div>
          <div>
            <label className={label}>Date of birth</label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              className={field}
              value={dobInput}
              onChange={(e) => { setDobInput(e.target.value); setError('') }}
              aria-label="Date of birth"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Email</label><input type="email" className={field} value={draft.email === '—' ? '' : draft.email} onChange={(e) => update('email', e.target.value)} placeholder="name@example.com" /></div>
          <div><label className={label}>Phone</label><PhoneInput value={draft.phone === '—' ? '' : draft.phone} onChange={(value) => update('phone', value)} /></div>
        </div>
        <div><label className={label}>Address</label><input className={field} value={draft.address ?? ''} onChange={(e) => update('address', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Accessibility requirements</label><input className={field} value={draft.accessibilityRequirements ?? ''} onChange={(e) => update('accessibilityRequirements', e.target.value)} /></div>
          <div><label className={label}>Interpreter requirements</label><input className={field} value={draft.interpreter ?? ''} onChange={(e) => update('interpreter', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Communication preference</label>
            <select className={field} value={draft.communicationPreferences ?? 'Email'} onChange={(e) => update('communicationPreferences', e.target.value)}>
              <option>Email</option><option>Phone</option><option>SMS</option><option>Email and phone</option>
            </select>
          </div>
          <div>
            <label className={label}>Patient status</label>
            <select className={field} value={draft.status} onChange={(e) => update('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save changes</button>
      </div>
    </Modal>
  )
}
