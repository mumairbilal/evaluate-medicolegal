import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address, for example name@evaluatemedicolegal.co.uk.'); return }
    setError(''); setSent(true)
  }
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center"><Mail size={18}/></div><h1 className="text-xl font-semibold text-slate-900 mt-4">Reset your password</h1><p className="text-sm text-slate-500 mt-1">Enter your account email and we’ll send a secure reset link.</p>{sent ? <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4"><p className="text-sm font-medium text-teal-800">Reset link requested</p><p className="text-xs text-teal-700 mt-1">If an active account exists for {email}, reset instructions have been sent. For this prototype, continue to the reset screen below.</p><Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="inline-flex mt-3 text-sm font-medium text-brand-700 hover:text-brand-800">Open prototype reset screen</Link></div> : <form onSubmit={submit} className="mt-5 space-y-4">{error&&<p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}<div><label className="block text-xs font-medium text-slate-600 mb-1.5">Email address *</label><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500" placeholder="name@evaluatemedicolegal.co.uk"/></div><button className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Send reset link</button></form>}<div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between"><Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-700"><ArrowLeft size={13}/> Return to login</Link><span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><ShieldCheck size={12}/> Secure recovery</span></div></div></div>
}
