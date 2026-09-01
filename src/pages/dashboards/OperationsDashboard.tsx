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
import { cases, teamWorkload, operationalAlerts } from '../../data/mockData'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { useToast } from '../../context/ToastContext'
import WelcomeBanner from '../../components/WelcomeBanner'

const summaryCards = [
  { label: 'Active cases', value: 7, sub: 'Across all clients and doctors', icon: FolderKanban, link: '/cases' },
  { label: 'Overdue cases', value: 0, sub: 'Past target completion date', icon: AlertTriangle, link: '/cases' },
  { label: 'Unassigned', value: 1, sub: 'Require a case owner', icon: UserX, link: '/cases' },
  { label: 'Awaiting documents', value: 4, sub: 'Records outstanding from clients', icon: Clock, link: '/documents' },
  { label: 'Awaiting reports', value: 1, sub: 'With the medical expert', icon: FileClock, link: '/reports' },
  { label: 'QA backlog', value: 1, sub: 'Awaiting or in review', icon: ShieldAlert, link: '/quality-assurance' },
]

const casesByStatus = [
  { label: 'New', value: 1 },
  { label: 'Awaiting documents', value: 1 },
  { label: 'Appointment scheduled', value: 1 },
  { label: 'File preparation', value: 1 },
  { label: 'Report in progress', value: 1 },
  { label: 'Quality assurance', value: 1 },
  { label: 'Complete', value: 1 },
]

const upcomingDeadlines = [
  { ref: 'EM-2026-1171', patient: 'Grace Adeyemi', status: 'Information Required', client: 'Harrow & Vale Solicitors', owner: 'Marcus Bell', target: '07 Aug 2026', note: 'Schedule appointment before court deadline', due: 'In 3 days' },
  { ref: 'EM-2026-1152', patient: 'Peter Hakkinen', status: 'Quality Assurance', client: 'Northbridge Insurance', owner: 'Marcus Bell', target: '08 Aug 2026', note: 'QA review due 08 Aug', due: 'In 4 days' },
  { ref: 'EM-2026-1196', patient: 'Sofia Marchetti', status: 'File Preparation', client: 'Calder Legal Group', owner: 'Priya Nandra', target: '12 Aug 2026', note: 'Complete PDF bundle and mark file ready', due: 'In 8 days' },
  { ref: 'EM-2026-1184', patient: 'Daniel Okafor', status: 'Report in Progress', client: 'Harrow & Vale Solicitors', owner: 'Hannah Whitfield', target: '14 Aug 2026', note: 'Dr Osei to submit draft report for QA', due: 'In 10 days' },
  { ref: 'EM-2026-1190', patient: 'Sofia Marchetti', status: 'Appointment Scheduled', client: 'Northbridge Insurance', owner: 'Hannah Whitfield', target: '29 Aug 2026', note: 'Chase occupational health records from client', due: 'In 25 days' },
]

const unassignedCases = cases.filter((c) => c.owner === 'Unassigned')

export default function OperationsDashboard() {
  const { showToast } = useToast()
  const maxLoad = Math.max(...teamWorkload.map((t) => t.load))

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
                    style={{ width: `${(s.value / Math.max(...casesByStatus.map((x) => x.value))) * 100}%` }}
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
            <Link to="/reports" className="text-xs text-brand-600 font-medium">Team workload</Link>
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
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{m.cases} cases · {m.tasks} tasks</span>
                      <button
                        onClick={() => showToast(`Reassign workload for ${m.name} isn't built in this prototype yet.`)}
                        className="text-xs text-brand-600 font-medium hover:underline"
                      >
                        Reassign
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full"
                      style={{ width: `${(m.load / maxLoad) * 100}%` }}
                    />
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
                  <p className="text-xs text-slate-500 mt-0.5">{d.client} · Owner {d.owner}</p>
                  <p className="text-xs text-slate-400">Target {d.target} · {d.note}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{d.due}</span>
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
                  onClick={() => showToast(`${c.ref} assigned to you.`)}
                  className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
                >
                  Assign owner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
