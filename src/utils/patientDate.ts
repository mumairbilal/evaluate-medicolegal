const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function patientDobToInput(value: string) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === 'Not set' || trimmed === '—') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const match = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/)
  if (!match) return ''

  const monthIndex = MONTHS.findIndex((month) => month.toLowerCase() === match[2].toLowerCase())
  if (monthIndex < 0) return ''

  return `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`
}

export function patientDobToDisplay(value: string) {
  if (!value) return 'Not set'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value

  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) return value

  return `${String(Number(match[3])).padStart(2, '0')} ${MONTHS[monthIndex]} ${match[1]}`
}

export function normalisePatientDob(value: string) {
  return patientDobToInput(value) || value.trim().toLowerCase()
}
