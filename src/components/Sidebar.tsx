import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { useRole, type NavItem } from '../context/RoleContext'

function NavSection({
  title,
  items,
  collapsed,
  onNavigate,
}: {
  title?: string
  items: NavItem[]
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <div className="mb-5">
      {title && !collapsed && (
        <p className="px-2 mb-2 text-[10px] font-semibold tracking-wide text-heading">
          {title}
        </p>
      )}
      <nav className="space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg text-sm transition-colors ${
                collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'
              } ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={2} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen = false,
  onCloseMobile,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}) {
  const { role } = useRole()

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`bg-ink-900 text-white flex flex-col py-4 border-r border-white/5 transition-all duration-200
          fixed inset-y-0 left-0 z-40 w-[240px] px-3 h-screen
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:h-screen lg:shrink-0
          ${collapsed ? 'lg:w-[72px] lg:px-2' : 'lg:w-[240px] lg:px-3'}
        `}
      >
        <div className={`flex items-center gap-3 mb-6 shrink-0 ${collapsed ? 'lg:px-0 lg:justify-center' : 'px-2'}`}>
          <div className="w-9 h-9 shrink-0 rounded-lg bg-teal-500 flex items-center justify-center font-semibold text-white text-base">
            E
          </div>
          <div className={`leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="text-base font-semibold">Evaluate</p>
            <p className="text-[11px] tracking-wide text-heading">MEDICOLEGAL</p>
          </div>
          <button
            onClick={onCloseMobile}
            className="ml-auto lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden -mr-4 pr-4">
          {role.nav.map((section, i) => (
            <NavSection
              key={i}
              title={section.title}
              items={section.items}
              collapsed={collapsed}
              onNavigate={onCloseMobile}
            />
          ))}
        </div>

        <button
          onClick={onToggleCollapsed}
          className={`hidden lg:flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium py-2.5 border-t border-white/5 mt-2 shrink-0 ${
            collapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          {!collapsed && 'Collapse'}
        </button>
      </aside>
    </>
  )
}
