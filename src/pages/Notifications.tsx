import { useMemo, useState, type ReactNode } from 'react'
import { Bell, CheckCheck, ChevronRight, Clock3, Filter, Mail, Save, Search, SlidersHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications, type NotificationType } from '../context/NotificationContext'
import PriorityBadge from '../components/PriorityBadge'
import { useToast } from '../context/ToastContext'

const types: Array<'All' | NotificationType> = [
  'All', 'New assignment', 'Appointment created', 'Appointment changed', 'Missing document',
  'Task approaching deadline', 'Task overdue', 'Report submitted', 'QA amendment requested',
  'Report approved', 'Case completed',
]

type Preferences = {
  inPlatform: boolean
  email: boolean
  taskReminders: boolean
  appointmentUpdates: boolean
  reportUpdates: boolean
  qaUpdates: boolean
  digest: 'Off' | 'Daily' | 'Weekly'
}
const PREF_KEY = 'evaluate-notification-preferences-v1'
const defaultPrefs: Preferences = { inPlatform: true, email: true, taskReminders: true, appointmentUpdates: true, reportUpdates: true, qaUpdates: true, digest: 'Daily' }
function loadPrefs() { try { return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') } as Preferences } catch { return defaultPrefs } }

export default function Notifications() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [tab, setTab] = useState<'centre' | 'preferences'>('centre')
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'All' | NotificationType>('All')
  const [showEarlier, setShowEarlier] = useState(false)
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs)

  const visible = useMemo(() => notifications.filter((item, index) => {
    if (!showEarlier && index >= 5) return false
    if (type !== 'All' && item.type !== type) return false
    const q = search.trim().toLowerCase()
    return !q || `${item.title} ${item.caseRef} ${item.detail}`.toLowerCase().includes(q)
  }), [notifications, search, showEarlier, type])

  const open = (id: string, path: string) => { markRead(id); navigate(path) }
  const savePreferences = () => { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); showToast('Notification preferences saved.') }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex bg-white border border-slate-200 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('centre')} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md ${tab === 'centre' ? 'bg-brand-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700'}`}><Bell size={13}/> Notification centre</button>
        <button onClick={() => setTab('preferences')} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md ${tab === 'preferences' ? 'bg-brand-600 text-white font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700'}`}><SlidersHorizontal size={13}/> Preferences</button>
      </div>

      {tab === 'centre' ? <>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div><h2 className="text-base font-semibold text-slate-900">Notification centre</h2><p className="text-xs text-slate-500 mt-1">Outstanding work, case updates and workflow events in one place.</p></div>
          <button onClick={markAllRead} disabled={unreadCount === 0} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-brand-50/50 hover:border-brand-200 hover:text-brand-700 disabled:opacity-40"><CheckCheck size={15} /> Mark all as read</button>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 max-w-lg"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications or case references..." className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30" /></div>
          <div className="relative"><Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={type} onChange={(e) => setType(e.target.value as 'All' | NotificationType)} className="pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30">{types.map((value) => <option key={value}>{value}</option>)}</select></div>
          <span className="self-center text-xs text-slate-400">{visible.length} shown · {unreadCount} unread</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {visible.length === 0 ? <div className="py-14 text-center"><Bell className="mx-auto text-slate-300 mb-3" size={26} /><p className="text-sm font-medium text-slate-700">No notifications match this view</p><p className="text-xs text-slate-400 mt-1">Clear the search or choose another notification type.</p></div> : visible.map((item) => (
            <div key={item.id} role="button" tabIndex={0} onClick={() => open(item.id, item.actionPath)} onKeyDown={(e) => { if (e.key === 'Enter') open(item.id, item.actionPath) }} className={`w-full text-left grid md:grid-cols-[minmax(0,1fr)_160px_150px_32px] gap-3 items-center px-4 py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-brand-50/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/30 ${item.read ? '' : 'bg-brand-50/30'}`}>
              <div className="min-w-0 flex gap-3"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.read ? 'bg-slate-200' : 'bg-brand-600'}`} aria-label={item.read ? 'Read' : 'Unread'} /><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className={`text-sm ${item.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>{item.title}</p><span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{item.type}</span></div><p className="text-xs text-slate-500 mt-1">{item.detail}</p><p className="text-[11px] text-brand-600 mt-1.5">Related case: {item.caseRef}</p></div></div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400"><Clock3 size={13} /> {item.time}</div>
              <div className="flex items-center gap-2"><PriorityBadge priority={item.priority} />{!item.read && <button onClick={(e) => { e.stopPropagation(); markRead(item.id) }} className="text-[11px] font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap">Mark as read</button>}</div><ChevronRight size={16} className="text-slate-300" />
            </div>
          ))}
        </div>
        {!showEarlier && notifications.length > 5 && <div className="text-center"><button onClick={() => setShowEarlier(true)} className="text-sm font-medium text-brand-600 hover:text-brand-700">View earlier notifications</button></div>}
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
    </div>
  )
}

function PreferenceRow({icon,title,detail,checked,onChange}:{icon:ReactNode;title:string;detail:string;checked:boolean;onChange:(value:boolean)=>void}) { return <div className="flex items-center justify-between gap-5"><div className="flex gap-3"><span className="mt-0.5 text-brand-600">{icon}</span><div><p className="text-sm font-medium text-slate-800">{title}</p><p className="text-xs text-slate-500 mt-0.5">{detail}</p></div></div><input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600"/></div> }
function Toggle({title,checked,onChange}:{title:string;checked:boolean;onChange:(value:boolean)=>void}) { return <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/30"><span className="text-sm text-slate-700">{title}</span><input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600"/></label> }
