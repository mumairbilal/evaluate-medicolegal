import { AlertTriangle, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function DeleteRecordModal({
  title,
  recordName,
  impact,
  blockedReason,
  confirmLabel = 'Delete permanently',
  reasonLabel = 'Reason for removal',
  onClose,
  onConfirm,
}: {
  title: string
  recordName: string
  impact: string
  blockedReason?: string
  confirmLabel?: string
  reasonLabel?: string
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const blocked = Boolean(blockedReason)
  const canConfirm = !blocked && reason.trim().length >= 3

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink-900/45 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${blocked ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
              <Trash2 size={17} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              <p className="mt-0.5 break-words text-xs text-slate-500">{recordName}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className={`flex items-start gap-3 rounded-lg border p-3 ${blocked ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
            <AlertTriangle size={17} className={`mt-0.5 shrink-0 ${blocked ? 'text-amber-600' : 'text-red-600'}`} />
            <div>
              <p className={`text-sm font-medium ${blocked ? 'text-amber-900' : 'text-red-800'}`}>{blocked ? 'Removal is currently restricted' : 'This is a destructive action'}</p>
              <p className={`mt-1 text-xs leading-5 ${blocked ? 'text-amber-800' : 'text-red-700'}`}>{blockedReason ?? impact}</p>
            </div>
          </div>

          {!blocked && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">{reasonLabel} *</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/10"
                placeholder="Briefly explain why this record should be removed…"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-slate-400">A reason is required for the prototype audit-style confirmation.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">{blocked ? 'Close' : 'Cancel'}</button>
          {!blocked && (
            <button
              onClick={() => canConfirm && onConfirm(reason.trim())}
              disabled={!canConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} /> {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
