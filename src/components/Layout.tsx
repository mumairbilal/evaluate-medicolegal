import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import SessionExpiredModal from './SessionExpiredModal'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { status } = useAuth()
  const { role } = useRole()
  const location = useLocation()
  const base = '/' + location.pathname.split('/')[1]
  const globallyAvailable = new Set(['/dashboard', '/profile', '/help', '/notifications', '/search'])
  const permittedModules = new Set(role.nav.flatMap((section) => section.items.map((item) => item.to)))
  const permitted = globallyAvailable.has(base) || permittedModules.has(base)

  return (
    <div className="h-screen flex bg-slate-50 text-slate-800 overflow-hidden">
      <div className={status === 'expired' ? 'flex flex-1 min-w-0 h-screen pointer-events-none select-none blur-[2px]' : 'flex flex-1 min-w-0 h-screen'}>
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
        <div className="flex-1 min-w-0 h-screen overflow-y-auto flex flex-col">
          <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 p-4 sm:p-5 lg:p-6">
            {permitted ? <Outlet /> : <div className="max-w-xl mx-auto mt-12 bg-white border border-slate-200 rounded-xl p-8 text-center"><h2 className="text-lg font-semibold text-slate-900">Permission denied</h2><p className="text-sm text-slate-500 mt-2">Your current role does not have permission to access this module. No restricted records or partial data have been shown.</p><div className="flex items-center justify-center gap-2 mt-5"><Link to="/dashboard" className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700">Return to dashboard</Link><Link to="/help" className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">Contact administrator / support</Link></div></div>}
          </main>
        </div>
      </div>
      {status === 'expired' && <SessionExpiredModal />}
    </div>
  )
}
