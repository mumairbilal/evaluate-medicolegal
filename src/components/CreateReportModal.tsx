import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import Modal from './Modal'
import { cases } from '../data/mockData'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useRole } from '../context/RoleContext'
import { useToast } from '../context/ToastContext'
import type { QaQueueItem, ReportItem } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'
const templates = ['Standard Medicolegal Report', 'Addendum Report', 'Condition & Prognosis Report', 'Records Review Report']

function defaultContent(caseRef: string, patient: string, doctor: string, reportType: string) {
  return `MEDICOLEGAL REPORT\n\nCase: ${caseRef}\nPatient: ${patient}\nMedical expert: ${doctor}\nReport type: ${reportType}\n\n1. Instructions\nSummarise the instruction and questions to be addressed.\n\n2. Documents reviewed\nConfirm the source material relied upon.\n\n3. History and examination\nEnter the relevant history, findings and chronology.\n\n4. Opinion\nSet out the expert opinion, causation and prognosis.\n\n5. Declaration\nComplete the required declaration before final approval.`
}

export default function CreateReportModal({ onClose, defaultCaseRef = '' }: { onClose: () => void; defaultCaseRef?: string }) {
  const { reports, documents, addReport, addQaItem } = usePrototypeData()
  const { role } = useRole()
  const { showToast } = useToast()
  const [step, setStep] = useState(1)
  const [caseRef, setCaseRef] = useState(defaultCaseRef || cases[0]?.ref || '')
  const selectedCase = cases.find((item) => item.ref === caseRef) ?? cases[0]
  const [template, setTemplate] = useState(templates[0])
  const [reportType, setReportType] = useState('Medicolegal Report')
  const [content, setContent] = useState(() => selectedCase ? defaultContent(selectedCase.ref, selectedCase.patient, selectedCase.doctor, 'Medicolegal Report') : '')
  const [error, setError] = useState('')
  const [bundleConfirmed, setBundleConfirmed] = useState(false)

  const sourceDocs = useMemo(() => documents.filter((doc) => doc.caseRef === caseRef), [documents, caseRef])
  const duplicate = reports.find((report) => report.caseRef === caseRef && report.reportType === reportType && report.status !== 'Delivered')

  const selectCase = (value: string) => {
    setCaseRef(value)
    const nextCase = cases.find((item) => item.ref === value)
    if (nextCase) setContent(defaultContent(nextCase.ref, nextCase.patient, nextCase.doctor, reportType))
    setError('')
  }

  const create = (submitForQa: boolean) => {
    if (!selectedCase) return
    if (!bundleConfirmed) { setError('Confirm the prepared document bundle/source documents before creating the report.'); setStep(4); return }
    if (!content.trim()) {
      setError('Report content cannot be empty.')
      setStep(3)
      return
    }
    if (duplicate) {
      setError(`An active ${reportType.toLowerCase()} already exists for ${caseRef}. Open the existing report instead of creating a duplicate.`)
      setStep(1)
      return
    }
    const id = `R-${Date.now()}`
    const now = 'Just now'
    const report: ReportItem = {
      id,
      caseRef: selectedCase.ref,
      patient: selectedCase.patient,
      doctor: selectedCase.doctor,
      reportType,
      version: 'v1',
      status: submitForQa ? 'Submitted for QA' : 'Draft',
      qaStatus: submitForQa ? 'In Review' : 'Not Started',
      dueDate: selectedCase.targetDate,
      lastUpdated: now,
      assignedUser: selectedCase.doctor,
      template,
      content: content.trim(),
      saveStatus: 'Saved',
      sourceDocumentIds: sourceDocs.map((doc) => doc.id),
      comments: [],
      versions: [{
        version: 'v1',
        date: now,
        author: role.name,
        status: submitForQa ? 'Submitted for QA' : 'Draft',
        changeSummary: submitForQa ? 'Initial version submitted for QA' : 'Initial draft created',
        qaOutcome: submitForQa ? 'Awaiting QA review' : 'Not submitted',
        content: content.trim(),
      }],
    }
    addReport(report)
    if (submitForQa) {
      const qa: QaQueueItem = {
        id: `QA-${Date.now()}`,
        reportId: id,
        caseRef: report.caseRef,
        patient: report.patient,
        doctor: report.doctor,
        reportType: report.reportType,
        submittedDate: 'Just now',
        dueDate: report.dueDate,
        priority: selectedCase.priority,
        reviewer: 'Unassigned',
        status: 'Not Started',
      }
      addQaItem(qa)
    }
    showToast(submitForQa ? `Report created and submitted to QA for ${caseRef}.` : `Draft report created for ${caseRef}.`)
    onClose()
  }

  const steps = ['Case & template', 'Auto-populated details', 'Report content', 'Review']

  return (
    <Modal title="Create report" description="Create a report from a case, review populated information, then save or submit it." onClose={onClose} width="max-w-4xl">
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {steps.map((name, index) => {
          const number = index + 1
          return (
            <div key={name} className="flex items-center gap-2 shrink-0">
              <div className={`w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center ${step > number ? 'bg-teal-500 text-white' : step === number ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {step > number ? <Check size={13} /> : number}
              </div>
              <span className={`text-xs ${step === number ? 'font-medium text-slate-800' : 'text-slate-400'}`}>{name}</span>
              {number < steps.length && <div className="w-10 h-px bg-slate-200" />}
            </div>
          )
        })}
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Case *</label>
            <select className={field} value={caseRef} onChange={(e) => selectCase(e.target.value)}>
              {cases.map((item) => <option key={item.ref} value={item.ref}>{item.ref} — {item.patient}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Report template *</label>
            <select className={field} value={template} onChange={(e) => setTemplate(e.target.value)}>
              {templates.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Report type *</label>
            <select className={field} value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option>Medicolegal Report</option>
              <option>Addendum Report</option>
              <option>Condition & Prognosis Report</option>
              <option>Records Review Report</option>
            </select>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600">Duplicate protection</p>
            <p className="text-xs text-slate-500 mt-1">The prototype prevents a second active report of the same type for the selected case.</p>
          </div>
        </div>
      )}

      {step === 2 && selectedCase && (
        <div className="grid md:grid-cols-2 gap-3">
          {[
            ['Case reference', selectedCase.ref], ['Patient', selectedCase.patient], ['Client', selectedCase.client], ['Medical expert', selectedCase.doctor],
            ['Case type', selectedCase.caseType], ['Target date', selectedCase.targetDate], ['Template', template], ['Source documents', `${sourceDocs.length} linked`],
          ].map(([key, value]) => (
            <div key={key} className="rounded-lg border border-slate-200 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{key}</p>
              <p className="text-sm font-medium text-slate-700 mt-1">{value}</p>
            </div>
          ))}
          <div className="md:col-span-2 rounded-lg border border-brand-100 bg-brand-50/40 px-3 py-2 text-xs text-brand-700">
            Automatically populated information is reviewable before the report is created. Source documents are linked, not copied into the report.
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <label className={label}>Report content *</label>
          <textarea className={`${field} font-mono leading-6`} rows={18} value={content} onChange={(e) => setContent(e.target.value)} />
          <p className="text-xs text-slate-400 mt-2">Draft content remains editable until final approval.</p>
        </div>
      )}

      {step === 4 && selectedCase && (
        <div className="grid md:grid-cols-[1fr_280px] gap-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3"><FileText size={16} className="text-brand-600" /><p className="text-sm font-semibold text-slate-800">Report review</p></div>
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="text-slate-400">Case:</span> {selectedCase.ref} — {selectedCase.patient}</p>
              <p><span className="text-slate-400">Expert:</span> {selectedCase.doctor}</p>
              <p><span className="text-slate-400">Template:</span> {template}</p>
              <p><span className="text-slate-400">Source documents:</span> {sourceDocs.length}</p>
              <p><span className="text-slate-400">Content:</span> {content.trim().length.toLocaleString()} characters</p>
            </div>
            <label className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><input type="checkbox" checked={bundleConfirmed} onChange={(e)=>{setBundleConfirmed(e.target.checked);setError('')}} className="mt-0.5 rounded border-slate-300 text-brand-600"/><span>I have reviewed and confirmed the prepared document bundle/source documents linked to this report.</span></label>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">What happens next?</p>
            <p><strong className="text-slate-600">Save draft:</strong> report remains editable and is not sent to QA.</p>
            <p><strong className="text-slate-600">Submit for QA:</strong> a QA queue item is created and linked to this report.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
        <button onClick={() => step > 1 ? setStep((value) => value - 1) : onClose()} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">
          {step > 1 && <ChevronLeft size={15} />}{step > 1 ? 'Back' : 'Cancel'}
        </button>
        {step < 4 ? (
          <button onClick={() => setStep((value) => value + 1)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Continue <ChevronRight size={15} /></button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => create(false)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg">Save draft</button>
            <button onClick={() => create(true)} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Create & submit for QA</button>
          </div>
        )}
      </div>
    </Modal>
  )
}
