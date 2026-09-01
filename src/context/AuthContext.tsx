import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { roles } from './RoleContext'

export type AuthStatus = 'loggedOut' | 'mfaPending' | 'loggedIn' | 'expired'

const PROTOTYPE_PASSWORD = 'Evaluate2026'
const SUSPENDED_EMAIL = 'rebecca.coyle@evaluatemedicolegal.co.uk'
const OUTAGE_PREFIX = 'offline@'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

function emailForRole(name: string) {
  return `${name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(' ').join('.')}@evaluatemedicolegal.co.uk`
}

interface AuthContextValue {
  status: AuthStatus
  pendingEmail: string
  mfaCode: string
  login: (email: string, password: string) => string | null
  confirmMfa: (code: string) => string | null
  resendCode: () => void
  cancelMfa: () => void
  logout: () => void
  simulateTimeout: () => void
  resumeSession: (password: string) => string | null
  returnToLogin: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
  onRoleChange,
  onLoggedOut,
  onLoggedIn,
}: {
  children: ReactNode
  onRoleChange: (roleId: string) => void
  onLoggedOut: () => void
  onLoggedIn: () => void
}) {
  const [status, setStatus] = useState<AuthStatus>('loggedOut')
  const [pendingEmail, setPendingEmail] = useState('')
  const [mfaCode, setMfaCode] = useState('481920')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetInactivityTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (status === 'loggedIn') {
      timerRef.current = setTimeout(() => setStatus('expired'), SESSION_TIMEOUT_MS)
    }
  }

  useEffect(() => {
    if (status !== 'loggedIn') return
    resetInactivityTimer()
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const handler = () => resetInactivityTimer()
    events.forEach((e) => window.addEventListener(e, handler))
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const login: AuthContextValue['login'] = (email, password) => {
    const normalized = email.trim().toLowerCase()
    if (!normalized || !password) return 'Enter your email and password.'
    if (normalized.startsWith(OUTAGE_PREFIX)) {
      return 'Service outage: authentication is temporarily unavailable. Please try again shortly.'
    }
    if (normalized === SUSPENDED_EMAIL) {
      return 'This account has been suspended. Contact your administrator for access.'
    }
    if (password !== PROTOTYPE_PASSWORD) {
      return 'Incorrect email or password.'
    }
    setPendingEmail(normalized)
    setMfaCode(String(Math.floor(100000 + Math.random() * 900000)))
    setStatus('mfaPending')
    return null
  }

  const confirmMfa: AuthContextValue['confirmMfa'] = (code) => {
    if (!/^\d{6}$/.test(code)) return 'Enter the 6-digit code from your authenticator app.'
    const matchedRole = roles.find((r) => emailForRole(r.name) === pendingEmail)
    onRoleChange((matchedRole ?? roles[0]).id)
    setStatus('loggedIn')
    onLoggedIn()
    return null
  }

  const resendCode = () => setMfaCode(String(Math.floor(100000 + Math.random() * 900000)))

  const cancelMfa = () => {
    setPendingEmail('')
    setStatus('loggedOut')
  }

  const logout = () => {
    setStatus('loggedOut')
    setPendingEmail('')
    onLoggedOut()
  }

  const simulateTimeout = () => setStatus('expired')

  const resumeSession: AuthContextValue['resumeSession'] = (password) => {
    if (!password) return 'Enter your password to continue.'
    if (password !== PROTOTYPE_PASSWORD) return 'Incorrect password.'
    setStatus('loggedIn')
    return null
  }

  const returnToLogin = () => {
    setStatus('loggedOut')
    setPendingEmail('')
    onLoggedOut()
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        pendingEmail,
        mfaCode,
        login,
        confirmMfa,
        resendCode,
        cancelMfa,
        logout,
        simulateTimeout,
        resumeSession,
        returnToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
