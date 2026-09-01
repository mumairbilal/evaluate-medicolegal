import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRole } from './RoleContext'

type ProfilePhotoContextValue = {
  profilePhoto: string | null
  setProfilePhoto: (photo: string | null) => void
}

const ProfilePhotoContext = createContext<ProfilePhotoContextValue | null>(null)
const storageKey = (roleId: string) => `evaluate-profile-photo-v1:${roleId}`

export function ProfilePhotoProvider({ children }: { children: ReactNode }) {
  const { role } = useRole()
  const [profilePhoto, setProfilePhotoState] = useState<string | null>(() => {
    try { return localStorage.getItem(storageKey(role.id)) } catch { return null }
  })

  useEffect(() => {
    try { setProfilePhotoState(localStorage.getItem(storageKey(role.id))) } catch { setProfilePhotoState(null) }
  }, [role.id])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey(role.id)) setProfilePhotoState(event.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [role.id])

  const setProfilePhoto = (photo: string | null) => {
    try {
      if (photo) localStorage.setItem(storageKey(role.id), photo)
      else localStorage.removeItem(storageKey(role.id))
    } catch {
      // Keep the prototype usable even if browser storage is unavailable.
    }
    setProfilePhotoState(photo)
  }

  const value = useMemo(() => ({ profilePhoto, setProfilePhoto }), [profilePhoto])
  return <ProfilePhotoContext.Provider value={value}>{children}</ProfilePhotoContext.Provider>
}

export function useProfilePhoto() {
  const value = useContext(ProfilePhotoContext)
  if (!value) throw new Error('useProfilePhoto must be used within ProfilePhotoProvider')
  return value
}
