import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('hannah.whitfield@evaluatemedicolegal.co.uk')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = login(email, password)
    if (err) {
      setError(err)
      return
    }
    setError('')
    navigate('/mfa')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between bg-ink-900 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-teal-500 flex items-center justify-center font-semibold text-white text-base">
            E
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold">Evaluate</p>
            <p className="text-[11px] tracking-wide text-slate-300">MEDICOLEGAL</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-serif leading-tight mb-5 max-w-md">
            Medicolegal case management, from instruction to delivered report.
          </h1>
          <p className="text-slate-300 max-w-md mb-6">
            Bookings, appointments, prepared files, expert reports, and quality assurance held in a single auditable record.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-200">
            {['Full audit history on every case', 'Role-based access to sensitive information', 'Deadline and turnaround monitoring'].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck size={14} /> Access is monitored and recorded. Patient data is confidential.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-teal-500 flex items-center justify-center font-semibold text-white text-base">
              E
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold text-slate-900">Evaluate</p>
              <p className="text-[11px] tracking-wide text-slate-400">MEDICOLEGAL</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mb-1.5">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Use your Evaluate Medicolegal account to access case records.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                />
                Remember this device
              </label>
              <Link
                to="/forgot-password"
                className="text-brand-600 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-700 hover:bg-brand-900 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Sign in
            </button>

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-600 tracking-wide">PROTOTYPE ACCESS</p>
              <p>
                Password <code className="bg-white border border-slate-200 rounded px-1 py-0.5">Evaluate2026</code> for any listed user. Try{' '}
                <code className="bg-white border border-slate-200 rounded px-1 py-0.5">rebecca.coyle@evaluatemedicolegal.co.uk</code> for a suspended
                account, or <code className="bg-white border border-slate-200 rounded px-1 py-0.5">offline@...</code> for a service outage.
              </p>
            </div>
          </form>

          <p className="text-xs text-slate-400 mt-6">
            This system contains confidential patient information. Access is logged and monitored. Do not share your credentials.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Problems signing in? <Link to="/forgot-password" className="text-brand-600 underline">Recover access</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
