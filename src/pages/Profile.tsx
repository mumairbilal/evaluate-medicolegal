import { useMemo, useRef, useState } from 'react'
import { Bell, Camera, CheckCircle2, Clock3, Download, History, KeyRound, Save, Trash2, UserRound } from 'lucide-react'
import { useRole } from '../context/RoleContext'
import { useToast } from '../context/ToastContext'
import { usePrototypeData } from '../context/PrototypeDataContext'
import PhoneInput from '../components/PhoneInput'
import { useProfilePhoto } from '../context/ProfilePhotoContext'

const PROFILE_KEY='evaluate-profile-overrides-v1'
const PREF_KEY='evaluate-profile-preferences-v1'
const field='w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
function load<T>(key:string,fallback:T):T{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}}

export default function Profile() {
  const { showToast } = useToast(); const { role } = useRole(); const { tasks,reports,communications }=usePrototypeData(); const { profilePhoto, setProfilePhoto } = useProfilePhoto()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const baseEmail=`${role.name.toLowerCase().replace(/[^a-z\s]/g,'').trim().split(' ').join('.')}@evaluatemedicolegal.co.uk`
  const [tab,setTab]=useState<'profile'|'security'|'preferences'|'activity'>('profile')
  const [profile,setProfile]=useState(()=>load(PROFILE_KEY,{name:role.name,email:baseEmail,phone:'+44 161 700 0100',team:role.title.includes('Administrator')?'Operations':'Evaluate Medicolegal'}))
  const [editing,setEditing]=useState(false)
  const [currentPassword,setCurrentPassword]=useState(''); const [newPassword,setNewPassword]=useState(''); const [confirmPassword,setConfirmPassword]=useState(''); const [passwordError,setPasswordError]=useState('')
  const [prefs,setPrefs]=useState(()=>load(PREF_KEY,{inPlatform:true,email:true,taskReminders:true,appointmentUpdates:true,reportUpdates:true,qaUpdates:true,digest:'Daily',defaultDashboard:'Role default',tableDensity:'Comfortable',dateFormat:'DD MMM YYYY'}))


  const handlePhotoUpload = (file?: File) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { showToast('Choose a JPG, PNG or WebP image.'); return }
    if (file.size > 5 * 1024 * 1024) { showToast('Profile photo must be 5 MB or smaller.'); return }

    const reader = new FileReader()
    reader.onerror = () => showToast('Could not read that image. Please choose another file.')
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => showToast('Could not process that image. Please choose another file.')
      image.onload = () => {
        const size = Math.min(image.naturalWidth, image.naturalHeight)
        const sx = Math.max(0, (image.naturalWidth - size) / 2)
        const sy = Math.max(0, (image.naturalHeight - size) / 2)
        const canvas = document.createElement('canvas')
        canvas.width = 512; canvas.height = 512
        const context = canvas.getContext('2d')
        if (!context) { showToast('Could not process that image.'); return }
        context.drawImage(image, sx, sy, size, size, 0, 0, 512, 512)
        setProfilePhoto(canvas.toDataURL('image/jpeg', 0.86))
        showToast('Profile photo updated.')
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const saveProfile=()=>{if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)){showToast('Enter a valid email address.');return}localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));setEditing(false);showToast('Profile details saved.')}
  const changePassword=()=>{if(currentPassword!=='Evaluate2026'){setPasswordError('Current password is incorrect for this prototype.');return}if(newPassword.length<10||!/[A-Z]/.test(newPassword)||!/[a-z]/.test(newPassword)||!/\d/.test(newPassword)){setPasswordError('Use at least 10 characters with upper-case, lower-case and a number.');return}if(newPassword!==confirmPassword){setPasswordError('New password and confirmation do not match.');return}setPasswordError('');setCurrentPassword('');setNewPassword('');setConfirmPassword('');showToast('Password updated for this prototype session.')}
  const savePrefs=(next= prefs)=>{setPrefs(next);localStorage.setItem(PREF_KEY,JSON.stringify(next));showToast('Preferences saved.')}

  const activities=useMemo(()=>[
    ...tasks.filter(t=>t.owner===role.name&&t.status==='Completed').slice(0,4).map(t=>({icon:CheckCircle2,title:`Completed task: ${t.title}`,detail:t.caseRef,time:t.dueDate})),
    ...reports.filter(r=>r.doctor===role.name||r.assignedUser===role.name).slice(0,4).map(r=>({icon:History,title:`Report ${r.status.toLowerCase()}`,detail:`${r.caseRef} · ${r.version}`,time:r.lastUpdated})),
    ...communications.filter(c=>c.from===role.name||c.to===role.name).slice(0,4).map(c=>({icon:Bell,title:c.subject,detail:`${c.caseRef} · ${c.type}`,time:c.date})),
    {icon:Clock3,title:'Signed in successfully',detail:'Secure session established with MFA',time:'Today, 09:02'},
    {icon:Download,title:'Export and download activity is recorded in Audit Logs',detail:'Authorised actions only',time:'Policy active'},
  ],[tasks,reports,communications,role.name])

  const tabs=[['profile','My profile',UserRound],['security','Password & security',KeyRound],['preferences','My preferences',Bell],['activity','My activity',History]] as const
  return <div className="max-w-5xl mx-auto space-y-4">
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">{tabs.map(([key,label,Icon])=><button key={key} onClick={()=>setTab(key)} className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap ${tab===key?'border-brand-600 text-brand-700':'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}><Icon size={15}/>{label}</button>)}</div>

    {tab==='profile'&&<section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-semibold overflow-hidden ring-2 ring-white shadow-sm border border-slate-200">
            {profilePhoto ? <img src={profilePhoto} alt={`${profile.name} profile`} className="w-full h-full object-cover" /> : role.initials}
          </div>
          <button type="button" onClick={()=>photoInputRef.current?.click()} aria-label="Change profile photo" title="Change profile photo" className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-brand-600 text-white border-2 border-white shadow-sm flex items-center justify-center hover:bg-brand-700 transition-colors"><Camera size={14}/></button>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e=>{handlePhotoUpload(e.target.files?.[0]); e.currentTarget.value=''}} />
        </div>
        <div className="min-w-0"><p className="text-lg font-semibold text-slate-900">{profile.name}</p><p className="text-sm text-slate-500">{role.title}</p><p className="text-xs text-slate-400 mt-1">JPG, PNG or WebP · up to 5 MB</p></div>
        <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
          <button type="button" onClick={()=>photoInputRef.current?.click()} className="inline-flex items-center gap-2 text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700"><Camera size={14}/>{profilePhoto?'Change photo':'Upload photo'}</button>
          {profilePhoto&&<button type="button" onClick={()=>{setProfilePhoto(null);showToast('Profile photo removed.')}} className="inline-flex items-center gap-2 text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"><Trash2 size={14}/>Remove</button>}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700">Active</span>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4"><div><label className="text-xs font-medium text-slate-500">Full name</label><input disabled={!editing} value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} className={`${field} mt-1 ${editing?'':'bg-slate-50'}`}/></div><div><label className="text-xs font-medium text-slate-500">Email</label><input type="email" disabled={!editing} value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})} className={`${field} mt-1 ${editing?'':'bg-slate-50'}`}/></div><div><label className="text-xs font-medium text-slate-500">Role</label><input disabled value={role.title} className={`${field} mt-1 bg-slate-50`}/></div><div><label className="text-xs font-medium text-slate-500">Team</label><input disabled={!editing} value={profile.team} onChange={e=>setProfile({...profile,team:e.target.value})} className={`${field} mt-1 ${editing?'':'bg-slate-50'}`}/></div><div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500">Contact number</label><div className={`mt-1 ${editing?'':'pointer-events-none opacity-80'}`}><PhoneInput value={profile.phone} onChange={phone=>setProfile({...profile,phone})}/></div></div></div>
      <div className="flex gap-2 mt-5">{editing?<><button onClick={saveProfile} className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"><Save size={14}/> Save profile</button><button onClick={()=>setEditing(false)} className="text-sm px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button></>:<button onClick={()=>setEditing(true)} className="text-sm font-medium border border-slate-200 rounded-lg px-4 py-2 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700">Edit profile</button>}</div>
    </section>}

    {tab==='security'&&<section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6"><h2 className="text-base font-semibold text-slate-900">Change password</h2><p className="text-xs text-slate-500 mt-1">Use at least 10 characters with upper-case, lower-case and a number.</p>{passwordError&&<p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{passwordError}</p>}<div className="grid sm:grid-cols-2 gap-4 max-w-2xl mt-4"><div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500">Current password *</label><input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className={`${field} mt-1`}/></div><div><label className="text-xs font-medium text-slate-500">New password *</label><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={`${field} mt-1`}/></div><div><label className="text-xs font-medium text-slate-500">Confirm password *</label><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className={`${field} mt-1`}/></div></div><button onClick={changePassword} className="mt-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2">Update password</button><div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500"><p className="font-medium text-slate-700">Account security</p><p className="mt-1">MFA is enabled. Sessions expire after inactivity. Login, download and export activity is auditable.</p></div></section>}

    {tab==='preferences'&&<section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6"><div><h2 className="text-base font-semibold text-slate-900">My preferences</h2><p className="text-xs text-slate-500 mt-1">Notification, dashboard, saved-view and table-display preferences.</p></div><div className="grid lg:grid-cols-2 gap-5 mt-5"><div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notifications</p>{[['inPlatform','In-platform notifications'],['email','Email notifications'],['taskReminders','Task reminders'],['appointmentUpdates','Appointment updates'],['reportUpdates','Report updates'],['qaUpdates','QA updates']].map(([key,label])=><label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:border-brand-200"><span className="text-sm text-slate-700">{label}</span><input type="checkbox" checked={Boolean((prefs as any)[key])} onChange={e=>setPrefs({...prefs,[key]:e.target.checked})} className="rounded border-slate-300 text-brand-600"/></label>)}</div><div className="space-y-4"><div><label className="text-xs font-medium text-slate-500">Digest preference</label><select value={prefs.digest} onChange={e=>setPrefs({...prefs,digest:e.target.value})} className={`${field} mt-1`}><option>Immediate only</option><option>Daily</option><option>Weekly</option></select></div><div><label className="text-xs font-medium text-slate-500">Default dashboard</label><select value={prefs.defaultDashboard} onChange={e=>setPrefs({...prefs,defaultDashboard:e.target.value})} className={`${field} mt-1`}><option>Role default</option><option>Dashboard</option><option>My tasks</option><option>Cases</option></select></div><div><label className="text-xs font-medium text-slate-500">Table preference</label><select value={prefs.tableDensity} onChange={e=>setPrefs({...prefs,tableDensity:e.target.value})} className={`${field} mt-1`}><option>Compact</option><option>Comfortable</option></select></div><div><label className="text-xs font-medium text-slate-500">Time and date display</label><select value={prefs.dateFormat} onChange={e=>setPrefs({...prefs,dateFormat:e.target.value})} className={`${field} mt-1`}><option>DD MMM YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></div><div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500">Saved views created on list screens are stored automatically and remain available in their Saved views menus.</div></div></div><button onClick={()=>savePrefs()} className="mt-5 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"><Save size={14}/> Save preferences</button></section>}

    {tab==='activity'&&<section className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="px-4 py-3 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-900">My activity</h2><p className="text-xs text-slate-500 mt-1">Recent case work, completed tasks, report actions, login activity, downloads and exports.</p></div>{activities.map((item,index)=>{const Icon=item.icon;return <div key={`${item.title}-${index}`} className="flex gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50"><div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Icon size={14}/></div><div className="min-w-0"><p className="text-sm font-medium text-slate-700">{item.title}</p><p className="text-xs text-slate-500 mt-0.5">{item.detail}</p><p className="text-[11px] text-slate-400 mt-1">{item.time}</p></div></div>})}</section>}
  </div>
}
