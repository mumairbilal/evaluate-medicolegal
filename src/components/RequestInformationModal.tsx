import { useMemo, useState } from 'react'
import Modal from './Modal'
import type { Booking, BookingInformationRequest, Client } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'
const ITEMS = ['Instruction letter', 'Medical records', 'Identity / authority documents', 'Appointment requirements', 'Fee approval', 'Other supporting information']

export default function RequestInformationModal({ booking, clients, onClose, onSend }:{ booking:Booking; clients:Client[]; onClose:()=>void; onSend:(request:BookingInformationRequest)=>void }) {
  const linked = useMemo(()=>clients.find((c)=>c.name===booking.client),[clients,booking.client])
  const [recipient, setRecipient] = useState(linked?.primaryContact ?? booking.client)
  const [email, setEmail] = useState(linked?.email ?? '')
  const [subject, setSubject] = useState(`Information required for ${booking.ref} — ${booking.patient}`)
  const [items, setItems] = useState<string[]>(booking.status === 'Information Required' ? ['Medical records'] : [])
  const [dueDate, setDueDate] = useState('')
  const [message, setMessage] = useState('Please provide the selected information so we can progress this instruction without delay.')
  const [error, setError] = useState('')

  const toggle = (item:string) => setItems((current)=>current.includes(item)?current.filter((x)=>x!==item):[...current,item])
  const send = () => {
    if (!recipient.trim() || !email.trim()) return setError('Recipient name and email are required.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid recipient email address.')
    if (!items.length) return setError('Select at least one item to request.')
    if (!subject.trim() || !message.trim()) return setError('Subject and message are required.')
    onSend({ id:`REQ-${Date.now()}`, recipient:recipient.trim(), email:email.trim(), subject:subject.trim(), requestedItems:items, dueDate:dueDate||undefined, message:message.trim(), sentAt:'31 Aug 2026 · Just now', status:'Sent' })
  }

  return <Modal title="Request information" description={`Create a traceable information request for ${booking.ref}.`} onClose={onClose} width="max-w-2xl">
    <div className="space-y-4">
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-3"><div><label className={label}>Recipient *</label><input className={field} value={recipient} onChange={(e)=>setRecipient(e.target.value)} /></div><div><label className={label}>Recipient email *</label><input type="email" className={field} value={email} onChange={(e)=>{setEmail(e.target.value);setError('')}} /></div></div>
      <div><label className={label}>Subject *</label><input className={field} value={subject} onChange={(e)=>setSubject(e.target.value)} /></div>
      <div><label className={label}>Information required *</label><div className="grid sm:grid-cols-2 gap-2 border border-slate-200 rounded-lg p-3">{ITEMS.map((item)=><label key={item} className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={items.includes(item)} onChange={()=>toggle(item)} /> {item}</label>)}</div></div>
      <div className="grid sm:grid-cols-[180px_1fr] gap-3"><div><label className={label}>Requested by</label><input type="date" className={field} value={dueDate} onChange={(e)=>setDueDate(e.target.value)} /></div><div><label className={label}>Message *</label><textarea rows={3} className={field} value={message} onChange={(e)=>setMessage(e.target.value)} /></div></div>
    </div>
    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={send} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Send request</button></div>
  </Modal>
}
