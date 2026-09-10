import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, Phone, StickyNote, MessageCircle, Bell, Paperclip, Eye, Inbox, Link2, Plus } from 'lucide-react'
import PageToolbar from '../components/PageToolbar'
import AddCommunicationModal from '../components/AddCommunicationModal'
import CommunicationDetailsModal from '../components/CommunicationDetailsModal'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useTableFilter } from '../hooks/useTableFilter'
import { useToast } from '../context/ToastContext'

const icons: Record<string, any> = {
  Email: Mail,
  'Phone Call': Phone,
  'Internal Note': StickyNote,
  Client: MessageCircle,
  Patient: MessageCircle,
  Doctor: MessageCircle,
  'System Notification': Bell,
}

const savedViews = [
  { key: 'all', label: 'All communication' },
  { key: 'internal', label: 'Internal notes' },
  { key: 'external', label: 'External communication' },
  { key: 'system', label: 'System activity' },
]
const sortOptions = [
  { key: 'recent', label: 'Most recent' },
  { key: 'case', label: 'Case reference' },
  { key: 'type', label: 'Communication type' },
]

export default function Communication() {
  const [searchParams, setSearchParams] = useSearchParams()
  const scopedCase = searchParams.get('case') ?? ''
  const { communications, cases } = usePrototypeData()
  const { showToast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savedView, setSavedView] = useState('all')
  const [sort, setSort] = useState('recent')
  const [mode, setMode] = useState<'timeline'|'email-inbox'>('timeline')
  const [emailMatches, setEmailMatches] = useState<Record<string,string>>({ 'EML-1001':'EM-2026-1196' })

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setAddOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const visible = useMemo(() => communications.filter((item) => {
    if (scopedCase && item.caseRef !== scopedCase) return false
    if (savedView === 'internal') return item.internal && item.type !== 'System Notification'
    if (savedView === 'external') return !item.internal
    if (savedView === 'system') return item.type === 'System Notification'
    return true
  }), [communications, savedView, scopedCase])

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable } =
    useTableFilter(visible, ['caseRef', 'from', 'to', 'subject', 'summary'], [
      { key: 'type', label: 'Communication type', options: [...new Set(communications.map((c) => c.type))] },
      { key: 'caseRef', label: 'Case', options: [...new Set(communications.map((c) => c.caseRef))] },
    ])

  const rows = useMemo(() => [...filtered].sort((a, b) => {
    if (sort === 'case') return a.caseRef.localeCompare(b.caseRef)
    if (sort === 'type') return a.type.localeCompare(b.type)
    return b.id.localeCompare(a.id)
  }), [filtered, sort])

  const emailInbox = [
    { id:'EML-1001', sender:'claims@oakwoodlegal.co.uk', subject:'Updated instruction and chronology documents', date:'31 Aug 2026 16:14', attachments:['updated-instruction.pdf','chronology.docx'] },
    { id:'EML-1002', sender:'litigation@northbridge.co.uk', subject:'New medicolegal instruction — Sarah Whitmore', date:'31 Aug 2026 11:02', attachments:['letter-of-instruction.pdf'] },
    { id:'EML-1003', sender:'records@westfieldhospital.nhs.uk', subject:'Medical records release for EM-2026-1184', date:'30 Aug 2026 15:48', attachments:['records-part-1.pdf','records-part-2.pdf'] },
  ]

  return (
    <div>
      {scopedCase && <div className="mb-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-800">Communication for <strong>{scopedCase}</strong></div>}
      <div className="mb-3 flex gap-1 border-b border-slate-200 overflow-x-auto">
        <button onClick={()=>setMode('timeline')} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${mode==='timeline'?'border-brand-600 text-brand-700':'border-transparent text-slate-500'}`}><MessageCircle size={14}/> Communication</button>
        <button onClick={()=>setMode('email-inbox')} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${mode==='email-inbox'?'border-brand-600 text-brand-700':'border-transparent text-slate-500'}`}><Inbox size={14}/> Email integration inbox <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">Advanced</span></button>
      </div>
      {mode==='timeline' && <>
      <PageToolbar
        searchPlaceholder="Search communication by case, sender, recipient, subject or notes..."
        searchValue={search}
        onSearchChange={setSearch}
        resultCount={rows.length}
        actionLabel="Add communication"
        onAction={() => setAddOpen(true)}
        filterDefs={filterDefs}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        dateFilterAvailable={dateFilterAvailable}
        savedViews={savedViews}
        activeSavedView={savedView}
        onSelectSavedView={setSavedView}
        sortOptions={sortOptions}
        activeSort={sort}
        onSortChange={setSort}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100"><p className="text-sm font-semibold text-slate-800">Communication timeline</p><p className="text-xs text-slate-400 mt-0.5">Emails, calls, internal notes, patient/client/doctor contact and system activity are recorded together with clear visibility labels.</p></div>
        <div className="p-4 space-y-1">
          {rows.map((c, index) => {
            const Icon = icons[c.type] ?? MessageCircle
            return <div key={c.id} className="group flex gap-3 py-3 relative">
              {index < rows.length - 1 && <div className="absolute left-[15px] top-10 bottom-[-12px] w-px bg-slate-100" />}
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 relative z-[1]"><Icon size={14} className="text-slate-500" /></div>
              <div className="flex-1 border-b border-slate-100 pb-4 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium text-slate-800">{c.subject}</p>{c.internal && <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Internal Only</span>}{!c.internal && <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">External</span>}{c.attachment && <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Paperclip size={10} /> {c.attachment}</span>}</div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.from} → {c.to} · <Link to={`/cases/${c.caseRef}`} className="text-brand-600 font-medium hover:text-brand-700">{c.caseRef}</Link> · {c.type}</p>
                  </div>
                  <div className="flex items-center gap-3"><span className="text-xs text-slate-400">{c.date}</span><button onClick={() => setSelectedId(c.id)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 opacity-70 group-hover:opacity-100"><Eye size={12} /> Details</button></div>
                </div>
                <p className="text-sm text-slate-600 mt-1.5 leading-6">{c.summary}</p>
                {c.followUpTaskId && <p className="text-[11px] text-brand-600 mt-1.5">Follow-up task linked: {c.followUpTaskId}</p>}
              </div>
            </div>
          })}
          {rows.length === 0 && <p className="text-center text-slate-400 text-sm py-10">No communication matches the current search, filters or view.</p>}
        </div>
      </div>

      </>}

      {mode==='email-inbox' && <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100"><p className="text-sm font-semibold text-slate-800">Email integration inbox</p><p className="text-xs text-slate-400 mt-0.5">Connected case-related email with match status, attachments and booking intake actions.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-sm"><thead><tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-400"><th className="px-4 py-3">Sender</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Attachments</th><th className="px-4 py-3">Case match status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{emailInbox.map(email=>{const matched=emailMatches[email.id];return <tr key={email.id} className="hover:bg-slate-50"><td className="px-4 py-3 text-slate-600">{email.sender}</td><td className="px-4 py-3"><p className="font-medium text-slate-800">{email.subject}</p></td><td className="px-4 py-3 text-slate-500">{email.date}</td><td className="px-4 py-3 text-slate-500">{email.attachments.map(a=><span key={a} className="mr-1.5 inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-1 text-[10px]"><Paperclip size={9}/>{a}</span>)}</td><td className="px-4 py-3">{matched?<span className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-medium text-teal-700">Matched · {matched}</span>:<span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">Unmatched</span>}</td><td className="px-4 py-3"><div className="flex justify-end gap-2">{!matched&&<select aria-label={`Match ${email.subject} to case`} className="max-w-44 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600" defaultValue="" onChange={e=>{if(e.target.value){setEmailMatches(prev=>({...prev,[email.id]:e.target.value}));showToast(`Email matched to ${e.target.value}.`)}}}><option value="">Match to Case…</option>{cases.map(c=><option key={c.ref} value={c.ref}>{c.ref} · {c.patient}</option>)}</select>}<Link to="/bookings?new=1" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-brand-700"><Plus size={12}/> Create New Booking</Link>{matched&&<button onClick={()=>showToast(`Email ${email.id} already matched to ${matched}.`)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600"><Link2 size={12}/> Matched</button>}</div></td></tr>})}</tbody></table></div>
      </section>}

      {addOpen && <AddCommunicationModal defaultCaseRef={scopedCase} onClose={() => setAddOpen(false)} />}
      {selectedId && <CommunicationDetailsModal communicationId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
