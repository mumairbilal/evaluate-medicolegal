import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Modal from './Modal'
import PhoneInput from './PhoneInput'
import { useRole } from '../context/RoleContext'
import type { Client, ClientContact } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

type DraftContact = Omit<ClientContact, 'id'> & { id?: string; key: string }

export default function EditClientModal({ client, onClose, onSave }: { client: Client; onClose: () => void; onSave: (client: Client) => void }) {
  const { role } = useRole()
  const canEditCommercial = ['system-administrator', 'operations-manager', 'management'].includes(role.id)
  const [name, setName] = useState(client.name)
  const [type, setType] = useState<Client['type']>(client.type)
  const [primaryContact, setPrimaryContact] = useState(client.primaryContact)
  const [email, setEmail] = useState(client.email)
  const [phone, setPhone] = useState(client.phone)
  const [organisationNumber, setOrganisationNumber] = useState(client.organisationNumber ?? '')
  const [address, setAddress] = useState(client.address ?? '')
  const [serviceRequirements, setServiceRequirements] = useState(client.serviceRequirements ?? '')
  const [standardInstructions, setStandardInstructions] = useState(client.standardInstructions ?? '')
  const [reportDeliveryPreference, setReportDeliveryPreference] = useState(client.reportDeliveryPreference ?? '')
  const [agreedFees, setAgreedFees] = useState(client.agreedFees ?? '')
  const [communicationDetails, setCommunicationDetails] = useState(client.communicationDetails ?? '')
  const [additionalContacts, setAdditionalContacts] = useState<DraftContact[]>(() => (client.contactPeople ?? []).slice(1).map((contact, index) => ({ ...contact, key: contact.id || `${client.id}-EXTRA-${index}` })))
  const [error, setError] = useState('')

  const addContact = () => setAdditionalContacts((prev) => [...prev, { key: `${Date.now()}-${prev.length}`, name: '', role: '', email: '', phone: '' }])
  const updateContact = (key: string, patch: Partial<DraftContact>) => setAdditionalContacts((prev) => prev.map((contact) => contact.key === key ? { ...contact, ...patch } : contact))
  const removeContact = (key: string) => setAdditionalContacts((prev) => prev.filter((contact) => contact.key !== key))

  const save = () => {
    if (!name.trim() || !primaryContact.trim()) return setError('Client name and primary contact are required.')
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid primary-contact email address.')
    if (phone.trim() && phone.replace(/\D/g, '').length < 7) return setError('Enter a valid primary-contact phone number.')
    if (additionalContacts.some((contact) => contact.email.trim() && !/^\S+@\S+\.\S+$/.test(contact.email.trim()))) return setError('Enter a valid email address for each additional contact.')
    if (additionalContacts.some((contact) => contact.phone.trim() && contact.phone.replace(/\D/g, '').length < 7)) return setError('Enter a valid phone number for each additional contact.')

    const contacts: ClientContact[] = [
      {
        id: client.contactPeople?.[0]?.id ?? `${client.id}-CONTACT-1`,
        name: primaryContact.trim(),
        role: type === 'Insurer' ? 'Claims Handler' : type === 'Solicitor Firm' ? 'Solicitor / Case Handler' : 'Primary Contact',
        email: email.trim(),
        phone: phone.trim(),
      },
      ...additionalContacts
        .filter((contact) => contact.name.trim() || contact.email.trim() || contact.phone.trim())
        .map((contact, index) => ({
          id: contact.id ?? `${client.id}-CONTACT-${index + 2}`,
          name: contact.name.trim() || 'Additional contact',
          role: contact.role.trim() || 'Contact',
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        })),
    ]

    onSave({
      ...client,
      name: name.trim(), type, primaryContact: primaryContact.trim(), email: email.trim(), phone: phone.trim(),
      organisationNumber: organisationNumber.trim(), address: address.trim(), serviceRequirements: serviceRequirements.trim(), standardInstructions: standardInstructions.trim(),
      reportDeliveryPreference: canEditCommercial ? reportDeliveryPreference.trim() : client.reportDeliveryPreference,
      agreedFees: canEditCommercial ? agreedFees.trim() : client.agreedFees,
      communicationDetails: communicationDetails.trim(), contactPeople: contacts, lastActivity: 'Just now',
    })
  }

  return (
    <Modal title="Edit client" description={`${client.id} · Organisation, contacts, service and permitted commercial settings.`} onClose={onClose} width="max-w-4xl">
      <div className="space-y-5">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Organisation</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Client name *</label><input className={field} value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className={label}>Client type</label><select className={field} value={type} onChange={(e) => setType(e.target.value as Client['type'])}><option>Solicitor Firm</option><option>Insurer</option><option>Direct Instruction</option></select></div>
            <div><label className={label}>Organisation number</label><input className={field} value={organisationNumber} onChange={(e) => setOrganisationNumber(e.target.value)} /></div>
            <div><label className={label}>Address</label><input className={field} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Primary contact</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Contact name *</label><input className={field} value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} /></div>
            <div><label className={label}>Email</label><input type="email" className={field} value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} /></div>
            <div className="sm:col-span-2"><label className={label}>Phone</label><PhoneInput value={phone} onChange={(value) => { setPhone(value); setError('') }} /></div>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Additional contacts</p>
            <button type="button" onClick={addContact} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><Plus size={13}/> Add contact</button>
          </div>
          {additionalContacts.length === 0 ? <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-400">No additional contacts recorded.</p> : <div className="space-y-3">{additionalContacts.map((contact) => <div key={contact.key} className="rounded-xl border border-slate-200 p-3"><div className="grid sm:grid-cols-2 gap-3"><div><label className={label}>Name</label><input className={field} value={contact.name} onChange={(e) => updateContact(contact.key, { name: e.target.value })}/></div><div><label className={label}>Role</label><input className={field} value={contact.role} onChange={(e) => updateContact(contact.key, { role: e.target.value })}/></div><div><label className={label}>Email</label><input type="email" className={field} value={contact.email} onChange={(e) => updateContact(contact.key, { email: e.target.value })}/></div><div><label className={label}>Phone</label><PhoneInput value={contact.phone} onChange={(value) => updateContact(contact.key, { phone: value })}/></div></div><div className="mt-2 flex justify-end"><button type="button" onClick={() => removeContact(contact.key)} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"><Trash2 size={13}/> Remove contact</button></div></div>)}</div>}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Service settings</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className={label}>Service requirements</label><textarea className={field} rows={3} value={serviceRequirements} onChange={(e) => setServiceRequirements(e.target.value)} /></div>
            <div><label className={label}>Standard instructions</label><textarea className={field} rows={3} value={standardInstructions} onChange={(e) => setStandardInstructions(e.target.value)} /></div>
            <div><label className={label}>Report delivery preference</label><input disabled={!canEditCommercial} className={`${field} disabled:bg-slate-50 disabled:text-slate-400`} value={reportDeliveryPreference} onChange={(e) => setReportDeliveryPreference(e.target.value)} /></div>
            <div><label className={label}>Commercial information / agreed fees</label><input disabled={!canEditCommercial} className={`${field} disabled:bg-slate-50 disabled:text-slate-400`} value={agreedFees} onChange={(e) => setAgreedFees(e.target.value)} /></div>
            {!canEditCommercial && <p className="sm:col-span-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">Commercial terms and delivery-rule changes are restricted for this role.</p>}
            <div className="sm:col-span-2"><label className={label}>Communication details</label><textarea className={field} rows={2} value={communicationDetails} onChange={(e) => setCommunicationDetails(e.target.value)} /></div>
          </div>
        </section>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Save client</button></div>
    </Modal>
  )
}
