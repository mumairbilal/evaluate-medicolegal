import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Download, Eye, FilePlus2, FileText, MessageSquarePlus, Pencil, StickyNote, Trash2, UserRoundPlus, X } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import Modal from '../components/Modal'
import EditBookingModal from '../components/EditBookingModal'
import RequestInformationModal from '../components/RequestInformationModal'
import BookingUploadDocumentsModal from '../components/BookingUploadDocumentsModal'
import BookingAppointmentModal from '../components/BookingAppointmentModal'
import { useToast } from '../context/ToastContext'
import { useRole } from '../context/RoleContext'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { patients as seedPatients } from '../data/mockData'
import { loadPatients } from '../utils/patientStorage'
import type { CaseStatus } from '../types'

const actionClass = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50'
const label = 'text-[11px] uppercase tracking-wide text-slate-400'
const value = 'text-sm font-medium text-slate-800 mt-1'

function downloadBookingDoc(doc: import('../types').BookingDocument, bookingRef: string) {
  const content = `Evaluate Medicolegal — prototype document export\n\nFile: ${doc.name}\nBooking: ${bookingRef}\nCategory: ${doc.category}\nSize: ${doc.size}\nUploaded by: ${doc.uploadedBy}\nUploaded: ${doc.uploadedAt}\n\nThis prototype does not retain the original binary file.`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${doc.name}.txt`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

type ModalType = 'edit' | 'request' | 'upload' | 'note' | 'appointment' | null

export default function BookingDetail() {
  const { ref } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  const { role } = useRole()
  const { bookings, cases, clients, doctors, appointments, addCase, addDocuments, addAppointment, updateBooking, removeBooking } = usePrototypeData()
  const booking = useMemo(() => bookings.find((item) => item.ref === ref), [bookings, ref])
  const [modal, setModal] = useState<ModalType>(null)
  const [viewingDoc, setViewingDoc] = useState<import('../types').BookingDocument | null>(null)
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'convert' | null>(null)
  const [note, setNote] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationComments, setCancellationComments] = useState('')

  useEffect(() => {
    const action = searchParams.get('action')
    if (!action) return
    if (action === 'edit') setModal('edit')
    if (action === 'schedule') setModal('appointment')
    if (action === 'cancel') setConfirmAction('cancel')
    if (action === 'convert') setConfirmAction('convert')
    const next = new URLSearchParams(searchParams); next.delete('action'); setSearchParams(next,{replace:true})
  }, [searchParams,setSearchParams])

  if (!booking) {
    return <div className="bg-white border border-slate-200 rounded-xl p-8 text-center"><p className="text-sm font-medium text-slate-800">Booking not found</p><p className="text-xs text-slate-400 mt-1">The requested booking reference is not available.</p><Link to="/bookings" className="inline-flex mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">Back to bookings</Link></div>
  }

  const linkedPatient = loadPatients(seedPatients).find((patient) => patient.name === booking.patient)
  const linkedClient = clients.find((client) => client.name === booking.client)
  const linkedDoctor = doctors.find((doctor) => doctor.name === booking.doctor)
  const linkedCase = cases.find((item) => item.bookingRef === booking.ref || (booking.status === 'Converted to Case' && item.patient === booking.patient && item.doctor === booking.doctor))
  const requests = booking.informationRequests ?? []
  const documents = booking.documents ?? []
  const activities = [...(booking.activity ?? [])].reverse()
  const isClosed = booking.status === 'Cancelled' || booking.status === 'Converted to Case'
  const unresolvedRequests = requests.filter((request) => request.status !== 'Resolved')
  const draftMissing = booking.status === 'Draft' ? [
    !booking.patient || booking.patient === 'Draft patient' ? 'Patient details' : '',
    !booking.client ? 'Client details' : '',
    !booking.doctor || booking.doctor === 'Unassigned' ? 'Doctor / medical expert' : '',
    !booking.caseType ? 'Case type' : '',
    booking.appointmentRequired !== false && !booking.preferredAppointmentDate && booking.appointmentDate === '—' ? 'Appointment requirements / preferred date' : '',
  ].filter(Boolean) : []
  const canDeleteDraft = ['booking-administrator','operations-manager','system-administrator'].includes(role.id)
  const workflowAction = linkedCase
    ? { label: 'Continue in case', action: () => navigate(`/cases/${linkedCase.ref}`), hint: 'Booking has entered the operational case workflow. Continue all appointment, document, report and QA work from the case.' }
    : !booking.doctor || booking.doctor === 'Unassigned'
      ? { label: 'Assign doctor', action: () => setModal('edit'), hint: 'A doctor / medical expert is required before the booking can become a case.' }
      : unresolvedRequests.length > 0 || booking.status === 'Information Required'
        ? { label: 'Resolve missing information', action: () => setModal('request'), hint: 'Resolve outstanding instruction information before creating the operational case.' }
        : { label: 'Create case & continue', action: () => setConfirmAction('convert'), hint: 'Create the central case record first. Appointment scheduling then happens from that case so the calendar, case history and doctor availability stay connected.' }

  const saveBooking = (next: typeof booking, toast: string) => {
    updateBooking(booking.ref, next)
    setModal(null)
    showToast(toast)
  }

  return <div className="space-y-4 max-w-[1500px] mx-auto">
    <header>
      <button onClick={() => navigate('/bookings')} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 mb-2.5"><ArrowLeft size={14}/> Back to bookings</button>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap"><h1 className="text-lg font-semibold text-slate-900">{booking.ref}</h1><StatusBadge status={booking.status}/><PriorityBadge priority={booking.priority}/></div>
          <p className="text-xs text-slate-400 mt-1">{booking.patient} · {booking.client || 'Direct instruction'} · {booking.doctor}</p>
        </div>
        {!isClosed && <div className="flex items-center gap-2 flex-wrap justify-end">
          <button className={actionClass} onClick={()=>setModal('edit')}><Pencil size={13}/> Edit</button>
          <button className={actionClass} onClick={()=>setModal('appointment')}><span className="text-xs">{booking.appointmentDate === '—' ? 'Schedule appointment' : 'Reschedule appointment'}</span></button>
          <button className={actionClass} onClick={()=>setModal('upload')}><FilePlus2 size={13}/> Upload</button>
          <button className={actionClass} onClick={()=>setModal('request')}><MessageSquarePlus size={13}/> Request information</button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium" onClick={()=>setConfirmAction('convert')}><UserRoundPlus size={13}/> Create case</button>
        </div>}
      </div>
    </header>

    {booking.status === 'Draft' && <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><AlertTriangle size={16} className="text-amber-700"/><h2 className="text-sm font-semibold text-amber-900">Booking draft</h2></div><p className="mt-1 text-xs text-amber-800">Last updated: {activities[0]?.date ?? booking.bookingDate}. Complete the missing fields before the booking enters the operational workflow.</p><p className="mt-2 text-xs text-amber-900"><strong>Missing fields:</strong> {draftMissing.length ? draftMissing.join(', ') : 'No mandatory fields currently missing — review and confirm the booking.'}</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>setModal('edit')} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white">Resume booking</button>{canDeleteDraft&&<button onClick={()=>{if(window.confirm(`Delete draft ${booking.ref}? This draft has not entered the case workflow.`)){removeBooking(booking.ref);showToast('Booking draft deleted.');navigate('/bookings')}}} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600"><Trash2 size={13}/> Delete draft</button>}</div></div>
    </section>}

    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
      <main className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <section className="p-4">
          <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">Booking overview</h2><span className="text-[11px] text-slate-400">Booked {booking.bookingDate} via {booking.source}</span></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
            <Info labelText="Patient · person assessed" valueText={booking.patient}/><Info labelText="Client · instructing party" valueText={booking.client || 'Direct / no instructing organisation'}/><Info labelText="Case type" valueText={booking.caseType}/><Info labelText="Priority" valueText={booking.priority}/>
            <Info labelText="Medical expert" valueText={booking.doctor}/><Info labelText="Case owner" valueText={booking.owner}/><Info labelText="Agreed fee" valueText={booking.agreedFee || 'Not recorded'}/><Info labelText="Missing information" valueText={booking.missingInformation}/>
          </div>
          {(booking.notes || booking.reportDueDate || booking.targetCompletionDate) && <div className="mt-4 pt-3 border-t border-slate-100 grid sm:grid-cols-3 gap-4"><Info labelText="Report due" valueText={booking.reportDueDate || 'Not set'}/><Info labelText="Target completion" valueText={booking.targetCompletionDate || 'Not set'}/><Info labelText="Internal note" valueText={booking.notes || 'None'}/></div>}
        </section>

        <section className="border-t border-slate-100 p-4">
          <div className="mb-3"><h2 className="text-sm font-semibold text-slate-900">Appointment requirements</h2><p className="text-[11px] text-slate-400 mt-0.5">A booking captures the requirement; the actual diary slot is scheduled from the linked case workflow.</p></div>
          {booking.appointmentDate !== '—' ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><Info labelText="Scheduled date" valueText={booking.appointmentDate}/><Info labelText="Time" valueText={booking.appointmentTime || 'Time not recorded'}/><Info labelText="Method" valueText={booking.appointmentMethod || 'Not recorded'}/><Info labelText="Location" valueText={booking.appointmentLocation || 'Not recorded'}/><Info labelText="Doctor" valueText={booking.doctor}/><Info labelText="Interpreter" valueText={booking.interpreterRequired ? 'Required' : 'Not required'}/></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-lg bg-slate-50 border border-slate-100 px-3 py-3"><Info labelText="Appointment needed" valueText={booking.appointmentRequired === false ? 'No' : 'Yes'}/><Info labelText="Preferred date" valueText={booking.preferredAppointmentDate || 'Not specified'}/><Info labelText="Preferred method" valueText={booking.appointmentMethod || 'Not specified'}/><Info labelText="Preferred location" valueText={booking.appointmentLocation || 'Not specified'}/></div>}
        </section>

        <section className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-semibold text-slate-900">Documents</h2><p className="text-[11px] text-slate-400 mt-0.5">{documents.length} file{documents.length === 1 ? '' : 's'} attached to this booking</p></div>{!isClosed && <button onClick={()=>setModal('upload')} className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"><FilePlus2 size={13}/> Upload documents</button>}</div>
          {documents.length ? <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">{documents.map((doc)=><button key={doc.id} onClick={()=>setViewingDoc(doc)} className="w-full grid grid-cols-[minmax(0,1fr)_140px_110px_auto] gap-3 items-center px-3 py-2.5 text-xs text-left hover:bg-slate-50"><div className="min-w-0 flex items-center gap-2"><FileText size={14} className="text-slate-400 shrink-0"/><div className="min-w-0"><p className="text-sm font-medium text-brand-600 truncate">{doc.name}</p><p className="text-[11px] text-slate-400 mt-0.5">Uploaded by {doc.uploadedBy} · {doc.uploadedAt}</p></div></div><span className="text-slate-500">{doc.category}</span><span className="text-slate-400 text-right">{doc.size}</span><Eye size={14} className="text-slate-300"/></button>)}</div> : <Empty text="No booking documents uploaded yet."/>}
        </section>

        <section className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-semibold text-slate-900">Information requests</h2><p className="text-[11px] text-slate-400 mt-0.5">Requests sent to obtain missing instruction information.</p></div>{!isClosed && <button onClick={()=>setModal('request')} className="text-xs font-medium text-brand-600 hover:text-brand-700">New request</button>}</div>
          {requests.length ? <div className="space-y-2">{requests.map((request)=><div key={request.id} className="border border-slate-100 rounded-lg px-3 py-2.5"><div className="flex justify-between gap-3"><div><p className="text-sm font-medium text-slate-700">{request.subject}</p><p className="text-xs text-slate-400 mt-0.5">To {request.recipient} · {request.email} · {request.sentAt}</p></div><StatusBadge status={request.status}/></div><p className="text-xs text-slate-500 mt-2">Requested: {request.requestedItems.join(', ')}</p>{request.dueDate && <p className="text-[11px] text-slate-400 mt-1">Requested by {request.dueDate}</p>}{request.status !== 'Resolved' && !isClosed && <button onClick={() => { const nextRequests = requests.map((item) => item.id === request.id ? { ...item, status: 'Resolved' as const } : item); const allResolved = nextRequests.every((item) => item.status === 'Resolved'); updateBooking(booking.ref, { ...booking, informationRequests: nextRequests, missingInformation: allResolved ? 'No' : 'Yes', status: allResolved ? 'New Booking' : 'Information Required', activity: [...(booking.activity ?? []), { id: `${booking.ref}-resolved-${Date.now()}`, date: 'Just now', title: 'Information request resolved', detail: `${request.subject} marked resolved.` }] }); showToast(allResolved ? 'Information resolved. Booking is ready to continue.' : 'Information request marked resolved.') }} className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700">Mark resolved</button>}</div>)}</div> : <Empty text="No information requests have been sent."/>}
        </section>

        <section className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">Activity history</h2>{!isClosed && <button onClick={()=>setModal('note')} className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"><StickyNote size={13}/> Add note</button>}</div>
          <div className="space-y-3">{activities.map((item)=><div key={item.id} className="flex gap-3"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"/><div><p className="text-[11px] text-slate-400">{item.date}</p><p className="text-xs font-medium text-slate-700 mt-0.5">{item.title}</p><p className="text-xs text-slate-500 mt-0.5">{item.detail}</p></div></div>)}</div>
        </section>
      </main>

      <aside className="space-y-4">
        <section className="bg-white border border-slate-200 rounded-xl p-4"><div className="flex items-center justify-between gap-2 mb-2"><h2 className="text-sm font-semibold text-slate-900">Continue workflow</h2><span className="text-[10px] font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">Next step</span></div><p className="text-xs text-slate-500 leading-5 mb-3">{workflowAction.hint}</p><button disabled={booking.status === 'Cancelled'} onClick={workflowAction.action} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white text-xs font-semibold">{workflowAction.label} →</button></section>
        <section className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-sm font-semibold text-slate-900 mb-3">Instruction contacts</h2><div className="space-y-3"><div><p className="text-[11px] uppercase tracking-wide text-slate-400">Patient</p><p className="text-sm font-medium text-slate-700 mt-1">{linkedPatient?.name ?? booking.patient}</p>{linkedPatient && <p className="text-xs text-slate-500 mt-1">{linkedPatient.email} · {linkedPatient.phone}</p>}</div><div className="pt-3 border-t border-slate-100"><p className="text-[11px] uppercase tracking-wide text-slate-400">Medical expert</p><p className="text-sm font-medium text-slate-700 mt-1">{linkedDoctor?.name ?? booking.doctor}</p>{linkedDoctor && <p className="text-xs text-slate-500 mt-1">{linkedDoctor.speciality} · {linkedDoctor.location}</p>}</div><div className="pt-3 border-t border-slate-100"><p className="text-[11px] uppercase tracking-wide text-slate-400">Client / instructing party</p>{linkedClient ? <div className="mt-1 space-y-1"><p className="text-sm font-medium text-slate-700">{linkedClient.primaryContact}</p><p className="text-xs text-slate-500 break-all">{linkedClient.email}</p><p className="text-xs text-slate-500">{linkedClient.phone}</p></div> : <p className="text-xs text-slate-400 mt-1">Direct instruction / no linked client organisation.</p>}</div></div></section>
        <section className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-sm font-semibold text-slate-900 mb-3">Linked case</h2>{linkedCase ? <div><p className="text-sm font-semibold text-slate-800">{linkedCase.ref}</p><div className="mt-2 flex items-center justify-between gap-2"><StatusBadge status={linkedCase.status}/><span className="text-[11px] text-slate-400">Managed from the case workflow</span></div></div> : <><p className="text-xs text-slate-400 mb-3">Create a case when the booking is ready to enter the operational workflow.</p><button disabled={booking.status === 'Cancelled'} onClick={()=>setConfirmAction('convert')} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:text-slate-300"><UserRoundPlus size={13}/> Convert to case</button></>}</section>
        {booking.status !== 'Cancelled' && booking.status !== 'Converted to Case' && <button onClick={()=>setConfirmAction('cancel')} className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-red-600 hover:bg-red-50">Cancel booking</button>}
      </aside>
    </div>

    {viewingDoc && <Modal title={viewingDoc.name} description={`${booking.ref} · Booking document`} onClose={()=>setViewingDoc(null)}><div className="space-y-3"><div className="grid grid-cols-2 gap-3 text-xs"><div><p className={label}>Category</p><p className={value}>{viewingDoc.category}</p></div><div><p className={label}>Size</p><p className={value}>{viewingDoc.size}</p></div><div><p className={label}>Uploaded by</p><p className={value}>{viewingDoc.uploadedBy}</p></div><div><p className={label}>Uploaded</p><p className={value}>{viewingDoc.uploadedAt}</p></div></div><div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center text-center"><FileText size={22} className="text-slate-300 mb-2"/><p className="text-xs text-slate-400">Preview isn't available in this prototype — the original file isn't retained.</p></div><div className="flex justify-end gap-2 pt-3 border-t border-slate-100"><button onClick={()=>setViewingDoc(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Close</button><button onClick={()=>{downloadBookingDoc(viewingDoc, booking.ref); showToast(`${viewingDoc.name} downloaded.`)}} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg"><Download size={14}/> Download</button></div></div></Modal>}
    {modal === 'edit' && <EditBookingModal booking={booking} existingBookings={bookings} onClose={()=>setModal(null)} onSave={(next)=>saveBooking(next,'Booking changes saved.')}/>} 
    {modal === 'request' && <RequestInformationModal booking={booking} clients={clients} onClose={()=>setModal(null)} onSend={(request)=>saveBooking({...booking,status:'Information Required',missingInformation:'Yes',informationRequests:[...(booking.informationRequests??[]),request],activity:[...(booking.activity??[]),{id:`${booking.ref}-request-${Date.now()}`,date:'31 Aug 2026 · Just now',title:'Information requested',detail:`Request sent to ${request.recipient}: ${request.requestedItems.join(', ')}.`}]},'Information request recorded and sent in the prototype.')}/>} 
    {modal === 'appointment' && <BookingAppointmentModal booking={booking} bookings={bookings} onClose={()=>setModal(null)} onSave={(next)=>saveBooking(next, booking.appointmentDate === '—' ? 'Appointment scheduled.' : 'Appointment rescheduled.')}/>} 
    {modal === 'upload' && <BookingUploadDocumentsModal booking={booking} onClose={()=>setModal(null)} onUpload={(docs)=>saveBooking({...booking,documents:[...(booking.documents??[]),...docs],activity:[...(booking.activity??[]),{id:`${booking.ref}-upload-${Date.now()}`,date:'31 Aug 2026 · Just now',title:'Documents uploaded',detail:`${docs.length} document${docs.length>1?'s':''} added to the booking.`}]},`${docs.length} document${docs.length>1?'s':''} uploaded.`)}/>} 
    {modal === 'note' && <Modal title="Add booking note" description={`${booking.ref} · Internal administration note`} onClose={()=>{setModal(null);setNote('')}}><label className="block text-xs font-medium text-slate-500 mb-1.5">Note *</label><textarea autoFocus rows={4} value={note} onChange={(e)=>setNote(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" placeholder="Record the booking update or decision..."/><div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={()=>{setModal(null);setNote('')}} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button disabled={!note.trim()} onClick={()=>{updateBooking(booking.ref,{...booking,activity:[...(booking.activity??[]),{id:`${booking.ref}-note-${Date.now()}`,date:'31 Aug 2026 · Just now',title:'Internal note added',detail:note.trim()}]});setModal(null);setNote('');showToast('Booking note added.')}} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 rounded-lg">Add note</button></div></Modal>}

    {confirmAction && <Modal title={confirmAction === 'cancel' ? 'Cancel booking' : 'Convert booking to case'} description={confirmAction === 'cancel' ? 'Cancel the booking while retaining its full history.' : 'This marks the booking as transferred to case management.'} onClose={()=>{setConfirmAction(null);setCancellationReason('');setCancellationComments('')}}>{confirmAction==='cancel'?<div className="space-y-4"><div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"><strong>Confirmation warning:</strong> Cancelling stops this booking workflow. The booking and cancellation record remain available for audit.</div><div><label className="block text-xs font-medium text-slate-600 mb-1.5">Cancellation reason *</label><select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white" value={cancellationReason} onChange={e=>setCancellationReason(e.target.value)}><option value="">Select reason</option><option>Client cancelled instruction</option><option>Duplicate booking</option><option>Patient unavailable</option><option>Unable to proceed</option><option>Created in error</option><option>Other</option></select></div><div><label className="block text-xs font-medium text-slate-600 mb-1.5">Additional comments</label><textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={cancellationComments} onChange={e=>setCancellationComments(e.target.value)} placeholder="Record any supporting context for the audit history…"/></div></div>:<p className="text-sm text-slate-600">Confirm this action for <strong>{booking.ref}</strong> — {booking.patient}.</p>}<div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={()=>{setConfirmAction(null);setCancellationReason('');setCancellationComments('')}} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Back</button><button disabled={confirmAction==='cancel'&&!cancellationReason} onClick={()=>{
      if (confirmAction === 'cancel') {
        const detail=`Reason: ${cancellationReason}.${cancellationComments.trim()?` Comments: ${cancellationComments.trim()}`:''}`
        updateBooking(booking.ref,{...booking,status:'Cancelled',activity:[...(booking.activity??[]),{id:`${booking.ref}-cancel-${Date.now()}`,date:'Just now',title:'Booking cancelled',detail}]})
        setConfirmAction(null); setCancellationReason(''); setCancellationComments(''); showToast('Booking cancelled.'); return
      }
      if (!booking.doctor || booking.doctor === 'Unassigned') { setConfirmAction(null); setModal('edit'); showToast('Assign a doctor before creating the case.'); return }
      const existing = cases.find((item) => item.bookingRef === booking.ref)
      if (existing) { setConfirmAction(null); navigate(`/cases/${existing.ref}`); return }
      const refs = cases.map((item) => Number(item.ref.split('-').pop())).filter(Number.isFinite)
      const nextNumber = Math.max(1199, ...refs) + 1
      const newCase = {
        ref: `EM-2026-${nextNumber}`, bookingRef: booking.ref, clientRef: booking.client && !booking.client.startsWith('Direct /') ? `BK-${booking.ref.split('-').pop()}` : `DIRECT-${booking.ref.split('-').pop()}`,
        patient: booking.patient, client: booking.client || 'Direct / no instructing organisation', doctor: booking.doctor, caseType: booking.caseType,
        status: (booking.appointmentDate !== '—' ? 'Appointment Scheduled' : booking.appointmentRequired === false ? 'Documents Pending' : 'Appointment Pending') as CaseStatus, priority: booking.priority, owner: booking.owner,
        targetDate: booking.targetCompletionDate || booking.reportDueDate || 'Not set', lastUpdated: 'Just now', documents: booking.documents?.length ?? 0, tasks: 0, qaComments: 0, statusHistory: [],
      }
      addCase(newCase)
      const transferred = (booking.documents ?? []).map((doc, index) => ({ id: `${newCase.ref}-BOOKING-DOC-${index + 1}-${Date.now()}`, name: doc.name, caseRef: newCase.ref, patient: booking.patient, category: doc.category || 'Initial document', uploadedBy: doc.uploadedBy, uploadDate: doc.uploadedAt, version: 'v1', size: doc.size, status: 'Not Started' as const, aiStatus: 'Not Started' as const, notes: `Transferred from booking ${booking.ref}.` }))
      if (transferred.length) addDocuments(transferred)
      if (booking.appointmentDate !== '—' && booking.appointmentTime && !appointments.some((item) => item.caseRef === newCase.ref && item.date === booking.appointmentDate)) {
        addAppointment({ id: `APT-${Date.now()}`, caseRef: newCase.ref, patient: booking.patient, doctor: booking.doctor, date: booking.appointmentDate, time: booking.appointmentTime, type: booking.appointmentType || 'Initial Examination', location: booking.appointmentLocation || 'Location to confirm', status: 'Scheduled', consultationMethod: booking.appointmentMethod, interpreterRequired: booking.interpreterRequired, notes: booking.appointmentNotes, history: [{ id: `APH-${Date.now()}`, date: 'Just now', action: 'Appointment transferred from booking', detail: `${booking.appointmentDate} · ${booking.appointmentTime}` }] })
      }
      updateBooking(booking.ref,{...booking,status:'Converted to Case',activity:[...(booking.activity??[]),{id:`${booking.ref}-converted-${Date.now()}`,date:'Just now',title:'Booking converted to case',detail:`Operational case ${newCase.ref} created and linked to this booking.`}]})
      setConfirmAction(null); showToast(`Case ${newCase.ref} created. Booking documents transferred; continue the workflow from the case.`); navigate(`/cases/${newCase.ref}`)
    }} className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${confirmAction==='cancel'?'bg-red-600 hover:bg-red-700':'bg-brand-600 hover:bg-brand-700'}`}>{confirmAction==='cancel'?'Cancel booking':'Create case & continue'}</button></div></Modal>}
  </div>
}

function Info({labelText,valueText}:{labelText:string;valueText:string}){return <div className="min-w-0"><p className={label}>{labelText}</p><p className={`${value} break-words`}>{valueText}</p></div>}
function Empty({text}:{text:string}){return <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-3 text-xs text-slate-400">{text}</div>}
