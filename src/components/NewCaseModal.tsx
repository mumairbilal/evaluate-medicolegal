import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import type { CaseRecord } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'
const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ')
const formatDate = (value: string) => {
  if (!value) return 'Not set'
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function NewCaseModal({
  onClose,
  onCreate,
  existingCases,
  onOpenExisting,
}: {
  onClose: () => void
  onCreate: (c: CaseRecord) => void
  existingCases: CaseRecord[]
  onOpenExisting?: (c: CaseRecord) => void
}) {
  const [patient, setPatient] = useState('')
  const [client, setClient] = useState('')
  const [doctor, setDoctor] = useState('')
  const [caseType, setCaseType] = useState('Personal Injury — RTA')
  const [priority, setPriority] = useState<CaseRecord['priority']>('Standard')
  const [targetDate, setTargetDate] = useState('')
  const [separateMatterConfirmed, setSeparateMatterConfirmed] = useState(false)
  const [error, setError] = useState('')

  const duplicate = useMemo(() => {
    const name = normalise(patient)
    if (!name) return undefined
    const active = existingCases.filter((c) => c.status !== 'Completed')
    return active.find((c) => normalise(c.patient) === name && normalise(c.client) === normalise(client) && c.caseType === caseType)
      ?? active.find((c) => normalise(c.patient) === name)
  }, [patient, client, caseType, existingCases])

  const handleSubmit = () => {
    if (!patient.trim() || !client.trim()) {
      setError('Patient and client are required.')
      return
    }
    if (duplicate && !separateMatterConfirmed) {
      setError('A possible duplicate active case already exists for this patient. Review it before creating another case.')
      return
    }
    const refs = existingCases.map((c) => Number(c.ref.split('-').pop())).filter(Number.isFinite)
    const nextNumber = Math.max(1199, ...refs) + 1
    onCreate({
      ref: `EM-2026-${nextNumber}`,
      clientRef: `NEW-${1000 + existingCases.length}`,
      patient: patient.trim(),
      client: client.trim(),
      doctor: doctor.trim() || 'Unassigned',
      caseType,
      status: 'New Booking',
      priority,
      owner: 'Unassigned',
      targetDate: formatDate(targetDate),
      lastUpdated: 'Just now',
      documents: 0,
      tasks: 0,
      qaComments: 0,
    })
  }

  const resetDuplicateConfirmation = () => {
    setSeparateMatterConfirmed(false)
    setError('')
  }

  return (
    <Modal title="Create case" description="Set up a new medicolegal case file with duplicate-case protection." onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        {duplicate && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex gap-2.5">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-900">Possible duplicate active case</p>
                <p className="text-xs text-amber-700 mt-1">{duplicate.ref} · {duplicate.patient} · {duplicate.client} · {duplicate.caseType}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {onOpenExisting && <button onClick={() => onOpenExisting(duplicate)} className="px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Open existing case</button>}
                  <label className="flex items-center gap-2 text-xs text-amber-800 bg-white border border-amber-200 rounded-lg px-3 py-1.5 cursor-pointer">
                    <input type="checkbox" checked={separateMatterConfirmed} onChange={(e) => setSeparateMatterConfirmed(e.target.checked)} />
                    This is a separate matter
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        <div>
          <label className={label}>Patient name *</label>
          <input className={field} value={patient} onChange={(e) => { setPatient(e.target.value); resetDuplicateConfirmation() }} placeholder="e.g. Grace Adeyemi" />
        </div>
        <div>
          <label className={label}>Client (solicitor / insurer) *</label>
          <input className={field} value={client} onChange={(e) => { setClient(e.target.value); resetDuplicateConfirmation() }} placeholder="e.g. Harrow & Vale Solicitors" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Case type</label>
            <select className={field} value={caseType} onChange={(e) => { setCaseType(e.target.value); resetDuplicateConfirmation() }}>
              <option>Personal Injury — RTA</option><option>Personal Injury — Workplace</option><option>Clinical Negligence</option><option>Employment Liability</option>
            </select>
          </div>
          <div>
            <label className={label}>Priority</label>
            <select className={field} value={priority} onChange={(e) => setPriority(e.target.value as CaseRecord['priority'])}>
              <option>Standard</option><option>High</option><option>Urgent</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Assigned doctor (optional)</label>
            <input className={field} value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="e.g. Dr Amara Osei" />
          </div>
          <div>
            <label className={label}>Target date</label>
            <input className={field} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Create case</button>
      </div>
    </Modal>
  )
}
