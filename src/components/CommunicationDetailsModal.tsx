import { Link } from 'react-router-dom'
import Modal from './Modal'
import { usePrototypeData } from '../context/PrototypeDataContext'

export default function CommunicationDetailsModal({ communicationId, onClose }: { communicationId: string; onClose: () => void }) {
  const { communications, tasks } = usePrototypeData()
  const item = communications.find((entry) => entry.id === communicationId)
  if (!item) return null
  const followUp = item.followUpTaskId ? tasks.find((task) => task.id === item.followUpTaskId) : undefined
  return (
    <Modal title="Communication details" description={`${item.caseRef} · ${item.type}`} onClose={onClose} width="max-w-2xl">
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          {[['Sender', item.from], ['Recipient', item.to], ['Date & time', item.date], ['Visibility', item.internal ? 'Internal Only' : 'External'], ['Type', item.type], ['Attachment', item.attachment || 'None']].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3"><p className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</p><p className="text-sm text-slate-700 mt-1">{value}</p></div>)}
        </div>
        <div><p className="text-xs text-slate-400 mb-1">Subject</p><p className="text-sm font-medium text-slate-800">{item.subject}</p></div>
        <div><p className="text-xs text-slate-400 mb-1">Notes / summary</p><p className="text-sm text-slate-600 leading-6 whitespace-pre-wrap">{item.summary}</p></div>
        {followUp && <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3"><p className="text-xs font-semibold text-brand-700">Follow-up task</p><p className="text-sm text-slate-700 mt-1">{followUp.title}</p><p className="text-xs text-slate-500 mt-1">Owner {followUp.owner} · Due {followUp.dueDate} · {followUp.status}</p></div>}
        <Link to={`/cases/${item.caseRef}`} onClick={onClose} className="inline-flex text-sm font-medium text-brand-600 hover:text-brand-700">Open related case →</Link>
      </div>
    </Modal>
  )
}
