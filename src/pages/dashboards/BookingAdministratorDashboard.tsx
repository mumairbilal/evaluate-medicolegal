import { Link, useNavigate } from 'react-router-dom'
import {
  Inbox,
  Clock,
  CalendarClock,
  CalendarDays,
  FileWarning,
  AlertTriangle,
  PlusSquare,
  CalendarPlus,
  UploadCloud,
  MessageSquarePlus,
  ClipboardEdit,
} from 'lucide-react'
import { usePrototypeData } from '../../context/PrototypeDataContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import WelcomeBanner from '../../components/WelcomeBanner'

const CURRENT_DIARY_DATE = '01 Sep 2026'

const quickActions = [
  { label: 'Create booking', icon: PlusSquare, route: '/bookings?new=1' },
  { label: 'Schedule appointment', icon: CalendarPlus, route: '/calendar?new=1' },
  { label: 'Upload document', icon: UploadCloud, route: '/documents?new=1' },
  { label: 'Add communication', icon: MessageSquarePlus, route: '/communication?new=1' },
  { label: 'Create task', icon: ClipboardEdit, route: '/tasks?new=1' },
]

function parseDisplayDate(value: string) {
  const parsed = new Date(value.replace(/(\d{1,2}) ([A-Za-z]{3}) (\d{4})/, '$2 $1, $3'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default function BookingAdministratorDashboard() {
  const navigate = useNavigate()
  const { bookings, cases, appointments, documents, tasks, communications } = usePrototypeData()

  const todayAppointments = appointments
    .filter((a) => a.date === CURRENT_DIARY_DATE && a.status !== 'Cancelled')
    .sort((a, b) => a.time.localeCompare(b.time))

  const awaitingInformation = bookings.filter((b) => b.status === 'Information Required' || b.missingInformation === 'Yes')
  const toSchedule = bookings.filter((b) => b.status !== 'Cancelled' && b.status !== 'Converted to Case' && b.appointmentRequired !== false && b.appointmentDate === '—')
  const missingDocumentCases = cases.filter((c) => !documents.some((d) => d.caseRef === c.ref))
  const currentDate = parseDisplayDate(CURRENT_DIARY_DATE)
  const overdueTasks = tasks.filter((t) => {
    if (['Completed', 'Cancelled'].includes(t.status)) return false
    const due = parseDisplayDate(t.dueDate)
    return Boolean(currentDate && due && due < currentDate)
  })

  const summaryCards = [
    { label: 'New bookings', value: bookings.filter((b) => b.status === 'New Booking' || b.status === 'Draft').length, sub: 'New or draft instructions', icon: Inbox, link: '/bookings' },
    { label: 'Awaiting information', value: awaitingInformation.length, sub: 'Records needing follow-up', icon: Clock, link: '/bookings' },
    { label: 'To be scheduled', value: toSchedule.length, sub: 'Appointments still to arrange', icon: CalendarClock, link: '/calendar' },
    { label: 'Appointments today', value: todayAppointments.length, sub: CURRENT_DIARY_DATE, icon: CalendarDays, link: '/calendar' },
    { label: 'Missing documents', value: missingDocumentCases.length, sub: 'Cases without uploaded documents', icon: FileWarning, link: '/documents' },
    { label: 'Overdue tasks', value: overdueTasks.length, sub: 'Open work past its due date', icon: AlertTriangle, link: '/tasks' },
  ]

  const bookingsRequiringAction = bookings
    .filter((b) => b.status !== 'Cancelled' && b.status !== 'Converted to Case' && (b.missingInformation === 'Yes' || b.appointmentDate === '—' || b.status === 'Draft'))
    .slice(0, 5)

  const recentCases = [...cases].slice(0, 5)
  const recentComms = [...communications].slice(0, 5)

  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Here's what needs your attention today" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((c) => (
          <Link to={c.link} key={c.label} className="summary-card-interactive group bg-white rounded-xl border border-slate-200 p-4">
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

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="font-semibold text-slate-900">Appointments today</p>
              <p className="text-xs text-slate-500 mt-0.5">{todayAppointments.length} appointment{todayAppointments.length === 1 ? '' : 's'} · {CURRENT_DIARY_DATE}</p>
            </div>
            <Link to="/calendar" className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Open calendar</Link>
          </div>
          <div className="divide-y divide-slate-100 mt-3">
            {todayAppointments.slice(0, 5).map((a) => (
              <Link to={`/cases/${a.caseRef}`} key={a.id} className="flex items-start justify-between gap-3 py-3 -mx-2 px-2 rounded-md hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.time} · {a.patient} <StatusBadge status={a.status} /></p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.type} · {a.doctor}</p>
                  <p className="text-xs text-slate-400">{a.location}</p>
                </div>
                <span className="text-xs text-brand-600 font-medium shrink-0">{a.caseRef} →</span>
              </Link>
            ))}
            {todayAppointments.length === 0 && <p className="text-sm text-slate-400 py-4">No appointments are scheduled for the current diary date.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Quick actions</p>
          <p className="text-xs text-slate-500 mb-4">Start the actual workflow, not just the module list</p>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <button key={a.label} onClick={() => navigate(a.route)} className="w-full flex items-center gap-2.5 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 hover:bg-slate-50 text-left">
                <a.icon size={16} className="text-slate-500" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Bookings requiring action</p>
            <Link to="/bookings" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Incomplete instructions or appointments still to arrange</p>
          <div className="divide-y divide-slate-100">
            {bookingsRequiringAction.map((b) => (
              <Link to={`/bookings/${b.ref}`} key={b.ref} className="flex items-center justify-between py-3 -mx-2 px-2 rounded-md hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{b.ref} · {b.patient} <StatusBadge status={b.status} /></p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.client || 'Direct instruction / no client'} · {b.caseType}</p>
                  <p className="text-xs text-slate-400">{b.missingInformation === 'Yes' ? 'Missing information requires follow-up' : b.appointmentDate === '—' ? 'Appointment needs scheduling' : 'Booking needs completion'}</p>
                </div>
                <PriorityBadge priority={b.priority} />
              </Link>
            ))}
            {bookingsRequiringAction.length === 0 && <p className="text-sm text-slate-400 py-3">No bookings currently require administrative action.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Overdue tasks</p>
            <Link to="/tasks" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Open tasks past the current diary date</p>
          <div className="divide-y divide-slate-100">
            {overdueTasks.slice(0, 5).map((t) => (
              <Link to={`/tasks?case=${encodeURIComponent(t.caseRef)}`} key={t.id} className="flex items-center justify-between py-3 -mx-2 px-2 rounded-md hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.caseRef} · {t.owner}</p>
                  <p className="text-xs text-slate-400">Due {t.dueDate}</p>
                </div>
                <PriorityBadge priority={t.priority} />
              </Link>
            ))}
            {overdueTasks.length === 0 && <p className="text-sm text-slate-400 py-3">No overdue tasks.</p>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Recently updated cases</p>
            <Link to="/cases" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Open a case and continue from its current workflow stage</p>
          <div className="divide-y divide-slate-100">
            {recentCases.map((c) => (
              <Link to={`/cases/${c.ref}`} key={c.ref} className="flex items-center justify-between py-2.5 -mx-2 px-2 rounded-md hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.ref} · {c.patient} <StatusBadge status={c.status} /></p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.client || 'Direct instruction / no client'} · {c.doctor}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{c.lastUpdated}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Recent communication</p>
            <Link to="/communication" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Case-linked communication with a direct route back to the work</p>
          <div className="divide-y divide-slate-100">
            {recentComms.map((item) => (
              <Link to={`/communication?case=${encodeURIComponent(item.caseRef)}`} key={item.id} className="block py-3 -mx-2 px-2 rounded-md hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.caseRef} · {item.type} · {item.from} → {item.to}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.summary}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{item.date}</span>
                </div>
              </Link>
            ))}
            {recentComms.length === 0 && <p className="text-sm text-slate-400 py-3">No communication records yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
