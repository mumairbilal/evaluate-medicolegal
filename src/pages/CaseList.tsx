import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckSquare, FileText, MessageSquareWarning, Eye, UserRoundPlus } from 'lucide-react'
import { usePrototypeData } from '../context/PrototypeDataContext'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import PageToolbar from '../components/PageToolbar'
import NewCaseModal from '../components/NewCaseModal'
import NewTaskModal from '../components/NewTaskModal'
import Modal from '../components/Modal'
import { useTableFilter } from '../hooks/useTableFilter'
import { useToast } from '../context/ToastContext'
import { useRole, roles } from '../context/RoleContext'
import type { CaseRecord } from '../types'
import InlineIconAction from '../components/InlineIconAction'
import { patients as seededPatients } from '../data/mockData'

type CaseRow = CaseRecord & { appointmentDate: string; documentStatus: string; reportStatus: string; qaStatus: string; overdueState: string }

function parseDisplayDate(value: string) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

export default function CaseList() {
  const { cases, appointments, documents, reports, qaQueue, tasks, clients, doctors, addCase, updateCase, addTask } = usePrototypeData()
  const { role } = useRole()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [taskCase, setTaskCase] = useState<CaseRow | null>(null)
  const [actionCase, setActionCase] = useState<CaseRow | null>(null)
  const [actionType, setActionType] = useState<'assign'|null>(null)
  const [actionValue, setActionValue] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [bulkOwner, setBulkOwner] = useState('')
  const [savedView, setSavedView] = useState('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const defaultPatient = searchParams.get('patient') ?? ''
  const defaultClient = searchParams.get('client') ?? ''
  const defaultDoctor = searchParams.get('doctor') ?? ''

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModalOpen(true)
      const next = new URLSearchParams(searchParams); next.delete('new'); setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const roleScopedCases = useMemo(() => {
    if (role.id === 'medical-expert') return cases.filter((item) => item.doctor === role.name)
    if (role.id === 'quality-assurance') {
      const refs = new Set(qaQueue.filter((item) => item.reviewer === role.name || item.reviewer === 'Unassigned').map((item) => item.caseRef))
      return cases.filter((item) => refs.has(item.ref))
    }
    if (role.id === 'file-preparation') return cases.filter((item) => ['Appointment Completed', 'Documents Pending', 'File Preparation in Progress', 'File Ready'].includes(item.status) || item.owner === role.name)
    return cases
  }, [cases, qaQueue, role.id, role.name])

  const rows = useMemo<CaseRow[]>(() => roleScopedCases.map((c) => {
    const caseAppointments = appointments.filter((a) => a.caseRef === c.ref && !a.calendarOnly && a.status !== 'Cancelled')
    const currentAppointment = caseAppointments.find((a) => a.status === 'Scheduled') ?? caseAppointments[0]
    const caseDocuments = documents.filter((d) => d.caseRef === c.ref)
    const caseReport = reports.find((r) => r.caseRef === c.ref)
    const caseQa = qaQueue.find((q) => q.caseRef === c.ref)
    const target = parseDisplayDate(c.targetDate)
    const overdue = target !== null && target < Date.now() && !['Completed','Cancelled','Archived'].includes(c.status)
    const liveTasks = tasks.filter((task) => task.caseRef === c.ref)
    const liveQaComments = qaQueue.filter((item) => item.caseRef === c.ref).reduce((total, item) => total + (item.comments ?? []).filter((comment) => !comment.resolved).length, 0)
    return {
      ...c,
      documents: caseDocuments.length,
      tasks: liveTasks.length,
      qaComments: liveQaComments,
      appointmentDate: currentAppointment?.date ?? 'Not scheduled',
      documentStatus: caseDocuments.length ? (caseDocuments.every((d) => d.status === 'Approved') ? 'Approved / ready' : 'Documents present') : 'No documents',
      reportStatus: caseReport?.status ?? 'No report',
      qaStatus: caseQa?.status ?? caseReport?.qaStatus ?? 'Not Started',
      overdueState: overdue ? 'Overdue' : 'Not overdue',
    }
  }), [roleScopedCases, appointments, documents, reports, qaQueue, tasks])

  const { search, setSearch, filterDefs, activeFilters, toggleFilter, clearFilters, activeFilterCount, filtered, dateRange, setDateRange, dateFilterAvailable, tableSortOptions, activeTableSort, setActiveTableSort } =
    useTableFilter(rows, ['ref','patient','client','clientRef','doctor'], [
      { key:'status', label:'Case status', options:[...new Set(rows.map((c)=>c.status))] },
      { key:'client', label:'Client', options:[...new Set(rows.map((c)=>c.client))] },
      { key:'doctor', label:'Doctor', options:[...new Set(rows.map((c)=>c.doctor))] },
      { key:'owner', label:'Owner', options:[...new Set(rows.map((c)=>c.owner))] },
      { key:'appointmentDate', label:'Appointment date', options:[...new Set(rows.map((c)=>c.appointmentDate))] },
      { key:'targetDate', label:'Target completion date', options:[...new Set(rows.map((c)=>c.targetDate))] },
      { key:'priority', label:'Priority', options:['Standard','High','Urgent'] },
      { key:'caseType', label:'Case type', options:[...new Set(rows.map((c)=>c.caseType))] },
      { key:'documentStatus', label:'Document status', options:[...new Set(rows.map((c)=>c.documentStatus))] },
      { key:'reportStatus', label:'Report status', options:[...new Set(rows.map((c)=>c.reportStatus))] },
      { key:'qaStatus', label:'QA status', options:[...new Set(rows.map((c)=>c.qaStatus))] },
      { key:'overdueState', label:'Overdue only', options:['Overdue'] },
    ])

  useEffect(() => { const query = searchParams.get('q'); if (query) setSearch(query) }, [searchParams, setSearch])

  const viewed = useMemo(() => {
    if (savedView === 'my') return filtered.filter((c) => c.owner === role.name)
    if (savedView === 'overdue') return filtered.filter((c) => c.overdueState === 'Overdue')
    if (savedView === 'unassigned') return filtered.filter((c) => !c.owner || c.owner === 'Unassigned')
    return filtered
  }, [filtered, savedView, role.name])

  const exportCases = () => {
    const headers = ['Case Reference','Client Reference','Patient','Client','Doctor','Appointment Date','Case Status','Owner','Priority','Target Date','Last Updated','Document Status','Report Status','QA Status']
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g,'""')}"`
    const csv = [headers, ...viewed.map((c)=>[c.ref,c.clientRef,c.patient,c.client,c.doctor,c.appointmentDate,c.status,c.owner,c.priority,c.targetDate,c.lastUpdated,c.documentStatus,c.reportStatus,c.qaStatus])].map((r)=>r.map(esc).join(',')).join('\n')
    const blob=new Blob([`\uFEFF${csv}`],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`cases-export-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast(`${viewed.length} case${viewed.length===1?'':'s'} exported.`)
  }

  const openAction = (c: CaseRow) => { setActionCase(c); setActionType('assign'); setActionValue(c.owner) }
  const saveAction = () => {
    if (!actionCase || !actionValue) return
    updateCase(actionCase.ref, (current)=>({ ...current, owner: actionValue, lastUpdated:'Just now' }))
    showToast(`Case assigned to ${actionValue}.`); setActionCase(null); setActionType(null); setActionValue('')
  }
  const applyBulkOwner = () => { if(!bulkOwner||!selected.length)return; selected.forEach(ref=>updateCase(ref,c=>({...c,owner:bulkOwner,lastUpdated:'Just now'}))); showToast(`${selected.length} case(s) assigned to ${bulkOwner}.`); setSelected([]) }
  const canManageCases = ['booking-administrator','operations-manager','system-administrator'].includes(role.id)
  const canCreateCase = ['booking-administrator','operations-manager','system-administrator'].includes(role.id)
  const patientIds = useMemo(() => Object.fromEntries(seededPatients.map((item) => [item.name, item.id])), [])
  const clientIds = useMemo(() => Object.fromEntries(clients.map((item) => [item.name, item.id])), [clients])
  const doctorIds = useMemo(() => Object.fromEntries(doctors.map((item) => [item.name, item.id])), [doctors])
  const canOpenPatients = role.nav.some((section) => section.items.some((item) => item.to === '/patients'))
  const canOpenClients = role.nav.some((section) => section.items.some((item) => item.to === '/clients'))
  const canOpenDoctors = role.nav.some((section) => section.items.some((item) => item.to === '/doctors'))

  return <div className="space-y-4">
    <PageToolbar
      searchPlaceholder="Search cases by reference, patient, client or doctor..." searchValue={search} onSearchChange={setSearch} resultCount={viewed.length}
      actionLabel={canCreateCase ? 'Create case' : undefined} onAction={canCreateCase ? ()=>setModalOpen(true) : undefined} filterDefs={filterDefs} activeFilters={activeFilters} onToggleFilter={toggleFilter} onClearFilters={clearFilters} activeFilterCount={activeFilterCount}
      dateRange={dateRange} onDateRangeChange={setDateRange} dateFilterAvailable={dateFilterAvailable} sortOptions={tableSortOptions} activeSort={activeTableSort} onSortChange={setActiveTableSort}
      savedViews={[{key:'all',label:'All cases'},{key:'my',label:'My cases'},{key:'overdue',label:'Overdue'},{key:'unassigned',label:'Unassigned'}]} activeSavedView={savedView} onSelectSavedView={setSavedView} onExport={exportCases}
    />

    {selected.length>0 && canManageCases && <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 flex flex-wrap items-end gap-2"><p className="mr-auto text-xs font-semibold text-brand-900">{selected.length} case{selected.length===1?'':'s'} selected</p><div><label className="block text-[10px] text-brand-700 mb-1">Bulk assign owner</label><select value={bulkOwner} onChange={e=>setBulkOwner(e.target.value)} className="rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-xs"><option value="">Select owner</option>{roles.filter(r=>r.id!=='management').map(r=><option key={r.id} value={r.name}>{r.name}</option>)}</select></div><button onClick={applyBulkOwner} disabled={!bulkOwner} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">Assign</button><button onClick={()=>setSelected([])} className="px-2 py-1.5 text-xs text-slate-500">Clear</button></div>}

    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1400px] text-sm"><thead><tr className="bg-slate-50 text-left text-[11px] text-slate-500 uppercase tracking-wide">
      <th className="px-3 py-3"><input type="checkbox" aria-label="Select all visible cases" checked={viewed.length>0&&viewed.every(c=>selected.includes(c.ref))} onChange={e=>setSelected(e.target.checked?viewed.map(c=>c.ref):[])}/></th><th className="px-3 py-3 font-medium">Case reference</th><th className="px-3 py-3 font-medium">Client reference</th><th className="px-3 py-3 font-medium">Patient</th><th className="px-3 py-3 font-medium">Client</th><th className="px-3 py-3 font-medium">Doctor</th><th className="px-3 py-3 font-medium">Appointment date</th><th className="px-3 py-3 font-medium">Case status</th><th className="px-3 py-3 font-medium">Owner</th><th className="px-3 py-3 font-medium">Priority</th><th className="px-3 py-3 font-medium">Target completion date</th><th className="px-3 py-3 font-medium">Last updated</th><th className="px-3 py-3 font-medium">Work</th><th className="px-3 py-3 font-medium text-right">Actions</th>
    </tr></thead><tbody className="divide-y divide-slate-100">{viewed.map(c=><tr key={c.ref} className="hover:bg-slate-50 align-top"><td className="px-3 py-3"><input type="checkbox" aria-label={`Select ${c.ref}`} checked={selected.includes(c.ref)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,c.ref]:prev.filter(x=>x!==c.ref))}/></td><td className="px-3 py-3"><Link to={`/cases/${c.ref}`} className="font-medium text-brand-600 hover:text-brand-700" title={`Open case ${c.ref}`}>{c.ref}</Link></td><td className="px-3 py-3 text-slate-500">{c.clientRef || 'Not recorded'}</td><td className="px-3 py-3 text-slate-700">{canOpenPatients && patientIds[c.patient] ? <Link to={`/patients/${patientIds[c.patient]}`} className="hover:text-brand-700" title={`Open patient ${c.patient}`}>{c.patient}</Link> : (c.patient || 'Not recorded')}</td><td className="px-3 py-3 text-slate-600">{canOpenClients && clientIds[c.client] ? <Link to={`/clients/${clientIds[c.client]}`} className="hover:text-brand-700" title={`Open client ${c.client}`}>{c.client}</Link> : (c.client || 'Not recorded')}</td><td className="px-3 py-3 text-slate-600">{canOpenDoctors && doctorIds[c.doctor] ? <Link to={`/doctors/${doctorIds[c.doctor]}`} className="hover:text-brand-700" title={`Open doctor ${c.doctor}`}>{c.doctor}</Link> : (c.doctor || 'Unassigned')}</td><td className="px-3 py-3 text-xs text-slate-500">{c.appointmentDate || 'Not scheduled'}</td><td className="px-3 py-3"><StatusBadge status={c.status}/></td><td className="px-3 py-3 text-slate-600">{c.owner || 'Unassigned'}</td><td className="px-3 py-3"><PriorityBadge priority={c.priority}/></td><td className="px-3 py-3 text-slate-500">{c.targetDate || 'Not set'}{c.overdueState==='Overdue'&&<span className="block text-[10px] font-medium text-red-600 mt-1">Overdue</span>}</td><td className="px-3 py-3 text-xs text-slate-500">{c.lastUpdated || 'Not recorded'}</td><td className="px-3 py-3"><div className="flex items-center gap-1.5"><Link to={`/cases/${c.ref}?tab=Documents`} title={`Open ${c.documents} case document${c.documents===1?'':'s'}`} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-brand-700"><FileText size={12}/>{c.documents}</Link><Link to={`/cases/${c.ref}?tab=Tasks`} title={`Open ${c.tasks} case task${c.tasks===1?'':'s'}`} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-brand-700"><CheckSquare size={12}/>{c.tasks}</Link>{c.qaComments>0&&<Link to={`/cases/${c.ref}?tab=Quality%20Assurance`} title={`Open ${c.qaComments} QA comment${c.qaComments===1?'':'s'}`} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-red-500 hover:bg-red-50"><MessageSquareWarning size={12}/>{c.qaComments}</Link>}</div></td><td className="px-3 py-3"><div className="flex justify-end gap-1"><InlineIconAction to={`/cases/${c.ref}`} label={`Open case ${c.ref}`} icon={<Eye size={14}/>} tone="brand" />{canManageCases && <InlineIconAction label={`Assign case ${c.ref}`} icon={<UserRoundPlus size={14}/>} onClick={()=>openAction(c)} />}{role.id !== 'management' && <InlineIconAction label={`Add task to ${c.ref}`} icon={<CheckSquare size={14}/>} onClick={()=>setTaskCase(c)} />}</div></td></tr>)}{viewed.length===0&&<tr><td colSpan={14} className="px-4 py-8 text-center text-slate-400 text-sm">No cases match your search, filters or saved view.</td></tr>}</tbody></table></div></div>

    {modalOpen&&<NewCaseModal existingCases={cases} defaultPatient={defaultPatient} defaultClient={defaultClient} defaultDoctor={defaultDoctor} onClose={()=>setModalOpen(false)} onOpenExisting={c=>{setModalOpen(false);navigate(`/cases/${c.ref}`)}} onCreate={c=>{addCase(c);setModalOpen(false);navigate(`/cases/${c.ref}`)}}/>}
    {taskCase&&<NewTaskModal existingCount={tasks.length} defaultOwner={role.name} defaultCaseRef={taskCase.ref} lockCase onClose={()=>setTaskCase(null)} onCreate={task=>{addTask(task);setTaskCase(null);showToast('Task created for case.')}}/>}
    {actionCase&&actionType&&<Modal title="Assign case" description={`${actionCase.ref} · ${actionCase.patient}`} onClose={()=>{setActionCase(null);setActionType(null)}}><div><label className="block text-xs font-medium text-slate-500 mb-1.5">Case owner *</label><select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={actionValue} onChange={e=>setActionValue(e.target.value)}>{roles.filter(r=>r.id!=='management').map(r=><option key={r.id} value={r.name}>{r.name} — {r.title}</option>)}<option>Unassigned</option></select><p className="text-[11px] text-slate-400 mt-2">Case status is changed from the case record so workflow prerequisites remain visible and auditable.</p></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>{setActionCase(null);setActionType(null)}} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button onClick={saveAction} className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg">Assign</button></div></Modal>}
  </div>
}
