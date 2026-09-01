import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Globe2, MapPin, Plus, RotateCcw, ShieldCheck, Stethoscope } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import NewAppointmentModal from '../components/NewAppointmentModal'
import AppointmentDetailsModal from '../components/AppointmentDetailsModal'
import { useToast } from '../context/ToastContext'
import { usePrototypeData } from '../context/PrototypeDataContext'
import { cases } from '../data/mockData'
import type { Appointment } from '../types'

const views = ['Day', 'Week', 'Month', 'Doctor', 'Location'] as const
type ViewType = (typeof views)[number]
type TimeFormat = '12h' | '24h'
type DatedAppointment = Appointment & { _date: Date; _start: number; _end: number; _timeLabel: string }

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TODAY = new Date(2026, 8, 1)
const DEFAULT_DAY_START = 8 * 60
const DEFAULT_DAY_END = 18 * 60
const SLOT_MINUTES = 30
const STORAGE_TIMEZONE_OFFSET = 5 * 60
const TIMEZONE_OFFSETS = [-720, -660, -600, -570, -540, -480, -420, -360, -300, -240, -210, -180, -120, -60, 0, 60, 120, 180, 210, 240, 270, 300, 330, 345, 360, 390, 420, 480, 525, 540, 570, 600, 630, 660, 720, 765, 780, 840]
const TIMEZONE_HINTS: Record<number, string> = {
  [-720]: 'International Date Line West', [-660]: 'Samoa', [-600]: 'Hawaii', [-570]: 'Marquesas', [-540]: 'Alaska',
  [-480]: 'Pacific', [-420]: 'Mountain', [-360]: 'Central', [-300]: 'Eastern', [-240]: 'Atlantic', [-210]: 'Newfoundland',
  [-180]: 'Argentina / Brazil', [-120]: 'South Georgia', [-60]: 'Azores', [0]: 'London / UTC', [60]: 'Central Europe',
  [120]: 'Eastern Europe / South Africa', [180]: 'Saudi Arabia / East Africa', [210]: 'Iran', [240]: 'UAE / Oman', [270]: 'Afghanistan',
  [300]: 'Pakistan / Maldives', [330]: 'India / Sri Lanka', [345]: 'Nepal', [360]: 'Bangladesh', [390]: 'Myanmar',
  [420]: 'Thailand / Vietnam', [480]: 'China / Singapore', [525]: 'Eucla', [540]: 'Japan / Korea', [570]: 'Australia Central',
  [600]: 'Australia East', [630]: 'Lord Howe', [660]: 'Solomon Islands', [720]: 'New Zealand', [765]: 'Chatham Islands',
  [780]: 'Tonga / Samoa', [840]: 'Line Islands',
}

function parseApptDate(value: string): Date | null {
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d
  const parts = value.split(' ')
  if (parts.length !== 3) return null
  const [day, mon, year] = parts
  const monthIdx = MONTH_NAMES.findIndex((m) => m.slice(0, 3).toLowerCase() === mon.toLowerCase())
  return monthIdx === -1 ? null : new Date(Number(year), monthIdx, Number(day))
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfWeek(d: Date) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() - copy.getDay())
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(d: Date, n: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

function clientForAppointment(a: Appointment) {
  return cases.find((item) => item.ref === a.caseRef)?.client ?? 'Not recorded'
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.trim().split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return hours * 60 + minutes
}

function appointmentStart(appointment: Appointment) {
  return timeToMinutes(appointment.time.split('–')[0] ?? '')
}

function appointmentEnd(appointment: Appointment) {
  return timeToMinutes(appointment.time.split('–')[1] ?? '')
}

function formatMinutes(value: number, timeFormat: TimeFormat) {
  const normalised = ((value % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours24 = Math.floor(normalised / 60)
  const minutes = normalised % 60
  if (timeFormat === '24h') return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  const suffix = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  return minutes === 0 ? `${hours12} ${suffix}` : `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function gmtLabel(offset: number) {
  const sign = offset >= 0 ? '+' : '-'
  const absolute = Math.abs(offset)
  return `GMT${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`
}

function timezoneOptionLabel(offset: number) {
  const hint = TIMEZONE_HINTS[offset]
  return `${gmtLabel(offset)}${hint ? ` · ${hint}` : ''}`
}

function displayAppointment(appointment: Appointment, timezoneOffset: number, timeFormat: TimeFormat): DatedAppointment | null {
  const sourceDate = parseApptDate(appointment.date)
  if (!sourceDate) return null
  const startMinutes = appointmentStart(appointment)
  const endMinutes = appointmentEnd(appointment)
  const baseUtc = Date.UTC(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate())
  const startUtc = baseUtc + (startMinutes - STORAGE_TIMEZONE_OFFSET) * 60_000
  const endUtc = baseUtc + (endMinutes - STORAGE_TIMEZONE_OFFSET) * 60_000
  const shiftedStart = new Date(startUtc + timezoneOffset * 60_000)
  const shiftedEnd = new Date(endUtc + timezoneOffset * 60_000)
  const displayDate = new Date(shiftedStart.getUTCFullYear(), shiftedStart.getUTCMonth(), shiftedStart.getUTCDate())
  const displayStart = shiftedStart.getUTCHours() * 60 + shiftedStart.getUTCMinutes()
  const displayEnd = shiftedEnd.getUTCHours() * 60 + shiftedEnd.getUTCMinutes()
  const crossesDay = shiftedStart.getUTCFullYear() !== shiftedEnd.getUTCFullYear() || shiftedStart.getUTCMonth() !== shiftedEnd.getUTCMonth() || shiftedStart.getUTCDate() !== shiftedEnd.getUTCDate()
  return {
    ...appointment,
    _date: displayDate,
    _start: displayStart,
    _end: crossesDay && displayEnd <= displayStart ? displayEnd + 24 * 60 : displayEnd,
    _timeLabel: `${formatMinutes(displayStart, timeFormat)} – ${formatMinutes(displayEnd, timeFormat)}${crossesDay ? ' (+1d)' : ''}`,
  }
}

function formatCalendarDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!remainder) return `${hours} hr${hours === 1 ? '' : 's'}`
  return `${hours} hr ${remainder} min`
}

type PositionedAppointment = DatedAppointment & { _column: number; _columns: number }

const HOUR_HEIGHT = 88

function timelineRange(appointments: DatedAppointment[]) {
  const validStarts = appointments.map((appointment) => appointment._start).filter((value) => value >= 0)
  const validEnds = appointments.map((appointment) => appointment._end).filter((value) => value >= 0)
  const earliest = validStarts.length ? Math.min(...validStarts) : DEFAULT_DAY_START
  const latest = validEnds.length ? Math.max(...validEnds) : DEFAULT_DAY_END
  const start = Math.max(0, Math.min(DEFAULT_DAY_START, Math.floor(earliest / 60) * 60))
  const end = Math.min(24 * 60, Math.max(DEFAULT_DAY_END, Math.ceil(latest / 60) * 60))
  return { start, end }
}

function hourMarkers(start: number, end: number) {
  return Array.from({ length: Math.max(1, Math.floor((end - start) / 60) + 1) }, (_, index) => start + index * 60)
}

function layoutOverlappingAppointments(appointments: DatedAppointment[]): PositionedAppointment[] {
  const sorted = [...appointments].sort((a, b) => a._start - b._start || a._end - b._end || a.doctor.localeCompare(b.doctor))
  const output: PositionedAppointment[] = []
  let cluster: DatedAppointment[] = []
  let clusterEnd = -1

  const flushCluster = () => {
    if (!cluster.length) return
    const columnEnds: number[] = []
    const assignments: Array<{ appointment: DatedAppointment; column: number }> = []

    for (const appointment of cluster) {
      let column = columnEnds.findIndex((end) => end <= appointment._start)
      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(appointment._end)
      } else {
        columnEnds[column] = appointment._end
      }
      assignments.push({ appointment, column })
    }

    const columns = Math.max(1, columnEnds.length)
    assignments.forEach(({ appointment, column }) => output.push({ ...appointment, _column: column, _columns: columns }))
    cluster = []
    clusterEnd = -1
  }

  for (const appointment of sorted) {
    if (cluster.length && appointment._start >= clusterEnd) flushCluster()
    cluster.push(appointment)
    clusterEnd = Math.max(clusterEnd, appointment._end)
  }
  flushCluster()
  return output
}

function appointmentStyle(appointment: PositionedAppointment, rangeStart: number) {
  const top = ((appointment._start - rangeStart) / 60) * HOUR_HEIGHT
  const rawHeight = ((appointment._end - appointment._start) / 60) * HOUR_HEIGHT
  const widthPercent = 100 / appointment._columns
  return {
    top: `${Math.max(0, top)}px`,
    height: `${Math.max(16, rawHeight - 2)}px`,
    left: `calc(${appointment._column * widthPercent}% + 3px)`,
    width: `calc(${widthPercent}% - 6px)`,
  }
}

export default function CalendarPage() {
  const { showToast } = useToast()
  const { appointments, doctors, addAppointment, updateAppointment } = usePrototypeData()
  const [view, setView] = useState<ViewType>('Month')
  const [cursor, setCursor] = useState<Date>(new Date(TODAY))
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [doctorFilter, setDoctorFilter] = useState('All doctors')
  const [locationFilter, setLocationFilter] = useState('All locations')
  const [typeFilter, setTypeFilter] = useState('All appointment types')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [clientFilter, setClientFilter] = useState('All clients')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    try { return localStorage.getItem('evaluate-calendar-time-format') === '24h' ? '24h' : '12h' } catch { return '12h' }
  })
  const [timezoneOffset, setTimezoneOffset] = useState<number>(() => {
    try {
      const stored = Number(localStorage.getItem('evaluate-calendar-timezone-offset'))
      return TIMEZONE_OFFSETS.includes(stored) ? stored : STORAGE_TIMEZONE_OFFSET
    } catch { return STORAGE_TIMEZONE_OFFSET }
  })

  useEffect(() => {
    try { localStorage.setItem('evaluate-calendar-time-format', timeFormat) } catch { /* prototype preference only */ }
  }, [timeFormat])

  useEffect(() => {
    try { localStorage.setItem('evaluate-calendar-timezone-offset', String(timezoneOffset)) } catch { /* prototype preference only */ }
  }, [timezoneOffset])

  const activeDoctorNames = doctors.filter((doctor) => doctor.status === 'Active').map((doctor) => doctor.name)
  const locations = useMemo(() => [...new Set(appointments.map((appointment) => appointment.location))].sort(), [appointments])
  const appointmentTypes = useMemo(() => [...new Set(appointments.map((appointment) => appointment.type))].sort(), [appointments])
  const clients = useMemo(() => [...new Set(appointments.map(clientForAppointment))].sort(), [appointments])
  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedId)

  const dated = useMemo(() => appointments
    .map((appointment) => displayAppointment(appointment, timezoneOffset, timeFormat))
    .filter((appointment): appointment is DatedAppointment => appointment !== null)
    .filter((appointment) => doctorFilter === 'All doctors' || appointment.doctor === doctorFilter)
    .filter((appointment) => locationFilter === 'All locations' || appointment.location === locationFilter)
    .filter((appointment) => typeFilter === 'All appointment types' || appointment.type === typeFilter)
    .filter((appointment) => statusFilter === 'All statuses' || appointment.status === statusFilter)
    .filter((appointment) => clientFilter === 'All clients' || clientForAppointment(appointment) === clientFilter)
    .filter((appointment) => !dateFrom || appointment._date >= new Date(`${dateFrom}T00:00:00`))
    .filter((appointment) => !dateTo || appointment._date <= new Date(`${dateTo}T23:59:59`)),
  [appointments, doctorFilter, locationFilter, typeFilter, statusFilter, clientFilter, dateFrom, dateTo, timezoneOffset, timeFormat])

  const filterCount = [
    doctorFilter !== 'All doctors',
    locationFilter !== 'All locations',
    typeFilter !== 'All appointment types',
    statusFilter !== 'All statuses',
    clientFilter !== 'All clients',
    Boolean(dateFrom),
    Boolean(dateTo),
  ].filter(Boolean).length

  const clearFilters = () => {
    setDoctorFilter('All doctors')
    setLocationFilter('All locations')
    setTypeFilter('All appointment types')
    setStatusFilter('All statuses')
    setClientFilter('All clients')
    setDateFrom('')
    setDateTo('')
  }

  function goPrev() {
    setCursor((previous) => view === 'Day' ? addDays(previous, -1) : view === 'Week' ? addDays(previous, -7) : new Date(previous.getFullYear(), previous.getMonth() - 1, 1))
  }

  function goNext() {
    setCursor((previous) => view === 'Day' ? addDays(previous, 1) : view === 'Week' ? addDays(previous, 7) : new Date(previous.getFullYear(), previous.getMonth() + 1, 1))
  }

  const label = useMemo(() => {
    if (view === 'Day') return cursor.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (view === 'Week') {
      const start = startOfWeek(cursor)
      const end = addDays(start, 6)
      return start.getMonth() === end.getMonth()
        ? `${start.getDate()}–${end.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`
        : `${start.getDate()} ${MONTH_NAMES[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`
    }
    return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
  }, [view, cursor])

  const apptsOn = (day: Date) => dated.filter((appointment) => isSameDay(appointment._date, day))
  const visibleAppointments = useMemo(() => {
    if (view === 'Day' || view === 'Doctor' || view === 'Location') {
      return dated.filter((appointment) => isSameDay(appointment._date, cursor))
    }
    if (view === 'Week') {
      const start = startOfWeek(cursor)
      const end = addDays(start, 7)
      return dated.filter((appointment) => appointment._date >= start && appointment._date < end)
    }
    return dated.filter((appointment) => appointment._date.getFullYear() === cursor.getFullYear() && appointment._date.getMonth() === cursor.getMonth())
  }, [dated, view, cursor])
  const groupedDated = useMemo(
    () => (view === 'Doctor' || view === 'Location') ? visibleAppointments : dated,
    [dated, visibleAppointments, view],
  )
  const openDetails = (appointment: Appointment) => setSelectedId(appointment.id)
  const selectCalendarDay = (day: Date) => {
    // Date navigation must never change the user's selected calendar view.
    // Day / Week / Month / Doctor / Location all remain active until the user
    // explicitly changes the view from the view switcher.
    setCursor(day)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={goPrev} aria-label="Previous period" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronLeft size={15} /></button>
            <p className="font-semibold text-slate-900 min-w-[12rem] text-center text-sm">{label}</p>
            <button onClick={goNext} aria-label="Next period" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronRight size={15} /></button>
            <button onClick={() => setCursor(new Date(TODAY))} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 ml-1">Today</button>
          </div>
          <label className="relative xl:ml-2">
            <span className="sr-only">Calendar time zone</span>
            <Globe2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select value={timezoneOffset} onChange={(event) => setTimezoneOffset(Number(event.target.value))} className="h-8 max-w-[210px] appearance-none rounded-lg border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-600 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500">
              {TIMEZONE_OFFSETS.map((offset) => <option key={offset} value={offset}>{timezoneOptionLabel(offset)}</option>)}
            </select>
          </label>
          <div className="flex bg-slate-100 rounded-lg p-0.5" aria-label="Time format">
            {(['12h', '24h'] as TimeFormat[]).map((format) => <button key={format} onClick={() => setTimeFormat(format)} className={`text-[11px] px-2.5 py-1.5 rounded-md transition-colors ${timeFormat === format ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}>{format === '12h' ? '12-hour' : '24-hour'}</button>)}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end xl:ml-auto">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {views.map((item) => (
              <button key={item} onClick={() => setView(item)} className={`text-xs px-3 py-1.5 rounded-md transition-colors ${view === item ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}>{item}</button>
            ))}
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Schedule appointment</button>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Calendar filters</h2>
            <p className="text-xs text-slate-400 mt-0.5">Filter by doctor, location, appointment type, status, client and date range.</p>
          </div>
          {filterCount > 0 && <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"><RotateCcw size={13}/> Clear {filterCount} filter{filterCount === 1 ? '' : 's'}</button>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          <FilterSelect label="Doctor" value={doctorFilter} onChange={setDoctorFilter} values={['All doctors', ...activeDoctorNames]} />
          <FilterSelect label="Location" value={locationFilter} onChange={setLocationFilter} values={['All locations', ...locations]} />
          <FilterSelect label="Appointment type" value={typeFilter} onChange={setTypeFilter} values={['All appointment types', ...appointmentTypes]} />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} values={['All statuses', 'Scheduled', 'Completed', 'Did Not Attend', 'Cancelled', 'Rescheduled']} />
          <FilterSelect label="Client" value={clientFilter} onChange={setClientFilter} values={['All clients', ...clients]} />
          <DateFilter label="From" value={dateFrom} onChange={setDateFrom} />
          <DateFilter label="To" value={dateTo} onChange={setDateTo} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-slate-400">{dated.length} appointment{dated.length === 1 ? '' : 's'} match the current filters.</p>
          <div className="flex items-center gap-3 flex-wrap justify-end"><p className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"><Globe2 size={12} /> Displaying {gmtLabel(timezoneOffset)} · {timeFormat === '12h' ? '12-hour AM/PM' : '24-hour'}.</p><p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700"><ShieldCheck size={12} /> Conflict protection checks overlapping doctor and patient appointments.</p></div>
        </div>
      </section>

      <div className="grid xl:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
        <MiniMonthCalendar cursor={cursor} today={TODAY} timezoneOffset={timezoneOffset} onChange={selectCalendarDay} onMonthChange={setCursor} />
        <div className="min-w-0">
          {view === 'Month' && <MonthGrid cursor={cursor} apptsOn={apptsOn} today={TODAY} onDayClick={selectCalendarDay} onAppointmentClick={openDetails} />}
          {view === 'Week' && <WeekTimeline cursor={cursor} apptsOn={apptsOn} today={TODAY} timeFormat={timeFormat} timezoneLabel={gmtLabel(timezoneOffset)} onDayClick={selectCalendarDay} onAppointmentClick={openDetails} />}
          {view === 'Day' && <DayTimeline appts={apptsOn(cursor)} timeFormat={timeFormat} timezoneLabel={gmtLabel(timezoneOffset)} onAppointmentClick={openDetails} />}
          {view === 'Doctor' && <GroupedAgenda dated={groupedDated} groupBy="doctor" onAppointmentClick={openDetails} />}
          {view === 'Location' && <GroupedAgenda dated={groupedDated} groupBy="location" onAppointmentClick={openDetails} />}
        </div>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div><h2 className="text-sm font-semibold text-slate-900">Appointment register</h2><p className="text-xs text-slate-400 mt-0.5">Open any appointment for details, history and actions.</p></div>
          <span className="text-xs text-slate-400">{visibleAppointments.length} shown in this {view.toLowerCase()} view</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {visibleAppointments.length ? [...visibleAppointments]
            .sort((a, b) => a._date.getTime() - b._date.getTime() || a._start - b._start)
            .map((appointment) => (
              <button key={appointment.id} onClick={() => openDetails(appointment)} className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 text-left">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{formatCalendarDate(appointment._date)} · {appointment._timeLabel} — {appointment.patient}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{appointment.type} · {appointment.doctor} · {appointment.location} · {clientForAppointment(appointment)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0"><StatusBadge status={appointment.status}/><span className="text-xs font-medium text-brand-600">View details</span></div>
              </button>
            )) : <div className="p-8 text-center text-sm text-slate-400">No appointments match the current filters.</div>}
        </div>
      </section>

      {modalOpen && <NewAppointmentModal existingCount={appointments.length} existingAppointments={appointments} onClose={() => setModalOpen(false)} onCreate={(appointment) => { addAppointment(appointment); setModalOpen(false); setSelectedId(appointment.id); showToast(`Appointment scheduled for ${appointment.patient}.`) }} />}
      {selectedAppointment && <AppointmentDetailsModal appointment={selectedAppointment} appointments={appointments} doctors={doctors} onClose={() => setSelectedId(null)} onUpdate={(next) => { updateAppointment(next.id, next); showToast('Appointment updated.') }} />}
    </div>
  )
}

function FilterSelect({ label, value, onChange, values }: { label: string; value: string; onChange: (value: string) => void; values: string[] }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-slate-500 mb-1">{label}</span>
      <select className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  )
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-slate-500 mb-1">{label}</span>
      <input type="date" className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function MiniMonthCalendar({ cursor, today, timezoneOffset, onChange, onMonthChange }: { cursor: Date; today: Date; timezoneOffset: number; onChange: (day: Date) => void; onMonthChange: (day: Date) => void }) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const gridStart = addDays(first, -first.getDay())
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))

  return (
    <aside className="bg-white rounded-xl border border-slate-200 p-3 xl:sticky xl:top-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{MONTH_NAMES[month]} {year}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Globe2 size={10} /> {gmtLabel(timezoneOffset)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous month" onClick={() => onMonthChange(new Date(year, month - 1, 1))} className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500"><ChevronLeft size={14} /></button>
          <button type="button" aria-label="Next month" onClick={() => onMonthChange(new Date(year, month + 1, 1))} className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_SHORT.map((day) => <span key={day} className="text-[9px] font-semibold uppercase text-slate-400 py-1">{day.slice(0, 1)}</span>)}
        {days.map((day) => {
          const inMonth = day.getMonth() === month
          const selected = isSameDay(day, cursor)
          const isToday = isSameDay(day, today)
          return (
            <button type="button" key={day.toISOString()} onClick={() => onChange(day)} className={`mx-auto w-7 h-7 rounded-full text-[11px] transition-colors ${selected ? 'bg-brand-600 text-white font-semibold' : isToday ? 'ring-1 ring-brand-300 text-brand-700 font-semibold hover:bg-brand-50' : inMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50'}`}>
              {day.getDate()}
            </button>
          )
        })}
      </div>
      <button type="button" onClick={() => onChange(new Date(TODAY))} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><CalendarDays size={13} /> Today</button>
      <p className="text-[10px] leading-4 text-slate-400 mt-3 pt-3 border-t border-slate-100">Times are converted from the clinic diary base of {gmtLabel(STORAGE_TIMEZONE_OFFSET)} for display. Conflict checks still use the same underlying appointment slots.</p>
    </aside>
  )
}

function AppointmentBlock({ appointment, onClick, compact = false }: { appointment: DatedAppointment; onClick: () => void; compact?: boolean }) {
  const remote = appointment.location.startsWith('Remote —')
  const duration = appointment._end - appointment._start
  return (
    <button onClick={(event) => { event.stopPropagation(); onClick() }} className={`w-full text-left border border-brand-100 border-l-[3px] border-l-brand-500 bg-brand-50/70 hover:bg-brand-50 hover:border-brand-200 hover:border-l-brand-600 transition-colors rounded-lg ${compact ? 'px-1.5 py-1' : 'px-2 py-1.5'} mb-1`} title={`${appointment._timeLabel} · ${formatDuration(duration)} · ${appointment.patient}`}>
      <div className="flex items-center justify-between gap-1"><p className="text-[10px] font-semibold text-brand-800 truncate">{appointment._timeLabel} · {formatDuration(duration)}</p><span className="text-[9px] font-medium text-brand-700 shrink-0">{appointment.status}</span></div>
      <p className="text-[11px] font-semibold text-brand-900 truncate mt-0.5">{appointment.patient}</p>
      {!compact && <><p className="text-[10px] text-brand-700 mt-0.5 truncate"><Stethoscope size={9} className="inline mr-1"/>{appointment.doctor} · {appointment.type}</p><p className="text-[10px] text-brand-600 mt-0.5 truncate"><MapPin size={9} className="inline mr-1"/>{remote ? 'Remote' : appointment.location}</p></>}
    </button>
  )
}

function MonthGrid({ cursor, apptsOn, today, onDayClick, onAppointmentClick }: { cursor: Date; apptsOn: (day: Date) => DatedAppointment[]; today: Date; onDayClick: (day: Date) => void; onAppointmentClick: (appointment: Appointment) => void }) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = new Date(year, month, 1).getDay()

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 text-xs font-medium text-slate-500">
        {WEEKDAY_SHORT.map((day) => <div key={day} className="px-3 py-2 text-center border-r border-slate-100 last:border-r-0">{day}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startOffset }).map((_, index) => <div key={`blank-${index}`} className="h-36 border-r border-b border-slate-100 bg-slate-50/50" />)}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const date = new Date(year, month, day)
          const items = apptsOn(date).sort((a, b) => a._start - b._start)
          const visible = items.slice(0, 2)
          const remaining = items.length - visible.length
          const isToday = isSameDay(date, today)
          return (
            <div key={day} onClick={() => onDayClick(date)} className="h-36 border-r border-b border-slate-100 p-1.5 hover:bg-slate-50 cursor-pointer overflow-hidden">
              <div className="flex items-center justify-between gap-1 mb-1">
                <p className={`text-xs ${isToday ? 'font-semibold text-brand-600' : 'text-slate-500'}`}>{day}</p>
                {items.length > 0 && <span className="text-[9px] text-slate-400">{items.length}</span>}
              </div>
              {visible.map((appointment) => <AppointmentBlock key={appointment.id} appointment={appointment} compact onClick={() => onAppointmentClick(appointment)} />)}
              {remaining > 0 && <button type="button" onClick={(event) => { event.stopPropagation(); onDayClick(date) }} className="w-full text-left text-[10px] font-medium text-brand-600 hover:text-brand-700 px-1 py-0.5">+{remaining} more — view day</button>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayTimeline({ appts, timeFormat, timezoneLabel, onAppointmentClick }: { appts: DatedAppointment[]; timeFormat: TimeFormat; timezoneLabel: string; onAppointmentClick: (appointment: Appointment) => void }) {
  const sorted = [...appts].sort((a, b) => a._start - b._start || a.doctor.localeCompare(b.doctor))
  const { start, end } = timelineRange(sorted)
  const markers = hourMarkers(start, end)
  const positioned = layoutOverlappingAppointments(sorted)
  const totalHeight = Math.max(HOUR_HEIGHT, ((end - start) / 60) * HOUR_HEIGHT)

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-slate-900">Day schedule</h2><p className="text-xs text-slate-400 mt-0.5">Hourly diary grid · {timezoneLabel}. Appointment position and height follow the exact start time and duration.</p></div>
        <span className="text-xs text-slate-500">{sorted.length} appointment{sorted.length === 1 ? '' : 's'}</span>
      </div>
      <div className="max-h-[620px] overflow-y-auto">
        <div className="grid grid-cols-[76px_minmax(0,1fr)] min-w-0">
          <div className="relative border-r border-slate-200 bg-white" style={{ height: totalHeight }}>
            {markers.map((marker, index) => (
              <div key={marker} className="absolute left-0 right-0 pr-3 text-right text-[11px] font-medium text-slate-500 tabular-nums" style={{ top: Math.min(index * HOUR_HEIGHT, totalHeight - 16), transform: index === 0 ? 'translateY(4px)' : 'translateY(-7px)' }}>
                {formatMinutes(marker, timeFormat)}
              </div>
            ))}
          </div>
          <div className="relative bg-white" style={{ height: totalHeight }}>
            {markers.map((marker, index) => (
              <div key={marker} className="absolute left-0 right-0 border-t border-slate-200" style={{ top: Math.min(index * HOUR_HEIGHT, totalHeight) }}>
                {index < markers.length - 1 && <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: HOUR_HEIGHT / 2 }} />}
              </div>
            ))}
            {positioned.map((appointment) => {
              const duration = appointment._end - appointment._start
              return (
                <button
                  key={appointment.id}
                  onClick={() => onAppointmentClick(appointment)}
                  style={appointmentStyle(appointment, start)}
                  className="absolute z-10 overflow-hidden rounded-md border border-brand-200 border-l-[3px] border-l-brand-500 bg-brand-50/95 px-2 py-1.5 text-left shadow-sm transition hover:z-20 hover:border-brand-300 hover:border-l-brand-600 hover:bg-brand-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  title={`${appointment._timeLabel} · ${formatDuration(duration)} · ${appointment.patient} · ${appointment.doctor}`}
                >
                  <p className="truncate text-[10px] font-semibold leading-tight text-brand-900">{appointment._timeLabel} · {formatDuration(duration)}</p>
                  {duration >= 20 && <p className="mt-0.5 truncate text-[11px] font-semibold leading-tight text-brand-900">{appointment.patient}</p>}
                  {duration >= 30 && <p className="mt-0.5 truncate text-[10px] leading-tight text-brand-800"><Stethoscope size={9} className="inline mr-1" />{appointment.doctor}</p>}
                  {duration >= 45 && <p className="mt-0.5 truncate text-[9px] leading-tight text-brand-700">{appointment.type} · {appointment.location.startsWith('Remote —') ? 'Remote' : appointment.location}</p>}
                  {duration >= 75 && <div className="mt-1"><StatusBadge status={appointment.status} /></div>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function WeekTimeline({ cursor, apptsOn, today, timeFormat, timezoneLabel, onDayClick, onAppointmentClick }: { cursor: Date; apptsOn: (day: Date) => DatedAppointment[]; today: Date; timeFormat: TimeFormat; timezoneLabel: string; onDayClick: (day: Date) => void; onAppointmentClick: (appointment: Appointment) => void }) {
  const startDate = startOfWeek(cursor)
  const days = Array.from({ length: 7 }, (_, index) => addDays(startDate, index))
  const weekAppointments = days.flatMap((day) => apptsOn(day))
  const { start, end } = timelineRange(weekAppointments)
  const markers = hourMarkers(start, end)
  const totalHeight = Math.max(HOUR_HEIGHT, ((end - start) / 60) * HOUR_HEIGHT)

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div><h2 className="text-sm font-semibold text-slate-900">Week schedule</h2><p className="text-xs text-slate-400 mt-0.5">Hourly time grid · {timezoneLabel}. Overlapping diary items automatically share the available width.</p></div>
        <span className="text-xs text-slate-500">{weekAppointments.length} appointments</span>
      </div>
      <div className="max-h-[650px] overflow-auto">
        <div className="min-w-[1180px]">
          <div className="grid grid-cols-[76px_repeat(7,minmax(150px,1fr))] sticky top-0 z-30 bg-white border-b border-slate-200">
            <div className="sticky left-0 z-40 bg-white border-r border-slate-200 flex items-end justify-center pb-2 text-[9px] font-medium text-slate-400">{timezoneLabel}</div>
            {days.map((day) => (
              <button key={day.toISOString()} onClick={() => onDayClick(day)} className="px-2 py-2 text-center border-r border-slate-100 last:border-r-0 hover:bg-slate-50">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{WEEKDAY_SHORT[day.getDay()]}</p>
                <p className={`text-sm mt-0.5 ${isSameDay(day, today) ? 'font-semibold text-brand-600' : 'font-medium text-slate-700'}`}>{day.getDate()}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{apptsOn(day).length} appts</p>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[76px_repeat(7,minmax(150px,1fr))]">
            <div className="sticky left-0 z-20 relative border-r border-slate-200 bg-white" style={{ height: totalHeight }}>
              {markers.map((marker, index) => (
                <div key={marker} className="absolute left-0 right-0 pr-2 text-right text-[10px] font-medium text-slate-500 tabular-nums" style={{ top: Math.min(index * HOUR_HEIGHT, totalHeight - 16), transform: index === 0 ? 'translateY(4px)' : 'translateY(-7px)' }}>
                  {formatMinutes(marker, timeFormat)}
                </div>
              ))}
            </div>
            {days.map((day) => {
              const items = apptsOn(day).sort((a, b) => a._start - b._start || a._end - b._end)
              const positioned = layoutOverlappingAppointments(items)
              return (
                <div key={day.toISOString()} onClick={() => onDayClick(day)} className="relative border-r border-slate-100 last:border-r-0 bg-white hover:bg-slate-50/20 cursor-pointer" style={{ height: totalHeight }}>
                  {markers.map((marker, index) => (
                    <div key={marker} className="absolute left-0 right-0 border-t border-slate-200 pointer-events-none" style={{ top: Math.min(index * HOUR_HEIGHT, totalHeight) }}>
                      {index < markers.length - 1 && <div className="absolute left-0 right-0 border-t border-dashed border-slate-100" style={{ top: HOUR_HEIGHT / 2 }} />}
                    </div>
                  ))}
                  {positioned.map((appointment) => {
                    const duration = appointment._end - appointment._start
                    return (
                      <button
                        key={appointment.id}
                        onClick={(event) => { event.stopPropagation(); onAppointmentClick(appointment) }}
                        style={appointmentStyle(appointment, start)}
                        className="absolute z-10 overflow-hidden rounded-md border border-brand-200 border-l-[3px] border-l-brand-500 bg-brand-50/95 px-1.5 py-1 text-left shadow-sm transition hover:z-20 hover:border-brand-300 hover:border-l-brand-600 hover:bg-brand-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                        title={`${appointment._timeLabel} · ${formatDuration(duration)} · ${appointment.patient} · ${appointment.doctor}`}
                      >
                        <p className="truncate text-[9px] font-semibold leading-tight text-brand-900">{appointment._timeLabel} · {formatDuration(duration)}</p>
                        {duration >= 20 && <p className="mt-0.5 truncate text-[9px] font-semibold leading-tight text-brand-900">{appointment.patient}</p>}
                        {duration >= 30 && <p className="mt-0.5 truncate text-[9px] leading-tight text-brand-700">{appointment.doctor.replace('Dr ', '')}</p>}
                        {duration >= 60 && <p className="mt-0.5 truncate text-[8px] leading-tight text-brand-600">{appointment.type}</p>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function GroupedAgenda({ dated, groupBy, onAppointmentClick }: { dated: DatedAppointment[]; groupBy: 'doctor' | 'location'; onAppointmentClick: (appointment: Appointment) => void }) {
  const groups = useMemo(() => {
    const map = new Map<string, DatedAppointment[]>()
    for (const appointment of dated) {
      const key = appointment[groupBy]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(appointment)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [dated, groupBy])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      {groups.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No appointments to group.</p>}
      {groups.map(([name, items]) => (
        <div key={name}>
          <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">{groupBy === 'doctor' ? <Stethoscope size={14}/> : <MapPin size={14}/>} {name}</p>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg max-h-72 overflow-y-auto">
            {items
              .sort((a, b) => a._date.getTime() - b._date.getTime() || a._start - b._start)
              .map((appointment) => (
                <button key={appointment.id} onClick={() => onAppointmentClick(appointment)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 text-left">
                  <div><p className="text-sm text-slate-800">{formatCalendarDate(appointment._date)} · {appointment._timeLabel} — {appointment.patient}</p><p className="text-xs text-slate-500 mt-0.5">{groupBy === 'doctor' ? appointment.location : appointment.doctor} · {appointment.type} · {clientForAppointment(appointment)}</p></div>
                  <StatusBadge status={appointment.status} />
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
