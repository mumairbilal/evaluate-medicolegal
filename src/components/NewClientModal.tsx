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
  const [organisationNumber, setOrganisationNumber] = useState('')
  const [primaryContact, setPrimaryContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [additionalContacts, setAdditionalContacts] = useState('')
  const [address, setAddress] = useState('')
  const [standardInstructions, setStandardInstructions] = useState('')
  const [reportDeliveryPreference, setReportDeliveryPreference] = useState('Secure digital delivery')
  const [serviceRequirements, setServiceRequirements] = useState('')
  const [agreedFees, setAgreedFees] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!name.trim() || !primaryContact.trim()) {
      setError('Client name and primary contact are required.')
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
      organisationNumber: organisationNumber.trim(),
      primaryContact: primaryContact.trim(),
      email: email.trim(),
      phone: phone.trim(),
      additionalContacts: additionalContacts.trim(),
      address: address.trim(),
      standardInstructions: standardInstructions.trim(),
      reportDeliveryPreference: reportDeliveryPreference.trim(),
      serviceRequirements: serviceRequirements.trim(),
      agreedFees: agreedFees.trim(),
      communicationDetails: email.trim() ? `Primary communication via ${email.trim()}.` : 'Primary communication by telephone.',
      contactPeople: [{
        id: `CL-${100 + existingCount}-CONTACT-1`,
        name: primaryContact.trim(),
        role: type === 'Insurer' ? 'Claims Handler' : type === 'Solicitor Firm' ? 'Solicitor / Case Handler' : 'Primary Contact',
        email: email.trim(),
        phone: phone.trim(),
      }],
      activeCases: 0,
      completedCases: 0,
      lastActivity: 'Just now',
      status: 'Active',
    })
  }

  return (
    <Modal title="Create client" description="Add an instructing organisation or direct instruction with its operational settings." onClose={onClose} width="max-w-3xl">
      <div className="space-y-5">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Organisation details</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Client name *</label><input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calder Legal Group" /></div>
            <div><label className={label}>Client type</label><select className={field} value={type} onChange={(e) => setType(e.target.value as Client['type'])}><option>Solicitor Firm</option><option>Insurer</option><option>Direct Instruction</option></select></div>
            <div><label className={label}>Organisation number</label><input className={field} value={organisationNumber} onChange={(e) => setOrganisationNumber(e.target.value)} placeholder="Company / client reference" /></div>
            <div><label className={label}>Address</label><input className={field} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Organisation address" /></div>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Primary contact</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Primary contact *</label><input className={field} value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} placeholder="e.g. Jane Whitmore" /></div>
            <div><label className={label}>Email</label><input className={field} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="e.g. jane@calderlegal.co.uk" /></div>
            <div className="sm:col-span-2"><label className={label}>Phone</label><PhoneInput value={phone} onChange={(value) => { setPhone(value); setError('') }} placeholder="161 000 0000" /></div>
          </div>
          <div className="mt-3"><label className={label}>Additional contacts</label><textarea className={field} rows={2} value={additionalContacts} onChange={(e) => setAdditionalContacts(e.target.value)} placeholder="Names, roles and contact details for additional contacts" /></div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Instructions & service requirements</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Standard instructions</label><textarea className={field} rows={3} value={standardInstructions} onChange={(e) => setStandardInstructions(e.target.value)} placeholder="Standing instructions for this client" /></div>
            <div><label className={label}>Service requirements</label><textarea className={field} rows={3} value={serviceRequirements} onChange={(e) => setServiceRequirements(e.target.value)} placeholder="Turnaround, appointment or document requirements" /></div>
            <div><label className={label}>Report delivery preference</label><select className={field} value={reportDeliveryPreference} onChange={(e) => setReportDeliveryPreference(e.target.value)}><option>Secure digital delivery</option><option>Secure email</option><option>Client portal</option><option>Manual confirmation required</option></select></div>
            <div><label className={label}>Commercial information / agreed fees</label><input className={field} value={agreedFees} onChange={(e) => setAgreedFees(e.target.value)} placeholder="Visible to authorised users only" /></div>
          </div>
        </section>
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Create client</button>
      </div>
    </Modal>
  )
}
