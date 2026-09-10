import { useMemo, useState, type ReactNode } from 'react'
import { Bell, CheckCheck, ChevronRight, Clock3, Filter, Mail, MailOpen, Save, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { notificationVisibleTo, useNotifications, type NotificationPriority, type NotificationType } from '../context/NotificationContext'
import PriorityBadge from '../components/PriorityBadge'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { useRole } from '../context/RoleContext'
import InlineIconAction from '../components/InlineIconAction'

const types: Array<'All' | NotificationType> = [
  'All', 'New assignment', 'Appointment created', 'Appointment changed', 'Missing document',
  'Task approaching deadline', 'Task overdue', 'Report submitted', 'QA amendment requested',
  'QA review started', 'Report approved', 'Final approval required', 'Report delivered', 'Case completed',
]
const priorities: Array<'All' | NotificationPriority> = ['All', 'Urgent', 'High', 'Standard']

type Preferences = {
  inPlatform: boolean
  email: boolean
  taskReminders: boolean
  appointmentUpdates: boolean
  reportUpdates: boolean
  qaUpdates: boolean
  digest: 'Off' | 'Daily' | 'Weekly'
}
const PREF_KEY = 'evaluate-notification-preferences-v2'
const defaultPrefs: Preferences = { inPlatform: true, email: true, taskReminders: true, appointmentUpdates: true, reportUpdates: true, qaUpdates: true, digest: 'Daily' }
function loadPrefs() { try { return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') } as Preferences } catch { return defaultPrefs } }

export default function Notifications() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { role } = useRole()
  const { notifications, markRead, markUnread, markAllRead, dismissNotification, dismissMany, clearRead } = useNotifications()
  const [tab, setTab] = useState<'centre' | 'preferences'>('centre')
  const [view, setView] = useState<'all' | 'unread' | 'read'>('all')
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'All' | NotificationType>('All')
  const [priority, setPriority] = useState<'All' | NotificationPriority>('All')
  const [limit, setLimit] = useState(8)
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)

  const roleNotifications = useMemo(
    () => notifications.filter((item) => notificationVisibleTo(item, role.id, role.name)),
    [notifications, role.id, role.name],
  )
  const unreadCount = roleNotifications.filter((item) => !item.read).length

  const filtered = useMemo(() => roleNotifications.filter((item) => {
    if (view === 'unread' && item.read) return false
    if (view === 'read' && !item.read) return false
    if (type !== 'All' && item.type !== type) return false
    if (priority !== 'All' && item.priority !== priority) return false
    const q = search.trim().toLowerCase()
    return !q || `${item.title} ${item.caseRef} ${item.detail} ${item.type}`.toLowerCase().includes(q)
  }), [roleNotifications, view, type, priority, search])
  const visible = filtered.slice(0, limit)

  const open = (id: string, path: string) => { markRead(id); navigate(path) }
  const savePreferences = () => { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); showToast('Notification preferences saved.') }
  const roleIds = roleNotifications.map((item) => item.id)

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex bg-white border border-slate-200 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('centre')} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md ${tab === 'centre' ? 'bg-brand-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700'}`}><Bell size={13}/> Notification centre</button>
        <button onClick={() => setTab('preferences')} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md ${tab === 'preferences' ? 'bg-brand-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700'}`}><SlidersHorizontal size={13}/> Preferences</button>
      </div>

      {tab === 'centre' ? <>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Notification centre</h2>
            <p className="text-xs text-slate-500 mt-1">Only notifications relevant to <strong className="font-medium text-slate-600">{role.title}</strong> are shown. Repeated workflow alerts replace the older alert instead of building an endless duplicate list.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => markAllRead(roleIds)} disabled={unreadCount === 0} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-brand-50/50 hover:border-brand-200 hover:text-brand-700 disabled:opacity-40"><CheckCheck size={15} /> Mark all read</button>
            <button onClick={() => clearRead(roleIds)} disabled={!roleNotifications.some((item) => item.read)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 disabled:opacity-40"><Trash2 size={14}/> Delete read</button>
            <button onClick={() => setDeleteAllOpen(true)} disabled={roleNotifications.length === 0} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"><Trash2 size={14}/> Delete all</button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button onClick={() => { setView('all'); setLimit(8) }} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === 'all' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>All <span className="ml-1 opacity-80">{roleNotifications.length}</span></button>
            <button onClick={() => { setView('unread'); setLimit(8) }} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === 'unread' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Unread <span className="ml-1 opacity-80">{unreadCount}</span></button>
            <button onClick={() => { setView('read'); setLimit(8) }} className={`px-3 py-1.5 rounded-md text-xs font-medium ${view === 'read' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Read <span className="ml-1 opacity-80">{roleNotifications.length - unreadCount}</span></button>
          </div>
          <div className="relative flex-1 min-w-[260px] max-w-lg"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => { setSearch(e.target.value); setLimit(8) }} placeholder="Search notifications or case references..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30" /></div>
          <div className="relative"><Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={type} onChange={(e) => { setType(e.target.value as 'All' | NotificationType); setLimit(8) }} className="pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30">{types.map((value) => <option key={value}>{value}</option>)}</select></div>
          <select value={priority} onChange={(e) => { setPriority(e.target.value as 'All' | NotificationPriority); setLimit(8) }} className="px-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30">{priorities.map((value) => <option key={value} value={value}>{value === 'All' ? 'All priorities' : value}</option>)}</select>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {visible.length === 0 ? <div className="py-14 text-center"><Bell className="mx-auto text-slate-300 mb-3" size={26} /><p className="text-sm font-medium text-slate-700">No notifications match this view</p><p className="text-xs text-slate-400 mt-1">Try All notifications, clear the search, or change the filters.</p></div> : visible.map((item) => (
            <div key={item.id} className={`grid md:grid-cols-[minmax(0,1fr)_145px_105px_118px] gap-3 items-center px-4 py-3.5 border-b border-slate-100 last:border-b-0 ${item.read ? 'bg-white' : 'bg-brand-50/30'}`}>
              <div className="min-w-0 flex gap-3">
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.read ? 'bg-slate-200' : 'bg-brand-600'}`} aria-label={item.read ? 'Read' : 'Unread'} />
                <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><button onClick={() => open(item.id, item.actionPath)} className={`text-left text-sm hover:text-brand-700 ${item.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`} title="Open notification target">{item.title || 'Workflow notification'}</button><span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{item.type}</span></div><p className="text-xs text-slate-500 mt-1">{item.detail || 'No additional details recorded.'}</p><Link to={`/cases/${item.caseRef}`} onClick={() => markRead(item.id)} className="inline-flex text-[11px] text-brand-600 hover:text-brand-700 mt-1.5" title={`Open case ${item.caseRef}`}>Case {item.caseRef}</Link></div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={13} /> {item.time || 'Time not recorded'}</div>
              <div className="flex items-center gap-2"><PriorityBadge priority={item.priority} /></div>
              <div className="flex items-center justify-end gap-1">
                {item.read ? <InlineIconAction label="Mark notification unread" icon={<Mail size={14}/>} onClick={() => markUnread(item.id)} /> : <InlineIconAction label="Mark notification read" icon={<MailOpen size={14}/>} onClick={() => markRead(item.id)} tone="brand" />}
                <InlineIconAction label="Open notification target" icon={<ChevronRight size={16}/>} onClick={() => open(item.id, item.actionPath)} tone="brand" />
                <InlineIconAction label="Delete notification" icon={<Trash2 size={14}/>} onClick={() => dismissNotification(item.id)} tone="danger" />
              </div>
            </div>
          ))}
        </div>
        {filtered.length > visible.length && <div className="text-center"><button onClick={() => setLimit((value) => value + 8)} className="text-sm font-medium text-brand-600 hover:text-brand-700">Show {Math.min(8, filtered.length - visible.length)} more</button></div>}
      </> : <section className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-3xl">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-base font-semibold text-slate-900">Notification preferences</h2><p className="text-xs text-slate-500 mt-1">Choose how workflow updates and reminders reach you.</p></div>
        <div className="p-5 space-y-5">
          <PreferenceRow icon={<Bell size={15}/>} title="In-platform notifications" detail="Show workflow notifications in Evaluate." checked={prefs.inPlatform} onChange={(value) => setPrefs({ ...prefs, inPlatform: value })}/>
          <PreferenceRow icon={<Mail size={15}/>} title="Email notifications" detail="Send selected operational updates to your account email." checked={prefs.email} onChange={(value) => setPrefs({ ...prefs, email: value })}/>
          <div className="grid sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <Toggle title="Task reminders" checked={prefs.taskReminders} onChange={(v) => setPrefs({...prefs,taskReminders:v})}/><Toggle title="Appointment updates" checked={prefs.appointmentUpdates} onChange={(v) => setPrefs({...prefs,appointmentUpdates:v})}/><Toggle title="Report updates" checked={prefs.reportUpdates} onChange={(v) => setPrefs({...prefs,reportUpdates:v})}/><Toggle title="QA updates" checked={prefs.qaUpdates} onChange={(v) => setPrefs({...prefs,qaUpdates:v})}/>
          </div>
          <div className="border-t border-slate-100 pt-4"><label className="block text-xs font-medium text-slate-500 mb-1.5">Digest preference</label><select value={prefs.digest} onChange={(e) => setPrefs({...prefs,digest:e.target.value as Preferences['digest']})} className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"><option>Off</option><option>Daily</option><option>Weekly</option></select></div>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end"><button onClick={savePreferences} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"><Save size={14}/> Save preferences</button></div>
      </section>}

      {deleteAllOpen && <Modal title="Delete all notifications" description={`Remove all ${roleNotifications.length} notifications currently stored for ${role.title}.`} onClose={() => setDeleteAllOpen(false)}>
        <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">This removes the notification copies only. Case, QA, report, task and audit records are not deleted.</div>
        <div className="mt-5 flex justify-end gap-2"><button onClick={() => setDeleteAllOpen(false)} className="px-3 py-2 text-sm text-slate-600">Cancel</button><button onClick={() => { dismissMany(roleIds); setDeleteAllOpen(false); showToast('Notifications deleted.') }} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700">Delete all notifications</button></div>
      </Modal>}
    </div>
  )
}

function PreferenceRow({icon,title,detail,checked,onChange}:{icon:ReactNode;title:string;detail:string;checked:boolean;onChange:(value:boolean)=>void}) { return <div className="flex items-center justify-between gap-5"><div className="flex gap-3"><span className="mt-0.5 text-brand-600">{icon}</span><div><p className="text-sm font-medium text-slate-800">{title}</p><p className="text-xs text-slate-500 mt-0.5">{detail}</p></div></div><input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600"/></div> }
function Toggle({title,checked,onChange}:{title:string;checked:boolean;onChange:(value:boolean)=>void}) { return <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/30"><span className="text-sm text-slate-700">{title}</span><input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600"/></label> }
