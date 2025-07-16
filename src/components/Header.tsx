'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, Search, Settings, User, Sparkles, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface HeaderProps {
  onOpenModelSettings: () => void
  onSearch?: (query: string) => void
  onClearSearch?: () => void
  searchQuery?: string
}

export default function Header({ onOpenModelSettings, onSearch, onClearSearch, searchQuery = '' }: HeaderProps) {
  const { data: session } = useSession()
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // 同步外部搜索查询
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // 处理搜索输入
  const handleSearchInput = (value: string) => {
    setLocalSearchQuery(value)
    
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 设置新的定时器，延迟搜索
    searchTimeoutRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(value.trim())
      }
    }, 300) // 300ms 延迟
  }

  // 清除搜索
  const handleClearSearch = () => {
    setLocalSearchQuery('')
    if (onClearSearch) {
      onClearSearch()
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // 处理回车键搜索
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      if (onSearch) {
        onSearch(localSearchQuery.trim())
      }
    }
  }

  return (
    <header className="glass border-b border-white/20 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* 左侧：Logo和搜索 */}
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-tech">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-blue rounded-full animate-pulse-glow"></div>
            </div>
            <h1 className="text-xl font-bold gradient-text">Hero ToDo</h1>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索任务..."
              value={localSearchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input-modern pl-10 pr-4 py-2 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {localSearchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 右侧：用户操作 */}
        <div className="flex items-center space-x-3">
          {/* 通知 */}
          <button className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group relative">
            <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </button>

          {/* 设置 */}
          <button 
            onClick={onOpenModelSettings}
            className="p-2.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group"
            title="模型设置"
          >
            <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* 用户菜单 */}
          <div className="relative">
            <button className="flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group">
              {session?.user?.image ? (
                <div className="relative">
                  <img
                    src={session.user.image}
                    alt={session.user.name || ''}
                    className="h-8 w-8 rounded-full ring-2 ring-white shadow-modern group-hover:ring-primary-200 transition-all duration-200"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
              ) : (
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 p-1.5 shadow-modern group-hover:shadow-tech transition-all duration-200">
                    <User className="h-full w-full text-white" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
              )}
              <span className="hidden sm:block font-medium">{session?.user?.name}</span>
            </button>
          </div>

          {/* 登出 */}
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 font-medium"
          >
            登出
          </button>
        </div>
      </div>
    </header>
  )
} 