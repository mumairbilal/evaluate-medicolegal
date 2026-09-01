import { useState } from 'react'
import Modal from './Modal'
import PhoneInput from './PhoneInput'
import type { Client } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

export default function NewClientModal({
  onClose,
  onCreate,
  existingCount,
}: {
  onClose: () => void
  onCreate: (c: Client) => void
  existingCount: number
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<Client['type']>('Solicitor Firm')
  const [primaryContact, setPrimaryContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Client name is required.')
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
      id: `CL-${100 + existingCount}`,
      name: name.trim(),
      type,
      primaryContact: primaryContact.trim() || 'Not set',
      email: email.trim(),
      phone: phone.trim(),
      activeCases: 0,
      completedCases: 0,
      lastActivity: 'Just now',
      status: 'Active',
    })
  }

  return (
    <Modal title="Create client" description="Add a solicitor firm, insurer, or direct instruction." onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className={label}>Client name</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calder Legal Group" />
        </div>
        <div>
          <label className={label}>Client type</label>
          <select className={field} value={type} onChange={(e) => setType(e.target.value as Client['type'])}>
            <option>Solicitor Firm</option>
            <option>Insurer</option>
            <option>Direct Instruction</option>
          </select>
        </div>
        <div>
          <label className={label}>Primary contact</label>
          <input className={field} value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} placeholder="e.g. Jane Whitmore" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Email</label>
            <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. jane@calderlegal.co.uk" />
          </div>
          <div>
            <label className={label}>Phone</label>
            <PhoneInput value={phone} onChange={(value) => { setPhone(value); setError('') }} placeholder="161 000 0000" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">
          Cancel
        </button>
        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">
          Create client
        </button>
      </div>
    </Modal>
  )
}
