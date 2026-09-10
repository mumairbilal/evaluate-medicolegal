import { useMemo, useRef, useState } from 'react'
import { Search, BookOpen, CalendarDays, FolderKanban, FileText, ShieldCheck, LifeBuoy, ChevronRight, Paperclip, CheckCircle2, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { cases } from '../data/mockData'

const guides = [
  { title: 'Getting started', desc: 'Set up your account and understand the dashboard.', icon: BookOpen, body: 'Start from your role dashboard, use Global Search for records, and use the Create menu for common actions. Navigation and available actions change with your role.' },
  { title: 'Booking guide', desc: 'How to create and manage bookings end to end.', icon: CalendarDays, body: 'Create a booking, record patient and client details, assign a medical expert, add appointment requirements and documents, then review before creating the booking and case.' },
  { title: 'Case workflow guide', desc: 'Move a case from new booking through to completion.', icon: FolderKanban, body: 'Use the case timeline and tabs to review ownership, appointments, documents, file preparation, reports, QA, tasks, communication and activity history before completing the case.' },
  { title: 'Document preparation guide', desc: 'Upload, organise, and prepare case files.', icon: FileText, body: 'Upload documents, classify them, review duplicates and missing items, check AI summaries, reorder the preparation copy, generate a bundle, preview it and mark the file ready.' },
  { title: 'Report and QA guide', desc: 'Create reports and follow the QA review process.', icon: ShieldCheck, body: 'Create a report from an approved template, review populated case data and source documents, save drafts, submit to QA, resolve amendments, approve the final report and record delivery.' },
  { title: 'Account help', desc: 'Manage your profile, password, and notifications.', icon: LifeBuoy, body: 'Use My Profile to update contact details, change your password, choose notification and table preferences, and review your recent activity.' },
]

export default function Help() {
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [category, setCategory] = useState('Account access')
  const [relatedCase, setRelatedCase] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [attachment, setAttachment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return !q ? guides : guides.filter((g) => `${g.title} ${g.desc} ${g.body}`.toLowerCase().includes(q))
  }, [query])

  const submit = () => {
    if (!subject.trim()) { setError('Enter a short subject so the support team can identify the issue.'); return }
    if (description.trim().length < 10) { setError('Add a little more detail about what happened and what you were trying to do.'); return }
    setError(''); setSubmitted(true); showToast('Support request submitted. The support team will respond by email.')
  }

  return <div className="space-y-5 max-w-6xl mx-auto">
    <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center">
      <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-2">Help centre</p>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">How can we help you today?</h2>
      <p className="text-sm text-slate-500 mb-4">Search the built-in workflow guides or contact support.</p>
      <div className="relative max-w-xl mx-auto">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search help articles..." className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
        {query && <button onClick={()=>setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Clear help search"><X size={14}/></button>}
      </div>
      {query && <p className="text-xs text-slate-400 mt-2">{filtered.length} article{filtered.length===1?'':'s'} match “{query}”</p>}
    </section>

    {filtered.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filtered.map((g) => {
      const open = active === g.title
      return <button key={g.title} onClick={()=>setActive(open?null:g.title)} className={`surface-hover text-left bg-white rounded-xl border p-5 transition-all ${open?'border-brand-200 ring-2 ring-brand-500/10':'border-slate-200 hover:border-brand-200 hover:shadow-sm'}`}>
        <div className="flex items-start justify-between gap-3"><div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center"><g.icon size={18}/></div><ChevronRight size={16} className={`text-slate-300 transition-transform ${open?'rotate-90 text-brand-600':''}`}/></div>
        <p className="font-medium text-slate-800 mt-3 mb-1">{g.title}</p><p className="text-sm text-slate-500">{g.desc}</p>{open&&<p className="text-xs leading-5 text-slate-600 mt-3 pt-3 border-t border-slate-100">{g.body}</p>}
      </button>
    })}</div> : <section className="bg-white rounded-xl border border-slate-200 p-10 text-center"><Search size={24} className="mx-auto text-slate-300"/><p className="text-sm font-medium text-slate-700 mt-3">No help articles match “{query}”</p><p className="text-xs text-slate-400 mt-1">Check spelling or try terms such as booking, case, documents, report, QA or account.</p><button onClick={()=>setQuery('')} className="mt-4 px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Clear search</button></section>}

    <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900 mb-1">Contact support</p><p className="text-sm text-slate-500">Record the issue and optionally attach a supporting file.</p></div>{submitted&&<span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full"><CheckCircle2 size={13}/> Submitted</span>}</div>
      {error&&<p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid md:grid-cols-2 gap-4 mt-4 max-w-3xl">
        <div><label className="text-xs font-medium text-slate-500">Issue category *</label><select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"><option>Account access</option><option>Booking or case</option><option>Documents</option><option>Reports and QA</option><option>Calendar or appointment</option><option>Other</option></select></div>
        <div><label className="text-xs font-medium text-slate-500">Related case</label><select value={relatedCase} onChange={(e)=>setRelatedCase(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"><option value="">No related case</option>{cases.map((item)=><option key={item.ref} value={item.ref}>{item.ref} — {item.patient}</option>)}</select></div>
        <div className="md:col-span-2"><label className="text-xs font-medium text-slate-500">Subject *</label><input value={subject} onChange={(e)=>setSubject(e.target.value)} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Brief summary of the issue" /></div>
        <div className="md:col-span-2"><label className="text-xs font-medium text-slate-500">Description *</label><textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={4} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Describe what happened, what you expected, and any error shown..." /></div>
        <div className="md:col-span-2"><label className="text-xs font-medium text-slate-500">Attachment</label><input ref={fileRef} type="file" className="hidden" onChange={(e)=>setAttachment(e.target.files?.[0]?.name ?? '')}/><button onClick={()=>fileRef.current?.click()} className="mt-1 w-full rounded-lg border border-dashed border-slate-300 px-3 py-3 text-left text-sm text-slate-500 hover:border-brand-300 hover:bg-brand-50/30"><span className="inline-flex items-center gap-2"><Paperclip size={15}/>{attachment || 'Attach screenshot or supporting file'}</span></button></div>
      </div>
      <div className="flex items-center gap-2 mt-4"><button onClick={submit} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg">Submit request</button>{submitted&&<button onClick={()=>{setSubmitted(false);setSubject('');setDescription('');setRelatedCase('');setAttachment('')}} className="text-xs text-slate-500 hover:text-brand-700">Create another request</button>}</div>
      <p className="text-[11px] text-slate-400 mt-3">Category: {category}{relatedCase?` · ${relatedCase}`:''}. Support submissions are recorded in this prototype only.</p>
    </section>
  </div>
}
