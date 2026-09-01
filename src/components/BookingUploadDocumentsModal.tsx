import { useRef, useState } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'
import Modal from './Modal'
import type { Booking, BookingDocument } from '../types'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-xs font-medium text-slate-500 mb-1.5'
const MAX_MB = 25
const ALLOWED = ['pdf','doc','docx','jpg','jpeg','png','txt']
function size(bytes:number){ return bytes < 1024*1024 ? `${Math.max(1,Math.round(bytes/1024))} KB` : `${(bytes/1024/1024).toFixed(1)} MB` }

export default function BookingUploadDocumentsModal({ booking, onClose, onUpload }:{ booking:Booking; onClose:()=>void; onUpload:(docs:BookingDocument[])=>void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files,setFiles]=useState<File[]>([])
  const [category,setCategory]=useState('Medical Records')
  const [error,setError]=useState('')
  const accept=(list:FileList|null)=>{
    if(!list)return
    const next=Array.from(list)
    const bad=next.find((f)=>!ALLOWED.includes((f.name.split('.').pop()||'').toLowerCase()) || f.size>MAX_MB*1024*1024)
    if(bad){ setError(`${bad.name} is not an accepted file or exceeds ${MAX_MB} MB.`); return }
    setFiles((current)=>[...current,...next]);setError('')
  }
  const upload=()=>{
    if(!files.length)return setError('Select at least one document.')
    onUpload(files.map((file,index)=>({id:`${booking.ref}-DOC-${Date.now()}-${index}`,name:file.name,category,size:size(file.size),uploadedAt:'31 Aug 2026 · Just now',uploadedBy:booking.owner==='Unassigned'?'Administration Team':booking.owner})))
  }
  return <Modal title="Upload documents" description={`${booking.ref} · Files will be attached to this booking.`} onClose={onClose} width="max-w-2xl">
    <div className="space-y-4">
      {error&&<p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <div><label className={label}>Document category</label><select className={field} value={category} onChange={(e)=>setCategory(e.target.value)}><option>Medical Records</option><option>Client Instruction</option><option>Identity / Authority</option><option>Appointment Document</option><option>Other</option></select></div>
      <button type="button" onClick={()=>inputRef.current?.click()} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();accept(e.dataTransfer.files)}} className="w-full border border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50"><UploadCloud size={22} className="mx-auto text-brand-600 mb-2"/><span className="block text-sm font-medium text-slate-700">Choose files or drag them here</span><span className="block text-xs text-slate-400 mt-1">PDF, Word, image or text · up to 25 MB each</span></button>
      <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" className="hidden" onChange={(e)=>accept(e.target.files)} />
      {files.length>0&&<div className="border border-slate-200 rounded-lg divide-y divide-slate-100">{files.map((file,index)=><div key={`${file.name}-${index}`} className="flex items-center justify-between px-3 py-2.5"><div className="flex items-center gap-2 min-w-0"><FileText size={14} className="text-slate-400 shrink-0"/><div className="min-w-0"><p className="text-sm text-slate-700 truncate">{file.name}</p><p className="text-xs text-slate-400">{size(file.size)} · {category}</p></div></div><button onClick={()=>setFiles((current)=>current.filter((_,i)=>i!==index))} className="p-1 text-slate-400 hover:text-red-600"><X size={14}/></button></div>)}</div>}
    </div>
    <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button><button onClick={upload} className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg">Upload {files.length?`${files.length} file${files.length>1?'s':''}`:'documents'}</button></div>
  </Modal>
}
