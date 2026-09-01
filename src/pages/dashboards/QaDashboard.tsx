import { Link } from 'react-router-dom'
import { ShieldAlert, AlertTriangle, Clock, RotateCcw, RefreshCw, CheckCircle2 } from 'lucide-react'
import { qaQueue } from '../../data/mockData'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import WelcomeBanner from '../../components/WelcomeBanner'

const awaitingReview = qaQueue.filter((q) => q.status === 'Not Started')
const highPriority = qaQueue.filter((q) => q.priority === 'High' || q.priority === 'Urgent')
const returned = qaQueue.filter((q) => q.status === 'Returned')
const inReview = qaQueue.filter((q) => q.status === 'In Review')
const approved = qaQueue.filter((q) => q.status === 'Approved')

const summaryCards = [
  { label: 'Awaiting review', value: awaitingReview.length, sub: 'Not yet started', icon: ShieldAlert, link: '/quality-assurance' },
  { label: 'High priority', value: highPriority.length, sub: 'Urgent or high priority reviews', icon: AlertTriangle, link: '/quality-assurance' },
  { label: 'Near deadline', value: qaQueue.filter((q) => q.dueDate !== '—').length, sub: 'Due within 7 days', icon: Clock, link: '/quality-assurance' },
  { label: 'Returned for amendment', value: returned.length, sub: 'Sent back to the doctor', icon: RotateCcw, link: '/quality-assurance' },
  { label: 'Resubmitted', value: inReview.length, sub: 'Back in your queue', icon: RefreshCw, link: '/quality-assurance' },
  { label: 'Recently approved', value: approved.length, sub: 'Cleared for delivery', icon: CheckCircle2, link: '/quality-assurance' },
]

export default function QaDashboard() {
  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Your quality assurance queue" />
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
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Reports awaiting review</p>
            <Link to="/quality-assurance" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Your review queue, ordered by due date</p>
          <div className="divide-y divide-slate-100">
            {qaQueue.map((q) => (
              <Link
                to={`/cases/${q.caseRef}`}
                key={q.id}
                className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {q.caseRef} · {q.patient} <PriorityBadge priority={q.priority} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{q.doctor} · {q.reportType}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <StatusBadge status={q.status} />
                  <p className="text-xs text-slate-400 mt-1">Due {q.dueDate}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Returned for amendment</p>
          <p className="text-xs text-slate-500 mb-3">Reports sent back and awaiting resubmission</p>
          <div className="divide-y divide-slate-100">
            {returned.map((q) => (
              <div key={q.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{q.caseRef} · {q.patient}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{q.doctor} · Submitted {q.submittedDate}</p>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
            {returned.length === 0 && (
              <p className="text-sm text-slate-400 py-3">No reports currently returned for amendment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
