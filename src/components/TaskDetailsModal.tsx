import { useState } from 'react'
import Modal from './Modal'
import { roles } from '../context/RoleContext'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useToast } from '../context/ToastContext'
import type { TaskItem } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'

export default function TaskDetailsModal({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { tasks, updateTask, documents } = usePrototypeData()
  const { showToast } = useToast()
  const task = tasks.find((item) => item.id === taskId)
  const [draft, setDraft] = useState<TaskItem | null>(task ? { ...task } : null)
  const [comment, setComment] = useState('')

  if (!task || !draft) return null

  const save = () => {
    if (!draft.title.trim() || !draft.dueDate.trim()) { showToast('Task title and due date are required.'); return }
    const activity = [...(draft.activity ?? [])]
    if (draft.status !== task.status) activity.unshift({ id: `ACT-${Date.now()}-status`, date: 'Just now', user: draft.owner, action: `Status changed from ${task.status} to ${draft.status}` })
    if (draft.owner !== task.owner) activity.unshift({ id: `ACT-${Date.now()}-owner`, date: 'Just now', user: task.owner, action: `Task reassigned to ${draft.owner}` })
    updateTask(task.id, { ...draft, title: draft.title.trim(), description: draft.description?.trim(), activity })
    showToast(`Task "${draft.title}" updated.`)
    onClose()
  }

  const addComment = () => {
    const text = comment.trim(); if (!text) return
    const entry = { id: `TC-${Date.now()}`, author: draft.owner, date: 'Just now', text }
    const next = { ...draft, comments: [entry, ...(draft.comments ?? [])], activity: [{ id: `ACT-${Date.now()}`, date: 'Just now', user: draft.owner, action: 'Comment added' }, ...(draft.activity ?? [])] }
    setDraft(next); updateTask(task.id, next); setComment(''); showToast('Task comment added.')
  }

  const relatedDocs = documents.filter((doc) => doc.caseRef === draft.caseRef)

  return (
    <Modal title="Task details" description={`${task.id} · ${task.caseRef}`} onClose={onClose} width="max-w-3xl">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-5">
        <div className="space-y-4">
          <div><label className={label}>Task title *</label><input className={field} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
          <div><label className={label}>Description</label><textarea className={field} rows={3} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className={label}>Related case</label><input className={`${field} bg-slate-50`} value={draft.caseRef} disabled /></div>
            <div><label className={label}>Owner</label><select className={field} value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })}><option>Unassigned</option>{roles.map((entry) => <option key={entry.id} value={entry.name}>{entry.name}</option>)}</select></div>
            <div><label className={label}>Due date</label><input className={field} value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></div>
            <div><label className={label}>Priority</label><select className={field} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskItem['priority'] })}><option>Low</option><option>Standard</option><option>High</option></select></div>
            <div><label className={label}>Status</label><select className={field} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskItem['status'] })}><option>Not Started</option><option>In Progress</option><option>Blocked</option><option>Completed</option><option>Cancelled</option></select></div>
            <div><label className={label}>Task type</label><select className={field} value={draft.taskType ?? 'General'} onChange={(e) => setDraft({ ...draft, taskType: e.target.value })}><option>General</option><option>Document Request</option><option>Scheduling</option><option>Report Follow-up</option><option>QA Amendment</option></select></div>
          </div>
          <div><label className={label}>Supporting document</label><select className={field} value={draft.supportingDocument ?? ''} onChange={(e) => setDraft({ ...draft, supportingDocument: e.target.value })}><option value="">No supporting document</option>{relatedDocs.map((doc) => <option key={doc.id} value={doc.name}>{doc.name}</option>)}</select></div>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={draft.notifyOwner ?? false} onChange={(e) => setDraft({ ...draft, notifyOwner: e.target.checked })} /> Notify owner about task updates</label>

          <div className="border-t border-slate-100 pt-4"><p className={label}>Comments</p><div className="flex gap-2"><input className={field} value={comment} onChange={(e)=>setComment(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter')addComment()}} placeholder="Add a task comment..."/><button onClick={addComment} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700">Add</button></div><div className="mt-3 space-y-2">{(draft.comments ?? []).length===0&&<p className="text-xs text-slate-400">No comments yet.</p>}{(draft.comments ?? []).map(item=><div key={item.id} className="rounded-lg bg-slate-50 border border-slate-100 p-2.5"><p className="text-sm text-slate-600">{item.text}</p><p className="text-[11px] text-slate-400 mt-1">{item.author} · {item.date}</p></div>)}</div></div>
        </div>
        <aside className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid grid-cols-1 gap-3 text-xs"><div><p className="text-slate-400">Created by</p><p className="text-slate-700 mt-0.5">{draft.createdBy}</p></div><div><p className="text-slate-400">Created</p><p className="text-slate-700 mt-0.5">{draft.createdAt ?? '—'}</p></div></div>
          <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-700">Activity history</p><div className="mt-3 space-y-3">{(draft.activity ?? []).map(item=><div key={item.id} className="border-l-2 border-slate-200 pl-2"><p className="text-xs text-slate-600">{item.action}</p><p className="text-[10px] text-slate-400 mt-0.5">{item.user} · {item.date}</p></div>)}</div></div>
        </aside>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={save} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700">Save changes</button></div>
    </Modal>
  )
}
