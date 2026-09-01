const styles: Record<string, string> = {
  Low: 'text-slate-500',
  Standard: 'text-slate-600',
  High: 'text-amber-600 font-medium',
  Urgent: 'text-red-600 font-medium',
}

export default function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`text-xs ${styles[priority] ?? 'text-slate-500'}`}>{priority}</span>
}
