import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, FilePlus2, MessageSquarePlus, Pencil, StickyNote, UserRoundPlus } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import Modal from '../components/Modal'
import EditBookingModal from '../components/EditBookingModal'
import BookingAppointmentModal from '../components/BookingAppointmentModal'
import RequestInformationModal from '../components/RequestInformationModal'
import BookingUploadDocumentsModal from '../components/BookingUploadDocumentsModal'
import { useToast } from '../context/ToastContext'
import { usePrototypeData } from '../context/PrototypeDataContext'

const actionClass = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50'
const label = 'text-[11px] uppercase tracking-wide text-slate-400'
const value = 'text-sm font-medium text-slate-800 mt-1'

type ModalType = 'edit' | 'appointment' | 'request' | 'upload' | 'note' | null

export default function BookingDetail() {
  const { ref } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { bookings, clients, updateBooking } = usePrototypeData()
  const booking = useMemo(() => bookings.find((item) => item.ref === ref), [bookings, ref])
  const [modal, setModal] = useState<ModalType>(null)
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'convert' | null>(null)
  const [note, setNote] = useState('')

  if (!booking) {
    return <div className="bg-white border border-slate-200 rounded-xl p-8 text-center"><p className="text-sm font-medium text-slate-800">Booking not found</p><p className="text-xs text-slate-400 mt-1">The requested booking reference is not available.</p><Link to="/bookings" className="inline-flex mt-4 text-sm font-medium text-brand-600 hover:text-brand-700">Back to bookings</Link></div>
  }

  const linkedClient = clients.find((client) => client.name === booking.client)
  const requests = booking.informationRequests ?? []
  const documents = booking.documents ?? []
  const activities = [...(booking.activity ?? [])].reverse()
  const isClosed = booking.status === 'Cancelled' || booking.status === 'Converted to Case'
  const requiredActions = booking.status === 'Information Required'
    ? ['Await requested information', ...(booking.appointmentDate === '—' ? ['Confirm appointment requirements'] : [])]
    : booking.appointmentDate === '—' && !isClosed ? ['Confirm whether an appointment is required']
    : ['No urgent booking actions outstanding']

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
          <p className="text-xs text-slate-400 mt-1">{booking.patient} · {booking.client}</p>
        </div>
        {!isClosed && <div className="flex items-center gap-2 flex-wrap justify-end">
          <button className={actionClass} onClick={()=>setModal('edit')}><Pencil size={13}/> Edit</button>
          <button className={actionClass} onClick={()=>setModal('appointment')}><CalendarDays size={13}/> {booking.appointmentDate === '—' ? 'Schedule' : 'Reschedule'}</button>
          <button className={actionClass} onClick={()=>setModal('upload')}><FilePlus2 size={13}/> Upload</button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium" onClick={()=>setModal('request')}><MessageSquarePlus size={13}/> Request information</button>
        </div>}
      </div>
    </header>

    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
      <main className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <section className="p-4">
          <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">Booking overview</h2><span className="text-[11px] text-slate-400">Booked {booking.bookingDate} via {booking.source}</span></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-4">
            <Info labelText="Patient" valueText={booking.patient}/><Info labelText="Client" valueText={booking.client}/><Info labelText="Case type" valueText={booking.caseType}/><Info labelText="Priority" valueText={booking.priority}/>
            <Info labelText="Medical expert" valueText={booking.doctor}/><Info labelText="Case owner" valueText={booking.owner}/><Info labelText="Agreed fee" valueText={booking.agreedFee || 'Not recorded'}/><Info labelText="Missing information" valueText={booking.missingInformation}/>
          </div>
          {(booking.notes || booking.reportDueDate || booking.targetCompletionDate) && <div className="mt-4 pt-3 border-t border-slate-100 grid sm:grid-cols-3 gap-4"><Info labelText="Report due" valueText={booking.reportDueDate || 'Not set'}/><Info labelText="Target completion" valueText={booking.targetCompletionDate || 'Not set'}/><Info labelText="Internal note" valueText={booking.notes || 'None'}/></div>}
        </section>

        <section className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">Appointment</h2>{!isClosed && <button onClick={()=>setModal('appointment')} className="text-xs font-medium text-brand-600 hover:text-brand-700">{booking.appointmentDate === '—' ? 'Schedule appointment' : 'Edit appointment'}</button>}</div>
          {booking.appointmentDate === '—' ? <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-3"><p className="text-sm text-slate-600">No appointment has been scheduled.</p><p className="text-xs text-slate-400 mt-1">Use Schedule to select doctor, date, time, method, location and interpreter requirements.</p></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><Info labelText="Date" valueText={booking.appointmentDate}/><Info labelText="Time" valueText={booking.appointmentTime || 'Time not recorded'}/><Info labelText="Method" valueText={booking.appointmentMethod || 'Not recorded'}/><Info labelText="Location" valueText={booking.appointmentLocation || 'Not recorded'}/><Info labelText="Type" valueText={booking.appointmentType || 'Initial Examination'}/><Info labelText="Doctor" valueText={booking.doctor}/><Info labelText="Interpreter" valueText={booking.interpreterRequired ? 'Required' : 'Not required'}/><Info labelText="Status" valueText="Scheduled"/></div>}
        </section>

        <section className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-semibold text-slate-900">Documents</h2><p className="text-[11px] text-slate-400 mt-0.5">{documents.length} file{documents.length === 1 ? '' : 's'} attached to this booking</p></div>{!isClosed && <button onClick={()=>setModal('upload')} className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"><FilePlus2 size={13}/> Upload documents</button>}</div>
          {documents.length ? <div className="border border-slate-100 rounded-lg divide-y divide-slate-100">{documents.map((doc)=><div key={doc.id} className="grid grid-cols-[minmax(0,1fr)_140px_110px] gap-3 items-center px-3 py-2.5 text-xs"><div className="min-w-0"><p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p><p className="text-[11px] text-slate-400 mt-0.5">Uploaded by {doc.uploadedBy} · {doc.uploadedAt}</p></div><span className="text-slate-500">{doc.category}</span><span className="text-slate-400 text-right">{doc.size}</span></div>)}</div> : <Empty text="No booking documents uploaded yet."/>}
        </section>

        <section className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3"><div><h2 className="text-sm font-semibold text-slate-900">Information requests</h2><p className="text-[11px] text-slate-400 mt-0.5">Requests sent to obtain missing instruction information.</p></div>{!isClosed && <button onClick={()=>setModal('request')} className="text-xs font-medium text-brand-600 hover:text-brand-700">New request</button>}</div>
          {requests.length ? <div className="space-y-2">{requests.map((request)=><div key={request.id} className="border border-slate-100 rounded-lg px-3 py-2.5"><div className="flex justify-between gap-3"><div><p className="text-sm font-medium text-slate-700">{request.subject}</p><p className="text-xs text-slate-400 mt-0.5">To {request.recipient} · {request.email} · {request.sentAt}</p></div><StatusBadge status={request.status}/></div><p className="text-xs text-slate-500 mt-2">Requested: {request.requestedItems.join(', ')}</p>{request.dueDate && <p className="text-[11px] text-slate-400 mt-1">Requested by {request.dueDate}</p>}</div>)}</div> : <Empty text="No information requests have been sent."/>}
        </section>

        <section className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold text-slate-900">Activity history</h2>{!isClosed && <button onClick={()=>setModal('note')} className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"><StickyNote size={13}/> Add note</button>}</div>
          <div className="space-y-3">{activities.map((item)=><div key={item.id} className="flex gap-3"><div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"/><div><p className="text-[11px] text-slate-400">{item.date}</p><p className="text-xs font-medium text-slate-700 mt-0.5">{item.title}</p><p className="text-xs text-slate-500 mt-0.5">{item.detail}</p></div></div>)}</div>
        </section>
      </main>

      <aside className="space-y-4">
        <section className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-sm font-semibold text-slate-900 mb-3">Workflow</h2><div className="space-y-2">{requiredActions.map((item)=><div key={item} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-xs text-slate-600">{item}</div>)}</div></section>
        <section className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-sm font-semibold text-slate-900 mb-3">Client contact</h2>{linkedClient ? <div className="space-y-2"><p className="text-sm font-medium text-slate-700">{linkedClient.primaryContact}</p><p className="text-xs text-slate-500 break-all">{linkedClient.email}</p><p className="text-xs text-slate-500">{linkedClient.phone}</p><Link to={`/clients/${linkedClient.id}`} className="inline-flex text-xs font-medium text-brand-600 hover:text-brand-700 mt-1">Open client profile →</Link></div> : <p className="text-xs text-slate-400">No linked client profile.</p>}</section>
        <section className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-sm font-semibold text-slate-900 mb-3">Linked case</h2>{booking.status === 'Converted to Case' ? <Link to="/cases" className="text-xs font-medium text-brand-600 hover:text-brand-700">Open linked case →</Link> : <><p className="text-xs text-slate-400 mb-3">Create a case when the booking is ready to enter the operational workflow.</p><button disabled={booking.status === 'Cancelled'} onClick={()=>setConfirmAction('convert')} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:text-slate-300"><UserRoundPlus size={13}/> Convert to case</button></>}</section>
        {booking.status !== 'Cancelled' && booking.status !== 'Converted to Case' && <button onClick={()=>setConfirmAction('cancel')} className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-red-600 hover:bg-red-50">Cancel booking</button>}
      </aside>
    </div>

    {modal === 'edit' && <EditBookingModal booking={booking} existingBookings={bookings} onClose={()=>setModal(null)} onSave={(next)=>saveBooking(next,'Booking changes saved.')}/>} 
    {modal === 'appointment' && <BookingAppointmentModal booking={booking} bookings={bookings} onClose={()=>setModal(null)} onSave={(next)=>saveBooking(next,'Appointment saved and booking updated.')}/>} 
    {modal === 'request' && <RequestInformationModal booking={booking} clients={clients} onClose={()=>setModal(null)} onSend={(request)=>saveBooking({...booking,status:'Information Required',missingInformation:'Yes',informationRequests:[...(booking.informationRequests??[]),request],activity:[...(booking.activity??[]),{id:`${booking.ref}-request-${Date.now()}`,date:'31 Aug 2026 · Just now',title:'Information requested',detail:`Request sent to ${request.recipient}: ${request.requestedItems.join(', ')}.`}]},'Information request recorded and sent in the prototype.')}/>} 
    {modal === 'upload' && <BookingUploadDocumentsModal booking={booking} onClose={()=>setModal(null)} onUpload={(docs)=>saveBooking({...booking,documents:[...(booking.documents??[]),...docs],activity:[...(booking.activity??[]),{id:`${booking.ref}-upload-${Date.now()}`,date:'31 Aug 2026 · Just now',title:'Documents uploaded',detail:`${docs.length} document${docs.length>1?'s':''} added to the booking.`}]},`${docs.length} document${docs.length>1?'s':''} uploaded.`)}/>} 
    {modal === 'note' && <Modal title="Add booking note" description={`${booking.ref} · Internal administration note`} onClose={()=>{setModal(null);setNote('')}}><label className="block text-xs font-medium text-slate-500 mb-1.5">Note *</label><textarea autoFocus rows={4} value={note} onChange={(e)=>setNote(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" placeholder="Record the booking update or decision..."/><div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={()=>{setModal(null);setNote('')}} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button disabled={!note.trim()} onClick={()=>{updateBooking(booking.ref,{...booking,activity:[...(booking.activity??[]),{id:`${booking.ref}-note-${Date.now()}`,date:'31 Aug 2026 · Just now',title:'Internal note added',detail:note.trim()}]});setModal(null);setNote('');showToast('Booking note added.')}} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 rounded-lg">Add note</button></div></Modal>}

    {confirmAction && <Modal title={confirmAction === 'cancel' ? 'Cancel booking' : 'Convert booking to case'} description={confirmAction === 'cancel' ? 'This stops the booking workflow.' : 'This marks the booking as transferred to case management.'} onClose={()=>setConfirmAction(null)}><p className="text-sm text-slate-600">Confirm this action for <strong>{booking.ref}</strong> — {booking.patient}.</p><div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={()=>setConfirmAction(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Back</button><button onClick={()=>{const status=confirmAction==='cancel'?'Cancelled':'Converted to Case';updateBooking(booking.ref,{...booking,status,activity:[...(booking.activity??[]),{id:`${booking.ref}-${status}-${Date.now()}`,date:'31 Aug 2026 · Just now',title:status==='Cancelled'?'Booking cancelled':'Booking converted to case',detail:status==='Cancelled'?'Booking workflow cancelled by an authorised user.':'Booking moved into the case management workflow.'}]});setConfirmAction(null);showToast(status==='Cancelled'?'Booking cancelled.':'Booking converted to case.')}} className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${confirmAction==='cancel'?'bg-red-600 hover:bg-red-700':'bg-brand-600 hover:bg-brand-700'}`}>{confirmAction==='cancel'?'Cancel booking':'Convert to case'}</button></div></Modal>}
  </div>
}

function Info({labelText,valueText}:{labelText:string;valueText:string}){return <div className="min-w-0"><p className={label}>{labelText}</p><p className={`${value} break-words`}>{valueText}</p></div>}
function Empty({text}:{text:string}){return <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-3 text-xs text-slate-400">{text}</div>}
