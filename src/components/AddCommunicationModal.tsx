import { useState } from 'react'
import Modal from './Modal'
import { cases } from '../data/mockData'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useRole } from '../context/RoleContext'
import { useToast } from '../context/ToastContext'
import type { CommunicationItem, TaskItem } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

function formatDate(value: string) {
  if (!value) return value
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AddCommunicationModal({ onClose, defaultCaseRef = '' }: { onClose: () => void; defaultCaseRef?: string }) {
  const { communications, tasks, addCommunication, addTask } = usePrototypeData()
  const { role } = useRole()
  const { showToast } = useToast()
  const [caseRef, setCaseRef] = useState(defaultCaseRef || cases[0]?.ref || '')
  const [type, setType] = useState<CommunicationItem['type']>('Email')
  const [from, setFrom] = useState(role.name)
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [summary, setSummary] = useState('')
  const [attachment, setAttachment] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followUpTitle, setFollowUpTitle] = useState('Follow up communication')
  const [followUpDue, setFollowUpDue] = useState('')
  const [error, setError] = useState('')

  const internal = type === 'Internal Note' || type === 'System Notification'

  const save = () => {
    if (!caseRef || !from.trim() || !to.trim() || !subject.trim() || !summary.trim()) {
      setError('Case, sender, recipient, subject and notes are required.')
      return
    }
    if (followUp && (!followUpTitle.trim() || !followUpDue)) {
      setError('Follow-up task title and due date are required when follow-up is enabled.')
      return
    }
    let followUpTaskId = ''
    if (followUp) {
      followUpTaskId = `T-${Date.now()}`
      const task: TaskItem = {
        id: followUpTaskId,
        title: followUpTitle.trim(),
        caseRef,
        owner: role.name,
        dueDate: formatDate(followUpDue),
        priority: 'Standard',
        status: 'Not Started',
        createdBy: role.name,
        createdAt: 'Just now',
        description: `Follow up communication: ${subject.trim()}`,
        taskType: 'General',
        notifyOwner: true,
      }
      addTask(task)
    }
    addCommunication({
      id: `C-${Date.now() + communications.length}`,
      caseRef,
      type,
      from: from.trim(),
      to: to.trim(),
      date: 'Just now',
      subject: subject.trim(),
      summary: summary.trim(),
      internal,
      attachment: attachment || undefined,
      followUpTaskId: followUpTaskId || undefined,
    })
    showToast(followUp ? 'Communication recorded and follow-up task created.' : 'Communication recorded.')
    onClose()
  }

  return (
    <Modal title="Add communication" description="Record case communication, visibility and any required follow-up." onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className={label}>Related case *</label><select className={field} value={caseRef} onChange={(e) => setCaseRef(e.target.value)}>{cases.map((item) => <option key={item.ref} value={item.ref}>{item.ref} — {item.patient}</option>)}</select></div>
          <div><label className={label}>Communication type *</label><select className={field} value={type} onChange={(e) => setType(e.target.value as CommunicationItem['type'])}><option>Email</option><option>Phone Call</option><option>Internal Note</option><option>Patient</option><option>Client</option><option>Doctor</option><option>System Notification</option></select></div>
          <div><label className={label}>Sender *</label><input className={field} value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className={label}>Recipient *</label><input className={field} value={to} onChange={(e) => setTo(e.target.value)} placeholder="Person or team" /></div>
        </div>
        <div><label className={label}>Subject *</label><input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div><label className={label}>Notes or summary *</label><textarea className={field} rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} /></div>
        <div>
          <label className={label}>Attachment</label>
          <input className={field} type="file" onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? '')} />
          {attachment && <p className="text-xs text-slate-400 mt-1">Selected: {attachment}</p>}
        </div>
        <div className={`rounded-lg border px-3 py-2 text-xs ${internal ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
          Visibility: <strong>{internal ? 'Internal Only' : 'External communication'}</strong>. {internal ? 'This record is not intended for external recipients.' : 'This communication is recorded as external-facing.'}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} /> Create a follow-up task</label>
        {followUp && <div className="grid md:grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><div><label className={label}>Follow-up task</label><input className={field} value={followUpTitle} onChange={(e) => setFollowUpTitle(e.target.value)} /></div><div><label className={label}>Due date</label><input className={field} type="date" value={followUpDue} onChange={(e) => setFollowUpDue(e.target.value)} /></div></div>}
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg">Record communication</button></div>
    </Modal>
  )
}
