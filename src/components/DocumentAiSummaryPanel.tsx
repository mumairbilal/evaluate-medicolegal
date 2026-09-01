import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Edit3, FileWarning, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import StatusBadge from './StatusBadge'
import type { DocumentItem } from '../types'

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
const smallButton = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'

function defaultSummary(document: DocumentItem) {
  const pageCount = document.pageCount ?? 1
  return `This document contains ${pageCount} page${pageCount === 1 ? '' : 's'} of ${document.category.toLowerCase()} material for ${document.patient}. Review the source references below and verify all material facts against the original document before using this draft in case preparation.`
}

function sourceReferences(document: DocumentItem) {
  if (document.aiSourceRefs?.length) return document.aiSourceRefs
  const pageCount = document.pageCount ?? 1
  if (pageCount <= 3) return [`${document.name} · pp. 1–${pageCount}`]
  const midpoint = Math.min(pageCount, Math.max(3, Math.ceil(pageCount / 2)))
  return [`${document.name} · pp. 1–${midpoint}`, `${document.name} · pp. ${midpoint + 1}–${pageCount}`]
}

export default function DocumentAiSummaryPanel({
  document,
  onUpdate,
  onToast,
}: {
  document: DocumentItem
  onUpdate: (updater: (current: DocumentItem) => DocumentItem) => void
  onToast: (message: string) => void
}) {
  const [issueOpen, setIssueOpen] = useState(false)
  const [issueDraft, setIssueDraft] = useState(document.aiIssue ?? '')
  useEffect(() => {
    setIssueOpen(false)
    setIssueDraft(document.aiIssue ?? '')
  }, [document.id])

  const status = document.aiStatus ?? 'Not Started'
  const summary = document.aiSummary ?? ''
  const sources = sourceReferences(document)

  const runGeneration = (mode: 'generate' | 'regenerate' | 'retry') => {
    onUpdate((current) => ({
      ...current,
      aiStatus: 'Processing',
      aiError: undefined,
      aiIssue: mode === 'retry' ? current.aiIssue : undefined,
    }))
    onToast(mode === 'retry' ? 'AI processing retry started.' : mode === 'regenerate' ? 'AI summary regeneration started.' : 'AI summary generation started.')
    window.setTimeout(() => {
      onUpdate((current) => ({
        ...current,
        aiStatus: 'Review Required',
        aiSummary: `${defaultSummary(current)}${mode === 'regenerate' ? ' Regenerated draft: confirm any recent instruction or document changes before approval.' : ''}`,
        aiGeneratedAt: 'Just now',
        aiSourceRefs: sourceReferences(current),
        aiError: undefined,
      }))
      onToast('AI draft is ready for human review.')
    }, 650)
  }

  const continueManually = () => {
    onUpdate((current) => ({
      ...current,
      aiStatus: 'Review Required',
      aiSummary: current.aiSummary || `Manual summary started after AI processing failed for ${current.name}. Review the source document and complete this draft before approval.`,
      aiGeneratedAt: current.aiGeneratedAt || 'Manual recovery · Just now',
      aiSourceRefs: sourceReferences(current),
      aiError: undefined,
    }))
    onToast('Manual summary mode opened; the document remains available for review.')
  }

  const approve = () => {
    if (!summary.trim()) {
      onToast('Add or generate a summary before approving it.')
      return
    }
    onUpdate((current) => ({ ...current, aiStatus: 'Approved', aiError: undefined }))
    onToast('AI summary approved after human review.')
  }

  const submitIssue = () => {
    if (!issueDraft.trim()) {
      onToast('Describe the AI issue before submitting it.')
      return
    }
    onUpdate((current) => ({ ...current, aiIssue: issueDraft.trim(), aiStatus: current.aiStatus === 'Approved' ? 'Review Required' : current.aiStatus }))
    setIssueOpen(false)
    onToast('AI issue recorded for review.')
  }

  return (
    <div className="border-t border-slate-200 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Sparkles size={13} /> AI summary</p>
        <StatusBadge status={status} />
      </div>

      {status === 'Not Started' && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">No AI summary has been generated. The source document remains fully available for manual review.</p>
          <button className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700" onClick={() => runGeneration('generate')}><Sparkles size={13} /> Generate summary</button>
        </div>
      )}

      {status === 'Processing' && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <div className="flex items-start gap-2 text-xs text-blue-700"><Loader2 size={14} className="mt-0.5 shrink-0 animate-spin" /><div><p className="font-medium">AI processing in progress</p><p className="mt-0.5 text-blue-600">You can continue reviewing the source document while processing runs.</p></div></div>
          <button className={`${smallButton} mt-2`} onClick={continueManually}><Edit3 size={13} /> Continue manually</button>
        </div>
      )}

      {status === 'Failed' && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2 text-xs text-red-700"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><div><p className="font-medium">AI summary could not be completed</p><p className="mt-0.5 text-red-600">{document.aiError || 'Processing failed. The source document is still available and the case workflow is not blocked.'}</p></div></div>
          <div className="flex flex-wrap gap-2">
            <button className={smallButton} onClick={() => runGeneration('retry')}><RefreshCw size={13} /> Retry AI</button>
            <button className={smallButton} onClick={continueManually}><Edit3 size={13} /> Continue manually</button>
          </div>
        </div>
      )}

      {status !== 'Not Started' && status !== 'Processing' && status !== 'Failed' && (
        <div className="space-y-2">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-2 text-[11px] text-blue-700">AI-generated draft — human review required.</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
            <div><span className="text-slate-400">Generated</span><p className="mt-0.5 font-medium text-slate-600">{document.aiGeneratedAt || 'Not recorded'}</p></div>
            <div><span className="text-slate-400">AI status</span><p className="mt-0.5 font-medium text-slate-600">{status}</p></div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-medium text-slate-500">Source references</p>
            <div className="flex flex-wrap gap-1.5">{sources.map((source) => <span key={source} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{source}</span>)}</div>
          </div>
          <textarea
            className={inputClass}
            rows={5}
            value={summary}
            onChange={(event) => onUpdate((current) => ({ ...current, aiSummary: event.target.value, aiStatus: 'Review Required' }))}
            aria-label="AI-generated summary"
          />
          <div className="flex flex-wrap gap-2">
            <button className={smallButton} onClick={approve}><Check size={13} /> Approve</button>
            <button className={smallButton} onClick={() => runGeneration('regenerate')}><RefreshCw size={13} /> Regenerate</button>
            <button className={smallButton} onClick={() => { setIssueDraft(document.aiIssue ?? ''); setIssueOpen((open) => !open) }}><FileWarning size={13} /> Report issue</button>
          </div>
          {document.aiIssue && !issueOpen && <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700"><span className="font-medium">Reported issue:</span> {document.aiIssue}</div>}
        </div>
      )}

      {issueOpen && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <label className="mb-1 block text-[11px] font-medium text-slate-600">Describe the AI issue</label>
          <textarea className={inputClass} rows={3} value={issueDraft} onChange={(event) => setIssueDraft(event.target.value)} placeholder="Example: source reference is incomplete or a key fact was omitted." />
          <div className="mt-2 flex gap-2"><button className={smallButton} onClick={submitIssue}><FileWarning size={13} /> Submit issue</button><button className={smallButton} onClick={() => setIssueOpen(false)}>Cancel</button></div>
        </div>
      )}
    </div>
  )
}
