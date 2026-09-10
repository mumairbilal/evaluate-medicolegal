import type { ReactNode } from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Mfa from './pages/Mfa'
import Dashboard from './pages/Dashboard'
import CaseList from './pages/CaseList'
import CaseDetail from './pages/CaseDetail'
import CalendarPage from './pages/Calendar'
import PatientList from './pages/PatientList'
import PatientProfile from './pages/PatientProfile'
import Documents from './pages/Documents'
import Tasks from './pages/Tasks'
import Communication from './pages/Communication'
import Reports from './pages/Reports'
import Help from './pages/Help'
import Bookings from './pages/Bookings'
import BookingDetail from './pages/BookingDetail'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Doctors from './pages/Doctors'
import DoctorDetail from './pages/DoctorDetail'
import QualityAssurance from './pages/QualityAssurance'
import Analytics from './pages/Analytics'
import Administration from './pages/Administration'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import GlobalSearch from './pages/GlobalSearch'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Advanced from './pages/Advanced'
import { useAuth } from './context/AuthContext'
import { useRole } from './context/RoleContext'

function ModuleGuard({ modulePath, children }: { modulePath: string; children: ReactNode }) {
  const { role } = useRole()
  const allowed = role.nav.some((section) => section.items.some((item) => item.to === modulePath))
  if (allowed) return <>{children}</>
  return (
    <div className="max-w-xl mx-auto mt-10 rounded-xl border border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto w-11 h-11 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center"><ShieldX size={20}/></div>
      <h2 className="text-base font-semibold text-slate-900 mt-4">Permission denied</h2>
      <p className="text-sm text-slate-500 mt-2">{role.title} does not have access to this module. Only information required for this role is available.</p>
      <div className="mt-5 flex items-center justify-center gap-2"><Link to="/dashboard" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Return to dashboard</Link><Link to="/help" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Contact support</Link></div>
    </div>
  )
}

export default function App() {
  const { status } = useAuth()

  if (status === 'loggedOut') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (status === 'mfaPending') {
    return (
      <Routes>
        <Route path="/mfa" element={<Mfa />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/mfa" replace />} />
      </Routes>
    )
  }

  const guard = (path: string, element: ReactNode) => <ModuleGuard modulePath={path}>{element}</ModuleGuard>

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cases" element={guard('/cases', <CaseList />)} />
        <Route path="/cases/:ref" element={guard('/cases', <CaseDetail />)} />
        <Route path="/calendar" element={guard('/calendar', <CalendarPage />)} />
        <Route path="/patients" element={guard('/patients', <PatientList />)} />
        <Route path="/patients/:id" element={guard('/patients', <PatientProfile />)} />
        <Route path="/documents" element={guard('/documents', <Documents />)} />
        <Route path="/tasks" element={guard('/tasks', <Tasks />)} />
        <Route path="/communication" element={guard('/communication', <Communication />)} />
        <Route path="/reports" element={guard('/reports', <Reports />)} />
        <Route path="/bookings" element={guard('/bookings', <Bookings />)} />
        <Route path="/bookings/:ref" element={guard('/bookings', <BookingDetail />)} />
        <Route path="/clients" element={guard('/clients', <Clients />)} />
        <Route path="/clients/:id" element={guard('/clients', <ClientDetail />)} />
        <Route path="/doctors" element={guard('/doctors', <Doctors />)} />
        <Route path="/doctors/:id" element={guard('/doctors', <DoctorDetail />)} />
        <Route path="/quality-assurance" element={guard('/quality-assurance', <QualityAssurance />)} />
        <Route path="/analytics" element={guard('/analytics', <Analytics />)} />
        <Route path="/administration" element={guard('/administration', <Administration />)} />
        <Route path="/advanced" element={guard('/advanced', <Advanced />)} />
        <Route path="/help" element={<Help />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/search" element={<GlobalSearch />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/mfa" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
