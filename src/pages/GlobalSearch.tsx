import { useMemo, useState } from 'react'
import { Search, Clock3, FolderKanban, CalendarDays, FileText, Stethoscope, Users, HeartPulse, Inbox, ArrowRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cases, patients as seedPatients } from '../data/mockData'
import { loadPatients } from '../utils/patientStorage'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { useRole } from '../context/RoleContext'

type SearchResult = { id: string; category: string; title: string; meta: string; path: string; haystack: string }

const categoryMeta: Record<string, { icon: typeof FolderKanban; route: string }> = {
  Cases: { icon: FolderKanban, route: '/cases' },
  Bookings: { icon: Inbox, route: '/bookings' },
  Patients: { icon: HeartPulse, route: '/patients' },
  Clients: { icon: Users, route: '/clients' },
  Doctors: { icon: Stethoscope, route: '/doctors' },
  Appointments: { icon: CalendarDays, route: '/calendar' },
  Reports: { icon: FileText, route: '/reports' },
  Documents: { icon: FileText, route: '/documents' },
}

const RECENT_KEY = 'evaluate-global-recent-searches-v1'
function loadRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[] } catch { return [] } }

export default function GlobalSearch() {
  const navigate = useNavigate()
  const { role } = useRole()
  const { bookings, clients, doctors, appointments, reports, documents } = usePrototypeData()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [category, setCategory] = useState('All')
  const [recent, setRecent] = useState<string[]>(loadRecent)
  const patients = loadPatients(seedPatients)

  const allowedRoutes = useMemo(() => new Set(role.nav.flatMap((section) => section.items.map((item) => item.to))), [role])
  const canSee = (route: string) => allowedRoutes.has(route) || route === '/cases'

  const allResults = useMemo<SearchResult[]>(() => [
    ...cases.map((item) => ({ id: item.ref, category: 'Cases', title: `${item.ref} — ${item.patient}`, meta: `${item.clientRef} · ${item.client} · ${item.status}`, path: `/cases/${item.ref}`, haystack: `${item.ref} ${item.clientRef} ${item.patient} ${item.client} ${item.doctor} ${item.caseType} ${item.status}` })),
    ...bookings.map((item) => ({ id: item.ref, category: 'Bookings', title: `${item.ref} — ${item.patient}`, meta: `${item.client} · ${item.status}`, path: `/bookings/${item.ref}`, haystack: `${item.ref} ${item.patient} ${item.client} ${item.doctor} ${item.caseType} ${item.status} ${item.source}` })),
    ...patients.map((item) => ({ id: item.id, category: 'Patients', title: item.name, meta: `${item.dob} · ${item.email || item.phone}`, path: `/patients/${item.id}`, haystack: `${item.name} ${item.dob} ${item.email} ${item.phone} ${item.address}` })),
    ...clients.map((item) => ({ id: item.id, category: 'Clients', title: item.name, meta: `${item.type} · ${item.primaryContact}`, path: `/clients/${item.id}`, haystack: `${item.name} ${item.type} ${item.primaryContact} ${item.email} ${item.phone}` })),
    ...doctors.map((item) => ({ id: item.id, category: 'Doctors', title: item.name, meta: `${item.speciality} · ${item.location}`, path: `/doctors/${item.id}`, haystack: `${item.name} ${item.speciality} ${item.location} ${(item.locations ?? []).join(' ')} ${(item.specialities ?? []).join(' ')}` })),
    ...appointments.map((item) => ({ id: item.id, category: 'Appointments', title: `${item.patient} — ${item.date}`, meta: `${item.time} · ${item.doctor} · ${item.type} · ${item.location}`, path: '/calendar', haystack: `${item.patient} ${item.caseRef} ${item.doctor} ${item.date} ${item.time} ${item.type} ${item.location} ${item.status}` })),
    ...reports.map((item) => ({ id: item.id, category: 'Reports', title: `${item.caseRef} — ${item.reportType}`, meta: `${item.patient} · ${item.doctor} · ${item.status}`, path: '/reports', haystack: `${item.caseRef} ${item.patient} ${item.doctor} ${item.reportType} ${item.status} ${item.qaStatus} ${item.template}` })),
    ...documents.map((item) => ({ id: item.id, category: 'Documents', title: item.name, meta: `${item.caseRef} · ${item.patient} · ${item.category}`, path: '/documents', haystack: `${item.name} ${item.caseRef} ${item.patient} ${item.category} ${item.uploadedBy}` })),
  ].filter((item) => canSee(categoryMeta[item.category]?.route ?? '/cases')), [bookings, clients, doctors, appointments, reports, documents, role])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return allResults.filter((item) => (category === 'All' || item.category === category) && item.haystack.toLowerCase().includes(q))
  }, [allResults, query, category])

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>()
    filtered.forEach((item) => map.set(item.category, [...(map.get(item.category) ?? []), item]))
    return [...map.entries()]
  }, [filtered])

  const runSearch = (value = query) => {
    const clean = value.trim()
    setParams(clean ? { q: clean } : {})
    if (!clean) return
    const next = [clean, ...recent.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6)
    setRecent(next)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }

  const availableCategories = Object.keys(categoryMeta).filter((name) => canSee(categoryMeta[name].route))

  return <div className="max-w-6xl mx-auto space-y-4">
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Global search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} placeholder="Search cases, client references, patients, doctors, appointments, reports or documents..." className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500" />
          </div>
        </div>
        <button onClick={() => runSearch()} className="inline-flex justify-center items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"><Search size={15}/> Search</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {['All', ...availableCategories].map((item) => <button key={item} onClick={() => setCategory(item)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${category === item ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-700'}`}>{item}</button>)}
      </div>
    </section>

    {!query.trim() && <section className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex items-center gap-2"><Clock3 size={16} className="text-slate-400"/><h2 className="text-sm font-semibold text-slate-800">Recent searches</h2></div>{recent.length ? <div className="flex flex-wrap gap-2 mt-3">{recent.map((item) => <button key={item} onClick={() => { setQuery(item); runSearch(item) }} className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700">{item}</button>)}</div> : <p className="text-sm text-slate-400 mt-3">Your recent searches will appear here.</p>}</section>}

    {query.trim() && <>
      <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{filtered.length} result{filtered.length === 1 ? '' : 's'} for <span className="font-medium text-slate-700">“{query.trim()}”</span></p><p className="text-xs text-slate-400">Results are limited to modules available to your role.</p></div>
      {grouped.length ? grouped.map(([name, items]) => { const Icon = categoryMeta[name]?.icon ?? FileText; return <section key={name} className="bg-white border border-slate-200 rounded-xl overflow-hidden"><div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2"><Icon size={15} className="text-brand-600"/><h2 className="text-sm font-semibold text-slate-800">{name}</h2></div><span className="text-xs text-slate-400">{items.length}</span></div>{items.map((item) => <button key={`${item.category}-${item.id}`} onClick={() => navigate(item.path)} className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left border-b border-slate-100 last:border-0 hover:bg-brand-50/40 group"><div className="min-w-0"><p className="text-sm font-medium text-slate-800 truncate group-hover:text-brand-700">{item.title}</p><p className="text-xs text-slate-500 mt-1 truncate">{item.meta}</p></div><ArrowRight size={15} className="text-slate-300 group-hover:text-brand-600 shrink-0"/></button>)}</section> }) : <section className="bg-white border border-slate-200 rounded-xl p-10 text-center"><Search size={26} className="mx-auto text-slate-300"/><h2 className="text-sm font-semibold text-slate-800 mt-3">No results for “{query.trim()}”</h2><p className="text-xs text-slate-500 mt-1">Check spelling, try fewer words, or choose another category filter.</p><div className="flex justify-center gap-2 mt-4"><button onClick={() => setCategory('All')} className="px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50">Clear category filter</button><button onClick={() => navigate('/bookings?new=1')} className="px-3 py-2 text-xs rounded-lg bg-brand-600 text-white hover:bg-brand-700">Create booking</button></div></section>}
    </>}
  </div>
}
