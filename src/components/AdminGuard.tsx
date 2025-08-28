'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') {
      return
    }
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin')
      return
    }

    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/admin')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
          <p className="text-gray-600">您没有权限访问管理端</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}