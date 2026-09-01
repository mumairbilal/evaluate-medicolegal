import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'

export default function ComingSoon({
  title,
  description,
  priority = 'Workflow Automation',
}: {
  title: string
  description: string
  priority?: string
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-slate-200 rounded-xl p-10 max-w-md text-center">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <Layers size={20} />
        </div>
        <span className="inline-block text-[11px] font-semibold tracking-wide text-brand-600 bg-brand-50 rounded-full px-2.5 py-1 mb-3">
          Priority: {priority}
        </span>
        <p className="font-semibold text-slate-900 mb-2">{title}</p>
        <p className="text-sm text-slate-500 mb-5">{description}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm font-medium border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
        <p className="text-xs text-slate-400 mt-5">This screen is scheduled for the {priority} phase and has not been designed yet.</p>
      </div>
    </div>
  )
}
