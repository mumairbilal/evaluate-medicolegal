import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type NotificationType =
  | 'New assignment'
  | 'Appointment created'
  | 'Appointment changed'
  | 'Missing document'
  | 'Task approaching deadline'
  | 'Task overdue'
  | 'Report submitted'
  | 'QA amendment requested'
  | 'Report approved'
  | 'Case completed'

export type NotificationPriority = 'Standard' | 'High' | 'Urgent'

export interface AppNotification {
  id: string
  title: string
  caseRef: string
  time: string
  type: NotificationType
  priority: NotificationPriority
  read: boolean
  actionPath: string
  detail: string
}

const STORAGE_KEY = 'evaluate-medicolegal-notifications-v1'

const seed: AppNotification[] = [
  { id: 'N-1', title: 'Booking requires scheduling', caseRef: 'EM-2026-1190', time: '12 minutes ago', type: 'New assignment', priority: 'Urgent', read: false, actionPath: '/cases/EM-2026-1190', detail: 'Grace Adeyemi is urgent and has no appointment booked.' },
  { id: 'N-2', title: 'Missing medical records', caseRef: 'EM-2026-1184', time: '32 minutes ago', type: 'Missing document', priority: 'High', read: false, actionPath: '/cases/EM-2026-1184', detail: 'Requested imaging records have not yet been uploaded.' },
  { id: 'N-3', title: 'Report submitted for QA', caseRef: 'EM-2026-1196', time: '2 hours ago', type: 'Report submitted', priority: 'Standard', read: false, actionPath: '/quality-assurance', detail: 'Dr Amara Osei submitted the current report version for QA review.' },
  { id: 'N-4', title: 'QA amendments requested', caseRef: 'EM-2026-1152', time: '3 hours ago', type: 'QA amendment requested', priority: 'High', read: false, actionPath: '/reports', detail: 'The QA reviewer returned the report with amendments.' },
  { id: 'N-5', title: 'Task is overdue', caseRef: 'EM-2026-1171', time: 'Yesterday, 16:20', type: 'Task overdue', priority: 'Urgent', read: true, actionPath: '/tasks', detail: 'Confirm court deadline instructions is overdue.' },
  { id: 'N-6', title: 'Appointment created', caseRef: 'EM-2026-1168', time: 'Yesterday, 11:05', type: 'Appointment created', priority: 'Standard', read: true, actionPath: '/calendar', detail: 'A new in-person appointment was added to the calendar.' },
  { id: 'N-7', title: 'Appointment changed', caseRef: 'EM-2026-1152', time: '28 Aug 2026', type: 'Appointment changed', priority: 'Standard', read: true, actionPath: '/calendar', detail: 'The appointment time was rescheduled.' },
  { id: 'N-8', title: 'Report approved', caseRef: 'EM-2026-1139', time: '27 Aug 2026', type: 'Report approved', priority: 'Standard', read: true, actionPath: '/reports', detail: 'The final report passed QA and was approved.' },
  { id: 'N-9', title: 'Case completed', caseRef: 'EM-2026-1128', time: '25 Aug 2026', type: 'Case completed', priority: 'Standard', read: true, actionPath: '/cases/EM-2026-1128', detail: 'All required workflow stages have been completed.' },
  { id: 'N-10', title: 'Task approaching deadline', caseRef: 'EM-2026-1184', time: '24 Aug 2026', type: 'Task approaching deadline', priority: 'High', read: true, actionPath: '/tasks', detail: 'Report preparation task is due within 24 hours.' },
]

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as AppNotification[] : seed
  } catch {
    return seed
  }
}

type NotificationContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  resetNotifications: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadInitial)

  const persist = (next: AppNotification[]) => {
    setNotifications(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    markRead: (id) => persist(notifications.map((item) => item.id === id ? { ...item, read: true } : item)),
    markAllRead: () => persist(notifications.map((item) => ({ ...item, read: true }))),
    resetNotifications: () => persist(seed),
  }), [notifications])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const value = useContext(NotificationContext)
  if (!value) throw new Error('useNotifications must be used within NotificationProvider')
  return value
}
