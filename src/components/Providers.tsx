'use client'

import { SessionProvider } from 'next-auth/react'
import { Session } from 'next-auth'
import { ModelProviderProvider } from '@/contexts/ModelProviderContext'

interface ProvidersProps {
  children: React.ReactNode
  session: Session | null
}

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ModelProviderProvider>
        {children}
      </ModelProviderProvider>
    </SessionProvider>
  )
} 