import { Link } from 'react-router-dom'
import {
  CalendarClock,
  CalendarDays,
  FolderKanban,
  FileText,
  FileClock,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { cases, appointments } from '../../data/mockData'
import StatusBadge from '../../components/StatusBadge'
import WelcomeBanner from '../../components/WelcomeBanner'

const summaryCards = [
  { label: 'Appointments today', value: 1, sub: 'Manchester Clinic', icon: CalendarClock, link: '/calendar' },
  { label: 'Upcoming', value: 1, sub: 'Next 14 days', icon: CalendarDays, link: '/calendar' },
  { label: 'Assigned cases', value: 3, sub: 'Active instructions', icon: FolderKanban, link: '/cases' },
  { label: 'Files ready to review', value: 2, sub: 'Prepared bundles awaiting you', icon: FileText, link: '/documents' },
  { label: 'Reports in progress', value: 1, sub: 'Drafts not yet submitted', icon: FileClock, link: '/reports' },
  { label: 'QA amendments', value: 1, sub: 'Comments awaiting your response', icon: ShieldAlert, link: '/reports', danger: true },
  { label: 'Awaiting approval', value: 1, sub: 'Reports pending your final sign-off', icon: CheckCircle2, link: '/reports' },
]

export default function MedicalExpertDashboard() {
  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Your assigned cases and appointments" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((c) => (
          <Link
            to={c.link}
            key={c.label}
            className={`summary-card-interactive group bg-white rounded-xl border p-4 ${
              c.danger ? 'summary-card-danger border-red-200' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{c.label}</p>
              <span className={`summary-card-icon ${c.danger ? 'text-red-500 bg-red-50' : ''}`}><c.icon size={16} /></span>
            </div>
            <p className="summary-card-value text-2xl font-semibold text-slate-900 mb-1">{c.value}</p>
            <p className="text-xs text-slate-500 mb-2">{c.sub}</p>
            <span className="summary-card-link text-xs text-brand-600 font-medium flex items-center gap-1">
              Open list <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-900">Your clinic today</p>
              <p className="text-xs text-slate-500">1 appointments · 04/08/2026</p>
            </div>
            <Link to="/calendar" className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
              Open calendar
            </Link>
          </div>
          {appointments.slice(0, 1).map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {a.time} · {a.patient} <StatusBadge status={a.status} />
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{a.type} · {a.location}</p>
              </div>
              <span className="text-xs text-slate-400">{a.caseRef}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Upcoming appointments</p>
          <p className="text-xs text-slate-500 mb-4">Your next scheduled examinations</p>
          {appointments.slice(1, 2).map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{a.date} · {a.time} <StatusBadge status={a.status} /></p>
                <p className="text-xs text-slate-500 mt-0.5">{a.patient} · {a.type}</p>
                <p className="text-xs text-slate-400">{a.location}</p>
              </div>
              <span className="text-xs text-slate-400">In 3 days</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-900">Your cases</p>
            <Link to="/cases" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Assigned instructions and their current stage</p>
          <div className="divide-y divide-slate-100">
            {cases.slice(0, 3).map((c) => (
              <Link to={`/cases/${c.ref}`} key={c.ref} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-md">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {c.ref} · {c.patient} <StatusBadge status={c.status} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.client} · {c.caseType}</p>
                </div>
                <span className="text-xs text-slate-400">Target {c.targetDate}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900 mb-1">Action required</p>
          <p className="text-xs text-slate-500 mb-3">Items waiting on you</p>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
            <p className="text-sm font-medium text-red-700">Review QA comments on Hakkinen report</p>
            <p className="text-xs text-red-600/80 mt-0.5">Three amendments raised by E. Fitzgerald, one high severity.</p>
            <p className="text-xs text-red-500 mt-1">Due 06 Aug 2026 · In 2 days</p>
          </div>
          <p className="text-xs text-slate-400">No reports are awaiting your approval.</p>

          <p className="font-semibold text-slate-900 mt-4 mb-1">Files ready for review</p>
          <p className="text-xs text-slate-500 mb-3">Prepared bundles and drafts</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Prepared bundle v3.pdf</p>
                <p className="text-xs text-slate-400">EM-2026-1184 · 148 pages · v3</p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">sensitive</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Report draft v1 — Hakkinen.docx</p>
                <p className="text-xs text-slate-400">EM-2026-1152 · 22 pages · v1</p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">sensitive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
