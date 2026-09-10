import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, AlertTriangle, Users, BriefcaseBusiness, CircleAlert, CheckCircle2 } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import PageToolbar from '../components/PageToolbar'
import NewTaskModal from '../components/NewTaskModal'
import TaskDetailsModal from '../components/TaskDetailsModal'
import InlineIconAction from '../components/InlineIconAction'
import { useRole, roles } from '../context/RoleContext'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useTableFilter } from '../hooks/useTableFilter'
import { useToast } from '../context/ToastContext'

const views = ['My Tasks', 'Team Tasks', 'Team Workload', 'Overdue Tasks', 'Completed Tasks', 'Tasks by Case']
const sortOptions = [{ key: 'due', label: 'Due date (soonest)' }, { key: 'priority', label: 'Priority (highest)' }, { key: 'created', label: 'Recently created' }]
function parseDisplayDate(value: string) { const parsed = Date.parse(value); return Number.isNaN(parsed) ? null : parsed }
function isOverdue(task: { dueDate: string; status: string }) { if (task.status === 'Completed' || task.status === 'Cancelled') return false; const due = parseDisplayDate(task.dueDate); return !!due && due < new Date('2026-09-01T23:59:59').getTime() }

export default function Tasks() {
  const { role } = useRole(); const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams(); const scopedCase = searchParams.get('case') ?? ''
  const { tasks, addTask, updateTask } = usePrototypeData()
  const [view, setView] = useState(scopedCase ? 'Tasks by Case' : 'My Tasks'); const [caseGroup, setCaseGroup] = useState(scopedCase || 'All cases'); const [modalOpen, setModalOpen] = useState(false); const [selectedId, setSelectedId] = useState<string | null>(null); const [sort, setSort] = useState('due')
  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setModalOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('new')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])
  useEffect(() => {
    const taskId = searchParams.get('task')
    if (taskId && tasks.some((item) => item.id === taskId)) setSelectedId(taskId)
  }, [searchParams, tasks])
  const closeTask = () => {
    setSelectedId(null)
    if (searchParams.has('task')) {
      const next = new URLSearchParams(searchParams)
      next.delete('task')
      setSearchParams(next, { replace: true })
    }
  }

  const caseOptions = useMemo(() => ['All cases', ...new Set(tasks.map((task) => task.caseRef))], [tasks])
  const viewFiltered = useMemo(() => tasks.filter((t) => { if (view === 'My Tasks') return t.owner === role.name; if (view === 'Completed Tasks') return t.status === 'Completed'; if (view === 'Overdue Tasks') return isOverdue(t); if (view === 'Tasks by Case') return caseGroup === 'All cases' || t.caseRef === caseGroup; return true }), [view, role.name, tasks, caseGroup])
  const filter = useTableFilter(viewFiltered, ['title', 'caseRef', 'owner', 'createdBy', 'taskType'], [
    { key: 'status', label: 'Status', options: ['Not Started', 'In Progress', 'Blocked', 'Completed', 'Cancelled'] },
    { key: 'priority', label: 'Priority', options: ['Low', 'Standard', 'High'] },
    { key: 'owner', label: 'Owner', options: [...new Set(tasks.map((task) => task.owner))] },
    { key: 'taskType', label: 'Task type', options: [...new Set(tasks.map((task) => task.taskType ?? 'General'))] },
  ])
  const rank: Record<string, number> = { High: 3, Standard: 2, Low: 1 }
  const rows = useMemo(() => [...filter.filtered].sort((a, b) => sort === 'priority' ? (rank[b.priority] ?? 0) - (rank[a.priority] ?? 0) : sort === 'created' ? b.id.localeCompare(a.id) : (parseDisplayDate(a.dueDate) ?? Number.MAX_SAFE_INTEGER) - (parseDisplayDate(b.dueDate) ?? Number.MAX_SAFE_INTEGER)), [filter.filtered, sort])
  const workload = useMemo(() => {
    const owners = roles.filter(r => !['management','system-administrator'].includes(r.id)).map(r => r.name)
    return owners.map(owner => { const mine=tasks.filter(t=>t.owner===owner); const open=mine.filter(t=>!['Completed','Cancelled'].includes(t.status)); const overdue=open.filter(isOverdue); const cases=new Set(open.map(t=>t.caseRef)).size; const score=Math.min(100, open.length*18+overdue.length*15); return {owner,open:open.length,overdue:overdue.length,cases,score} }).filter(x=>x.open>0 || x.owner===role.name)
  }, [tasks,role.name])
  const reassignOldest = (owner:string,target:string) => { const task=tasks.filter(t=>t.owner===owner&&!['Completed','Cancelled'].includes(t.status)).sort((a,b)=>(parseDisplayDate(a.dueDate)??Infinity)-(parseDisplayDate(b.dueDate)??Infinity))[0]; if(!task){showToast('No active task available to reassign.');return}; updateTask(task.id,{...task,owner:target,activity:[{id:`ACT-${Date.now()}`,date:'Just now',user:role.name,action:`Task reassigned from ${owner} to ${target}`},...(task.activity??[])]}); showToast(`${task.title} reassigned to ${target}.`) }

  return <div>
    {scopedCase && <div className="mb-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-800">Scoped to case <Link to={`/cases/${scopedCase}`} className="font-semibold" title={`Open case ${scopedCase}`}>{scopedCase}</Link></div>}
    <div className="flex items-center gap-2 flex-wrap mb-4"><div className="flex bg-white border border-slate-200 rounded-lg p-1 w-fit overflow-x-auto">{views.map(v=><button key={v} onClick={()=>setView(v)} className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap ${view===v?'bg-brand-600 text-white font-medium':'text-slate-500 hover:bg-brand-50/50 hover:text-brand-700'}`}>{v}</button>)}</div>{view==='Tasks by Case'&&<select value={caseGroup} onChange={e=>setCaseGroup(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white">{caseOptions.map(item=><option key={item}>{item}</option>)}</select>}</div>

    {view==='Team Workload' ? <TeamWorkload rows={workload} onReassign={reassignOldest}/> : <>
      <PageToolbar searchPlaceholder="Search tasks by title, case, owner, creator or type..." searchValue={filter.search} onSearchChange={filter.setSearch} resultCount={rows.length} actionLabel="Create task" onAction={()=>setModalOpen(true)} filterDefs={filter.filterDefs} activeFilters={filter.activeFilters} onToggleFilter={filter.toggleFilter} onClearFilters={filter.clearFilters} activeFilterCount={filter.activeFilterCount} dateRange={filter.dateRange} onDateRangeChange={filter.setDateRange} dateFilterAvailable={filter.dateFilterAvailable} sortOptions={sortOptions} activeSort={sort} onSortChange={setSort}/>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm min-w-[960px]"><thead><tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide"><th className="px-4 py-3 font-medium">Task</th><th className="px-4 py-3 font-medium">Related case</th><th className="px-4 py-3 font-medium">Owner</th><th className="px-4 py-3 font-medium">Due date</th><th className="px-4 py-3 font-medium">Priority</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Created by</th><th className="px-4 py-3 font-medium text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map(t=>{const overdue=isOverdue(t);return <tr key={t.id} className={overdue?'bg-red-50/40 hover:bg-red-50/70':'hover:bg-brand-50/30'}><td className="px-4 py-3"><div className="flex items-start gap-2">{overdue&&<AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0"/>}<div><button onClick={()=>setSelectedId(t.id)} className="font-medium text-slate-800 text-left hover:text-brand-700" title={`Open task ${t.id}`}>{t.title || 'Untitled task'}</button><p className="text-[11px] text-slate-400 mt-0.5">{t.id} · {t.taskType??'General'}{t.supportingDocument?` · ${t.supportingDocument}`:''}</p></div></div></td><td className="px-4 py-3"><Link to={`/cases/${t.caseRef}?tab=Tasks`} className="font-medium text-brand-600 hover:text-brand-700" title={`Open case ${t.caseRef} tasks`}>{t.caseRef}</Link></td><td className="px-4 py-3 text-slate-600">{t.owner || 'Unassigned'}</td><td className={`px-4 py-3 ${overdue?'text-red-600 font-medium':'text-slate-500'}`}>{t.dueDate || 'Not set'}{overdue&&<span className="block text-[10px] uppercase tracking-wide">Overdue</span>}</td><td className="px-4 py-3"><PriorityBadge priority={t.priority}/></td><td className="px-4 py-3"><StatusBadge status={t.status}/></td><td className="px-4 py-3 text-slate-500">{t.createdBy || 'Not recorded'}</td><td className="px-4 py-3 text-right"><InlineIconAction label={`Open task ${t.id}`} icon={<Eye size={14}/>} onClick={()=>setSelectedId(t.id)} tone="brand" /></td></tr>})}{rows.length===0&&<tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">No tasks in this view.</td></tr>}</tbody></table></div></div>
    </>}
    {modalOpen&&<NewTaskModal existingCount={tasks.length} defaultOwner={role.name} defaultCaseRef={scopedCase} lockCase={Boolean(scopedCase)} onClose={()=>setModalOpen(false)} onCreate={task=>{addTask(task);setModalOpen(false)}}/>}{selectedId&&<TaskDetailsModal taskId={selectedId} onClose={closeTask}/>} 
  </div>
}

function TeamWorkload({rows,onReassign}:{rows:Array<{owner:string;open:number;overdue:number;cases:number;score:number}>;onReassign:(owner:string,target:string)=>void}) {
  const [targets,setTargets]=useState<Record<string,string>>({})
  return <div className="space-y-4"><div className="grid sm:grid-cols-3 gap-3"><Metric icon={<Users size={17}/>} label="Team members" value={String(rows.length)}/><Metric icon={<BriefcaseBusiness size={17}/>} label="Active tasks" value={String(rows.reduce((a,b)=>a+b.open,0))}/><Metric icon={<CircleAlert size={17}/>} label="Overdue" value={String(rows.reduce((a,b)=>a+b.overdue,0))}/></div><div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="px-4 py-3 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-800">Team workload</h2><p className="text-xs text-slate-500 mt-1">Active tasks, overdue work, linked cases and reassignment controls.</p></div><div className="divide-y divide-slate-100">{rows.map(row=><div key={row.owner} className="grid lg:grid-cols-[minmax(180px,1fr)_90px_90px_90px_minmax(150px,1fr)_minmax(240px,300px)] items-center gap-3 px-4 py-3 hover:bg-brand-50/25"><div><p className="text-sm font-medium text-slate-800">{row.owner}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">Workload indicator</p><div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${row.score>75?'bg-red-500':row.score>45?'bg-amber-500':'bg-teal-500'}`} style={{width:`${row.score}%`}}/></div></div><p className="text-sm text-slate-600">{row.open} active</p><p className={`text-sm ${row.overdue?'text-red-600 font-medium':'text-slate-500'}`}>{row.overdue} overdue</p><p className="text-sm text-slate-500">{row.cases} cases</p><span className="text-xs text-slate-500">{row.score>75?'High load':row.score>45?'Balanced':'Available capacity'}</span><div className="space-y-2"><select value={targets[row.owner]??''} onChange={e=>setTargets({...targets,[row.owner]:e.target.value})} className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white"><option value="">Reassign oldest task to…</option>{roles.filter(r=>r.name!==row.owner&&!['management','system-administrator'].includes(r.id)).map(r=><option key={r.id} value={r.name}>{r.name}</option>)}</select><button disabled={!targets[row.owner]} onClick={()=>onReassign(row.owner,targets[row.owner])} className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-40">Reassign task</button></div></div>)}</div></div></div>
}
function Metric({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-brand-200 hover:shadow-sm"><span className="w-9 h-9 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-semibold text-slate-900">{value}</p></div></div>}
