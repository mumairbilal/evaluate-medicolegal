import { Link } from 'react-router-dom'
import { Inbox, FolderKanban, CheckCircle2, Clock, AlertTriangle, CalendarCheck, ShieldAlert } from 'lucide-react'
import { cases, bookings, teamWorkload, clients, doctors } from '../../data/mockData'
import WelcomeBanner from '../../components/WelcomeBanner'

const summaryCards = [
  { label: 'Total bookings', value: bookings.length, sub: 'Last 30 days', icon: Inbox, link: '/bookings' },
  { label: 'Active cases', value: cases.filter((c) => c.status !== 'Completed').length, sub: 'Currently open', icon: FolderKanban, link: '/cases' },
  { label: 'Completed cases', value: cases.filter((c) => c.status === 'Completed').length, sub: 'Delivered to clients', icon: CheckCircle2, link: '/cases' },
  { label: 'Avg. turnaround', value: '18 days', sub: 'Booking to report delivery', icon: Clock, link: '/analytics' },
  { label: 'Overdue cases', value: 0, sub: 'Past target completion date', icon: AlertTriangle, link: '/cases' },
  { label: 'Appointments completed', value: '92%', sub: 'Attended vs scheduled', icon: CalendarCheck, link: '/calendar' },
  { label: 'Reports awaiting QA', value: 2, sub: 'Submitted, not yet reviewed', icon: ShieldAlert, link: '/quality-assurance' },
]

const caseVolumeTrend = [
  { label: 'Apr', value: 12 },
  { label: 'May', value: 16 },
  { label: 'Jun', value: 15 },
  { label: 'Jul', value: 19 },
  { label: 'Aug', value: cases.length + 14 },
]

const clientPerformance = [...clients]
  .sort((a, b) => b.completedCases - a.completedCases)
  .slice(0, 5)

const doctorPerformance = [...doctors]
  .sort((a, b) => b.activeCases - a.activeCases)
  .slice(0, 5)

export default function ManagementDashboard() {
  const maxTrend = Math.max(...caseVolumeTrend.map((t) => t.value), 1)
  const maxLoad = Math.max(...teamWorkload.map((t) => t.load), 1)

  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Organisation-wide performance" />
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
          <p className="font-semibold text-slate-900">Case volume trends</p>
          <p className="text-xs text-slate-500 mb-4">New cases created per month</p>
          <div className="flex items-end gap-3 h-36">
            {caseVolumeTrend.map((t) => (
              <div key={t.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-teal-400 rounded-t-md" style={{ height: `${(t.value / maxTrend) * 100}%` }} />
                <span className="text-xs text-slate-500">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Workload distribution</p>
            <Link to="/analytics" className="text-xs text-brand-600 font-medium">Full analytics</Link>
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
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full" style={{ width: `${(m.load / maxLoad) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Client performance</p>
            <Link to="/clients" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Ranked by completed cases</p>
          <div className="divide-y divide-slate-100">
            {clientPerformance.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.type}</p>
                </div>
                <span className="text-xs text-slate-500">{c.activeCases} active · {c.completedCases} completed</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Doctor performance</p>
            <Link to="/doctors" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Ranked by active caseload</p>
          <div className="divide-y divide-slate-100">
            {doctorPerformance.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.speciality}</p>
                </div>
                <span className="text-xs text-slate-500">{d.activeCases} cases · {d.reportsInProgress} reports</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
