import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export default function Modal({
  title,
  description,
  onClose,
  children,
  width = 'max-w-lg',
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative w-full ${width} bg-white rounded-xl shadow-xl border border-slate-200 max-h-[88vh] flex flex-col`}>
        <div className="flex items-start justify-between px-5 py-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
