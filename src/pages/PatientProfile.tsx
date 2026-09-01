import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, FileText, CalendarDays, MapPin, Accessibility, Languages, MessageSquare, Trash2, UserCheck, UserX } from 'lucide-react'
import { cases, patients as seedPatients } from '../data/mockData'
import { loadPatients, removePatient, upsertPatient } from '../utils/patientStorage'
import StatusBadge from '../components/StatusBadge'
import EditPatientModal from '../components/EditPatientModal'
import DeleteRecordModal from '../components/DeleteRecordModal'
import { useToast } from '../context/ToastContext'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useRole } from '../context/RoleContext'
import type { Patient } from '../types'

export default function PatientProfile() {
  const { showToast } = useToast()
  const { role } = useRole()
  const { id } = useParams()
  const navigate = useNavigate()
  const { appointments, documents, bookings, reports } = usePrototypeData()
  const sourcePatient = loadPatients(seedPatients).find((p) => p.id === id)
  const [patient, setPatient] = useState<Patient | undefined>(sourcePatient)
  const [editOpen, setEditOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)

  if (!patient) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center"><p className="text-sm font-medium text-slate-800">Patient record not found.</p><button onClick={() => navigate('/patients')} className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">Back to patients</button></div>
  }

  const relatedCases = cases.filter((c) => c.patient === patient.name)
  const appointmentHistory = appointments.filter((a) => a.patient === patient.name)
  const permittedDocuments = documents.filter((d) => d.patient === patient.name)
  const relatedBookings = bookings.filter((booking) => booking.patient === patient.name)
  const relatedReports = reports.filter((report) => report.patient === patient.name)
  const canManageRecords = ['booking-administrator', 'operations-manager', 'system-administrator'].includes(role.id)
  const dependencyCount = relatedCases.length + appointmentHistory.length + permittedDocuments.length + relatedBookings.length + relatedReports.length
  const blockedReason = !canManageRecords
    ? 'Your current role does not have permission to remove patient master records.'
    : dependencyCount > 0
      ? `This patient is linked to ${relatedCases.length} case(s), ${relatedBookings.length} booking(s), ${appointmentHistory.length} appointment(s), ${permittedDocuments.length} document(s) and ${relatedReports.length} report(s). Historical medicolegal records must be preserved. Deactivate the patient instead of deleting the record.`
      : undefined

  const savePatient = (next: Patient, message: string) => {
    upsertPatient(next, seedPatients)
    setPatient(next)
    showToast(message)
  }

  const toggleStatus = () => {
    const next = { ...patient, status: patient.status === 'Active' ? 'Inactive' as const : 'Active' as const }
    savePatient(next, next.status === 'Inactive' ? 'Patient deactivated.' : 'Patient reactivated.')
  }

  return (
    <div>
      <Link to="/patients" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft size={15} /> Back to patients
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
            {patient.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-slate-900">{patient.name}</h2><StatusBadge status={patient.status} /></div>
            <p className="text-sm text-slate-500">{patient.id} · DOB {patient.dob}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={() => setEditOpen(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">Edit patient</button>
          {canManageRecords && <button onClick={toggleStatus} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">{patient.status === 'Active' ? <UserX size={14}/> : <UserCheck size={14}/>} {patient.status === 'Active' ? 'Deactivate patient' : 'Reactivate patient'}</button>}
          {canManageRecords && <button onClick={() => setRemoveOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 size={14}/> Remove patient</button>}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-4 font-semibold text-slate-900">Patient details</p>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div><p className="mb-1 text-xs text-slate-400">Email</p><p className="text-slate-700">{patient.email}</p></div>
              <div><p className="mb-1 text-xs text-slate-400">Phone</p><p className="text-slate-700">{patient.phone}</p></div>
              <div className="flex gap-2 sm:col-span-2"><MapPin size={16} className="mt-0.5 text-slate-400" /><div><p className="mb-1 text-xs text-slate-400">Address</p><p className="text-slate-700">{patient.address ?? 'Not recorded'}</p></div></div>
              <div className="flex gap-2"><Accessibility size={16} className="mt-0.5 text-slate-400" /><div><p className="mb-1 text-xs text-slate-400">Accessibility requirements</p><p className="text-slate-700">{patient.accessibilityRequirements ?? 'None recorded'}</p></div></div>
              <div className="flex gap-2"><Languages size={16} className="mt-0.5 text-slate-400" /><div><p className="mb-1 text-xs text-slate-400">Interpreter requirements</p><p className="text-slate-700">{patient.interpreter ?? 'None recorded'}</p></div></div>
              <div className="flex gap-2"><MessageSquare size={16} className="mt-0.5 text-slate-400" /><div><p className="mb-1 text-xs text-slate-400">Communication preference</p><p className="text-slate-700">{patient.communicationPreferences ?? 'Email'}</p></div></div>
              <div><p className="mb-1 text-xs text-slate-400">Status</p><StatusBadge status={patient.status} /></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 font-semibold text-slate-900">Related cases</p>
            <div className="divide-y divide-slate-100">
              {relatedCases.map((c) => (
                <Link to={`/cases/${c.ref}`} key={c.ref} className="-mx-2 flex items-center justify-between rounded-md px-2 py-3 hover:bg-slate-50">
                  <div><p className="text-sm font-medium text-slate-800">{c.ref}</p><p className="text-xs text-slate-500">{c.client} · {c.caseType}</p></div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
              {relatedCases.length === 0 && <p className="py-2 text-sm text-slate-500">No linked cases.</p>}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2"><CalendarDays size={17} className="text-slate-400" /><p className="font-semibold text-slate-900">Appointment history</p></div>
              <div className="divide-y divide-slate-100">
                {appointmentHistory.map((a) => <div key={a.id} className="py-3 first:pt-0"><div className="flex justify-between gap-3"><p className="text-sm font-medium text-slate-800">{a.date} · {a.time}</p><StatusBadge status={a.status} /></div><p className="mt-1 text-xs text-slate-500">{a.type} · {a.doctor}</p><p className="mt-0.5 text-xs text-slate-400">{a.location}</p></div>)}
                {appointmentHistory.length === 0 && <p className="text-sm text-slate-500">No appointment history.</p>}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2"><FileText size={17} className="text-slate-400" /><p className="font-semibold text-slate-900">Documents</p></div>
              <div className="divide-y divide-slate-100">
                {permittedDocuments.map((d) => <div key={d.id} className="py-3 first:pt-0"><p className="text-sm font-medium text-slate-800">{d.name}</p><p className="mt-1 text-xs text-slate-500">{d.category} · {d.version}</p><p className="mt-0.5 text-xs text-slate-400">Uploaded {d.uploadDate}</p></div>)}
                {permittedDocuments.length === 0 && <p className="text-sm text-slate-500">No documents available for this role.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 font-semibold text-slate-900">Activity history</p>
          <div className="space-y-4 text-sm">
            <div><p className="text-slate-700">Patient record reviewed</p><p className="text-xs text-slate-400">{patient.lastActivity ?? 'Today'} · Admin Team</p></div>
            {appointmentHistory[0] && <div><p className="text-slate-700">Appointment {appointmentHistory[0].status.toLowerCase()}</p><p className="text-xs text-slate-400">{appointmentHistory[0].date} · {appointmentHistory[0].doctor}</p></div>}
            <div><p className="text-slate-700">Contact details verified</p><p className="text-xs text-slate-400">31 Jul 2026 · Admin Team</p></div>
            <div><p className="text-slate-700">Patient record created</p><p className="text-xs text-slate-400">31 Jul 2026 · Admin Team</p></div>
          </div>
        </div>
      </div>

      {editOpen && <EditPatientModal patient={patient} onClose={() => setEditOpen(false)} onSave={(updated) => { savePatient(updated, 'Patient details updated successfully.'); setEditOpen(false) }} />}
      {removeOpen && <DeleteRecordModal
        title="Remove patient"
        recordName={`${patient.name} · ${patient.id}`}
        impact="This permanently removes the patient master record from the prototype. This should only be used for an incorrectly created, unlinked record."
        blockedReason={blockedReason}
        confirmLabel="Remove patient"
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          removePatient(patient.id, seedPatients)
          showToast(`${patient.name} removed.`)
          setRemoveOpen(false)
          navigate('/patients')
        }}
      />}
    </div>
  )
}
