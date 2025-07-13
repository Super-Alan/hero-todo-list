import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Dashboard />
    </main>
  )
}
