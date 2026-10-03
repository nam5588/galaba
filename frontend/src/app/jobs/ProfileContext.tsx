'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { defaultProfile, type StudentProfile } from './jobsData'
import { validateProfile } from './matching'

const ProfileContext = createContext<{ profile: StudentProfile; saveProfile: (next: StudentProfile) => void } | null>(null)
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile)
  function saveProfile(next: StudentProfile) {
    if (validateProfile(next) === null) setProfile(next)
  }
  return <ProfileContext.Provider value={{ profile, saveProfile }}>{children}</ProfileContext.Provider>
}
export function useStudentProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('ProfileProvider is required')
  return context
}
