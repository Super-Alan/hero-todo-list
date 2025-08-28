import AdminGuard from '@/components/AdminGuard'
import AdminNavbar from '@/components/AdminNavbar'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}

export const metadata = {
  title: '管理后台',
  description: '系统管理员后台',
}