import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import SessionExpiredModal from './SessionExpiredModal'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { status } = useAuth()

  return (
    <div className="h-screen flex bg-slate-50 text-slate-800 overflow-hidden">
      <div className={status === 'expired' ? 'flex flex-1 min-w-0 h-screen pointer-events-none select-none blur-[2px]' : 'flex flex-1 min-w-0 h-screen'}>
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 min-w-0 h-screen overflow-y-auto flex flex-col">
          <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 p-4 sm:p-5 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {status === 'expired' && <SessionExpiredModal />}
    </div>
  )
}
