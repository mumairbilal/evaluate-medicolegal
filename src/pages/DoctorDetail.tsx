import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CalendarDays, FileText, Mail, MapPin, Phone, Stethoscope, Trash2, UserCheck, UserX, UsersRound, Pencil } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useToast } from '../context/ToastContext'
import type { Doctor } from '../types'
import Modal from '../components/Modal'
import EditDoctorModal from '../components/EditDoctorModal'
import { sortAppointmentsByDate } from '../utils/appointmentDate'
import DoctorMiniCalendar from '../components/DoctorMiniCalendar'

const tabs = ['Profile', 'Availability', 'Workload'] as const
const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'

export default function DoctorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cases, doctors, appointments, reports, qaQueue, tasks, updateDoctor, removeDoctor } = usePrototypeData()
  const { showToast } = useToast()
  const doctor = doctors.find((item) => item.id === id)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Profile')
  const [availability, setAvailability] = useState<Doctor['availability']>(doctor?.availability ?? 'Available')
  const [availabilityNotes, setAvailabilityNotes] = useState(doctor?.availabilityNotes ?? '')
  const [removeOpen, setRemoveOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [removeReason, setRemoveReason] = useState('')

  const assignedCases = useMemo(() => cases.filter((item) => item.doctor === doctor?.name), [doctor?.name, cases])
  const doctorAppointments = useMemo(() => sortAppointmentsByDate(appointments.filter((item) => item.doctor === doctor?.name)), [appointments, doctor?.name])
  const doctorReports = useMemo(() => reports.filter((item) => item.doctor === doctor?.name), [reports, doctor?.name])
  const qaAmendments = useMemo(() => qaQueue.filter((item) => item.doctor === doctor?.name && item.status === 'Returned'), [qaQueue, doctor?.name])
  const overdueActions = useMemo(() => tasks.filter((item) => item.owner === doctor?.name && !['Completed','Cancelled'].includes(item.status)), [tasks, doctor?.name])
  const activeAssignedCases = useMemo(() => assignedCases.filter((item) => item.status !== 'Completed'), [assignedCases])
  const upcomingAppointments = useMemo(() => doctorAppointments.filter((item) => item.status === 'Scheduled'), [doctorAppointments])

  if (!doctor) return <div className="bg-white border border-slate-200 rounded-xl p-8 text-center"><p className="text-sm text-slate-600">Doctor record not found.</p><button onClick={() => navigate('/doctors')} className="mt-3 text-sm font-medium text-brand-600">Back to doctors</button></div>

  const saveAvailability = () => {
    updateDoctor(doctor.id, { ...doctor, availability, availabilityNotes })
    showToast('Doctor availability updated.')
  }

  const toggleAccountStatus = () => {
    const nextStatus: Doctor['status'] = doctor.status === 'Active' ? 'Inactive' : 'Active'
    updateDoctor(doctor.id, { ...doctor, status: nextStatus, availability: nextStatus === 'Inactive' ? 'On Leave' : availability })
    if (nextStatus === 'Inactive') setAvailability('On Leave')
    showToast(nextStatus === 'Inactive' ? 'Doctor deactivated.' : 'Doctor reactivated.')
  }

  const canRemove = activeAssignedCases.length === 0 && upcomingAppointments.length === 0
  const confirmRemove = () => {
    if (!canRemove) return
    removeDoctor(doctor.id)
    showToast(`${doctor.name} removed from the medical expert panel.`)
    navigate('/doctors')
  }

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      <header>
        <button onClick={() => navigate('/doctors')} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 mb-2.5"><ArrowLeft size={14}/> Back to doctors</button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold text-slate-900">{doctor.name}</h1><StatusBadge status={doctor.status}/></div><p className="text-xs text-slate-400 mt-1">{doctor.speciality} · {doctor.id}</p></div>
          <div className="flex items-center gap-2 flex-wrap justify-end"><StatusBadge status={doctor.availability}/><button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"><Pencil size={13}/> Edit doctor</button><Link to={`/cases?new=1&doctor=${encodeURIComponent(doctor.name)}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 rounded-lg">Create case</Link><button onClick={toggleAccountStatus} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg">{doctor.status === 'Active' ? <UserX size={13}/> : <UserCheck size={13}/>} {doctor.status === 'Active' ? 'Deactivate doctor' : 'Reactivate doctor'}</button><button onClick={() => setRemoveOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13}/> Remove doctor</button></div>
        </div>
      </header>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap ${tab === item ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{item}</button>)}
      </div>

      {tab === 'Profile' && <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <main className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          <Section title="Professional details"><p className="text-sm text-slate-600 leading-6">{doctor.professionalDetails}</p><div className="grid sm:grid-cols-2 gap-4 mt-4"><Info icon={<Stethoscope size={14}/>} label="Primary speciality" value={doctor.speciality}/><Info icon={<MapPin size={14}/>} label="Primary location" value={doctor.location}/><Info icon={<FileText size={14}/>} label="Qualifications" value={doctor.qualifications || 'Not recorded'}/><Info icon={<FileText size={14}/>} label="Standard fees" value={doctor.standardFees || 'Restricted / not recorded'}/></div></Section>
          <Section title="Specialities & appointment types"><div className="grid sm:grid-cols-3 gap-5"><TagGroup title="Specialities" values={doctor.specialities ?? [doctor.speciality]}/><TagGroup title="Appointment types" values={doctor.appointmentTypes ?? []}/><TagGroup title="Report templates" values={doctor.reportTemplates ?? []}/></div></Section>
          <Section title="Locations"><div className="flex flex-wrap gap-2">{(doctor.locations ?? [doctor.location]).map((location) => <span key={location} className="text-xs border border-slate-200 bg-slate-50 text-slate-600 rounded-full px-2.5 py-1">{location}</span>)}</div></Section>
        </main>
        <aside className="space-y-4"><Card title="Contact details"><Info icon={<Mail size={14}/>} label="Email" value={doctor.email || 'Not recorded'}/><div className="mt-3"><Info icon={<Phone size={14}/>} label="Phone" value={doctor.phone || 'Not recorded'}/></div></Card><Card title="Current workload"><Metric label="Assigned cases" value={assignedCases.length}/><Metric label="Upcoming appointments" value={doctorAppointments.filter((a) => a.status === 'Scheduled').length}/><Metric label="Reports in progress" value={doctorReports.filter((r) => r.status !== 'Delivered').length}/></Card><Card title="Performance information"><p className="text-xs text-slate-500 leading-5">{doctor.performanceSummary}</p><div className="mt-3"><Metric label="Completed appointments" value={doctorAppointments.filter((a) => a.status === 'Completed').length}/></div></Card></aside>
      </div>}

      {tab === 'Availability' && <div className="grid lg:grid-cols-[420px_minmax(0,1fr)] gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-sm font-semibold text-slate-900">Availability controls</h2><p className="text-xs text-slate-400 mt-1 mb-4">Weekly pattern, working hours, blocked periods and leave are kept with the expert profile.</p><label className="block text-xs font-medium text-slate-500 mb-1.5">Availability status</label><select className={field} value={availability} onChange={(e) => setAvailability(e.target.value as Doctor['availability'])}><option>Available</option><option>Limited Availability</option><option>Fully Booked</option><option>On Leave</option></select><div className="grid grid-cols-2 gap-3 mt-4"><Info icon={<CalendarDays size={14}/>} label="Weekly calendar" value={doctor.weeklyAvailability || 'Not recorded'}/><Info icon={<CalendarDays size={14}/>} label="Available hours" value={doctor.availableHours || 'Not recorded'}/><Info icon={<CalendarDays size={14}/>} label="Blocked periods" value={doctor.blockedPeriods || 'None recorded'}/><Info icon={<CalendarDays size={14}/>} label="Leave" value={doctor.leaveDetails || 'No leave recorded'}/></div><div className="mt-4"><TagGroup title="Appointment types" values={doctor.appointmentTypes ?? []}/></div><div className="mt-4"><TagGroup title="Locations" values={doctor.locations ?? [doctor.location]}/></div><label className="block text-xs font-medium text-slate-500 mt-4 mb-1.5">Availability notes</label><textarea rows={4} className={field} value={availabilityNotes} onChange={(e) => setAvailabilityNotes(e.target.value)} placeholder="Capacity, leave period or assignment constraints..."/><div className="flex gap-2 mt-4"><button onClick={saveAvailability} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Save availability</button><button onClick={() => setEditOpen(true)} className="border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50">Edit weekly schedule</button></div></div>
        <DoctorMiniCalendar doctorName={doctor.name} appointments={doctorAppointments} />
      </div>}

      {tab === 'Workload' && <div className="grid lg:grid-cols-2 gap-4">
        <ListCard title="Assigned cases" icon={<UsersRound size={15}/>} empty="No cases assigned.">{assignedCases.map((item) => <Link key={item.ref} to={`/cases/${item.ref}`} className="block p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50"><div className="flex justify-between gap-3"><div><p className="text-sm font-medium text-brand-600">{item.ref}</p><p className="text-xs text-slate-600 mt-1">{item.patient} · {item.caseType}</p></div><StatusBadge status={item.status}/></div></Link>)}</ListCard>
        <ListCard title="Report workload" icon={<FileText size={15}/>} empty="No reports in progress.">{doctorReports.map((item) => <div key={item.id} className="p-3 rounded-lg border border-slate-100"><div className="flex justify-between gap-3"><div><p className="text-sm font-medium text-slate-800">{item.patient}</p><p className="text-xs text-slate-500 mt-1">{item.caseRef} · {item.reportType} · {item.version}</p><p className="text-[11px] text-slate-400 mt-1">Due {item.dueDate}</p></div><StatusBadge status={item.status}/></div></div>)}</ListCard>
        <ListCard title="Appointment workload" icon={<CalendarDays size={15}/>} empty="No appointment workload.">{doctorAppointments.map((item) => <Link key={item.id} to={`/calendar?doctor=${encodeURIComponent(doctor.name)}&case=${encodeURIComponent(item.caseRef)}`} className="block p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-800">{item.patient}</p><p className="text-xs text-slate-500 mt-1">{item.date} · {item.time}</p></div><StatusBadge status={item.status}/></div></Link>)}</ListCard>
        <Card title="Workload summary"><Metric label="Case workload" value={assignedCases.length}/><Metric label="Scheduled appointments" value={doctorAppointments.filter((a) => a.status === 'Scheduled').length}/><Metric label="Reports due / open" value={doctorReports.filter((r) => r.status !== 'Delivered').length}/><Metric label="QA amendments" value={qaAmendments.length}/><Metric label="Overdue / open actions" value={overdueActions.length}/><Metric label="Current availability" value={doctor.availability}/><div className="pt-3"><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2">Workload trend</p><div className="grid grid-cols-4 gap-1 h-12 items-end">{[Math.max(1,assignedCases.length-2),Math.max(1,assignedCases.length-1),Math.max(1,assignedCases.length),Math.max(1,assignedCases.length+doctorReports.filter((r)=>r.status!=='Delivered').length)].map((v,i)=><div key={i} className="bg-slate-200 rounded-t" style={{height:`${Math.min(100,20+v*15)}%`}} />)}</div></div></Card>
      </div>}

      {editOpen && <EditDoctorModal doctor={doctor} onClose={() => setEditOpen(false)} onSave={(next) => { updateDoctor(doctor.id, next); setAvailability(next.availability); setAvailabilityNotes(next.availabilityNotes ?? ''); setEditOpen(false); showToast('Doctor profile updated.') }} />}

      {removeOpen && <Modal title="Remove doctor" description={`${doctor.name} · ${doctor.id}`} onClose={() => setRemoveOpen(false)} width="max-w-lg">
        {canRemove ? <div>
          <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3"><AlertTriangle size={17} className="text-red-500 mt-0.5 shrink-0"/><div><p className="text-sm font-medium text-red-800">This permanently removes the doctor from the panel.</p><p className="text-xs text-red-700 mt-1 leading-5">No active cases or scheduled appointments are linked to this doctor. Historical records remain unchanged.</p></div></div>
          <label className="block text-xs font-medium text-slate-600 mt-4 mb-1.5">Reason for removal *</label><textarea rows={3} value={removeReason} onChange={(e)=>setRemoveReason(e.target.value)} className={field} placeholder="Why should this doctor record be removed?"/>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={() => {setRemoveOpen(false);setRemoveReason('')}} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button disabled={removeReason.trim().length < 3} onClick={confirmRemove} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed">Remove doctor</button></div>
        </div> : <div>
          <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3"><AlertTriangle size={17} className="text-amber-600 mt-0.5 shrink-0"/><div><p className="text-sm font-medium text-amber-900">This doctor still owns active work.</p><p className="text-xs text-amber-800 mt-1 leading-5">Reassign {activeAssignedCases.length} active case{activeAssignedCases.length === 1 ? '' : 's'} and {upcomingAppointments.length} scheduled appointment{upcomingAppointments.length === 1 ? '' : 's'} before removal. Deactivate the account now if no new work should be assigned.</p></div></div>
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={() => setRemoveOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Close</button>{doctor.status === 'Active' && <button onClick={() => { toggleAccountStatus(); setRemoveOpen(false) }} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Deactivate doctor</button>}</div>
        </div>}
      </Modal>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="p-4"><h2 className="text-sm font-semibold text-slate-900 mb-3">{title}</h2>{children}</section> }
function Card({ title, children }: { title: string; children: ReactNode }) { return <div className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-sm font-semibold text-slate-900 mb-3">{title}</h2>{children}</div> }
function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div><p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{icon}{label}</p><p className="text-sm text-slate-700 mt-1 break-words">{value}</p></div> }
function TagGroup({ title, values }: { title: string; values: string[] }) { return <div><p className="text-xs font-medium text-slate-500 mb-2">{title}</p><div className="flex flex-wrap gap-2">{values.map((value) => <span key={value} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-full px-2.5 py-1">{value}</span>)}</div></div> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><span className="text-xs text-slate-500">{label}</span><span className="text-xs font-semibold text-slate-800">{value}</span></div> }
function ListCard({ title, icon, empty, children }: { title: string; icon: ReactNode; empty: string; children: ReactNode }) { const items = Array.isArray(children) ? children.length : 1; return <div className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">{icon}{title}</h2><div className="space-y-2">{items ? children : <Empty text={empty}/>}</div></div> }
function Empty({ text }: { text: string }) { return <div className="p-6 text-center text-xs text-slate-400">{text}</div> }
