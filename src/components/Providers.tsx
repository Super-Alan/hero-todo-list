'use client'

import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'
import { ModelProviderProvider } from '@/contexts/ModelProviderContext'
import { TaskDataProvider } from '@/contexts/TaskDataContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface ProvidersProps {
  children: React.ReactNode
  session: Session | null
}

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <ModelProviderProvider>
          <TaskDataProvider>
            {children}
          </TaskDataProvider>
        </ModelProviderProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
} 