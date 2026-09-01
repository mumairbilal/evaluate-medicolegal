import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) { setError('Use at least 10 characters with upper-case, lower-case and a number.'); return }
    if (password !== confirm) { setError('Passwords do not match. Re-enter the same password in both fields.'); return }
    setError(''); setSaved(true)
  }
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">{saved ? <div className="text-center py-3"><CheckCircle2 size={34} className="mx-auto text-teal-600"/><h1 className="text-xl font-semibold text-slate-900 mt-3">Password updated</h1><p className="text-sm text-slate-500 mt-1">Your prototype password reset is complete.</p><Link to="/login" className="inline-flex mt-5 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700">Return to sign in</Link></div> : <><h1 className="text-xl font-semibold text-slate-900">Create a new password</h1><p className="text-sm text-slate-500 mt-1">{params.get('email') ? `Account: ${params.get('email')}` : 'Choose a strong password for your account.'}</p><form onSubmit={submit} className="mt-5 space-y-4">{error&&<p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}<div><label className="block text-xs font-medium text-slate-600 mb-1.5">New password *</label><div className="relative"><input type={show?'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500"/><button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{show?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></div><div><label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm password *</label><input type={show?'text':'password'} value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500"/></div><div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-500"><p className="font-medium text-slate-700 mb-1">Password requirements</p><p>At least 10 characters, one upper-case letter, one lower-case letter and one number.</p></div><button className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Save password</button></form><Link to="/login" className="block text-center text-xs text-slate-500 hover:text-brand-700 mt-4">Cancel and return to login</Link></>}</div></div>
}
