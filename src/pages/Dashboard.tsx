import { useRole } from '../context/RoleContext'
import MedicalExpertDashboard from './dashboards/MedicalExpertDashboard'
import OperationsDashboard from './dashboards/OperationsDashboard'
import BookingAdministratorDashboard from './dashboards/BookingAdministratorDashboard'
import FilePreparationDashboard from './dashboards/FilePreparationDashboard'
import QaDashboard from './dashboards/QaDashboard'
import ManagementDashboard from './dashboards/ManagementDashboard'
import PlaceholderDashboard from './dashboards/PlaceholderDashboard'

export default function Dashboard() {
  const { role } = useRole()

  if (role.dashboard === 'operations') {
    return <OperationsDashboard />
  }

  if (role.dashboard === 'booking-administrator') {
    return <BookingAdministratorDashboard />
  }

  if (role.dashboard === 'file-preparation') {
    return <FilePreparationDashboard />
  }

  if (role.dashboard === 'qa') {
    return <QaDashboard />
  }

  if (role.dashboard === 'management') {
    return <ManagementDashboard />
  }

  if (role.dashboard === 'placeholder') {
    return (
      <PlaceholderDashboard
        title={role.dashboardTitle ?? 'Dashboard'}
        description={role.dashboardDescription ?? 'This screen has not been designed yet.'}
      />
    )
  }

  return <MedicalExpertDashboard />
}
