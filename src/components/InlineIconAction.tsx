import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Tone = 'default' | 'brand' | 'danger' | 'warning' | 'success'

type Props = {
  label: string
  icon: ReactNode
  onClick?: () => void
  to?: string
  disabled?: boolean
  tone?: Tone
  className?: string
}

const toneClass: Record<Tone, string> = {
  default: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200',
  brand: 'text-brand-600 hover:text-brand-700 hover:bg-brand-50 border-brand-100',
  danger: 'text-slate-400 hover:text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-100',
  warning: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-100',
  success: 'text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-teal-100',
}

export default function InlineIconAction({ label, icon, onClick, to, disabled = false, tone = 'default', className = '' }: Props) {
  const classes = `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${toneClass[tone]} ${className}`
  if (to) {
    return <Link to={to} aria-label={label} title={label} className={classes}>{icon}</Link>
  }
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={classes}>{icon}</button>
}
