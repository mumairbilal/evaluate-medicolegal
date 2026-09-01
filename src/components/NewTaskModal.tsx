import { useState } from 'react'
import Modal from './Modal'
import { cases } from '../data/mockData'
import { roles } from '../context/RoleContext'
import type { TaskItem } from '../types'
import { usePrototypeData } from '../context/PrototypeDataContext'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

function formatDate(value: string) {
  if (!value) return value
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function NewTaskModal({
  onClose,
  onCreate,
  existingCount,
  defaultOwner,
  defaultCaseRef = '',
  lockCase = false,
}: {
  onClose: () => void
  onCreate: (t: TaskItem) => void
  existingCount: number
  defaultOwner: string
  defaultCaseRef?: string
  lockCase?: boolean
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [caseRef, setCaseRef] = useState(defaultCaseRef)
  const [owner, setOwner] = useState(defaultOwner)
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskItem['priority']>('Standard')
  const [taskType, setTaskType] = useState('General')
  const { documents } = usePrototypeData()
  const [notify, setNotify] = useState(true)
  const [supportingDocument, setSupportingDocument] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!title.trim() || !dueDate.trim()) {
      setError('Task title and due date are required.')
      return
    }
    if (lockCase && !caseRef) {
      setError('This task must stay linked to the current case.')
      return
    }
    onCreate({
      id: `T-${100 + existingCount}`,
      title: title.trim(),
      caseRef: caseRef || 'Unlinked',
      owner: owner.trim() || 'Unassigned',
      dueDate: formatDate(dueDate),
      priority,
      status: 'Not Started',
      createdBy: defaultOwner,
      description: description.trim() || undefined,
      taskType,
      notifyOwner: notify,
      supportingDocument: supportingDocument || undefined,
      createdAt: 'Just now',
      comments: [],
      activity: [{ id: `ACT-${Date.now()}`, date: 'Just now', user: defaultOwner, action: 'Task created' }],
    })
  }

  return (
    <Modal title="Create task" description="Assign a specific piece of work with ownership and a due date." onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className={label}>Task title *</label>
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Request missing GP records" />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be completed?" />
        </div>
        <div>
          <label className={label}>Related case {lockCase ? '' : '(optional)'}</label>
          <select className={`${field} disabled:bg-slate-50 disabled:text-slate-500`} value={caseRef} onChange={(e) => setCaseRef(e.target.value)} disabled={lockCase}>
            {!lockCase && <option value="">No related case</option>}
            {cases.map((c) => (
              <option key={c.ref} value={c.ref}>{c.ref} — {c.patient}</option>
            ))}
            {defaultCaseRef && !cases.some((c) => c.ref === defaultCaseRef) && <option value={defaultCaseRef}>{defaultCaseRef}</option>}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Owner *</label>
            <select className={field} value={owner} onChange={(e) => setOwner(e.target.value)}>
              {roles.filter((r) => r.id !== 'management').map((user) => <option key={user.id} value={user.name}>{user.name} — {user.title}</option>)}
              {owner && !roles.some((r) => r.name === owner) && <option value={owner}>{owner}</option>}
            </select>
          </div>
          <div>
            <label className={label}>Due date *</label>
            <input className={field} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Priority</label>
            <select className={field} value={priority} onChange={(e) => setPriority(e.target.value as TaskItem['priority'])}>
              <option>Low</option><option>Standard</option><option>High</option>
            </select>
          </div>
          <div>
            <label className={label}>Task type</label>
            <select className={field} value={taskType} onChange={(e) => setTaskType(e.target.value)}>
              <option>General</option><option>Document Request</option><option>Scheduling</option><option>Report Follow-up</option><option>QA Amendment</option>
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Supporting document</label>
          <select className={field} value={supportingDocument} onChange={(e) => setSupportingDocument(e.target.value)}>
            <option value="">No supporting document</option>
            {documents.filter((doc) => !caseRef || doc.caseRef === caseRef).map((doc) => (
              <option key={doc.id} value={doc.name}>{doc.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30" />
          Notify the owner when this task is created
        </label>
      </div>
      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Create task</button>
      </div>
    </Modal>
  )
}
