'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UsersIcon, 
  CpuChipIcon, 
  ChatBubbleLeftRightIcon,
  ArrowLeftOnRectangleIcon,
  ArrowLeftIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'

const navigation = [
  { name: '仪表板', href: '/admin', icon: HomeIcon },
  { name: '用户管理', href: '/admin/users', icon: UsersIcon },
  { name: '模型管理', href: '/admin/model-providers', icon: CpuChipIcon },
  { name: '微信用户', href: '/admin/wechat-users', icon: ChatBubbleLeftRightIcon },
  { name: '调度管理', href: '/admin/scheduling', icon: ClockIcon },
]

export default function AdminNavbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>返回应用</span>
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">管理后台</h1>
            </div>
            
            <nav className="flex space-x-6">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              欢迎，<span className="font-medium">{session?.user?.name || session?.user?.email}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" />
              <span>退出</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}