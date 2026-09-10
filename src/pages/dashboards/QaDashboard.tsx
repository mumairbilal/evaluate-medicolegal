import { Link } from 'react-router-dom'
import { Inbox, ClipboardCheck, RotateCcw, CheckCircle2 } from 'lucide-react'
import { usePrototypeData } from '../../context/PrototypeDataContext'
import { useRole } from '../../context/RoleContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import WelcomeBanner from '../../components/WelcomeBanner'

export default function QaDashboard() {
  const { qaQueue } = usePrototypeData()
  const { role } = useRole()

  // A QA user's dashboard is their actionable queue, not every historical QA item in the system.
  const myQueue = qaQueue.filter((item) => item.reviewer === role.name || item.reviewer === 'Unassigned')
  const newRequests = myQueue.filter((item) => item.status === 'Not Started')
  const inReview = myQueue.filter((item) => item.status === 'In Review')
  const returned = qaQueue.filter((item) => item.status === 'Returned')
  const approved = qaQueue.filter((item) => item.status === 'Approved')

  const cards = [
    { label: 'New QA requests', value: newRequests.length, detail: 'Submitted reports waiting for you to start', icon: Inbox, view: 'awaiting' },
    { label: 'In review', value: inReview.length, detail: 'Reviews currently being worked', icon: ClipboardCheck, view: 'inreview' },
    { label: 'Returned', value: returned.length, detail: 'Reports awaiting doctor amendments', icon: RotateCcw, view: 'returned' },
    { label: 'Approved', value: approved.length, detail: 'QA decisions completed and recorded', icon: CheckCircle2, view: 'approved' },
  ]

  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Your quality assurance work queue" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={`/quality-assurance?view=${card.view}`} className="summary-card-interactive bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{card.label}</p><p className="text-2xl font-semibold text-slate-900 mt-2">{card.value}</p></div>
              <span className="summary-card-icon"><card.icon size={16}/></span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{card.detail}</p>
          </Link>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div><h2 className="font-semibold text-slate-900">New QA requests</h2><p className="text-xs text-slate-500 mt-1">A report appears here as soon as it is submitted to QA. Starting it moves the case into <strong>QA Review</strong>.</p></div>
          <Link to="/quality-assurance?view=awaiting" className="text-xs font-medium text-brand-600">Open QA queue</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {newRequests.map((item) => (
            <Link key={item.id} to={`/quality-assurance?case=${encodeURIComponent(item.caseRef)}&view=awaiting`} className="grid md:grid-cols-[minmax(0,1fr)_150px_130px] gap-3 items-center px-5 py-4 hover:bg-slate-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-semibold text-slate-800">{item.caseRef} · {item.patient}</p><PriorityBadge priority={item.priority}/></div>
                <p className="text-xs text-slate-500 mt-1">{item.reportType} · {item.doctor} · Submitted {item.submittedDate}</p>
              </div>
              <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Reviewer</p><p className="text-xs font-medium text-slate-700 mt-1">{item.reviewer}</p></div>
              <div className="md:text-right"><StatusBadge status={item.status}/><p className="text-xs text-slate-400 mt-1">Due {item.dueDate}</p></div>
            </Link>
          ))}
          {newRequests.length === 0 && <div className="px-5 py-10 text-center"><CheckCircle2 size={24} className="mx-auto text-teal-500 mb-2"/><p className="text-sm font-medium text-slate-700">No new QA requests</p><p className="text-xs text-slate-400 mt-1">Newly submitted draft reports will appear here automatically.</p></div>}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">In review</h2><p className="text-xs text-slate-500 mt-1">Reviews you have started but not yet decided.</p></div><Link to="/quality-assurance?view=inreview" className="text-xs font-medium text-brand-600">View all</Link></div>
          <div className="divide-y divide-slate-100 mt-3">
            {inReview.map((item) => <Link key={item.id} to={`/quality-assurance?case=${encodeURIComponent(item.caseRef)}&view=inreview`} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-800">{item.caseRef} · {item.patient}</p><p className="text-xs text-slate-500 mt-1">{item.reportType} · Due {item.dueDate}</p></div><StatusBadge status={item.status}/></Link>)}
            {inReview.length === 0 && <p className="text-sm text-slate-400 py-5">No QA reviews are currently in progress.</p>}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div><h2 className="font-semibold text-slate-900">Returned for amendments</h2><p className="text-xs text-slate-500 mt-1">These remain in history while the doctor resolves the recorded QA comments.</p></div>
          <div className="divide-y divide-slate-100 mt-3">
            {returned.slice(0, 5).map((item) => <Link key={item.id} to={`/quality-assurance?case=${encodeURIComponent(item.caseRef)}&view=returned`} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-800">{item.caseRef} · {item.patient}</p><p className="text-xs text-slate-500 mt-1">{item.doctor} · {item.reportType}</p></div><StatusBadge status={item.status}/></Link>)}
            {returned.length === 0 && <p className="text-sm text-slate-400 py-5">No reports are currently returned for amendments.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
