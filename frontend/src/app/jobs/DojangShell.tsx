'use client'

import type { ReactNode } from 'react'
import { AppShell } from '@/components/app-shell'
import styles from './jobs.module.css'

export default function DojangShell({ children }: { children: ReactNode }) {
  return <AppShell fixed showSearch={false}><div className={styles.jobsScroll}>{children}</div></AppShell>
}
