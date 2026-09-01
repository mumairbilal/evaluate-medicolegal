import type { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { useRole } from './RoleContext'

export default function AuthRoleBridge({ children }: { children: ReactNode }) {
  const { setRoleId } = useRole()

  return (
    <AuthProvider onRoleChange={setRoleId} onLoggedOut={() => {}} onLoggedIn={() => {}}>
      {children}
    </AuthProvider>
  )
}
