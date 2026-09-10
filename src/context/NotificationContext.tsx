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
  | 'QA review started'
  | 'Report approved'
  | 'Final approval required'
  | 'Report delivered'
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
  /** Optional audience controls. Empty audience means visible to every role. */
  recipientRoleIds?: string[]
  recipientNames?: string[]
  /** Repeated workflow events with the same key replace the previous item instead of growing the list forever. */
  dedupeKey?: string
}

export type NewNotification = Omit<AppNotification, 'id' | 'read' | 'time'> & {
  id?: string
  read?: boolean
  time?: string
}

// New key clears prototype notifications from older builds whose workflow hand-offs were inconsistent.
const STORAGE_KEY = 'evaluate-medicolegal-notifications-v5-navigation-cleanup'
const MAX_NOTIFICATIONS = 30

const seed: AppNotification[] = [
  { id: 'N-1', title: 'Booking requires scheduling', caseRef: 'EM-2026-0594', time: '12 minutes ago', type: 'New assignment', priority: 'Urgent', read: false, actionPath: '/cases/EM-2026-0594', detail: 'Grace Adeyemi is urgent and has no appointment booked.', recipientRoleIds: ['booking-administrator', 'operations-manager'] },
  { id: 'N-2', title: 'Missing medical records', caseRef: 'EM-2026-1184', time: '32 minutes ago', type: 'Missing document', priority: 'High', read: false, actionPath: '/cases/EM-2026-1184?tab=Documents', detail: 'Requested imaging records have not yet been uploaded.', recipientRoleIds: ['operations-manager', 'file-preparation', 'medical-expert'] },
  { id: 'N-3', title: 'New report awaiting QA review', caseRef: 'EM-2026-1210', time: '18 minutes ago', type: 'Report submitted', priority: 'High', read: false, actionPath: '/quality-assurance?case=EM-2026-1210', detail: 'Dr Amara Osei submitted Medicolegal Report v1. Start the assigned QA review from the QA queue.', recipientRoleIds: ['quality-assurance'], recipientNames: ['Elaine Fitzgerald'], dedupeKey: 'workflow:qa:EM-2026-1210' },
  { id: 'N-4', title: 'QA amendments require action', caseRef: 'EM-2026-1152', time: '3 hours ago', type: 'QA amendment requested', priority: 'High', read: false, actionPath: '/reports?report=R-2', detail: 'The QA reviewer returned the report with amendments. Resolve the comments and resubmit a new version.', recipientRoleIds: ['medical-expert'], recipientNames: ['Dr Amara Osei'], dedupeKey: 'workflow:doctor:EM-2026-1152' },
  { id: 'N-5', title: 'Information follow-up is overdue', caseRef: 'EM-2026-0588', time: 'Yesterday, 16:20', type: 'Task overdue', priority: 'High', read: true, actionPath: '/tasks?task=T-5', detail: 'The outstanding-information follow-up for Marcus Green is overdue.', recipientRoleIds: ['operations-manager', 'booking-administrator'] },
  { id: 'N-6', title: 'File preparation appointment completed', caseRef: 'EM-2026-1196', time: 'Yesterday, 11:05', type: 'Appointment changed', priority: 'Standard', read: true, actionPath: '/cases/EM-2026-1196', detail: 'The appointment is complete and the case is ready for document preparation work.', recipientRoleIds: ['file-preparation', 'operations-manager'] },
  { id: 'N-7', title: 'Appointment changed', caseRef: 'EM-2026-1152', time: '28 Aug 2026', type: 'Appointment changed', priority: 'Standard', read: true, actionPath: '/calendar', detail: 'The appointment time was rescheduled.', recipientRoleIds: ['booking-administrator', 'medical-expert'] },
]

const workflowTypes = new Set<NotificationType>([
  'Report submitted',
  'QA review started',
  'QA amendment requested',
  'Final approval required',
  'Report approved',
  'Report delivered',
  'Case completed',
])

function audienceOverlaps(a: AppNotification, b: AppNotification) {
  const aRoles = a.recipientRoleIds ?? []
  const bRoles = b.recipientRoleIds ?? []
  const aNames = a.recipientNames ?? []
  const bNames = b.recipientNames ?? []
  if (aRoles.length === 0 && aNames.length === 0) return bRoles.length === 0 && bNames.length === 0
  if (bRoles.length === 0 && bNames.length === 0) return false
  return aRoles.some((role) => bRoles.includes(role)) || aNames.some((name) => bNames.includes(name))
}

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

export function notificationVisibleTo(notification: AppNotification, roleId: string, roleName: string) {
  const roles = notification.recipientRoleIds ?? []
  const names = notification.recipientNames ?? []
  if (roles.length === 0 && names.length === 0) return true
  return roles.includes(roleId) || names.includes(roleName)
}

type NotificationContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  pushNotification: (notification: NewNotification) => void
  markRead: (id: string) => void
  markUnread: (id: string) => void
  markAllRead: (ids?: string[]) => void
  dismissNotification: (id: string) => void
  dismissMany: (ids: string[]) => void
  clearRead: (ids?: string[]) => void
  resetNotifications: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadInitial)

  const commit = (transform: (current: AppNotification[]) => AppNotification[]) => {
    setNotifications((current) => {
      const next = transform(current)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    pushNotification: (input) => {
      const nextItem: AppNotification = {
        ...input,
        id: input.id ?? `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time: input.time ?? 'Just now',
        read: input.read ?? false,
      }
      commit((current) => {
        const withoutSuperseded = current.filter((item) => {
          if (nextItem.dedupeKey && item.dedupeKey === nextItem.dedupeKey) return false
          if (!nextItem.dedupeKey && item.caseRef === nextItem.caseRef && item.type === nextItem.type && item.title === nextItem.title) return false
          // A newer hand-off replaces the previous workflow alert for the same case + audience.
          // Independent operational alerts (missing documents/tasks/appointments) remain available.
          if (item.caseRef === nextItem.caseRef && workflowTypes.has(item.type) && workflowTypes.has(nextItem.type) && audienceOverlaps(item, nextItem)) return false
          return true
        })
        return [nextItem, ...withoutSuperseded].slice(0, MAX_NOTIFICATIONS)
      })
    },
    markRead: (id) => commit((current) => current.map((item) => item.id === id ? { ...item, read: true } : item)),
    markUnread: (id) => commit((current) => current.map((item) => item.id === id ? { ...item, read: false } : item)),
    markAllRead: (ids) => {
      const idSet = ids ? new Set(ids) : null
      commit((current) => current.map((item) => !idSet || idSet.has(item.id) ? { ...item, read: true } : item))
    },
    dismissNotification: (id) => commit((current) => current.filter((item) => item.id !== id)),
    dismissMany: (ids) => {
      const idSet = new Set(ids)
      commit((current) => current.filter((item) => !idSet.has(item.id)))
    },
    clearRead: (ids) => {
      const idSet = ids ? new Set(ids) : null
      commit((current) => current.filter((item) => !(item.read && (!idSet || idSet.has(item.id)))))
    },
    resetNotifications: () => commit(() => seed),
  }), [notifications])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const value = useContext(NotificationContext)
  if (!value) throw new Error('useNotifications must be used within NotificationProvider')
  return value
}
