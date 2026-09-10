import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  AlertTriangle,
  UserX,
  Clock,
  FileClock,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react'
import { usePrototypeData } from '../../context/PrototypeDataContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { useToast } from '../../context/ToastContext'
import WelcomeBanner from '../../components/WelcomeBanner'
import Modal from '../../components/Modal'

export default function OperationsDashboard() {
  const { showToast } = useToast()
  const { cases, documents, reports, qaQueue, tasks, updateCase, updateTask } = usePrototypeData()
  const [reassignOwner, setReassignOwner] = useState<string | null>(null)
  const [targetOwner, setTargetOwner] = useState('')
  const teamWorkload = useMemo(() => {
    const names = Array.from(new Set([...cases.map((c) => c.owner || 'Unassigned'), ...tasks.map((t) => t.owner || 'Unassigned')]))
    return names.map((name) => {
      const caseCount = cases.filter((c) => c.owner === name && !['Completed','Cancelled','Archived'].includes(c.status)).length
      const taskCount = tasks.filter((t) => t.owner === name && !['Completed','Cancelled'].includes(t.status)).length
      return { name, cases: caseCount, tasks: taskCount, load: caseCount + taskCount }
    }).sort((a,b) => b.load-a.load)
  }, [cases, tasks])
  const ownerOptions = Array.from(new Set([...teamWorkload.map((m) => m.name), 'Operations Team'])).filter(Boolean)
  const maxLoad = Math.max(1, ...teamWorkload.map((t) => t.load))
  const activeCases = cases.filter((c) => c.status !== 'Completed')
  const unassignedCases = activeCases.filter((c) => c.owner === 'Unassigned')
  const summaryCards = [
    { label: 'Active cases', value: activeCases.length, sub: 'Across all clients and doctors', icon: FolderKanban, link: '/cases' },
    { label: 'Overdue cases', value: activeCases.filter((c) => /Aug 2026|Jul 2026/.test(c.targetDate)).length, sub: 'Past target completion date', icon: AlertTriangle, link: '/cases' },
    { label: 'Unassigned', value: unassignedCases.length, sub: 'Require a case owner', icon: UserX, link: '/cases' },
    { label: 'Awaiting documents', value: activeCases.filter((c) => documents.filter((d) => d.caseRef === c.ref).length === 0).length, sub: 'No case documents received', icon: Clock, link: '/documents' },
    { label: 'Awaiting reports', value: activeCases.filter((c) => ['File Preparation in Progress','Report in Progress'].includes(c.status) && !reports.some((r) => r.caseRef === c.ref && r.status !== 'Delivered')).length, sub: 'Report workflow needs attention', icon: FileClock, link: '/reports' },
    { label: 'QA backlog', value: qaQueue.filter((q) => !['Approved'].includes(q.status)).length, sub: 'Awaiting or in review', icon: ShieldAlert, link: '/quality-assurance' },
  ]
  const statusOrder = ['New Booking','Information Required','Appointment Scheduled','File Preparation in Progress','Report in Progress','QA Review','Amendments Required','Report Delivered','Completed']
  const casesByStatus = statusOrder.map((label) => ({ label, value: cases.filter((c) => c.status === label).length })).filter((item) => item.value > 0)
  const upcomingDeadlines = [...activeCases].slice(0, 5).map((c) => ({ ...c, note: c.status === 'Information Required' ? 'Resolve missing information' : c.status === 'Appointment Scheduled' ? 'Complete appointment workflow' : c.status === 'File Preparation in Progress' ? 'Prepare case file' : c.status === 'Report in Progress' ? 'Complete report' : c.status === 'QA Review' ? 'Complete QA review' : 'Continue case workflow' }))
  const operationalAlerts = activeCases.filter((c) => c.status === 'Information Required' || c.priority === 'Urgent').slice(0, 4).map((c) => ({ id: `alert-${c.ref}`, caseRef: c.ref, level: c.priority === 'Urgent' ? 'danger' : 'warning', title: c.priority === 'Urgent' ? `Urgent case: ${c.ref}` : `Information required: ${c.ref}`, detail: `${c.patient} · ${c.doctor} · ${c.status}` }))

  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Operational overview across all cases" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((c) => (
          <Link
            to={c.link}
            key={c.label}
            className="summary-card-interactive group bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{c.label}</p>
              <span className="summary-card-icon"><c.icon size={16} /></span>
            </div>
            <p className="summary-card-value text-2xl font-semibold text-slate-900 mb-1">{c.value}</p>
            <p className="text-xs text-slate-500 mb-2">{c.sub}</p>
            <span className="summary-card-link text-xs text-brand-600 font-medium">Open list <span aria-hidden="true">→</span></span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Cases by status</p>
          <p className="text-xs text-slate-500 mb-4">Current distribution of the caseload</p>
          <div className="space-y-3">
            {casesByStatus.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-40 text-xs text-slate-600 shrink-0">{s.label}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full"
                    style={{ width: `${(s.value / Math.max(1, ...casesByStatus.map((x) => x.value))) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-xs text-slate-500 text-right">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Workload by team member</p>
            <Link to="/tasks?view=team" className="text-xs text-brand-600 font-medium">Team workload</Link>
          </div>
          <p className="text-xs text-slate-500 mb-4">Active cases and open tasks per owner</p>
          <div className="space-y-4">
            {teamWorkload.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                  {m.name === 'Unassigned' ? 'U' : m.name.split(' ').map((p) => p[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{m.name}</span>
                    <span className="text-xs text-slate-400">{m.cases} cases · {m.tasks} tasks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-teal-400 rounded-full"
                        style={{ width: `${(m.load / maxLoad) * 100}%` }}
                      />
                    </div>
                    <button
                      onClick={() => { setReassignOwner(m.name); setTargetOwner(ownerOptions.find((name) => name !== m.name) ?? '') }}
                      className="shrink-0 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      Reassign work
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Operational alerts</p>
          <p className="text-xs text-slate-500 mb-4">Items that need an escalation decision</p>
          <div className="space-y-2.5">
            {operationalAlerts.map((a) => (
              <div
                key={a.id}
                className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                  a.level === 'danger' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
                }`}
              >
                <div className="flex items-start gap-2">
                  {a.level === 'danger' ? (
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${a.level === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>
                      {a.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${a.level === 'danger' ? 'text-red-600/80' : 'text-amber-700/80'}`}>
                      {a.detail}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/cases/${a.caseRef}`}
                  className="shrink-0 text-xs font-medium border border-slate-200 bg-white rounded-lg px-3 py-1.5 hover:bg-slate-50"
                >
                  Open case
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Upcoming deadlines</p>
            <Link to="/cases" className="text-xs text-brand-600 font-medium">View all cases</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Nearest target completion dates</p>
          <div className="divide-y divide-slate-100">
            {upcomingDeadlines.map((d) => (
              <Link
                to={`/cases/${d.ref}`}
                key={d.ref}
                className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {d.ref} · {d.patient} <StatusBadge status={d.status} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.client} · Doctor {d.doctor} · Owner {d.owner}</p>
                  <p className="text-xs text-slate-400">Target {d.targetDate} · {d.note}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {unassignedCases.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Unassigned cases</p>
          <p className="text-xs text-slate-500 mb-3">Assign an owner before work can progress</p>
          <div className="divide-y divide-slate-100">
            {unassignedCases.map((c) => (
              <div key={c.ref} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {c.ref} · {c.patient} <PriorityBadge priority={c.priority} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.client} · {c.caseType} · Target {c.targetDate}</p>
                </div>
                <button
                  onClick={() => { updateCase(c.ref, (current) => ({ ...current, owner: 'Operations Team', lastUpdated: 'Just now' })); showToast(`${c.ref} assigned to Operations Team.`) }}
                  className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
                >
                  Assign owner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {reassignOwner && <Modal title="Reassign next work item" description={`Move one active case or open task from ${reassignOwner} to another owner.`} onClose={() => setReassignOwner(null)}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">New owner</label>
            <select value={targetOwner} onChange={(event) => setTargetOwner(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
              <option value="">Select owner</option>
              {ownerOptions.filter((name) => name !== reassignOwner).map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <p className="text-xs leading-5 text-slate-500">The oldest available active case is reassigned first. If there is no case, the next open task is reassigned. This keeps ownership changes explicit instead of silently moving an entire workload.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setReassignOwner(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button disabled={!targetOwner} onClick={() => {
              if (!targetOwner) return
              const sourceCase = cases.find((c) => c.owner === reassignOwner && !['Completed','Cancelled','Archived'].includes(c.status))
              if (sourceCase) {
                updateCase(sourceCase.ref, (current) => ({ ...current, owner: targetOwner, lastUpdated: 'Just now' }))
                showToast(`${sourceCase.ref} reassigned to ${targetOwner}.`)
              } else {
                const sourceTask = tasks.find((t) => t.owner === reassignOwner && !['Completed','Cancelled'].includes(t.status))
                if (sourceTask) { updateTask(sourceTask.id, (current) => ({ ...current, owner: targetOwner })); showToast(`${sourceTask.title} reassigned to ${targetOwner}.`) }
                else showToast(`No active work remains for ${reassignOwner}.`)
              }
              setReassignOwner(null)
            }} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">Confirm reassignment</button>
          </div>
        </div>
      </Modal>}
    </div>
  )
}
