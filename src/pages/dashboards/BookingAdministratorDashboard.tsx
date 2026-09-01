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
import { useToast } from '../../context/ToastContext'
import WelcomeBanner from '../../components/WelcomeBanner'

const summaryCards = [
  { label: 'New bookings', value: 1, sub: 'Received in the last 24 hours', icon: Inbox, link: '/bookings' },
  { label: 'Awaiting information', value: 1, sub: 'Chase client before scheduling', icon: Clock, link: '/bookings' },
  { label: 'To be scheduled', value: 1, sub: '1 urgent with court deadline', icon: CalendarClock, link: '/bookings' },
  { label: 'Appointments today', value: 2, sub: '1 requires an interpreter', icon: CalendarDays, link: '/calendar' },
  { label: 'Missing documents', value: 4, sub: 'Cases with outstanding records', icon: FileWarning, link: '/documents' },
  { label: 'Overdue tasks', value: 3, sub: 'Assigned to you or your team', icon: AlertTriangle, link: '/tasks' },
]

const appointmentsToday = [
  {
    time: '11:00',
    patient: 'Sofia Marchetti',
    status: 'Scheduled',
    type: 'Initial examination',
    doctor: 'Dr Amara Osei',
    location: 'Manchester Clinic — Room 2',
    note: 'Interpreter: Italian — Lingua Partners',
    ref: 'EM-2026-1196',
  },
  {
    time: '14:00',
    patient: 'Grace Adeyemi',
    status: 'Scheduled',
    type: 'Initial examination',
    doctor: 'Dr Helena Vasquez',
    location: 'Birmingham Clinic — Room 3',
    note: 'Chaperone required — vulnerable adult',
    ref: 'EM-2026-1171',
  },
]

const quickActions = [
  { label: 'Create booking', icon: PlusSquare },
  { label: 'Schedule appointment', icon: CalendarPlus },
  { label: 'Upload document', icon: UploadCloud },
  { label: 'Add communication', icon: MessageSquarePlus },
  { label: 'Create task', icon: ClipboardEdit },
]

const bookingsRequiringAction = [
  { ref: 'BK-2026-0515', patient: 'Peter Häkkinen', tag: 'New', tagTone: 'neutral', client: 'Northbridge Insurance', caseType: 'Orthopaedic Surgery', note: 'Missing: Client reference', priority: 'Standard' },
  { ref: 'BK-2026-0512', patient: 'Callum Reid', tag: 'Awaiting information', tagTone: 'warning', client: 'Calder Legal Group', caseType: 'Pain Management', note: 'Missing: GP records, Date of accident confirmation', priority: 'Standard' },
  { ref: 'BK-2026-0514', patient: 'Grace Adeyemi', tag: 'Awaiting scheduling', tagTone: 'info', client: 'Harrow & Vale Solicitors', caseType: 'Neurology', note: 'Requested completion 21 Aug 2026', priority: 'Urgent' },
]

const overdueTasks = [
  { title: 'Schedule neurology appointment before court deadline', tag: 'Urgent', tagTone: 'critical', ref: 'EM-2026-1171', owner: 'Hannah Whitfield', note: 'Scheduling', due: 'Yesterday' },
  { title: 'Reschedule Reid telephone assessment', tag: 'Standard', tagTone: 'neutral', ref: 'EM-2026-1139', owner: 'Marcus Bell', note: 'Rescheduling', due: '3 days overdue' },
  { title: 'Assign case owner for EM-2026-1198', tag: 'High', tagTone: 'warning', ref: 'EM-2026-1198', owner: 'Marcus Bell', note: 'Case administration', due: 'Today' },
]

const recentlyUpdatedCases = [
  { ref: 'EM-2026-1198', patient: 'Daniel Okafor', tag: 'New', tagTone: 'neutral', client: 'Northbridge Insurance', doctor: 'Dr Raymond Speight', note: 'Next action: Assign case owner', date: '04 Aug 2026' },
  { ref: 'EM-2026-1184', patient: 'Daniel Okafor', tag: 'Report in progress', tagTone: 'info', client: 'Harrow & Vale Solicitors', doctor: 'Dr Amara Osei', note: 'Next action: Dr Osei to submit draft report for QA', date: '04 Aug 2026' },
  { ref: 'EM-2026-1196', patient: 'Sofia Marchetti', tag: 'File preparation', tagTone: 'info', client: 'Calder Legal Group', doctor: 'Dr Amara Osei', note: 'Next action: Complete PDF bundle and mark file ready', date: '04 Aug 2026' },
  { ref: 'EM-2026-1171', patient: 'Grace Adeyemi', tag: 'Awaiting documents', tagTone: 'warning', client: 'Harrow & Vale Solicitors', doctor: 'Dr Helena Vasquez', note: 'Next action: Schedule appointment before court deadline', date: '04 Aug 2026' },
  { ref: 'EM-2026-1190', patient: 'Sofia Marchetti', tag: 'Appointment scheduled', tagTone: 'info', client: 'Northbridge Insurance', doctor: 'Dr Raymond Speight', note: 'Next action: Chase occupational health records from client', date: '03 Aug 2026' },
]

const recentCommunication = [
  { title: 'Second request: occupational health file', tag: 'email', ref: 'EM-2026-1190', people: 'Hannah Whitfield → Stephen Rowe — Northbridge Insurance', note: 'Second chase for the occupational health file and absence record ahead of the 11 August assessment.', date: '04 Aug 2026 · 08:22' },
  { title: 'Court deadline discussion', tag: 'telephone', ref: 'EM-2026-1171', people: 'Marcus Bell — Julia Kemp — Harrow & Vale Solicitors', note: 'Confirmed the 21 August court deadline. Client will send imaging today and accepts Birmingham appointment.', date: '04 Aug 2026 · 07:15' },
  { title: 'QA amendments raised — report v1', tag: 'email', ref: 'EM-2026-1152', people: 'Elaine Fitzgerald → Dr Amara Osei', note: 'Three amendments raised, one high severity relating to the causation section.', date: '02 Aug 2026 · 15:12' },
  { title: 'Bundle v3 ready', tag: 'Internal only', ref: 'EM-2026-1184', people: 'Priya Nandra → Case team', note: 'Duplicate GP entries removed and index regenerated. Bundle v3 is with Dr Osei for report preparation.', date: '01 Aug 2026 · 11:15' },
]

const pillTones: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-blue-50 text-blue-700',
  critical: 'bg-red-50 text-red-700',
}

function Pill({ label, tone = 'neutral' }: { label: string; tone?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${pillTones[tone] ?? pillTones.neutral}`}>
      {label}
    </span>
  )
}

const quickActionRoutes: Record<string, string> = {
  'Create booking': '/bookings',
  'Schedule appointment': '/calendar',
  'Upload document': '/documents',
  'Add communication': '/communication',
  'Create task': '/tasks',
}

export default function BookingAdministratorDashboard() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Here's what needs your attention today" />
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

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Appointments today</p>
            <Link to="/calendar" className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
              Open calendar
            </Link>
          </div>
          <p className="text-xs text-slate-500 mb-4">2 appointments across all clinics</p>
          <div className="divide-y divide-slate-100">
            {appointmentsToday.map((a) => (
              <Link
                to={`/cases/${a.ref}`}
                key={a.ref}
                className="flex items-start justify-between gap-3 py-3 -mx-2 px-2 rounded-md hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {a.time} · {a.patient} <Pill label={a.status} tone="info" />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.type} · {a.doctor} · {a.location}</p>
                  <p className="text-xs text-slate-400">{a.note}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{a.ref}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Quick actions</p>
          <p className="text-xs text-slate-500 mb-4">Common administrative tasks</p>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(quickActionRoutes[a.label] ?? '/dashboard')}
                className="w-full flex items-center gap-2.5 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5 hover:bg-slate-50 text-left"
              >
                <a.icon size={16} className="text-brand-600" />
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
          <p className="text-xs text-slate-500 mb-3">New bookings, missing information, and unscheduled appointments</p>
          <div className="divide-y divide-slate-100">
            {bookingsRequiringAction.map((b) => (
              <Link
                to="/bookings"
                key={b.ref}
                className="flex items-center justify-between py-2.5 -mx-2 px-2 rounded-md hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {b.ref} · {b.patient} <Pill label={b.tag} tone={b.tagTone} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.client} · {b.caseType}</p>
                  <p className="text-xs text-slate-400">{b.note}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{b.priority}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Overdue administrative tasks</p>
            <Link to="/tasks" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Tasks past their due date</p>
          <div className="divide-y divide-slate-100">
            {overdueTasks.map((t) => (
              <Link
                to="/tasks"
                key={t.ref}
                className="flex items-center justify-between py-2.5 -mx-2 px-2 rounded-md hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {t.title} <Pill label={t.tag} tone={t.tagTone} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.ref} · {t.owner}</p>
                  <p className="text-xs text-slate-400">{t.note}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{t.due}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Recently updated cases</p>
            <Link to="/cases" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Cases you or your team touched most recently</p>
          <div className="divide-y divide-slate-100">
            {recentlyUpdatedCases.map((c) => (
              <Link
                to={`/cases/${c.ref}`}
                key={c.ref}
                className="flex items-center justify-between py-2.5 -mx-2 px-2 rounded-md hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {c.ref} · {c.patient} <Pill label={c.tag} tone={c.tagTone} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.client} · {c.doctor}</p>
                  <p className="text-xs text-slate-400">{c.note}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{c.date}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Recent communication</p>
            <Link to="/communication" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Latest recorded contact across your cases</p>
          <div className="divide-y divide-slate-100">
            {recentCommunication.map((c) => (
              <Link
                to="/communication"
                key={c.title}
                className="flex items-center justify-between py-2.5 -mx-2 px-2 rounded-md hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {c.title} <Pill label={c.tag} tone={c.tag === 'Internal only' ? 'neutral' : 'info'} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.ref} · {c.people}</p>
                  <p className="text-xs text-slate-400">{c.note}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">{c.date}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
