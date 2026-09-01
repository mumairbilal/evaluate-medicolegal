import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  LayoutGrid,
  FolderKanban,
  CalendarDays,
  CheckSquare,
  MessageSquare,
  HeartPulse,
  FolderOpen,
  ClipboardCheck,
  LifeBuoy,
  Inbox,
  Users,
  Stethoscope,
  BarChart3,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export interface NavSectionConfig {
  title?: string
  items: NavItem[]
}

export type DashboardVariant = 'medical-expert' | 'operations' | 'booking-administrator' | 'file-preparation' | 'qa' | 'management' | 'placeholder'

export interface RoleConfig {
  id: string
  name: string
  title: string
  initials: string
  nav: NavSectionConfig[]
  dashboard: DashboardVariant
  dashboardTitle?: string
  dashboardDescription?: string
}

const dailyWorkBase: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/cases', label: 'Cases', icon: FolderKanban },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
]

const dailyWorkWithBookings: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/bookings', label: 'Bookings', icon: Inbox },
  { to: '/cases', label: 'Cases', icon: FolderKanban },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/communication', label: 'Communication', icon: MessageSquare },
]

const dailyWorkQa: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/cases', label: 'Cases', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
]

const dailyWorkManagement: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/cases', label: 'Cases', icon: FolderKanban },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
]

export const roles: RoleConfig[] = [
  {
    id: 'booking-administrator',
    name: 'Priya Nandra',
    title: 'Booking Administrator',
    initials: 'PN',
    dashboard: 'booking-administrator',
    nav: [
      { title: 'DAILY WORK', items: dailyWorkWithBookings },
      { title: 'RECORDS', items: [
        { to: '/patients', label: 'Patients', icon: HeartPulse },
        { to: '/clients', label: 'Clients', icon: Users },
        { to: '/doctors', label: 'Doctors', icon: Stethoscope },
        { to: '/documents', label: 'Documents', icon: FolderOpen },
      ] },
      { title: 'REPORTS & OVERSIGHT', items: [{ to: '/reports', label: 'Reports', icon: ClipboardCheck }] },
      { title: 'SYSTEM', items: [{ to: '/help', label: 'Help and Support', icon: LifeBuoy }] },
    ],
  },
  {
    id: 'operations-manager',
    name: 'Marcus Bell',
    title: 'Operations Manager',
    initials: 'MB',
    dashboard: 'operations',
    nav: [
      { title: 'DAILY WORK', items: dailyWorkWithBookings },
      { title: 'RECORDS', items: [
        { to: '/patients', label: 'Patients', icon: HeartPulse },
        { to: '/clients', label: 'Clients', icon: Users },
        { to: '/doctors', label: 'Doctors', icon: Stethoscope },
        { to: '/documents', label: 'Documents', icon: FolderOpen },
      ] },
      { title: 'REPORTS & OVERSIGHT', items: [
        { to: '/reports', label: 'Reports', icon: ClipboardCheck },
        { to: '/quality-assurance', label: 'Quality Assurance', icon: ShieldCheck },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      ] },
      { title: 'SYSTEM', items: [{ to: '/help', label: 'Help and Support', icon: LifeBuoy }] },
    ],
  },
  {
    id: 'medical-expert',
    name: 'Dr Amara Osei',
    title: 'Medical Expert',
    initials: 'AO',
    dashboard: 'medical-expert',
    nav: [
      { title: 'DAILY WORK', items: dailyWorkBase },
      { title: 'RECORDS', items: [
        { to: '/patients', label: 'Patients', icon: HeartPulse },
        { to: '/documents', label: 'Documents', icon: FolderOpen },
      ] },
      { title: 'REPORTS & OVERSIGHT', items: [{ to: '/reports', label: 'Reports', icon: ClipboardCheck }] },
      { title: 'SYSTEM', items: [{ to: '/help', label: 'Help and Support', icon: LifeBuoy }] },
    ],
  },
  {
    id: 'file-preparation',

    name: 'Fiona Chen',
    title: 'File Preparation',
    initials: 'FC',
    dashboard: 'file-preparation',
    nav: [
      { title: 'DAILY WORK', items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
        { to: '/cases', label: 'Cases', icon: FolderKanban },
        { to: '/tasks', label: 'Tasks', icon: CheckSquare },
      ] },
      { title: 'RECORDS', items: [{ to: '/documents', label: 'Documents', icon: FolderOpen }] },
      { title: 'REPORTS & OVERSIGHT', items: [{ to: '/reports', label: 'Reports', icon: ClipboardCheck }] },
      { title: 'SYSTEM', items: [{ to: '/help', label: 'Help and Support', icon: LifeBuoy }] },
    ],
  },
  {
    id: 'quality-assurance',
    name: 'Elaine Fitzgerald',
    title: 'Quality Assurance',
    initials: 'EF',
    dashboard: 'qa',
    nav: [
      { title: 'DAILY WORK', items: dailyWorkQa },
      { title: 'RECORDS', items: [{ to: '/documents', label: 'Documents', icon: FolderOpen }] },
      { title: 'REPORTS & OVERSIGHT', items: [
        { to: '/reports', label: 'Reports', icon: ClipboardCheck },
        { to: '/quality-assurance', label: 'Quality Assurance', icon: ShieldCheck },
      ] },
      { title: 'SYSTEM', items: [{ to: '/help', label: 'Help and Support', icon: LifeBuoy }] },
    ],
  },
  {
    id: 'management',
    name: 'Helena Vasquez',
    title: 'Management',
    initials: 'HV',
    dashboard: 'management',
    nav: [
      { title: 'DAILY WORK', items: dailyWorkManagement },
      { title: 'RECORDS', items: [{ to: '/documents', label: 'Documents', icon: FolderOpen }] },
      { title: 'REPORTS & OVERSIGHT', items: [
        { to: '/reports', label: 'Reports', icon: ClipboardCheck },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      ] },
      { title: 'SYSTEM', items: [{ to: '/help', label: 'Help and Support', icon: LifeBuoy }] },
    ],
  },
  {
    id: 'system-administrator',
    name: 'Tom Ackerley',
    title: 'System Administrator',
    initials: 'TA',
    dashboard: 'operations',
    nav: [
      { title: 'DAILY WORK', items: dailyWorkWithBookings },
      { title: 'RECORDS', items: [
        { to: '/patients', label: 'Patients', icon: HeartPulse },
        { to: '/clients', label: 'Clients', icon: Users },
        { to: '/doctors', label: 'Doctors', icon: Stethoscope },
        { to: '/documents', label: 'Documents', icon: FolderOpen },
      ] },
      { title: 'REPORTS & OVERSIGHT', items: [
        { to: '/reports', label: 'Reports', icon: ClipboardCheck },
        { to: '/quality-assurance', label: 'Quality Assurance', icon: ShieldCheck },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      ] },
      { title: 'SYSTEM', items: [
        { to: '/administration', label: 'Administration', icon: Settings },
        { to: '/help', label: 'Help and Support', icon: LifeBuoy },
      ] },
    ],
  },
]

interface RoleContextValue {
  role: RoleConfig
  setRoleId: (id: string) => void
  roles: RoleConfig[]
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState(roles[0].id)
  const role = roles.find((r) => r.id === roleId) ?? roles[0]

  return (
    <RoleContext.Provider value={{ role, setRoleId, roles }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within a RoleProvider')
  return ctx
}
