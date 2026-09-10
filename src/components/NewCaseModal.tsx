import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import type { CaseRecord, Patient } from '../types'
import NewPatientModal from './NewPatientModal'
import { upsertPatient } from '../utils/patientStorage'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { patients as seedPatients } from '../data/mockData'
import { loadPatients } from '../utils/patientStorage'

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
  defaultPatient = '',
  defaultClient = '',
  defaultDoctor = '',
}: {
  onClose: () => void
  onCreate: (c: CaseRecord) => void
  existingCases: CaseRecord[]
  onOpenExisting?: (c: CaseRecord) => void
  defaultPatient?: string
  defaultClient?: string
  defaultDoctor?: string
}) {
  const { clients, doctors } = usePrototypeData()
  const [patientOptions, setPatientOptions] = useState<Patient[]>(() => loadPatients(seedPatients))
  const [patientModalOpen, setPatientModalOpen] = useState(false)
  const activeDoctors = doctors.filter((item) => item.status === 'Active')
  const activeClients = clients.filter((item) => item.status === 'Active')
  const [patient, setPatient] = useState(defaultPatient)
  const [client, setClient] = useState(defaultClient)
  const [doctor, setDoctor] = useState(defaultDoctor)
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
    if (!patient.trim() || !doctor.trim()) {
      setError('Patient and assigned doctor are required. Client is optional for direct instructions.')
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
      clientRef: client.trim() ? `NEW-${1000 + existingCases.length}` : `DIRECT-${1000 + existingCases.length}`,
      patient: patient.trim(),
      client: client.trim() || 'Direct / no instructing organisation',
      doctor: doctor.trim(),
      caseType,
      status: 'Appointment Pending',
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
    <>
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
          <div className="flex items-center justify-between gap-3 mb-1.5"><label className={`${label} mb-0`}>Patient *</label><button type="button" onClick={() => setPatientModalOpen(true)} className="text-xs font-medium text-brand-600 hover:text-brand-700">+ Create patient</button></div>
          <select className={field} value={patient} onChange={(e) => { setPatient(e.target.value); resetDuplicateConfirmation() }}>
            <option value="">Select existing patient</option>
            {patientOptions.filter((item) => item.status === 'Active').map((item) => <option key={item.id} value={item.name}>{item.name} · DOB {item.dob}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">Patient = the person being medically assessed; using the master record keeps every related module connected.</p>
        </div>
        <div>
          <label className={label}>Client / instructing organisation (optional)</label>
          <select className={field} value={client} onChange={(e) => { setClient(e.target.value); resetDuplicateConfirmation() }}>
            <option value="">Direct instruction / no client</option>
            {activeClients.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.type}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">Client = the solicitor, insurer or organisation instructing Evaluate; it is not the patient.</p>
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
            <label className={label}>Assigned doctor / medical expert *</label>
            <select className={field} value={doctor} onChange={(e) => setDoctor(e.target.value)} required>
              <option value="">Select doctor</option>
              {activeDoctors.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.speciality} · {item.availability}</option>)}
            </select>
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
    {patientModalOpen && <NewPatientModal existingPatients={patientOptions} onClose={() => setPatientModalOpen(false)} onUseExisting={(existing) => { setPatient(existing.name); setPatientModalOpen(false); resetDuplicateConfirmation() }} onCreate={(created) => { const next = upsertPatient(created, seedPatients); setPatientOptions(next); setPatient(created.name); setPatientModalOpen(false); resetDuplicateConfirmation() }} />}
    </>
  )
}
