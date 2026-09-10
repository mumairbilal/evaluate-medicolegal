import { Link } from 'react-router-dom'
import { FolderOpen, Upload, AlertTriangle, FileCheck2, PackageCheck, Clock, Bot, Copy, UserCheck } from 'lucide-react'
import { usePrototypeData } from '../../context/PrototypeDataContext'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import WelcomeBanner from '../../components/WelcomeBanner'



export default function FilePreparationDashboard() {
  const { cases, documents, tasks } = usePrototypeData()
  const awaitingPrep = cases.filter((c) => ['Appointment Completed','Documents Pending','File Preparation in Progress'].includes(c.status))
  const missingDocumentCases = cases.filter((c) => c.status === 'Documents Pending' && !documents.some((d) => d.caseRef === c.ref))
  const readyForReview = documents.filter((d) => d.status === 'Review Required')
  const preparedBundles = documents.filter((d) => d.category === 'Prepared Bundle' && d.status !== 'Approved')
  const duplicateAlerts = documents.filter((d) => Boolean(d.duplicateOf))
  const aiProcessing = documents.filter((d) => ['Processing','Review Required'].includes(d.aiStatus ?? ''))
  const readyForDoctor = cases.filter((c) => c.status === 'File Ready')
  const prepCaseRefs = new Set(awaitingPrep.map((c) => c.ref))
  const preparationTasks = tasks.filter((t) => !['Completed','Cancelled'].includes(t.status) && (prepCaseRefs.has(t.caseRef) || /document|file preparation|bundle/i.test(`${t.taskType ?? ''} ${t.title}`)))
  const summaryCards = [
    { label: 'Awaiting file preparation', value: awaitingPrep.length, sub: 'Cases ready for preparation', icon: FolderOpen, link: '/documents?view=preparation' },
    { label: 'Recently uploaded', value: documents.length, sub: 'Documents in the shared library', icon: Upload, link: '/documents' },
    { label: 'Missing documents', value: missingDocumentCases.length, sub: 'Cases waiting for source records', icon: AlertTriangle, link: '/documents' },
    { label: 'Duplicate alerts', value: duplicateAlerts.length, sub: 'Potential duplicate documents', icon: Copy, link: '/documents' },
    { label: 'AI processing', value: aiProcessing.length, sub: 'Processing or review required', icon: Bot, link: '/documents' },
    { label: 'Bundles awaiting review', value: readyForReview.length, sub: 'Awaiting human review', icon: FileCheck2, link: '/documents?view=preparation' },
    { label: 'Files ready for doctor', value: readyForDoctor.length, sub: 'Ready for doctor confirmation', icon: UserCheck, link: '/documents?view=preparation' },
    { label: 'Overdue / open prep tasks', value: preparationTasks.length, sub: 'Preparation work to complete', icon: Clock, link: '/tasks' },
  ]
  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Your file preparation queue" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
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

      <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="flex items-center justify-between gap-3 flex-wrap"><div><p className="text-sm font-semibold text-slate-900">File preparation actions</p><p className="text-xs text-slate-500 mt-1">Open workspace, review documents/AI, prepare a PDF bundle and confirm the file ready state.</p></div><div className="flex flex-wrap gap-2"><Link to="/documents?view=preparation" className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50">Open preparation workspace</Link><Link to="/documents" className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50">Review documents / AI</Link><Link to="/documents?view=preparation" className="px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700">Create / confirm PDF bundle</Link></div></div></div>

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
                to={`/documents?case=${c.ref}&view=preparation`}
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
              <Link key={d.id} to={`/documents?case=${encodeURIComponent(d.caseRef)}`} className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-md">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.caseRef} · {d.patient} · {d.uploadDate}</p>
                </div>
                <div className="text-right"><StatusBadge status={d.status} /><p className="text-xs text-brand-600 mt-1">Open document →</p></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Missing document issues</p>
          <p className="text-xs text-slate-500 mb-3">Outstanding source records to chase from the instructing party</p>
          <div className="divide-y divide-slate-100">
            {missingDocumentCases.map((c) => (
              <div key={c.ref} className="flex items-center justify-between py-3 gap-3">
                <div>
                  <Link to={`/cases/${c.ref}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">{c.ref} · {c.patient}</Link>
                  <p className="text-xs text-slate-500 mt-0.5">No source documents are currently uploaded for this case.</p>
                </div>
                <Link to={`/communication?case=${c.ref}&new=1`} className="text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 shrink-0">Record chase-up</Link>
              </div>
            ))}
            {missingDocumentCases.length === 0 && (
              <p className="text-sm text-slate-400 py-3">No cases are currently blocked by missing source documents.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Preparation tasks</p>
          <p className="text-xs text-slate-500 mb-3">Your open and overdue preparation work</p>
          <div className="divide-y divide-slate-100">
            {preparationTasks.map((t) => (
              <Link
                to={`/tasks?case=${encodeURIComponent(t.caseRef)}`}
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
            {preparationTasks.length === 0 && <p className="text-sm text-slate-400 py-3">No open file-preparation tasks.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
