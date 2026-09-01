import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, CalendarCheck, Clock, Download, FileClock, Filter, ShieldAlert, Users, X } from 'lucide-react'
import { cases, teamWorkload } from '../data/mockData'
import { usePrototypeData } from '../context/PrototypeDataContext'
import StatusBadge from '../components/StatusBadge'

const field = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500'
const label = 'block text-[11px] font-semibold text-slate-500 mb-1.5'

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export default function Analytics() {
  const navigate = useNavigate()
  const { bookings, appointments, reports, qaQueue } = usePrototypeData()
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON'>('CSV')
  const [operationalReport, setOperationalReport] = useState('Cases by status')
  const [dateFrom, setDateFrom] = useState('2026-08-01')
  const [dateTo, setDateTo] = useState('2026-08-31')
  const [client, setClient] = useState('All')
  const [doctor, setDoctor] = useState('All')
  const [caseType, setCaseType] = useState('All')
  const [team, setTeam] = useState('All')
  const [user, setUser] = useState('All')
  const [status, setStatus] = useState('All')
  const [location, setLocation] = useState('All')

  const owners = [...new Set(cases.map((item) => item.owner))]
  const locations = [...new Set(appointments.map((item) => item.location))]
  const clients = [...new Set(cases.map((item) => item.client))]
  const doctors = [...new Set(cases.map((item) => item.doctor))]
  const caseTypes = [...new Set(cases.map((item) => item.caseType))]
  const statuses = [...new Set(cases.map((item) => item.status))]

  const filteredCases = useMemo(() => cases.filter((item) => {
    const target = Date.parse(item.targetDate)
    if (dateFrom && !Number.isNaN(target) && target < new Date(`${dateFrom}T00:00:00`).getTime()) return false
    if (dateTo && !Number.isNaN(target) && target > new Date(`${dateTo}T23:59:59`).getTime()) return false
    if (client !== 'All' && item.client !== client) return false
    if (doctor !== 'All' && item.doctor !== doctor) return false
    if (caseType !== 'All' && item.caseType !== caseType) return false
    if (status !== 'All' && item.status !== status) return false
    if (user !== 'All' && item.owner !== user) return false
    if (team !== 'All') {
      if (team === 'Operations' && !['Marcus Bell', 'Priya Nandra', 'Hannah Whitfield', 'Unassigned'].includes(item.owner)) return false
      if (team === 'Medical Expert' && item.doctor === '—') return false
    }
    if (location !== 'All' && !appointments.some((a) => a.caseRef === item.ref && a.location === location)) return false
    return true
  }), [dateFrom, dateTo, client, doctor, caseType, team, user, status, location, appointments])

  const caseRefs = new Set(filteredCases.map((item) => item.ref))
  const filteredReports = reports.filter((item) => caseRefs.has(item.caseRef))
  const filteredQa = qaQueue.filter((item) => caseRefs.has(item.caseRef))
  const filteredAppointments = appointments.filter((item) => caseRefs.has(item.caseRef) && (location === 'All' || item.location === location))
  const filteredBookings = bookings.filter((item) => client === 'All' || item.client === client)

  const statusRows = statuses.map((name) => ({ name, value: filteredCases.filter((item) => item.status === name).length }))
  const maxStatus = Math.max(...statusRows.map((item) => item.value), 1)
  const completedAppointments = filteredAppointments.filter((item) => item.status === 'Completed').length
  const appointmentCompletion = filteredAppointments.length ? Math.round((completedAppointments / filteredAppointments.length) * 100) : 0
  const qaApproved = filteredQa.filter((item) => item.status === 'Approved').length

  const clientPerformance = clients.map((name) => {
    const clientCases = filteredCases.filter((item) => item.client === name)
    return { name, active: clientCases.filter((item) => item.status !== 'Completed').length, completed: clientCases.filter((item) => item.status === 'Completed').length }
  }).filter((item) => item.active || item.completed)

  const doctorPerformance = doctors.filter((name) => name !== '—').map((name) => {
    const doctorCases = filteredCases.filter((item) => item.doctor === name)
    const doctorReports = filteredReports.filter((item) => item.doctor === name)
    return { name, cases: doctorCases.length, reports: doctorReports.length, approved: doctorReports.filter((item) => item.qaStatus === 'Approved').length }
  }).filter((item) => item.cases || item.reports)

  const activeFilterSummary = [
    `Date: ${dateFrom || 'Any'} to ${dateTo || 'Any'}`,
    client !== 'All' ? `Client: ${client}` : '', doctor !== 'All' ? `Doctor: ${doctor}` : '', caseType !== 'All' ? `Case type: ${caseType}` : '',
    team !== 'All' ? `Team: ${team}` : '', user !== 'All' ? `User: ${user}` : '', status !== 'All' ? `Status: ${status}` : '', location !== 'All' ? `Location: ${location}` : '',
  ].filter(Boolean)

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setClient('All'); setDoctor('All'); setCaseType('All'); setTeam('All'); setUser('All'); setStatus('All'); setLocation('All')
  }

  const operationalReportNames = ['Bookings by period','Cases by status','Cases by client','Cases by doctor','Appointment volumes','Cancellation rates','Pending reports','QA turnaround','Overdue tasks','Completed cases','Team workload']
  const operationalRows = useMemo(() => {
    if (operationalReport === 'Cases by client') return clientPerformance.map(x=>({label:x.name,value:x.active+x.completed,detail:`${x.active} active · ${x.completed} completed`}))
    if (operationalReport === 'Cases by doctor') return doctorPerformance.map(x=>({label:x.name,value:x.cases,detail:`${x.reports} reports · ${x.approved} QA approved`}))
    if (operationalReport === 'Appointment volumes') return [{label:'All appointments',value:filteredAppointments.length,detail:`${completedAppointments} completed`},{label:'Completion rate',value:appointmentCompletion,detail:'Percent completed'}]
    if (operationalReport === 'Cancellation rates') { const cancelled=filteredAppointments.filter(x=>x.status==='Cancelled').length; return [{label:'Cancelled appointments',value:cancelled,detail:`${filteredAppointments.length ? Math.round(cancelled/filteredAppointments.length*100):0}% cancellation rate`}] }
    if (operationalReport === 'Pending reports') return filteredReports.filter(x=>!['Approved','Delivered'].includes(x.status)).map(x=>({label:x.caseRef,value:1,detail:`${x.patient} · ${x.status}`}))
    if (operationalReport === 'QA turnaround') return [{label:'QA queue',value:filteredQa.length,detail:`${qaApproved} approved · ${filteredQa.filter(x=>x.status==='Returned').length} returned`}]
    if (operationalReport === 'Completed cases') return filteredCases.filter(x=>x.status==='Completed').map(x=>({label:x.ref,value:1,detail:`${x.patient} · ${x.client}`}))
    if (operationalReport === 'Team workload') return teamWorkload.map(x=>({label:x.name,value:x.cases,detail:`${x.tasks} tasks · ${x.load}% workload`}))
    if (operationalReport === 'Bookings by period') return [{label:'Bookings in current view',value:filteredBookings.length,detail:activeFilterSummary[0]??'Current filter period'}]
    if (operationalReport === 'Overdue tasks') return [{label:'Operational overdue work',value:teamWorkload.reduce((n,x)=>n+(x.tasks>3?1:0),0),detail:'High-workload team members requiring review'}]
    return statusRows.map(x=>({label:x.name,value:x.value,detail:'Cases'}))
  }, [operationalReport, clientPerformance, doctorPerformance, filteredAppointments, completedAppointments, appointmentCompletion, filteredReports, filteredQa, qaApproved, filteredCases, filteredBookings, activeFilterSummary, statusRows])

  const exportData = () => {
    const rows = filteredCases.map((item) => ({
      case_reference: item.ref, patient: item.patient, client: item.client, doctor: item.doctor, case_type: item.caseType,
      status: item.status, owner: item.owner, target_date: item.targetDate, priority: item.priority,
    }))
    if (exportFormat === 'JSON') {
      download('evaluate-analytics-export.json', JSON.stringify({ filters: activeFilterSummary, rows }, null, 2), 'application/json;charset=utf-8')
    } else {
      const headers = Object.keys(rows[0] ?? { case_reference: '', patient: '', client: '', doctor: '', case_type: '', status: '', owner: '', target_date: '', priority: '' })
      const esc = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => esc((row as Record<string, unknown>)[key])).join(','))].join('\n')
      download('evaluate-analytics-export.csv', `\ufeff${csv}`, 'text/csv;charset=utf-8')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Management analytics</h2>
          <p className="text-xs text-slate-500 mt-1">Operational performance across cases, appointments, reports and QA.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFiltersOpen((value) => !value)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"><Filter size={15} /> Filters</button>
          <button onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"><Download size={15} /> Export data</button>
        </div>
      </div>

      {filtersOpen && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <div><label className={label}>Date from</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={field} /></div>
            <div><label className={label}>Date to</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={field} /></div>
            <div><label className={label}>Client</label><select className={field} value={client} onChange={(e) => setClient(e.target.value)}><option>All</option>{clients.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div><label className={label}>Doctor</label><select className={field} value={doctor} onChange={(e) => setDoctor(e.target.value)}><option>All</option>{doctors.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div><label className={label}>Case type</label><select className={field} value={caseType} onChange={(e) => setCaseType(e.target.value)}><option>All</option>{caseTypes.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div><label className={label}>Team</label><select className={field} value={team} onChange={(e) => setTeam(e.target.value)}><option>All</option><option>Operations</option><option>Medical Expert</option><option>Quality Assurance</option><option>File Preparation</option></select></div>
            <div><label className={label}>User</label><select className={field} value={user} onChange={(e) => setUser(e.target.value)}><option>All</option>{owners.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div><label className={label}>Status</label><select className={field} value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div><label className={label}>Location</label><select className={field} value={location} onChange={(e) => setLocation(e.target.value)}><option>All</option>{locations.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-end"><button onClick={clearFilters} className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900">Clear all filters</button></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Current view: {activeFilterSummary.join(' · ')}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['Bookings', filteredBookings.length, 'Matching booking activity', Users],
          ['Active cases', filteredCases.filter((item) => item.status !== 'Completed').length, 'Current operational caseload', BarChart3],
          ['Completed cases', filteredCases.filter((item) => item.status === 'Completed').length, 'Closed in current view', CalendarCheck],
          ['Avg. turnaround', '18 days', 'Booking to report delivery', Clock],
          ['Report backlog', filteredReports.filter((item) => !['Delivered', 'Approved'].includes(item.status)).length, 'Not finally delivered', FileClock],
          ['QA approved', qaApproved, `${filteredQa.length} review records`, ShieldAlert],
        ].map(([title, value, sub, Icon]) => {
          const IconComponent = Icon as typeof BarChart3
          return <div key={String(title)} className="summary-card-interactive bg-white rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title as string}</p><span className="summary-card-icon"><IconComponent size={16} /></span></div><p className="summary-card-value text-xl font-semibold text-slate-900 mt-3">{String(value)}</p><p className="text-xs text-slate-400 mt-1">{sub as string}</p></div>
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Case volume trend</h3><p className="text-xs text-slate-400 mt-1 mb-5">Monthly operational volume.</p>
          <div className="flex items-end gap-3 h-40">{[['Apr',14],['May',19],['Jun',16],['Jul',22],['Aug',Math.max(filteredCases.length,1)+18]].map(([name, value]) => <div key={String(name)} className="flex-1 flex flex-col items-center gap-2"><span className="text-[11px] text-slate-500">{value}</span><div className="w-full rounded-t-md bg-brand-500" style={{height:`${Math.max(8, Number(value)*4)}px`}} /><span className="text-xs text-slate-400">{name}</span></div>)}</div>
        </section>
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900">Status breakdown</h3><p className="text-xs text-slate-400 mt-1 mb-4">Current case status distribution.</p>
          <div className="space-y-3">{statusRows.map((row) => <div key={row.name} className="flex items-center gap-3"><span className="w-36 text-xs text-slate-600 truncate">{row.name}</span><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{width:`${(row.value/maxStatus)*100}%`}} /></div><span className="w-5 text-xs text-right text-slate-500">{row.value}</span></div>)}</div>
        </section>
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-900">Workload table</h3><p className="text-xs text-slate-400 mt-1">Cases and tasks by team member.</p></div><div className="divide-y divide-slate-100">{teamWorkload.map((item) => <div key={item.name} className="grid grid-cols-[1fr_70px_70px_100px] gap-3 px-4 py-3 text-sm items-center"><span className="font-medium text-slate-700">{item.name}</span><span className="text-xs text-slate-500">{item.cases} cases</span><span className="text-xs text-slate-500">{item.tasks} tasks</span><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-teal-500" style={{width:`${item.load}%`}} /></div></div>)}</div></section>
        <section className="bg-white rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-900">Turnaround metrics</h3><div className="grid grid-cols-2 gap-3 mt-4">{[['Booking → appointment','6.2 days'],['Appointment → draft','8.1 days'],['QA turnaround','4.5 days'],['Overall','18 days']].map(([name,value]) => <div key={name} className="metric-card-interactive rounded-lg border border-slate-100 bg-slate-50 p-3"><p className="text-xs text-slate-500">{name}</p><p className="text-lg font-semibold text-slate-800 mt-1">{value}</p></div>)}</div></section>
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-900">Client performance</h3></div><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50"><th className="px-4 py-2.5">Client</th><th className="px-4 py-2.5">Active</th><th className="px-4 py-2.5">Completed</th></tr></thead><tbody className="divide-y divide-slate-100">{clientPerformance.map((item) => <tr key={item.name}><td className="px-4 py-3 text-slate-700">{item.name}</td><td className="px-4 py-3 text-slate-500">{item.active}</td><td className="px-4 py-3 text-slate-500">{item.completed}</td></tr>)}</tbody></table></section>
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-900">Doctor performance</h3></div><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50"><th className="px-4 py-2.5">Doctor</th><th className="px-4 py-2.5">Cases</th><th className="px-4 py-2.5">Reports</th><th className="px-4 py-2.5">QA approved</th></tr></thead><tbody className="divide-y divide-slate-100">{doctorPerformance.map((item) => <tr key={item.name}><td className="px-4 py-3 text-slate-700">{item.name}</td><td className="px-4 py-3 text-slate-500">{item.cases}</td><td className="px-4 py-3 text-slate-500">{item.reports}</td><td className="px-4 py-3 text-slate-500">{item.approved}</td></tr>)}</tbody></table></section>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-900">Operational reports</h3><p className="text-xs text-slate-500 mt-1">Open a detailed operational report using the current analytics filters.</p></div><select className={`${field} md:w-64`} value={operationalReport} onChange={(e)=>setOperationalReport(e.target.value)}>{operationalReportNames.map(name=><option key={name}>{name}</option>)}</select></div>
        <div className="p-4 grid lg:grid-cols-[260px_minmax(0,1fr)] gap-4"><div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700">Report details</p><p className="text-sm font-medium text-slate-900 mt-2">{operationalReport}</p><p className="text-xs text-slate-500 mt-2">{operationalRows.reduce((n,x)=>n+Number(x.value||0),0)} total across {operationalRows.length} breakdown row{operationalRows.length===1?'':'s'}.</p><p className="text-[11px] text-slate-400 mt-3">Applied filters</p><div className="mt-1 space-y-1">{activeFilterSummary.map(item=><p key={item} className="text-[11px] text-slate-500">{item}</p>)}</div><div className="flex flex-wrap gap-2 mt-4"><button onClick={()=>setExportOpen(true)} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-brand-50 hover:text-brand-700">Export</button><button onClick={()=>navigate(operationalReport.toLowerCase().includes('report')?'/reports':operationalReport.toLowerCase().includes('appointment')?'/calendar':operationalReport.toLowerCase().includes('task')||operationalReport==='Team workload'?'/tasks':'/cases')} className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-brand-50 hover:text-brand-700">Open related records</button></div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 bg-slate-50"><th className="px-3 py-2.5">Breakdown</th><th className="px-3 py-2.5">Value</th><th className="px-3 py-2.5">Detail</th></tr></thead><tbody className="divide-y divide-slate-100">{operationalRows.map((row,index)=><tr key={`${row.label}-${index}`} className="hover:bg-brand-50/25"><td className="px-3 py-2.5 text-slate-700">{row.label}</td><td className="px-3 py-2.5 font-medium text-slate-800">{row.value}</td><td className="px-3 py-2.5 text-slate-500">{row.detail}</td></tr>)}{operationalRows.length===0&&<tr><td colSpan={3} className="p-8 text-center text-slate-400">No data for this report and filter set.</td></tr>}</tbody></table></div></div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-900">Appointment statistics</h3><div className="grid grid-cols-3 gap-3 mt-4"><div><p className="text-2xl font-semibold text-slate-900">{filteredAppointments.length}</p><p className="text-xs text-slate-400">Total</p></div><div><p className="text-2xl font-semibold text-slate-900">{completedAppointments}</p><p className="text-xs text-slate-400">Completed</p></div><div><p className="text-2xl font-semibold text-slate-900">{appointmentCompletion}%</p><p className="text-xs text-slate-400">Completion rate</p></div></div></section>
        <section className="bg-white rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-900">QA statistics</h3><div className="flex gap-2 flex-wrap mt-4">{['Not Started','In Review','Returned','Approved'].map((value) => <div key={value} className="metric-card-interactive rounded-lg border border-slate-100 px-3 py-2"><StatusBadge status={value} /><p className="text-lg font-semibold text-slate-800 mt-2">{filteredQa.filter((item) => item.status === value).length}</p></div>)}</div></section>
      </div>

      {exportOpen && <div className="fixed inset-0 z-50 bg-slate-900/35 flex items-center justify-center p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200"><div className="flex items-start justify-between p-4 border-b border-slate-100"><div><h3 className="font-semibold text-slate-900">Export analytics data</h3><p className="text-xs text-slate-500 mt-1">Only authorised, approved operational data should be exported.</p></div><button onClick={() => setExportOpen(false)} className="p-1.5 rounded-md hover:bg-slate-100"><X size={16} /></button></div><div className="p-4 space-y-4"><div><label className={label}>Export format</label><select className={field} value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'CSV'|'JSON')}><option>CSV</option><option>JSON</option></select></div><div><p className={label}>Included filters</p><div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-1">{activeFilterSummary.map((item) => <p key={item}>{item}</p>)}</div></div><div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800"><strong>Confidentiality warning:</strong> Exported medicolegal data may contain sensitive personal information. Store and share it only through approved secure channels.</div></div><div className="p-4 border-t border-slate-100 flex justify-end gap-2"><button onClick={() => setExportOpen(false)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">Cancel</button><button onClick={() => { exportData(); setExportOpen(false) }} className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"><Download size={14} className="inline mr-1.5" /> Export {exportFormat}</button></div></div></div>}
    </div>
  )
}
