import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronRight, Copy, FileText, History, KeyRound, Loader2, Lock, Plus, Save, Search, Settings2, ShieldCheck, UserPlus, Users, X } from 'lucide-react'
import { systemUsers } from '../data/mockData'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { useRole } from '../context/RoleContext'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-[11px] font-semibold text-slate-500 mb-1.5'

type AdminUser = typeof systemUsers[number] & { permissions?: string[]; authenticationMethod?: string; assignedWork?: string[]; accountActivity?: string[] }
type RoleItem = { id: string; name: string; description: string; permissions: string[] }
type AuditItem = { id: string; date: string; user: string; action: string; recordType: string; caseRef: string; detail: string }

const permissionGroups: Record<string,string[]> = { Bookings:['View bookings','Manage bookings'], Cases:['View cases','Manage cases'], Patients:['View patient data'], Appointments:['Manage appointments'], Documents:['Manage documents'], Reports:['Create reports','Approve reports'], QA:['QA review'], Tasks:['Manage tasks'], Communication:['Manage communication'], Analytics:['View analytics','Export data'], Administration:['Manage users','Manage configuration','View audit logs'] }
const permissions = Object.values(permissionGroups).flat()
const seedRoles: RoleItem[] = [
  { id:'R-1', name:'System Administrator', description:'Full platform administration and security configuration.', permissions },
  { id:'R-2', name:'Management', description:'Organisation-wide oversight, analytics and approved exports.', permissions:['View bookings','View cases','View patient data','View analytics','Export data','View audit logs'] },
  { id:'R-3', name:'Operations Manager', description:'Operational case, scheduling and team workflow management.', permissions:['View bookings','Manage bookings','View cases','Manage cases','View patient data','Manage documents','Create reports','View analytics'] },
  { id:'R-4', name:'Booking Administrator', description:'Booking intake, patient records, scheduling and communication.', permissions:['View bookings','Manage bookings','View cases','View patient data','Manage documents'] },
  { id:'R-5', name:'File Preparation', description:'Document processing and prepared file workflow.', permissions:['View cases','View patient data','Manage documents'] },
  { id:'R-6', name:'Quality Assurance', description:'QA queue, review comments and report approval workflow.', permissions:['View cases','View patient data','Create reports','QA review','Approve reports'] },
  { id:'R-7', name:'Medical Expert', description:'Assigned cases, appointments and report preparation.', permissions:['View cases','View patient data','Manage documents','Create reports'] },
]

const configSeed: Record<string,string[]> = {
  'Case statuses':['New Booking','Information Required','Appointment Scheduled','File Preparation','Report in Progress','Quality Assurance','Amendments Required','Report Delivered','On Hold','Completed'],
  'Appointment types':['Initial Examination','Follow-up Examination','Records Review','Telephone Consultation'],
  'Case types':['Personal Injury — RTA','Personal Injury — Workplace','Clinical Negligence','Employment Liability'],
  'Document categories':['Client Instruction','Medical Records','Imaging','Correspondence','Report','Prepared Bundle'],
  'Task types':['Administration','Clinical Review','Document Preparation','QA','Follow-up'],
  'Locations':['Manchester Clinic','Leeds Clinic','Remote — Video','Remote — Telephone'],
  'Notification rules':['New assignment','Appointment changed','Missing document','Task deadline','Report submitted','QA amendment','Report approved'],
  'Report templates':['Standard Medicolegal Report','Addendum Report','Condition & Prognosis Report','Records Review Report'],
  'QA checklists':['Standard QA Checklist','Clinical Negligence QA','Addendum QA'],
  'Client requirements':['Secure delivery','Client reference required','Court deadline required','Fee approval required'],
}

const seedAudit: AuditItem[] = [
  { id:'AUD-1008', date:'31 Aug 2026 17:42', user:'Elaine Fitzgerald', action:'Report approved', recordType:'QA Review', caseRef:'EM-2026-1139', detail:'QA checklist completed and report approved. Approval confirmation recorded.' },
  { id:'AUD-1007', date:'31 Aug 2026 16:18', user:'Priya Nandra', action:'Appointment updated', recordType:'Appointment', caseRef:'EM-2026-1152', detail:'Appointment moved to 05 Sep 2026 at 10:30. Previous slot retained in appointment history.' },
  { id:'AUD-1006', date:'31 Aug 2026 15:04', user:'Fiona Chen', action:'Document downloaded', recordType:'Document', caseRef:'EM-2026-1196', detail:'Prepared bundle downloaded by authorised File Preparation user.' },
  { id:'AUD-1005', date:'31 Aug 2026 13:36', user:'Tom Ackerley', action:'Permission changed', recordType:'Role', caseRef:'—', detail:'Export data permission added to Management role after confirmation.' },
  { id:'AUD-1004', date:'31 Aug 2026 11:22', user:'Marcus Bell', action:'Case reassigned', recordType:'Case', caseRef:'EM-2026-1184', detail:'Case owner changed from Unassigned to Marcus Bell.' },
  { id:'AUD-1003', date:'30 Aug 2026 16:51', user:'Dr Amara Osei', action:'Report submitted', recordType:'Report', caseRef:'EM-2026-1196', detail:'Report v2 submitted for QA review.' },
]

function load<T>(key:string, fallback:T):T { try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback } }
function persist<T>(key:string,value:T,setter:(value:T)=>void){ setter(value); localStorage.setItem(key,JSON.stringify(value)) }

export default function Administration() {
  const { showToast } = useToast()
  const { role: currentRole } = useRole()
  const [tab,setTab]=useState<'overview'|'users'|'roles'|'configuration'|'security'|'audit'>('overview')
  const [users,setUsers]=useState<AdminUser[]>(()=>load('evaluate-admin-users-v1', systemUsers.map((u)=>({...u,permissions:seedRoles.find((r)=>r.name===u.role)?.permissions ?? []}))))
  const [roles,setRoles]=useState<RoleItem[]>(()=>load('evaluate-admin-roles-v1',seedRoles))
  const [config,setConfig]=useState<Record<string,string[]>>(()=>load('evaluate-admin-config-v1',configSeed))
  const [audit,setAudit]=useState<AuditItem[]>(()=>load('evaluate-admin-audit-v1',seedAudit))
  const [search,setSearch]=useState('')
  const [roleFilter,setRoleFilter]=useState('All')
  const [teamFilter,setTeamFilter]=useState('All')
  const [statusFilter,setStatusFilter]=useState('All')
  const [userModal,setUserModal]=useState<AdminUser|null>(null)
  const [addUserOpen,setAddUserOpen]=useState(false)
  const [roleModal,setRoleModal]=useState<RoleItem|null>(null)
  const [newRoleOpen,setNewRoleOpen]=useState(false)
  const [auditDetail,setAuditDetail]=useState<AuditItem|null>(null)
  const [auditUser,setAuditUser]=useState('All')
  const [auditAction,setAuditAction]=useState('All')
  const [auditRecord,setAuditRecord]=useState('All')
  const [auditCase,setAuditCase]=useState('')
  const [auditFrom,setAuditFrom]=useState('2026-08-01')
  const [auditTo,setAuditTo]=useState('2026-08-31')
  const [security,setSecurity]=useState(()=>load('evaluate-security-settings-v1',{ passwordMinLength:'10', passwordComplexity:'Uppercase, lowercase, number and symbol', mfa:'Required for administrators and QA', sessionDuration:'30 minutes', failedLogin:'5 attempts / 15 minute lockout', exportRestriction:'Permission required + confidentiality confirmation', downloadRestriction:'Role-based + audit logged', retention:'7 years' }))

  const addAudit=(action:string,recordType:string,caseRef:string,detail:string)=>{
    const item:AuditItem={id:`AUD-${Date.now()}`,date:'Just now',user:'Tom Ackerley',action,recordType,caseRef,detail}
    persist('evaluate-admin-audit-v1',[item,...audit],setAudit)
  }

  const filteredUsers=useMemo(()=>users.filter((u)=>{
    const q=search.toLowerCase(); if(q&&!`${u.name} ${u.email} ${u.role} ${u.team}`.toLowerCase().includes(q))return false
    return (roleFilter==='All'||u.role===roleFilter)&&(teamFilter==='All'||u.team===teamFilter)&&(statusFilter==='All'||u.status===statusFilter)
  }),[users,search,roleFilter,teamFilter,statusFilter])

  const filteredAudit=useMemo(()=>audit.filter((a)=>{
    const q=search.toLowerCase(); if(q&&!`${a.user} ${a.action} ${a.recordType} ${a.caseRef} ${a.detail}`.toLowerCase().includes(q))return false
    const parsed = a.date === 'Just now' ? Date.now() : Date.parse(a.date)
    const inDateRange = Number.isNaN(parsed) || ((!auditFrom || parsed >= new Date(`${auditFrom}T00:00:00`).getTime()) && (!auditTo || parsed <= new Date(`${auditTo}T23:59:59`).getTime()))
    return inDateRange&&(auditUser==='All'||a.user===auditUser)&&(auditAction==='All'||a.action===auditAction)&&(auditRecord==='All'||a.recordType===auditRecord)&&(!auditCase||a.caseRef.toLowerCase().includes(auditCase.toLowerCase()))
  }),[audit,search,auditUser,auditAction,auditRecord,auditCase,auditFrom,auditTo])

  const toggleUserStatus=(u:AdminUser)=>{
    const nextStatus=u.status==='Active'?'Suspended':'Active'
    if(!window.confirm(`${nextStatus==='Suspended'?'Suspend':'Activate'} ${u.name}'s account? This changes their platform access.`))return
    const next=users.map((item)=>item.id===u.id?{...item,status:nextStatus as 'Active'|'Suspended'}:item)
    persist('evaluate-admin-users-v1',next,setUsers); setUserModal({...u,status:nextStatus as 'Active'|'Suspended'}); addAudit(`Account ${nextStatus.toLowerCase()}`,'User','—',`${u.name} account changed to ${nextStatus}.`); showToast(`Account ${nextStatus.toLowerCase()}.`)
  }

  if (currentRole.id !== 'system-administrator') return <div className="max-w-xl mx-auto mt-12 bg-white border border-slate-200 rounded-xl p-6 text-center"><Lock size={26} className="mx-auto text-slate-400"/><h2 className="text-base font-semibold text-slate-900 mt-3">Access restricted</h2><p className="text-sm text-slate-500 mt-2">You do not have permission to access Administration. No user, permission, configuration or audit information has been exposed.</p></div>

  return <div className="space-y-4">
    <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
      {[['overview','Overview',Settings2],['users','User management',Users],['roles','Role management',ShieldCheck],['configuration','Configuration',Settings2],['security','Security settings',Lock],['audit','Audit logs',History]].map(([key,text,Icon])=>{const I=Icon as typeof Users; return <button key={String(key)} onClick={()=>{setTab(key as typeof tab);setSearch('')}} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${tab===key?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-700'}`}><I size={15}/>{String(text)}</button>})}
    </div>

    {tab==='overview'&&<><div><h2 className="text-base font-semibold text-slate-900">Administration overview</h2><p className="text-xs text-slate-500 mt-1">Access user, permission, workflow configuration, audit and security administration.</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">{[
      ['Users','Create and manage accounts','users',Users],['Roles & permissions','Control role access','roles',ShieldCheck],['Case configuration','Statuses and workflow rules','configuration',Settings2],['Appointment configuration','Types, duration and eligibility','configuration',CalendarDays],['Document configuration','Categories and AI processing rules','configuration',FileText],['Report templates','Versions and assignments','configuration',FileText],['QA checklists','Items, severity and status','configuration',CheckCircle2],['Notifications','Rules and operational events','configuration',Bell],['Audit logs','Trace important actions','audit',History],['Security settings','Authentication and data controls','security',Lock],
    ].map(([title,desc,target,Icon])=>{const I=Icon as typeof Users;return <button key={String(title)} onClick={()=>setTab(target as typeof tab)} className="group text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-200 hover:bg-brand-50/30 hover:shadow-sm"><I size={17} className="text-slate-400 group-hover:text-brand-600"/><p className="mt-3 text-sm font-semibold text-slate-800 group-hover:text-brand-800">{String(title)}</p><p className="mt-1 text-xs text-slate-500">{String(desc)}</p></button>})}</div></>}

    {tab==='users'&&<>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-900">User management</h2><p className="text-xs text-slate-500 mt-1">Create users, assign roles and teams, manage access and review permissions.</p></div><button onClick={()=>setAddUserOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium"><UserPlus size={15}/> Add user</button></div>
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2"><div className="relative flex-1 min-w-64"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search users by name, email, role or team..." className={`${field} pl-9`}/></div><select className={`${field} w-auto`} value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)}><option>All</option>{[...new Set(users.map(u=>u.role))].map(v=><option key={v}>{v}</option>)}</select><select className={`${field} w-auto`} value={teamFilter} onChange={(e)=>setTeamFilter(e.target.value)}><option>All</option>{[...new Set(users.map(u=>u.team))].map(v=><option key={v}>{v}</option>)}</select><select className={`${field} w-auto`} value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option>All</option><option>Active</option><option>Suspended</option></select><span className="self-center text-xs text-slate-400">{filteredUsers.length} users</span></div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50"><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Team</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredUsers.map(u=><tr key={u.id} className="hover:bg-slate-50"><td className="px-4 py-3"><p className="font-medium text-slate-800">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></td><td className="px-4 py-3 text-slate-600">{u.role}</td><td className="px-4 py-3 text-slate-600">{u.team}</td><td className="px-4 py-3 text-slate-500">{u.lastLogin}</td><td className="px-4 py-3"><StatusBadge status={u.status}/></td><td className="px-4 py-3 text-right"><button onClick={()=>setUserModal(u)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">Review <ChevronRight size={13}/></button></td></tr>)}</tbody></table></div></div>
    </>}

    {tab==='roles'&&<>
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-900">Role management</h2><p className="text-xs text-slate-500 mt-1">Permission changes require explicit review and confirmation.</p></div><button onClick={()=>setNewRoleOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium"><Plus size={15}/> Add role</button></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{roles.map(r=>{const assigned=users.filter(u=>u.role===r.name);return <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4"><div className="flex justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-900">{r.name}</h3><p className="text-xs text-slate-500 mt-1">{r.description}</p></div><ShieldCheck size={18} className="text-brand-600 shrink-0"/></div><div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-4"><span>{r.permissions.length} permissions</span><span>{assigned.length} users assigned</span><span className="text-teal-700">● Active</span></div><div className="flex gap-2 mt-4"><button onClick={()=>setRoleModal(r)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">Review permissions</button><button onClick={()=>{const copy={...r,id:`R-${Date.now()}`,name:`${r.name} Copy`};persist('evaluate-admin-roles-v1',[...roles,copy],setRoles);addAudit('Role copied','Role','—',`${r.name} copied to ${copy.name}.`);showToast('Role copied.')}} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-500" title="Copy role"><Copy size={14}/></button></div></div>})}</div>
    </>}

    {tab==='configuration'&&<>
      <div><h2 className="text-base font-semibold text-slate-900">System configuration</h2><p className="text-xs text-slate-500 mt-1">Manage operational reference values used by forms and workflows.</p></div>
      <div className="grid lg:grid-cols-2 gap-4">{Object.entries(config).map(([title,items])=><ConfigCard key={title} title={title} items={items} onChange={(next)=>{const updated={...config,[title]:next};persist('evaluate-admin-config-v1',updated,setConfig);addAudit('Configuration changed','Configuration','—',`${title} configuration updated.`)}}/>)}</div>
      <ConfigurationDetailReference />
      <SystemFeedbackPatterns />
      <ComponentStatePatterns />
    </>}

    {tab==='security'&&<section className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-5xl">
      <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-base font-semibold text-slate-900">Security settings</h2><p className="text-xs text-slate-500 mt-1">Configure authentication, session, export, download and data-retention controls.</p></div>
      <div className="p-5 grid md:grid-cols-2 gap-4">
        <div><label className={label}>Minimum password length</label><input className={field} type="number" min="8" max="32" value={security.passwordMinLength} onChange={e=>setSecurity({...security,passwordMinLength:e.target.value})}/></div>
        <div><label className={label}>Password policy</label><input className={field} value={security.passwordComplexity} onChange={e=>setSecurity({...security,passwordComplexity:e.target.value})}/></div>
        <div><label className={label}>Multi-factor authentication</label><select className={field} value={security.mfa} onChange={e=>setSecurity({...security,mfa:e.target.value})}><option>Required for administrators and QA</option><option>Required for all users</option><option>Optional</option></select></div>
        <div><label className={label}>Session duration</label><select className={field} value={security.sessionDuration} onChange={e=>setSecurity({...security,sessionDuration:e.target.value})}><option>15 minutes</option><option>30 minutes</option><option>60 minutes</option><option>4 hours</option></select></div>
        <div><label className={label}>Failed login policy</label><input className={field} value={security.failedLogin} onChange={e=>setSecurity({...security,failedLogin:e.target.value})}/></div>
        <div><label className={label}>Data retention</label><select className={field} value={security.retention} onChange={e=>setSecurity({...security,retention:e.target.value})}><option>5 years</option><option>7 years</option><option>10 years</option><option>Per client policy</option></select></div>
        <div><label className={label}>Export restrictions</label><textarea rows={2} className={field} value={security.exportRestriction} onChange={e=>setSecurity({...security,exportRestriction:e.target.value})}/></div>
        <div><label className={label}>Download restrictions</label><textarea rows={2} className={field} value={security.downloadRestriction} onChange={e=>setSecurity({...security,downloadRestriction:e.target.value})}/></div>
      </div>
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">Security-setting changes are recorded in the audit log.</p><button onClick={()=>{localStorage.setItem('evaluate-security-settings-v1',JSON.stringify(security));addAudit('Security settings changed','Security','—','Authentication, session or data-control settings updated.');showToast('Security settings saved.')}} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"><Save size={14}/> Save security settings</button></div>
    </section>}

    {tab==='audit'&&<>
      <div><h2 className="text-base font-semibold text-slate-900">Audit logs</h2><p className="text-xs text-slate-500 mt-1">Search and inspect authorised user activity and sensitive actions.</p></div>
      <div className="bg-white border border-slate-200 rounded-xl p-3 grid md:grid-cols-2 xl:grid-cols-7 gap-2"><div className="relative xl:col-span-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search audit activity..." className={`${field} pl-9`}/></div><input type="date" value={auditFrom} onChange={(e)=>setAuditFrom(e.target.value)} className={field}/><input type="date" value={auditTo} onChange={(e)=>setAuditTo(e.target.value)} className={field}/><select value={auditUser} onChange={(e)=>setAuditUser(e.target.value)} className={field}><option>All</option>{[...new Set(audit.map(a=>a.user))].map(v=><option key={v}>{v}</option>)}</select><select value={auditAction} onChange={(e)=>setAuditAction(e.target.value)} className={field}><option>All</option>{[...new Set(audit.map(a=>a.action))].map(v=><option key={v}>{v}</option>)}</select><select value={auditRecord} onChange={(e)=>setAuditRecord(e.target.value)} className={field}><option>All</option>{[...new Set(audit.map(a=>a.recordType))].map(v=><option key={v}>{v}</option>)}</select><input value={auditCase} onChange={(e)=>setAuditCase(e.target.value)} placeholder="Case reference" className={field}/></div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50"><th className="px-4 py-3">Date</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action type</th><th className="px-4 py-3">Record type</th><th className="px-4 py-3">Case reference</th><th className="px-4 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredAudit.map(a=><tr key={a.id}><td className="px-4 py-3 text-xs text-slate-500">{a.date}</td><td className="px-4 py-3 text-slate-700">{a.user}</td><td className="px-4 py-3 text-slate-600">{a.action}</td><td className="px-4 py-3 text-slate-500">{a.recordType}</td><td className="px-4 py-3 text-brand-600">{a.caseRef}</td><td className="px-4 py-3 text-right"><button onClick={()=>setAuditDetail(a)} className="text-xs font-medium text-brand-600">View activity</button></td></tr>)}{filteredAudit.length===0&&<tr><td colSpan={6} className="p-10 text-center text-sm text-slate-400">No audit activity matches these filters.</td></tr>}</tbody></table></div></div>
    </>}

    {addUserOpen&&<AddUserModal roles={roles} onClose={()=>setAddUserOpen(false)} onCreate={(u)=>{const next=[...users,u];persist('evaluate-admin-users-v1',next,setUsers);addAudit('User created','User','—',`${u.name} created as ${u.role}.`);showToast('User account created.');setAddUserOpen(false)}}/>}
    {userModal && <UserReviewModal
      user={userModal}
      roles={roles}
      onClose={() => setUserModal(null)}
      onSave={(u) => {
        const next = users.map((x) => x.id === u.id ? u : x)
        persist('evaluate-admin-users-v1', next, setUsers)
        setUserModal(u)
        addAudit('User updated', 'User', '—', `${u.name} role/team/permissions reviewed.`)
        showToast('User changes saved.')
      }}
      onToggleStatus={() => toggleUserStatus(userModal)}
      onReset={() => {
        if (window.confirm(`Reset access for ${userModal.name}? They will be required to establish new access credentials.`)) {
          addAudit('Access reset', 'User', '—', `Access reset initiated for ${userModal.name}.`)
          showToast('Access reset initiated.')
        }
      }}
    />}
    {roleModal&&<RoleModal role={roleModal} users={users} onClose={()=>setRoleModal(null)} onSave={(r)=>{if(!window.confirm('Confirm role permission changes? These changes affect every user assigned to this role.'))return;const next=roles.map(x=>x.id===r.id?r:x);persist('evaluate-admin-roles-v1',next,setRoles);setRoleModal(null);addAudit('Permission changed','Role','—',`Permissions updated for ${r.name}.`);showToast('Role permissions updated.')}}/>}
    {newRoleOpen&&<NewRoleModal onClose={()=>setNewRoleOpen(false)} onCreate={(r)=>{persist('evaluate-admin-roles-v1',[...roles,r],setRoles);setNewRoleOpen(false);addAudit('Role created','Role','—',`${r.name} created.`);showToast('Role created.')}}/>}
    {auditDetail&&<Modal title="Audit activity" description={auditDetail.id} onClose={()=>setAuditDetail(null)}><div className="space-y-3 text-sm">{[['Date',auditDetail.date],['User',auditDetail.user],['Action type',auditDetail.action],['Record type',auditDetail.recordType],['Case reference',auditDetail.caseRef]].map(([k,v])=><div key={k} className="flex justify-between gap-4 border-b border-slate-100 pb-2"><span className="text-slate-400">{k}</span><span className="text-slate-700 font-medium text-right">{v}</span></div>)}<div><p className={label}>Detailed activity</p><div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-slate-600">{auditDetail.detail}</div></div></div></Modal>}
  </div>
}

function ConfigCard({title,items,onChange}:{title:string;items:string[];onChange:(items:string[])=>void}){
  const [value,setValue]=useState('')
  return <section className="bg-white border border-slate-200 rounded-xl p-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="text-xs text-slate-400 mt-1">{items.length} configured values</p></div><Settings2 size={16} className="text-slate-400"/></div><div className="flex flex-wrap gap-2 mt-3">{items.map(item=><span key={item} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">{item}<button onClick={()=>{if(window.confirm(`Remove “${item}” from ${title}?`))onChange(items.filter(x=>x!==item))}} className="text-slate-300 hover:text-red-500"><X size={12}/></button></span>)}</div><div className="flex gap-2 mt-3"><input value={value} onChange={(e)=>setValue(e.target.value)} placeholder={`Add ${title.toLowerCase()} value`} className={field}/><button onClick={()=>{const clean=value.trim();if(!clean||items.includes(clean))return;onChange([...items,clean]);setValue('')}} className="px-3 rounded-lg bg-brand-600 text-white"><Plus size={15}/></button></div></section>
}

function AddUserModal({roles,onClose,onCreate}:{roles:RoleItem[];onClose:()=>void;onCreate:(u:AdminUser)=>void}){
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [role,setRole]=useState(roles[0]?.name??'');const [team,setTeam]=useState('Operations');const [status,setStatus]=useState<'Active'|'Suspended'>('Active');const [authenticationMethod,setAuthenticationMethod]=useState('Password + MFA');const [error,setError]=useState('')
  const initialPermissions=roles.find(r=>r.name===role)?.permissions??[]
  const submit=()=>{if(!name.trim()){setError('Enter the user name.');return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError('Enter a valid email address.');return}onCreate({id:`U-${Date.now()}`,name:name.trim(),email:email.trim(),role,team,status,lastLogin:'Never',authenticationMethod,permissions:initialPermissions,assignedWork:[],accountActivity:['Account created just now']})}
  return <Modal title="Add user" description="Create an individual account and assign role/team access." onClose={onClose} width="max-w-2xl"><div className="space-y-4">{error&&<p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg">{error}</p>}<div className="grid sm:grid-cols-2 gap-3"><div><label className={label}>Full name *</label><input className={field} value={name} onChange={e=>setName(e.target.value)}/></div><div><label className={label}>Email *</label><input type="email" className={field} value={email} onChange={e=>setEmail(e.target.value)}/></div><div><label className={label}>Role *</label><select className={field} value={role} onChange={e=>setRole(e.target.value)}>{roles.map(r=><option key={r.id}>{r.name}</option>)}</select></div><div><label className={label}>Team *</label><select className={field} value={team} onChange={e=>setTeam(e.target.value)}><option>Operations</option><option>Leadership</option><option>IT & Systems</option><option>File Preparation</option><option>Quality Assurance</option><option>Medical Expert</option></select></div><div><label className={label}>Account status</label><select className={field} value={status} onChange={e=>setStatus(e.target.value as 'Active'|'Suspended')}><option>Active</option><option>Suspended</option></select></div><div><label className={label}>Authentication method</label><select className={field} value={authenticationMethod} onChange={e=>setAuthenticationMethod(e.target.value)}><option>Password + MFA</option><option>Password</option><option>SSO + MFA</option></select></div></div><div><p className={label}>Initial permissions ({initialPermissions.length})</p><div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex flex-wrap gap-1.5">{initialPermissions.map(p=><span key={p} className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-600">{p}</span>)}{initialPermissions.length===0&&<span className="text-xs text-slate-400">No permissions assigned to this role yet.</span>}</div></div><div className="flex justify-end gap-2 pt-3 border-t border-slate-100"><button onClick={onClose} className="px-3 py-2 text-sm border rounded-lg">Cancel</button><button onClick={submit} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">Add user</button></div></div></Modal>
}

function UserReviewModal({user,roles,onClose,onSave,onToggleStatus,onReset}:{user:AdminUser;roles:RoleItem[];onClose:()=>void;onSave:(u:AdminUser)=>void;onToggleStatus:()=>void;onReset:()=>void}){
  const [draft,setDraft]=useState(user)
  const assignedWork=draft.assignedWork?.length?draft.assignedWork:[draft.role==='Booking Administrator'?'3 active bookings · 2 follow-ups':draft.role==='Quality Assurance'?'2 QA reviews awaiting action':'2 active cases · 1 task due this week']
  const accountActivity=draft.accountActivity?.length?draft.accountActivity:[`Last login: ${draft.lastLogin}`,'Role and permission review available','No suspicious access recorded']
  return <Modal title="User details" description="User information, assigned work, account activity and permission review." onClose={onClose} width="max-w-3xl"><div className="space-y-4"><div className="grid sm:grid-cols-2 gap-3"><div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-400">User information</p><p className="text-sm font-medium text-slate-800 mt-1">{draft.name}</p><p className="text-xs text-slate-500 mt-1">{draft.email}</p><p className="text-[11px] text-slate-400 mt-2">Authentication: {draft.authenticationMethod??'Password + MFA'}</p></div><div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-400">Account status</p><div className="mt-1"><StatusBadge status={draft.status}/></div><p className="text-[11px] text-slate-400 mt-2">Last login: {draft.lastLogin}</p></div></div><div className="grid grid-cols-2 gap-3"><div><label className={label}>Role</label><select className={field} value={draft.role} onChange={e=>{const role=e.target.value;setDraft({...draft,role,permissions:roles.find(r=>r.name===role)?.permissions??[]})}}>{roles.map(r=><option key={r.id}>{r.name}</option>)}</select></div><div><label className={label}>Team</label><select className={field} value={draft.team} onChange={e=>setDraft({...draft,team:e.target.value})}><option>Operations</option><option>Leadership</option><option>IT & Systems</option><option>File Preparation</option><option>Quality Assurance</option><option>Medical Expert</option></select></div></div><div className="grid md:grid-cols-2 gap-3"><div className="rounded-lg border border-slate-200 p-3"><p className={label}>Assigned work</p>{assignedWork.map(item=><p key={item} className="text-xs text-slate-600 py-1.5 border-b border-slate-100 last:border-0">{item}</p>)}</div><div className="rounded-lg border border-slate-200 p-3"><p className={label}>Account activity</p>{accountActivity.map(item=><p key={item} className="text-xs text-slate-600 py-1.5 border-b border-slate-100 last:border-0">{item}</p>)}</div></div><div><p className={label}>Permission summary / review</p><div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-3 max-h-52 overflow-y-auto">{permissions.map(p=><label key={p} className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={draft.permissions?.includes(p)??false} onChange={()=>setDraft({...draft,permissions:(draft.permissions??[]).includes(p)?(draft.permissions??[]).filter(x=>x!==p):[...(draft.permissions??[]),p]})}/>{p}</label>)}</div></div><div className="flex flex-wrap justify-between gap-2 pt-3 border-t"><div className="flex gap-2"><button onClick={onToggleStatus} className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">{draft.status==='Active'?'Suspend account':'Reactivate account'}</button><button onClick={onReset} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"><KeyRound size={14}/> Reset access</button></div><button onClick={()=>onSave(draft)} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save changes</button></div></div></Modal>
}

function RoleModal({role,users,onClose,onSave}:{role:RoleItem;users:AdminUser[];onClose:()=>void;onSave:(r:RoleItem)=>void}){const [draft,setDraft]=useState(role);const assigned=users.filter(u=>u.role===role.name);return <Modal title={`Review ${role.name}`} description="Permissions are grouped by product area and apply to every assigned user." onClose={onClose} width="max-w-3xl"><div className="space-y-4"><div><label className={label}>Role description</label><textarea className={field} rows={2} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></div><div><p className={label}>Assigned users ({assigned.length})</p><div className="flex flex-wrap gap-2">{assigned.map(u=><span key={u.id} className="text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-600">{u.name}</span>)}{assigned.length===0&&<span className="text-xs text-slate-400">No users assigned</span>}</div></div><div><p className={label}>Permissions</p><div className="grid md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">{Object.entries(permissionGroups).map(([group,items])=><div key={group} className="rounded-lg border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-700 mb-2">{group}</p><div className="space-y-2">{items.map(p=><label key={p} className="flex gap-2 text-xs text-slate-600"><input type="checkbox" checked={draft.permissions.includes(p)} onChange={()=>setDraft({...draft,permissions:draft.permissions.includes(p)?draft.permissions.filter(x=>x!==p):[...draft.permissions,p]})}/>{p}</label>)}</div></div>)}</div></div><div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Permission changes can expose or restrict sensitive medicolegal information. Review the complete permission set before confirming.</div><div className="flex justify-end gap-2"><button onClick={onClose} className="px-3 py-2 text-sm border rounded-lg">Cancel</button><button onClick={()=>onSave(draft)} className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700">Confirm permission changes</button></div></div></Modal>}

function NewRoleModal({onClose,onCreate}:{onClose:()=>void;onCreate:(r:RoleItem)=>void}){const [name,setName]=useState('');const [description,setDescription]=useState('');return <Modal title="Add role" description="Create a new role, then review its permissions." onClose={onClose}><div className="space-y-3"><div><label className={label}>Role name *</label><input className={field} value={name} onChange={e=>setName(e.target.value)}/></div><div><label className={label}>Description</label><textarea rows={3} className={field} value={description} onChange={e=>setDescription(e.target.value)}/></div><div className="flex justify-end gap-2"><button onClick={onClose} className="px-3 py-2 border rounded-lg text-sm">Cancel</button><button disabled={!name.trim()} onClick={()=>onCreate({id:`R-${Date.now()}`,name:name.trim(),description:description.trim()||'Custom role',permissions:[]})} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-40">Add role</button></div></div></Modal>}


function ConfigurationDetailReference(){
  const blocks = [
    {title:'Case status configuration', headers:['Status','Order','Allowed next','Role access','Required / completion'], rows:[['New Booking','1','Information Required, Appointment Scheduled','Administration, Operations','Patient + client / booking validated'],['Appointment Scheduled','5','Appointment Completed, On Hold','Administration, Operations','Appointment / outcome recorded'],['Quality Assurance','10','Amendments Required, Final Report Approved','QA','Report submitted / QA decision'],['Completed','17','Archived','Operations, Management','Final delivery + tasks complete']]},
    {title:'Appointment type configuration', headers:['Type','Duration','Location type','Doctor eligibility','Interpreter'], rows:[['Initial Examination','60 min','Clinic / Remote','Medical experts','Supported'],['Follow-up Examination','30 min','Clinic / Remote','Assigned doctor','Supported'],['Records Review','45 min','Remote','Medical experts','Not required']]},
    {title:'Document category configuration', headers:['Category','Order','Requirement','AI rule','Status'], rows:[['Client Instruction','1','Required','Classification + extraction','Active'],['Medical Records','2','Required','Classification + summary','Active'],['Prepared Bundle','6','Generated','Human approval required','Active']]},
    {title:'Report template management', headers:['Template','Report type','Client','Version','Status'], rows:[['Standard Medicolegal Report','Medicolegal','All clients','v4','Active'],['Addendum Report','Addendum','All clients','v2','Active'],['Condition & Prognosis','Condition & Prognosis','Selected clients','v3','Active']]},
    {title:'QA checklist management', headers:['Checklist','Report type','Items','Required','Severity'], rows:[['Standard QA Checklist','Medicolegal','12','10','Low / Medium / High'],['Clinical Negligence QA','Clinical Negligence','16','14','Low / Medium / High / Critical'],['Addendum QA','Addendum','8','7','Low / Medium / High']]},
  ]
  return <section className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="px-4 py-3 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-900">Configuration detail</h3><p className="text-xs text-slate-500 mt-1">Operational fields required by the screen breakdown. Reference values remain managed in the configuration cards above.</p></div><div className="divide-y divide-slate-100">{blocks.map(block=><div key={block.title} className="p-4"><h4 className="text-xs font-semibold text-slate-700 mb-2">{block.title}</h4><div className="overflow-x-auto rounded-lg border border-slate-100"><table className="w-full text-xs"><thead><tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-400">{block.headers.map(h=><th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{block.rows.map((row,i)=><tr key={i} className="hover:bg-brand-50/30">{row.map((cell,j)=><td key={j} className="px-3 py-2 text-slate-600 whitespace-nowrap">{cell}</td>)}</tr>)}</tbody></table></div></div>)}</div></section>
}

function SystemFeedbackPatterns(){
  const [retried,setRetried]=useState(false)
  return <section className="bg-white border border-slate-200 rounded-xl p-4"><div><h3 className="text-sm font-semibold text-slate-900">System feedback and states</h3><p className="text-xs text-slate-500 mt-1">Reusable loading, empty, success, error and permission-restricted patterns used across modules.</p></div><div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3 mt-4">
    <div className="rounded-lg border border-slate-200 p-3"><Loader2 size={18} className="text-brand-600 animate-spin"/><p className="text-xs font-semibold text-slate-700 mt-2">Loading</p><p className="text-[11px] text-slate-400 mt-1">Loading case information…</p><div className="mt-3 space-y-1.5"><div className="h-2 rounded bg-slate-100 animate-pulse"/><div className="h-2 w-2/3 rounded bg-slate-100 animate-pulse"/></div></div>
    <div className="rounded-lg border border-slate-200 p-3"><Search size={18} className="text-slate-400"/><p className="text-xs font-semibold text-slate-700 mt-2">Empty</p><p className="text-[11px] text-slate-400 mt-1">No records match this view. Clear filters or create the first record.</p><button className="text-[11px] font-medium text-brand-600 mt-2">Clear filters</button></div>
    <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-3"><CheckCircle2 size={18} className="text-teal-600"/><p className="text-xs font-semibold text-teal-800 mt-2">Success</p><p className="text-[11px] text-teal-700 mt-1">Changes saved. The updated record is now available to authorised users; no further action is required.</p></div>
    <div className="rounded-lg border border-red-200 bg-red-50/40 p-3"><AlertTriangle size={18} className="text-red-600"/><p className="text-xs font-semibold text-red-800 mt-2">Error</p><p className="text-[11px] text-red-700 mt-1">The update was not saved. Existing data is unchanged.</p><button onClick={()=>setRetried(true)} className="text-[11px] font-medium text-red-700 mt-2">{retried?'Retry requested':'Retry'}</button></div>
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><Lock size={18} className="text-slate-500"/><p className="text-xs font-semibold text-slate-700 mt-2">Access restricted</p><p className="text-[11px] text-slate-500 mt-1">You do not have permission to view this information. Sensitive fields are not partially exposed.</p></div>
  </div></section>
}

function ComponentStatePatterns(){
  return <section className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="text-sm font-semibold text-slate-900">Component interaction states</h3><p className="text-xs text-slate-500 mt-1">Reference treatment for default, hover, focus, active, selected, disabled, error and loading states.</p><div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 mt-4">
    <StateBox label="Default"><button className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md">Action</button></StateBox>
    <StateBox label="Hover"><button className="w-full px-2 py-1.5 text-xs border border-slate-300 bg-slate-50 rounded-md">Action</button></StateBox>
    <StateBox label="Focus"><button className="w-full px-2 py-1.5 text-xs border border-brand-500 ring-2 ring-brand-500/20 rounded-md">Action</button></StateBox>
    <StateBox label="Active"><button className="w-full px-2 py-1.5 text-xs bg-brand-700 text-white rounded-md">Action</button></StateBox>
    <StateBox label="Selected"><button className="w-full px-2 py-1.5 text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-md">Selected</button></StateBox>
    <StateBox label="Disabled"><button disabled className="w-full px-2 py-1.5 text-xs bg-slate-100 text-slate-400 rounded-md cursor-not-allowed">Disabled</button></StateBox>
    <StateBox label="Error"><input aria-label="Error example" value="Invalid" readOnly className="w-full px-2 py-1.5 text-xs border border-red-400 bg-red-50 rounded-md text-red-700"/></StateBox>
    <StateBox label="Loading"><button disabled className="w-full flex justify-center items-center gap-1 px-2 py-1.5 text-xs bg-brand-600 text-white rounded-md"><Loader2 size={12} className="animate-spin"/> Saving</button></StateBox>
  </div></section>
}
function StateBox({label,children}:{label:string;children:ReactNode}){return <div><p className="text-[11px] font-medium text-slate-500 mb-1.5">{label}</p>{children}</div>}
