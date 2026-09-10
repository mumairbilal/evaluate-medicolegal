const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Fixed "today" anchor used across the prototype's appointment data (matches Calendar.tsx)
export const APP_TODAY = new Date(2026, 8, 1)

export function parseAppointmentDate(value: string): Date | null {
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) return d
  const parts = value.split(' ')
  if (parts.length !== 3) return null
  const [day, mon, year] = parts
  const monthIdx = MONTH_NAMES.findIndex((m) => m.slice(0, 3).toLowerCase() === mon.toLowerCase())
  return monthIdx === -1 ? null : new Date(Number(year), monthIdx, Number(day))
}

/**
 * Sort appointments chronologically — soonest upcoming first, then most-recent-past.
 * Mirrors how the Calendar page orders appointments, so any appointments list
 * (doctor workload, patient history, case tabs) reads the same way.
 */
export function sortAppointmentsByDate<T extends { date: string; time?: string }>(items: T[], today: Date = APP_TODAY): T[] {
  const withDates = items.map((item) => ({ item, date: parseAppointmentDate(item.date) }))
  const upcoming = withDates
    .filter((entry) => entry.date && entry.date.getTime() >= new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime())
    .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime())
  const past = withDates
    .filter((entry) => !entry.date || entry.date.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime())
    .sort((a, b) => (b.date as Date)?.getTime() - (a.date as Date)?.getTime())
  return [...upcoming, ...past].map((entry) => entry.item)
}

export function isUpcomingAppointmentDate(value: string, today: Date = APP_TODAY) {
  const parsed = parseAppointmentDate(value)
  if (!parsed) return false
  return parsed.getTime() >= new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
}
