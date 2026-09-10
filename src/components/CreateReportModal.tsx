import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import Modal from './Modal'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useRole } from '../context/RoleContext'
import { useToast } from '../context/ToastContext'
import type { ReportItem } from '../types'
import { transitionCaseForEvent } from '../utils/caseWorkflow'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'
const templates = ['Standard Medicolegal Report', 'Addendum Report', 'Condition & Prognosis Report', 'Records Review Report']

function defaultContent(caseRef: string, patient: string, doctor: string, reportType: string) {
  return `MEDICOLEGAL REPORT\n\nCase: ${caseRef}\nPatient: ${patient}\nMedical expert: ${doctor}\nReport type: ${reportType}\n\n1. Instructions\nSummarise the instruction and questions to be addressed.\n\n2. Documents reviewed\nConfirm the source material relied upon.\n\n3. History and examination\nEnter the relevant history, findings and chronology.\n\n4. Opinion\nSet out the expert opinion, causation and prognosis.\n\n5. Declaration\nComplete the required declaration before final approval.`
}

export default function CreateReportModal({ onClose, defaultCaseRef = '' }: { onClose: () => void; defaultCaseRef?: string }) {
  const { reports, documents, cases, addReport, updateCase } = usePrototypeData()
  const { role } = useRole()
  const { showToast } = useToast()
  const eligibleCases = useMemo(() => cases.filter((item) => item.status === 'File Ready' && (role.id !== 'medical-expert' || item.doctor === role.name)), [cases, role.id, role.name])
  const initialCaseRef = eligibleCases.some((item) => item.ref === defaultCaseRef) ? defaultCaseRef : (eligibleCases[0]?.ref ?? '')
  const [step, setStep] = useState(1)
  const [caseRef, setCaseRef] = useState(initialCaseRef)
  const selectedCase = eligibleCases.find((item) => item.ref === caseRef)
  const [reportType, setReportType] = useState('Medicolegal Report')
  const [template, setTemplate] = useState(templates[0])
  const [content, setContent] = useState(() => selectedCase ? defaultContent(selectedCase.ref, selectedCase.patient, selectedCase.doctor, 'Medicolegal Report') : '')
  const [error, setError] = useState('')
  const [bundleConfirmed, setBundleConfirmed] = useState(false)

  const sourceDocs = useMemo(() => documents.filter((doc) => doc.caseRef === caseRef), [documents, caseRef])
  const duplicate = reports.find((report) => report.caseRef === caseRef && report.reportType === reportType && report.status !== 'Delivered')

  const selectCase = (value: string) => {
    setCaseRef(value)
    const nextCase = cases.find((item) => item.ref === value)
    if (nextCase) setContent(defaultContent(nextCase.ref, nextCase.patient, nextCase.doctor, reportType))
    setBundleConfirmed(false)
    setError('')
  }

  const changeReportType = (value: string) => {
    setReportType(value)
    if (selectedCase) setContent(defaultContent(selectedCase.ref, selectedCase.patient, selectedCase.doctor, value))
    setError('')
  }

  const validateStep = () => {
    if (!selectedCase) { setError('No eligible File Ready case is available for this user. Complete file preparation before report drafting.'); return false }
    if (step === 1 && (!selectedCase.doctor || selectedCase.doctor === 'Unassigned')) { setError('Assign a doctor / medical expert to the case before creating a report.'); return false }
    if (step === 5 && !bundleConfirmed) { setError('Confirm the prepared document bundle/source documents before continuing.'); return false }
    setError('')
    return true
  }

  const next = () => { if (validateStep()) setStep((value) => Math.min(6, value + 1)) }

  const createDraft = () => {
    if (!selectedCase) return
    if (!bundleConfirmed) { setError('Confirm the prepared document bundle/source documents before creating the report.'); setStep(5); return }
    if (!content.trim()) { setError('Report content cannot be empty.'); setStep(6); return }
    if (duplicate) { setError(`An active ${reportType.toLowerCase()} already exists for ${caseRef}. Open the existing report instead of creating a duplicate.`); setStep(2); return }

    const id = `R-${Date.now()}`
    const now = 'Just now'
    const report: ReportItem = {
      id,
      caseRef: selectedCase.ref,
      patient: selectedCase.patient,
      doctor: selectedCase.doctor,
      reportType,
      version: 'v1',
      status: 'Draft',
      qaStatus: 'Not Started',
      dueDate: selectedCase.targetDate,
      lastUpdated: now,
      assignedUser: selectedCase.doctor,
      template,
      content: content.trim(),
      saveStatus: 'Saved',
      sourceDocumentIds: sourceDocs.map((doc) => doc.id),
      comments: [],
      versions: [{ version: 'v1', date: now, author: role.name, status: 'Draft', changeSummary: 'Initial draft created', qaOutcome: 'Not submitted', content: content.trim() }],
    }
    addReport(report)
    updateCase(report.caseRef, (current) => transitionCaseForEvent(current, 'report-created', role.name, 'Draft report created'))
    showToast(`Draft report created for ${caseRef}. Open the report workspace when it is ready for QA.`)
    onClose()
  }

  const steps = ['Select case', 'Report type', 'Select template', 'Review case', 'Confirm bundle', 'Create draft']
  const canCreateForRole = ['medical-expert', 'file-preparation'].includes(role.id)

  return (
    <Modal title="Create report" description="Follow the structured report-creation sequence. QA submission happens from the report workspace after the draft is created." onClose={onClose} width="max-w-4xl">
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {steps.map((name, index) => { const number = index + 1; return <div key={name} className="flex items-center gap-2 shrink-0"><div className={`w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center ${step > number ? 'bg-teal-500 text-white' : step === number ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{step > number ? <Check size={13}/> : number}</div><span className={`text-xs ${step === number ? 'font-medium text-slate-800' : 'text-slate-400'}`}>{name}</span>{number < steps.length && <div className="w-6 h-px bg-slate-200"/>}</div> })}
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      {step === 1 && <div><label className={label}>Case *</label>{canCreateForRole && eligibleCases.length > 0 ? <select className={field} value={caseRef} onChange={(e)=>selectCase(e.target.value)}>{eligibleCases.map((item)=><option key={item.ref} value={item.ref}>{item.ref} — {item.patient} — {item.doctor || 'No doctor'}</option>)}</select> : <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{canCreateForRole ? 'No cases are currently File Ready for report drafting.' : 'Your role cannot create report drafts.'}</div>}<p className="text-xs text-slate-400 mt-2">Report drafting starts only after file preparation is marked File Ready. Medical experts only see cases assigned to them.</p></div>}

      {step === 2 && <div><label className={label}>Report type *</label><select className={field} value={reportType} onChange={(e)=>changeReportType(e.target.value)}><option>Medicolegal Report</option><option>Addendum Report</option><option>Condition & Prognosis Report</option><option>Records Review Report</option></select>{duplicate && <p className="mt-2 text-xs text-amber-700">An active report of this type already exists for the selected case.</p>}</div>}

      {step === 3 && <div><label className={label}>Report template *</label><select className={field} value={template} onChange={(e)=>setTemplate(e.target.value)}>{templates.map((item)=><option key={item}>{item}</option>)}</select></div>}

      {step === 4 && selectedCase && <div className="grid md:grid-cols-2 gap-3">{[['Case reference',selectedCase.ref],['Patient',selectedCase.patient],['Client',selectedCase.client],['Medical expert',selectedCase.doctor],['Case type',selectedCase.caseType],['Target date',selectedCase.targetDate],['Report type',reportType],['Template',template]].map(([key,value])=><div key={key} className="rounded-lg border border-slate-200 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">{key}</p><p className="text-sm font-medium text-slate-700 mt-1">{value}</p></div>)}</div>}

      {step === 5 && <div className="grid md:grid-cols-[1fr_260px] gap-4"><div className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2"><FileText size={16} className="text-brand-600"/><p className="text-sm font-semibold text-slate-800">Prepared document bundle</p></div><p className="text-xs text-slate-500 mt-2">{sourceDocs.length} source document{sourceDocs.length===1?'':'s'} linked to {caseRef}.</p><div className="mt-3 max-h-40 overflow-y-auto divide-y divide-slate-100">{sourceDocs.map((doc)=><div key={doc.id} className="py-2 text-xs text-slate-600">{doc.name} <span className="text-slate-400">· {doc.category}</span></div>)}{sourceDocs.length===0&&<p className="py-3 text-xs text-amber-700">No source documents are currently linked. Confirm only if this is appropriate for the report type.</p>}</div></div><label className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50/40 p-4 text-sm text-brand-800"><input type="checkbox" checked={bundleConfirmed} onChange={(e)=>{setBundleConfirmed(e.target.checked);setError('')}} className="mt-0.5 rounded border-slate-300 text-brand-600"/><span>I have reviewed and confirmed the prepared document bundle/source documents for this draft.</span></label></div>}

      {step === 6 && selectedCase && <div className="space-y-4"><div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"><strong className="text-slate-800">Draft summary:</strong> {selectedCase.ref} · {reportType} · {template} · {sourceDocs.length} source document{sourceDocs.length===1?'':'s'}</div><div><label className={label}>Initial report content *</label><textarea className={`${field} font-mono leading-6`} rows={14} value={content} onChange={(e)=>setContent(e.target.value)}/><p className="text-xs text-slate-400 mt-2">The draft remains editable in Report Workspace. Submit for QA from that workspace when ready.</p></div></div>}

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100"><button onClick={()=>step>1?setStep((value)=>value-1):onClose()} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">{step>1&&<ChevronLeft size={15}/>} {step>1?'Back':'Cancel'}</button>{step<6?<button disabled={!canCreateForRole || !selectedCase} onClick={next} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed">Continue <ChevronRight size={15}/></button>:<button onClick={createDraft} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Create draft</button>}</div>
    </Modal>
  )
}
