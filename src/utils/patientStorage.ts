import type { Patient } from '../types'

const STORAGE_KEY = 'evaluate-medicolegal-patients-v1'
const DELETED_STORAGE_KEY = 'evaluate-medicolegal-patients-deleted-v1'

function loadDeletedIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(DELETED_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

function saveDeletedIds(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify([...new Set(ids)]))
  } catch {
    // Prototype persistence should never block the UI.
  }
}

export function loadPatients(seed: Patient[]): Patient[] {
  if (typeof window === 'undefined') return seed
  try {
    const deleted = new Set(loadDeletedIds())
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed.filter((patient) => !deleted.has(patient.id))
    const stored = JSON.parse(raw) as Patient[]
    if (!Array.isArray(stored)) return seed.filter((patient) => !deleted.has(patient.id))

    const liveStored = stored.filter((patient) => !deleted.has(patient.id))
    const storedById = new Map(liveStored.map((patient) => [patient.id, patient]))
    const merged = seed
      .filter((patient) => !deleted.has(patient.id))
      .map((patient) => ({ ...patient, ...(storedById.get(patient.id) ?? {}) }))
    const seedIds = new Set(seed.map((patient) => patient.id))
    return [...liveStored.filter((patient) => !seedIds.has(patient.id)), ...merged]
  } catch {
    return seed
  }
}

export function savePatients(patients: Patient[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(patients))
  } catch {
    // Prototype persistence should never block the UI.
  }
}

export function upsertPatient(patient: Patient, seed: Patient[]) {
  const deleted = loadDeletedIds().filter((id) => id !== patient.id)
  saveDeletedIds(deleted)
  const current = loadPatients(seed)
  const next = current.some((item) => item.id === patient.id)
    ? current.map((item) => item.id === patient.id ? patient : item)
    : [patient, ...current]
  savePatients(next)
  return next
}

export function removePatient(patientId: string, seed: Patient[]) {
  const current = loadPatients(seed).filter((patient) => patient.id !== patientId)
  savePatients(current)
  saveDeletedIds([...loadDeletedIds(), patientId])
  return current
}
