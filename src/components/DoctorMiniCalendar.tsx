import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { parseAppointmentDate, APP_TODAY } from '../utils/appointmentDate'
import type { Appointment } from '../types'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAY_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const DOT_TONE: Record<string, string> = {
  Scheduled: 'bg-blue-500',
  Completed: 'bg-green-500',
  Cancelled: 'bg-red-500',
  Rescheduled: 'bg-amber-500',
  'Did Not Attend': 'bg-red-500',
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * Compact, actionable month calendar scoped to one doctor's appointments.
 * Click a day to see that day's appointments; each links through to the
 * full Calendar page (pre-filtered to this doctor) for scheduling actions.
 */
export default function DoctorMiniCalendar({ doctorName, appointments }: { doctorName: string; appointments: Appointment[] }) {
  const dated = useMemo(
    () => appointments.map((a) => ({ appt: a, date: parseAppointmentDate(a.date) })).filter((x): x is { appt: Appointment; date: Date } => x.date !== null),
    [appointments]
  )

  const initialMonth = useMemo(() => {
    const upcoming = dated.filter((d) => d.date.getTime() >= APP_TODAY.getTime()).sort((a, b) => a.date.getTime() - b.date.getTime())[0]
    const anchor = upcoming?.date ?? dated[0]?.date ?? APP_TODAY
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  }, [dated])

  const [cursor, setCursor] = useState(initialMonth)
  const [selected, setSelected] = useState<Date | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = new Date(year, month, 1).getDay()
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const apptsOn = (day: number) => dated.filter((d) => d.date.getFullYear() === year && d.date.getMonth() === month && d.date.getDate() === day)

  const selectedAppts = selected ? dated.filter((d) => isSameDay(d.date, selected)).map((d) => d.appt) : []

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Appointment calendar</h2>
          <p className="text-xs text-slate-400 mt-0.5">Scheduled and completed appointments for this expert.</p>
        </div>
        <Link to={`/calendar?doctor=${encodeURIComponent(doctorName)}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 shrink-0">
          Open full calendar <ExternalLink size={12} />
        </Link>
      </div>

      <div className="p-4 grid sm:grid-cols-[minmax(0,260px)_1fr] gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => { setCursor(new Date(year, month - 1, 1)); setSelected(null) }} className="p-1 rounded hover:bg-slate-100 text-slate-500"><ChevronLeft size={15} /></button>
            <p className="text-xs font-semibold text-slate-700">{MONTH_NAMES[month]} {year}</p>
            <button type="button" onClick={() => { setCursor(new Date(year, month + 1, 1)); setSelected(null) }} className="p-1 rounded hover:bg-slate-100 text-slate-500"><ChevronRight size={15} /></button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_SHORT.map((d, i) => <span key={i} className="text-[9px] font-semibold uppercase text-slate-400 py-1">{d}</span>)}
            {cells.map((day, idx) => {
              if (day === null) return <span key={`blank-${idx}`} />
              const dayDate = new Date(year, month, day)
              const dayAppts = apptsOn(day)
              const isSelected = selected && isSameDay(selected, dayDate)
              const isToday = isSameDay(dayDate, APP_TODAY)
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelected(dayAppts.length ? dayDate : null)}
                  disabled={dayAppts.length === 0}
                  className={`relative mx-auto w-7 h-7 rounded-full text-[11px] transition-colors flex items-center justify-center ${
                    isSelected ? 'bg-brand-600 text-white font-semibold' : isToday ? 'ring-1 ring-brand-300 text-brand-700 font-semibold' : dayAppts.length ? 'text-slate-700 hover:bg-slate-100 font-medium' : 'text-slate-300'
                  }`}
                >
                  {day}
                  {dayAppts.length > 0 && !isSelected && (
                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${DOT_TONE[dayAppts[0].appt.status] ?? 'bg-brand-500'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-5 pt-4 sm:pt-0">
          {!selected ? (
            <p className="text-xs text-slate-400">Select a highlighted day to see that day's appointments.</p>
          ) : selectedAppts.length === 0 ? (
            <p className="text-xs text-slate-400">No appointments on this day.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 mb-1">
                {selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedAppts.map((appt) => (
                <Link
                  key={appt.id}
                  to={`/calendar?doctor=${encodeURIComponent(doctorName)}&case=${encodeURIComponent(appt.caseRef)}`}
                  className="block p-3 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{appt.patient}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{appt.time} · {appt.type}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{appt.location}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
