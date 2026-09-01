import { AlertCircle, CheckCircle2, Circle, Clock3, MinusCircle, XCircle } from 'lucide-react'

const tones = {
  neutral: 'bg-slate-100 text-slate-600',
  info: 'bg-blue-50 text-blue-700',
  positive: 'bg-teal-50 text-teal-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
  inactive: 'bg-slate-100 text-slate-500',
} as const

type Tone = keyof typeof tones
const statusTone: Record<string, Tone> = {
  'New Booking': 'neutral', New: 'neutral', 'Information Required': 'warning', 'Attention Required': 'warning', 'Appointment Scheduled': 'info', 'File Preparation': 'info',
  'Report in Progress': 'info', 'Quality Assurance': 'warning', 'Amendments Required': 'critical', 'Report Delivered': 'positive',
  'On Hold': 'inactive', Completed: 'positive', Scheduled: 'info', 'Not Started': 'neutral', Processing: 'info',
  'Review Required': 'warning', Approved: 'positive', 'In Progress': 'info', Blocked: 'critical', Failed: 'critical', Draft: 'neutral',
  'Submitted for QA': 'warning', 'In Review': 'warning', Returned: 'critical', Delivered: 'positive', Active: 'positive',
  Inactive: 'inactive', Cancelled: 'inactive', Rescheduled: 'warning', 'Did Not Attend': 'critical', 'Converted to Case': 'positive',
  Suspended: 'critical', Overdue: 'critical', Archived: 'inactive', Available: 'positive', 'Limited Availability': 'warning', 'Fully Booked': 'critical', 'On Leave': 'inactive',
}

const icons: Record<Tone, typeof Circle> = {
  neutral: Circle,
  info: Clock3,
  positive: CheckCircle2,
  warning: AlertCircle,
  critical: XCircle,
  inactive: MinusCircle,
}

export default function StatusBadge({ status }: { status: string }) {
  const tone = statusTone[status] ?? 'neutral'
  const Icon = icons[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`} title={`Status: ${status}`}>
      <Icon size={12} aria-hidden="true" />
      <span>{status}</span>
    </span>
  )
}
