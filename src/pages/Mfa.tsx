import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CODE_LENGTH = 6
const EXPIRY_SECONDS = 88

export default function Mfa() {
  const { pendingEmail, mfaCode, confirmMfa, resendCode, cancelMfa } = useAuth()
  const navigate = useNavigate()
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!pendingEmail) {
      navigate('/login', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEmail])

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])

  const handleChange = (i: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[i] = v
      return next
    })
    if (v && i < CODE_LENGTH - 1) inputsRef.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus()
  }

  const handleSubmit = () => {
    const code = digits.join('')
    const err = confirmMfa(code)
    if (err) {
      setError(err)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  const handleResend = () => {
    resendCode()
    setSecondsLeft(EXPIRY_SECONDS)
    setDigits(Array(CODE_LENGTH).fill(''))
    setError('')
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
          <h2 className="text-2xl font-semibold text-slate-900 mb-1.5">Two-step verification</h2>
          <p className="text-sm text-slate-500 mb-6">Enter the 6-digit code from your authenticator app to finish signing in.</p>

          <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 mb-5">
            <Smartphone size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600">
              Verification method: Authenticator app registered to <span className="font-medium text-slate-700">{pendingEmail}</span>
            </p>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

          <label className="block text-sm font-medium text-slate-700 mb-2">Verification code</label>
          <div className="flex gap-2 mb-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el }}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                className="w-full h-12 text-center text-lg border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Code expires in {secondsLeft}s · Prototype code: <span className="font-medium text-slate-600">{mfaCode}</span>
          </p>

          <button
            onClick={handleSubmit}
            className="w-full bg-brand-700 hover:bg-brand-900 text-white text-sm font-medium py-2.5 rounded-lg transition-colors mb-4"
          >
            Confirm and sign in
          </button>

          <div className="flex items-center justify-between text-sm">
            <button onClick={handleResend} className="text-brand-600 font-medium hover:underline">
              Resend code
            </button>
            <button
              onClick={() => {
                cancelMfa()
                navigate('/login')
              }}
              className="text-slate-500 hover:underline"
            >
              Return to sign in
            </button>
          </div>

          <div className="border-t border-slate-100 mt-6 pt-4">
            <p className="text-xs text-slate-500">
              Lost access to your device? <span className="text-brand-600 underline cursor-pointer">Contact support</span> to re-register.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
