import { Routes, Route, Navigate } from 'react-router-dom'
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
import { useAuth } from './context/AuthContext'

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

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/cases" element={<CaseList />} />
        <Route path="/cases/:ref" element={<CaseDetail />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/:id" element={<PatientProfile />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/bookings/:ref" element={<BookingDetail />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        <Route path="/quality-assurance" element={<QualityAssurance />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/administration" element={<Administration />} />
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
