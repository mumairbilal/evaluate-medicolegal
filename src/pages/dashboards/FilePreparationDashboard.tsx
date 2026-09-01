import { Link } from 'react-router-dom'
import { FolderOpen, Upload, AlertTriangle, FileCheck2, PackageCheck, Clock } from 'lucide-react'
import { cases, documents, tasks } from '../../data/mockData'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { useToast } from '../../context/ToastContext'
import WelcomeBanner from '../../components/WelcomeBanner'

const awaitingPrep = cases.filter((c) => c.status === 'File Preparation')
const missingDocs = documents.filter((d) => d.status === 'Not Started')
const readyForReview = documents.filter((d) => d.status === 'Review Required')
const preparedBundles = documents.filter((d) => d.category === 'Prepared Bundle')
const overdueTasks = tasks.filter((t) => t.status !== 'Completed')

const summaryCards = [
  { label: 'Awaiting file preparation', value: awaitingPrep.length, sub: 'Cases assigned to you', icon: FolderOpen, link: '/cases' },
  { label: 'Recently uploaded', value: documents.length, sub: 'Documents added this week', icon: Upload, link: '/documents' },
  { label: 'Missing documents', value: missingDocs.length, sub: 'Issues to resolve with client', icon: AlertTriangle, link: '/documents' },
  { label: 'Files ready for review', value: readyForReview.length, sub: 'Awaiting doctor sign-off', icon: FileCheck2, link: '/documents' },
  { label: 'Prepared bundles', value: preparedBundles.length, sub: 'Awaiting confirmation', icon: PackageCheck, link: '/documents' },
  { label: 'Preparation tasks', value: overdueTasks.length, sub: 'Open or overdue', icon: Clock, link: '/tasks' },
]

export default function FilePreparationDashboard() {
  const { showToast } = useToast()
  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Your file preparation queue" />
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
            <p className="font-semibold text-slate-900">Cases awaiting file preparation</p>
            <Link to="/cases" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Bundles to compile or complete</p>
          <div className="divide-y divide-slate-100">
            {awaitingPrep.map((c) => (
              <Link
                to={`/cases/${c.ref}`}
                key={c.ref}
                className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {c.ref} · {c.patient} <PriorityBadge priority={c.priority} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.client} · {c.documents} documents</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0 ml-2">Target {c.targetDate}</span>
              </Link>
            ))}
            {awaitingPrep.length === 0 && (
              <p className="text-sm text-slate-400 py-3">No cases currently awaiting file preparation.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-slate-900">Recently uploaded documents</p>
            <Link to="/documents" className="text-xs text-brand-600 font-medium">View all</Link>
          </div>
          <p className="text-xs text-slate-500 mb-3">Latest documents added across your cases</p>
          <div className="divide-y divide-slate-100">
            {documents.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.caseRef} · {d.patient} · {d.uploadDate}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Missing document issues</p>
          <p className="text-xs text-slate-500 mb-3">Outstanding records to chase from clients</p>
          <div className="divide-y divide-slate-100">
            {missingDocs.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.caseRef} · {d.patient}</p>
                </div>
                <button
                  onClick={() => showToast(`Chase-up email sent for ${d.name} (${d.caseRef}).`)}
                  className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
                >
                  Chase client
                </button>
              </div>
            ))}
            {missingDocs.length === 0 && (
              <p className="text-sm text-slate-400 py-3">No missing document issues right now.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Preparation tasks</p>
          <p className="text-xs text-slate-500 mb-3">Your open and overdue preparation work</p>
          <div className="divide-y divide-slate-100">
            {overdueTasks.map((t) => (
              <Link
                to="/tasks"
                key={t.id}
                className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {t.title} <PriorityBadge priority={t.priority} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.caseRef} · Due {t.dueDate}</p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
