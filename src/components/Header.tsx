import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Plus, ChevronDown, User, TimerOff, LogOut, Menu, X, CircleHelp } from 'lucide-react'
import { useRole } from '../context/RoleContext'
import { useAuth } from '../context/AuthContext'
import { useDismissable } from '../hooks/useDismissable'
import { useNotifications } from '../context/NotificationContext'
import { useProfilePhoto } from '../context/ProfilePhotoContext'

const createDestinations: Record<string, string> = {
  'New booking': '/bookings',
  'New case': '/cases?new=1',
  'New patient': '/patients?new=1',
  'New appointment': '/calendar',
  'New task': '/tasks',
  'Upload document': '/documents',
  'Add communication': '/communication',
}

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cases': 'Cases',
  '/calendar': 'Calendar',
  '/tasks': 'Tasks',
  '/communication': 'Communication',
  '/patients': 'Patients',
  '/documents': 'Documents',
  '/reports': 'Reports',
  '/help': 'Help and Support',
  '/bookings': 'Bookings',
  '/clients': 'Clients',
  '/doctors': 'Doctors',
  '/quality-assurance': 'Quality Assurance',
  '/analytics': 'Analytics',
  '/administration': 'Administration',
  '/profile': 'My Profile',
  '/notifications': 'Notifications',
  '/search': 'Search',
}


export default function Header({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const base = '/' + location.pathname.split('/')[1]
  const pageTitle = titles[base] ?? 'Evaluate Medicolegal'
  const { role, setRoleId, roles } = useRole()
  const { simulateTimeout, logout } = useAuth()
  const { notifications, unreadCount, markRead } = useNotifications()
  const { profilePhoto } = useProfilePhoto()

  const [createOpen, setCreateOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const createRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  useDismissable(createRef, createOpen, () => setCreateOpen(false))
  useDismissable(notifRef, notifOpen, () => setNotifOpen(false))
  useDismissable(profileRef, profileOpen, () => setProfileOpen(false))
  useEffect(() => {
    if (base !== '/search') setGlobalSearch('')
  }, [base])
  const runGlobalSearch = () => {
    const query = globalSearch.trim()
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
    setMobileSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-5 lg:px-6 py-3 lg:py-3.5">
      <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <Menu size={18} className="text-slate-600" />
        </button>
        <div className="min-w-0">
          <p className="text-sm text-slate-400 mb-1 hidden sm:block">
            <Link to="/dashboard" className="hover:text-slate-600">Home</Link>
            {base !== '/dashboard' && (
              <>
                <span className="mx-1">/</span>
                <span className="text-slate-500">{pageTitle}</span>
              </>
            )}
          </p>
          <h1 className="text-lg sm:text-xl lg:text-[22px] leading-none font-semibold text-slate-900 truncate">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runGlobalSearch() }}
            placeholder="Search cases, patients, clients..."
            aria-label="Global search"
            className="w-56 lg:w-72 pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          <button onClick={runGlobalSearch} aria-label="Run global search" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-700">
            <Search size={14} />
          </button>
        </div>

        {/* Mobile search toggle */}
        <button
          onClick={() => setMobileSearchOpen((v) => !v)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          {mobileSearchOpen ? <X size={16} className="text-slate-600" /> : <Search size={16} className="text-slate-600" />}
        </button>

        <div className="relative" ref={createRef}>
          <button
            onClick={() => setCreateOpen((v) => !v)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Create</span> <ChevronDown size={14} />
          </button>
          {createOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white z-50 border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 py-1.5 text-sm">
              {['New booking', 'New case', 'New patient', 'New appointment', 'New task', 'Upload document', 'Add communication'].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-4 py-2 hover:bg-brand-50/60 hover:text-brand-700 text-slate-700"
                  onClick={() => {
                    setCreateOpen(false)
                    navigate(createDestinations[item] ?? '/dashboard')
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => navigate('/help')} title="Help and Support" aria-label="Help and Support" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"><CircleHelp size={16}/></button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"
          >
            <Bell size={16} className="text-slate-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 bg-white z-50 border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 py-2 text-sm">
              <div className="px-4 py-1.5 flex items-center justify-between border-b border-slate-100 mb-1">
                <p className="font-medium text-slate-800">Notifications</p>
                <span className="text-xs text-slate-400">{unreadCount} unread</span>
              </div>
              {notifications.slice(0, 4).map((n) => (
                <button key={n.id} onClick={() => { markRead(n.id); setNotifOpen(false); navigate(n.actionPath) }} className={`w-full text-left px-4 py-2 hover:bg-brand-50/60 ${n.read ? '' : 'bg-brand-50/30'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-800">{n.title}</p>
                    {!n.read && <span className="mt-1 w-2 h-2 rounded-full bg-brand-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.detail}</p>
                  <div className="flex items-center justify-between mt-1"><p className="text-[11px] text-slate-400">{n.time}</p><p className="text-[11px] text-brand-600">{n.caseRef}</p></div>
                </button>
              ))}
              <div className="border-t border-slate-100 mt-1 pt-2 px-4">
                <button onClick={() => { setNotifOpen(false); navigate('/notifications') }} className="text-brand-600 text-xs font-medium">Open notification centre</button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-50"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold overflow-hidden ring-1 ring-slate-200/70">
              {profilePhoto ? <img src={profilePhoto} alt={`${role.name} profile`} className="w-full h-full object-cover" /> : role.initials}
            </div>
            <div className="text-left leading-tight hidden md:block">
              <p className="text-sm font-medium text-slate-800">{role.name}</p>
              <p className="text-xs text-slate-400">{role.title}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white z-50 border border-slate-200 rounded-xl shadow-xl shadow-slate-200/70 py-3 text-sm">
              <div className="px-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold overflow-hidden ring-1 ring-slate-200">
                    {profilePhoto ? <img src={profilePhoto} alt={`${role.name} profile`} className="w-full h-full object-cover" /> : role.initials}
                  </div>
                  <div className="min-w-0"><p className="font-medium text-slate-800 truncate">{role.name}</p><p className="text-[11px] text-slate-400">{role.title}</p></div>
                </div>
                <p className="sr-only">{role.name}</p>
                <p className="text-xs text-slate-400">
                  {role.name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(' ').join('.')}@evaluatemedicolegal.co.uk
                </p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {role.title}
                  </span>
                </div>
              </div>
              <div className="px-4 pt-3">
                <p className="text-[11px] font-semibold tracking-wide text-slate-400 mb-1.5">VIEW AS ROLE</p>
                <select
                  value={role.id}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  <User size={15} /> My profile
                </Link>
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    simulateTimeout()
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 text-left"
                >
                  <TimerOff size={15} /> Simulate session timeout
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    logout()
                    navigate('/login')
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 text-red-600 text-left"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {mobileSearchOpen && (
        <div className="relative mt-3 md:hidden">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runGlobalSearch() }}
            placeholder="Search cases, patients, clients..."
            aria-label="Global search"
            className="w-full pl-9 pr-12 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          <button onClick={runGlobalSearch} aria-label="Run global search" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">Go</button>
        </div>
      )}
    </header>
  )
}
