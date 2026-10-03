import type { ReactNode } from 'react'
import { ProfileProvider } from './ProfileContext'
import DojangShell from './DojangShell'

export default function JobsLayout({ children }: { children: ReactNode }) {
  return <ProfileProvider><DojangShell>{children}</DojangShell></ProfileProvider>
}
