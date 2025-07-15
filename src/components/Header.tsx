'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, Search, Settings, User } from 'lucide-react'
import { useState } from 'react'
import ModelSettings from './ModelSettings'

export default function Header() {
  const { data: session } = useSession()
  const [showModelSettings, setShowModelSettings] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：搜索 */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索任务..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 右侧：用户操作 */}
        <div className="flex items-center space-x-4">
          {/* 通知 */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
            <Bell className="h-5 w-5" />
          </button>

          {/* 设置 */}
          <button 
            onClick={() => setShowModelSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            title="模型设置"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* 用户菜单 */}
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <User className="h-8 w-8 rounded-full bg-gray-200 p-2" />
              )}
              <span className="hidden sm:block">{session?.user?.name}</span>
            </button>
          </div>

          {/* 登出 */}
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            登出
          </button>
        </div>
      </div>
      
      {/* 模型设置弹窗 */}
      <ModelSettings 
        isOpen={showModelSettings}
        onClose={() => setShowModelSettings(false)}
      />
    </header>
  )
} 