import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox, FolderKanban, CheckCircle2, Clock, AlertTriangle, CalendarCheck, ShieldAlert } from 'lucide-react'
import WelcomeBanner from '../../components/WelcomeBanner'
import { usePrototypeData } from '../../context/PrototypeDataContext'

export default function ManagementDashboard() {
  const { cases, bookings, clients, doctors, appointments, reports, qaQueue, tasks } = usePrototypeData()
  const [dateFrom, setDateFrom] = useState('2026-08-01')
  const [dateTo, setDateTo] = useState('2026-09-07')
  const activeCases = cases.filter((c) => !['Completed', 'Cancelled', 'Archived'].includes(c.status))
  const completedCases = cases.filter((c) => c.status === 'Completed')
  const completedAppointments = appointments.filter((a) => a.status === 'Completed').length
  const activeAppointments = appointments.filter((a) => a.status !== 'Cancelled').length
  const completionRate = activeAppointments ? Math.round((completedAppointments / activeAppointments) * 100) : 0
  const awaitingQa = qaQueue.filter((q) => q.status !== 'Approved').length
  const overdueCases = activeCases.filter((c) => /Jul 2026|Aug 2026|0[1-6] Sep 2026/.test(c.targetDate)).length
  const averageTurnaround = completedCases.length ? `${Math.max(1, Math.round(18 / completedCases.length + 7))} days` : '—'
  const qaTurnaround = qaQueue.length ? `${Math.max(1, Math.round((qaQueue.filter((q)=>q.status==='Approved').length / qaQueue.length) * 4 + 1))} days` : '—'

  const teamWorkload = useMemo(() => {
    const names = Array.from(new Set([...cases.map((c) => c.owner || 'Unassigned'), ...tasks.map((t) => t.owner || 'Unassigned')]))
    return names.map((name) => {
      const caseCount = activeCases.filter((c) => c.owner === name).length
      const taskCount = tasks.filter((t) => t.owner === name && !['Completed', 'Cancelled'].includes(t.status)).length
      return { name, cases: caseCount, tasks: taskCount, load: caseCount + taskCount }
    }).sort((a, b) => b.load - a.load)
  }, [activeCases, cases, tasks])

  const summaryCards = [
    { label: 'Total bookings', value: bookings.length, sub: 'Current prototype records', icon: Inbox, link: '/bookings' },
    { label: 'Active cases', value: activeCases.length, sub: 'Currently open', icon: FolderKanban, link: '/cases' },
    { label: 'Completed cases', value: completedCases.length, sub: 'Workflow completed', icon: CheckCircle2, link: '/cases' },
    { label: 'Average turnaround', value: averageTurnaround, sub: 'Case completion turnaround', icon: Clock, link: '/analytics' },
    { label: 'Overdue cases', value: overdueCases, sub: 'Past target date in demo period', icon: AlertTriangle, link: '/cases' },
    { label: 'Appointments completed', value: `${completionRate}%`, sub: 'Completion rate', icon: CalendarCheck, link: '/calendar' },
    { label: 'Report backlog', value: reports.filter((r) => r.status !== 'Delivered').length, sub: 'Reports still in workflow', icon: Clock, link: '/reports' },
    { label: 'QA turnaround', value: qaTurnaround, sub: `${awaitingQa} open QA review${awaitingQa===1?'':'s'}`, icon: ShieldAlert, link: '/quality-assurance' },
  ]

  const caseVolumeTrend = [
    { label: 'Apr', value: 12 }, { label: 'May', value: 16 }, { label: 'Jun', value: 15 }, { label: 'Jul', value: 19 },
    { label: 'Current', value: cases.length },
  ]
  const maxTrend = Math.max(...caseVolumeTrend.map((t) => t.value), 1)
  const maxLoad = Math.max(...teamWorkload.map((t) => t.load), 1)
  const clientPerformance = clients.map((client) => ({
    ...client,
    liveActive: activeCases.filter((c) => c.client === client.name).length,
    liveCompleted: completedCases.filter((c) => c.client === client.name).length,
  })).sort((a, b) => b.liveCompleted - a.liveCompleted || b.liveActive - a.liveActive).slice(0, 5)
  const doctorPerformance = doctors.map((doctor) => ({
    ...doctor,
    liveCases: activeCases.filter((c) => c.doctor === doctor.name).length,
    liveReports: reports.filter((r) => r.doctor === doctor.name && r.status !== 'Delivered').length,
  })).sort((a, b) => b.liveCases - a.liveCases).slice(0, 5)

  return (
    <div className="space-y-6">
      <WelcomeBanner subtitle="Organisation-wide performance" />
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-3"><div><label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">From</label><input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div><div><label className="block text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1">To</label><input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div><Link to="/analytics" className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50">View detailed reports</Link><Link to="/cases" className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50">View filtered case list</Link><button onClick={()=>{const rows=[['Metric','Value'],...summaryCards.map((c)=>[c.label,String(c.value)])];const blob=new Blob([rows.map((r)=>r.map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`management-summary-${dateFrom}-to-${dateTo}.csv`;a.click();URL.revokeObjectURL(url)}} className="px-3 py-2 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700">Export authorised data</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-4">
        {summaryCards.map((c) => <Link to={c.link} key={c.label} className="summary-card-interactive group bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between mb-3"><p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{c.label}</p><span className="summary-card-icon"><c.icon size={16} /></span></div><p className="summary-card-value text-2xl font-semibold text-slate-900 mb-1">{c.value}</p><p className="text-xs text-slate-500 mb-2">{c.sub}</p><span className="summary-card-link text-xs text-brand-600 font-medium">Open list <span aria-hidden="true">→</span></span></Link>)}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="font-semibold text-slate-900">Case volume trends</p><p className="text-xs text-slate-500 mb-4">Historical demo context with current live case count</p><div className="flex items-end gap-3 h-36">{caseVolumeTrend.map((t) => <div key={t.label} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-teal-400 rounded-t-md" style={{ height: `${(t.value / maxTrend) * 100}%` }} /><span className="text-xs text-slate-500">{t.label}</span></div>)}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between mb-1"><p className="font-semibold text-slate-900">Workload distribution</p><Link to="/tasks?view=team" className="text-xs text-brand-600 font-medium">Open team tasks</Link></div><p className="text-xs text-slate-500 mb-4">Live active cases and open tasks per owner</p><div className="space-y-4">{teamWorkload.map((m) => <div key={m.name} className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-semibold shrink-0">{m.name === 'Unassigned' ? 'U' : m.name.split(' ').map((p) => p[0]).join('')}</div><div className="flex-1"><div className="flex items-center justify-between mb-1"><span className="text-sm text-slate-700">{m.name}</span><span className="text-xs text-slate-400">{m.cases} cases · {m.tasks} tasks</span></div><div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-teal-400 rounded-full" style={{ width: `${(m.load / maxLoad) * 100}%` }} /></div></div></div>)}</div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between mb-1"><p className="font-semibold text-slate-900">Client performance</p><Link to="/clients" className="text-xs text-brand-600 font-medium">View all</Link></div><p className="text-xs text-slate-500 mb-3">Client means the instructing organisation, not the patient</p><div className="divide-y divide-slate-100">{clientPerformance.map((c) => <Link to={`/clients/${c.id}`} key={c.id} className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-md"><div><p className="text-sm font-medium text-slate-800">{c.name}</p><p className="text-xs text-slate-500 mt-0.5">{c.type}</p></div><span className="text-xs text-slate-500">{c.liveActive} active · {c.liveCompleted} completed</span></Link>)}</div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center justify-between mb-1"><p className="font-semibold text-slate-900">Doctor workload</p><Link to="/doctors" className="text-xs text-brand-600 font-medium">View all</Link></div><p className="text-xs text-slate-500 mb-3">Live assigned cases and reports in workflow</p><div className="divide-y divide-slate-100">{doctorPerformance.map((d) => <Link to={`/doctors/${d.id}`} key={d.id} className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-md"><div><p className="text-sm font-medium text-slate-800">{d.name}</p><p className="text-xs text-slate-500 mt-0.5">{d.speciality}</p></div><span className="text-xs text-slate-500">{d.liveCases} cases · {d.liveReports} reports</span></Link>)}</div></div>
      </div>
    </div>
  )
}
