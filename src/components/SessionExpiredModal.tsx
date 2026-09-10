import { useState } from 'react'
import { Lock, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SessionExpiredModal() {
  const { pendingEmail, returnToLogin, resumeSession } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const email = pendingEmail || 'your account'

  const handleSignInAgain = () => {
    const err = resumeSession(password)
    if (err) {
      setError(err)
      return
    }
    setPassword('')
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]" />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Your session has expired</h2>
          <button onClick={returnToLogin} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-500 mb-4">
            For security, you were signed out after 30 minutes of inactivity. Case information is hidden until you sign in again.
          </p>

          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-lg px-3.5 py-3 mb-5">
            <Lock size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Any unsaved changes on the previous screen were not submitted.</p>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          <p className="text-xs text-slate-400 mt-2">Signed in as {email}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={returnToLogin}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Return to login
          </button>
          <button
            onClick={handleSignInAgain}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-700 hover:bg-brand-900 rounded-lg"
          >
            Sign in again
          </button>
        </div>
      </div>
    </div>
  )
}
