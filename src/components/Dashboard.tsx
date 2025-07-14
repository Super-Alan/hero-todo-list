'use client'

import { useSession } from 'next-auth/react'
import { useState, useRef } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import TaskList from './TaskList'
import QuickAdd from './QuickAdd'
import { useKeyboardShortcuts, createShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function Dashboard() {
  const { data: session } = useSession()
  const [selectedView, setSelectedView] = useState<'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag'>('today')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchFilters, setSearchFilters] = useState<any>(null)
  const taskListRef = useRef<{ refreshTasks: () => void } | null>(null)
  const quickAddRef = useRef<{ focus: () => void; blur: () => void; isOpen: boolean } | null>(null)
  const sidebarRef = useRef<{ refreshTags: () => void; refreshTaskStats: () => void } | null>(null)

  const handleTaskCreated = () => {
    // 刷新任务列表
    if (taskListRef.current) {
      taskListRef.current.refreshTasks()
    }
    // 刷新侧栏标签列表（新创建的标签会自动显示在侧栏）
    if (sidebarRef.current) {
      sidebarRef.current.refreshTags()
    }
  }

  const handleRefreshTasks = () => {
    if (taskListRef.current) {
      taskListRef.current.refreshTasks()
    }
  }

  const handleRefreshSidebar = () => {
    if (sidebarRef.current) {
      sidebarRef.current.refreshTaskStats()
      sidebarRef.current.refreshTags()
    }
  }

  const handleQuickAddFocus = () => {
    if (quickAddRef.current) {
      quickAddRef.current.focus()
    }
  }

  const handleQuickAddBlur = () => {
    if (quickAddRef.current && quickAddRef.current.isOpen) {
      quickAddRef.current.blur()
    }
  }

  const handleViewChange = (view: 'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag') => {
    setSelectedView(view)
    if (view !== 'tag') {
      setSelectedTag(null)
    }
  }

  const handleTagSelect = (tagId: string | null) => {
    setSelectedTag(tagId)
  }

  const handleSearch = (filters: any) => {
    setSearchFilters(filters)
    setSelectedView('all') // 搜索时切换到所有任务视图
    setSelectedTag(null)
  }

  const handleClearSearch = () => {
    setSearchFilters(null)
  }

  // 定义快捷键
  const shortcuts = [
    // Ctrl+N 或 Cmd+N：快速添加任务
    {
      key: 'n',
      ctrlKey: true,
      metaKey: true,
      action: handleQuickAddFocus
    },
    // Escape：关闭快速添加
    {
      key: 'Escape',
      action: handleQuickAddBlur
    },
    // Ctrl+R 或 Cmd+R：刷新任务列表
    {
      key: 'r',
      ctrlKey: true,
      metaKey: true,
      action: handleRefreshTasks
    },
    // 数字键切换视图
    {
      key: '1',
      action: () => handleViewChange('today')
    },
    {
      key: '2',
      action: () => handleViewChange('upcoming')
    },
    {
      key: '3',
      action: () => handleViewChange('all')
    }
  ]

  // 使用快捷键
  useKeyboardShortcuts({ shortcuts })

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <Sidebar
        ref={sidebarRef}
        selectedView={selectedView}
        selectedTag={selectedTag}
        onViewSelect={handleViewChange}
        onTagSelect={handleTagSelect}
      />

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <Header />

        {/* 主要内容 */}
        <main className="flex-1 overflow-auto p-6">
          {/* 快速添加栏 */}
          <QuickAdd 
            ref={quickAddRef}
            onTaskCreated={handleTaskCreated}
          />

          {/* 任务列表 */}
          <TaskList
            ref={taskListRef}
            selectedView={selectedView}
            selectedTag={selectedTag}
            searchFilters={searchFilters}
            onSidebarRefresh={handleRefreshSidebar}
          />
        </main>
      </div>

      {/* 快捷键提示 */}
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 border border-gray-200 opacity-90">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="font-medium text-gray-800 mb-2">快捷键</div>
          <div className="flex justify-between">
            <span>快速添加</span>
            <span className="text-gray-500">⌘N / Ctrl+N</span>
          </div>
          <div className="flex justify-between">
            <span>刷新列表</span>
            <span className="text-gray-500">⌘R / Ctrl+R</span>
          </div>
          <div className="flex justify-between">
            <span>切换视图</span>
            <span className="text-gray-500">1/2/3</span>
          </div>
          <div className="flex justify-between">
            <span>关闭</span>
            <span className="text-gray-500">ESC</span>
          </div>
        </div>
      </div>
    </div>
  )
} 