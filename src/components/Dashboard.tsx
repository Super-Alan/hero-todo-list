'use client'

import { useSession } from 'next-auth/react'
import { api } from '@/lib/api';
import { CreateTaskInput } from '@/types';
import { useState, useRef } from 'react'
import { tagService } from '@/lib/tagService'
import Header from './Header'
import Sidebar from './Sidebar'
import TaskList from './TaskList'
import SmartQuickAdd from './QuickAdd/SmartQuickAdd'
import TaskAddBar from './TaskAddBar'
import AIChatPanel from './AIChatPanel';
import { useKeyboardShortcuts, createShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function Dashboard() {
  const { data: session } = useSession()
  const [selectedView, setSelectedView] = useState<'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag'>('today')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchFilters, setSearchFilters] = useState<any>(null)
  const taskListRef = useRef<{ refreshTasks: () => void } | null>(null)
  const quickAddRef = useRef<{ focus: () => void; blur: () => void; isOpen: boolean } | null>(null)
  const [showSmartQuickAdd, setShowSmartQuickAdd] = useState(false)
  const [quickAddInitialValue, setQuickAddInitialValue] = useState('')
  const sidebarRef = useRef<{ refreshTags: () => void; refreshTaskStats: () => void } | null>(null)
  const [isAIChatPanelOpen, setIsAIChatPanelOpen] = useState(false);

  const handleTaskCreated = async () => {
    // 刷新标签缓存（因为可能创建了新标签）
    await tagService.refreshCache();
    
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

  const handleOpenAdvancedAdd = (initialValue: string) => {
    setQuickAddInitialValue(initialValue);
    setShowSmartQuickAdd(true);
  };

  const handleSimpleTaskSubmit = async (task: CreateTaskInput) => {
    try {
      await api.createTask(task);
      handleTaskCreated(); // 刷新列表和侧边栏
    } catch (error) {
      console.error('Failed to create task:', error);
      // 这里可以添加一个用户提示，例如使用 react-hot-toast
    }
  };

  const handleBatchTasksSubmit = async (tasks: CreateTaskInput[]) => {
    try {
      // 批量创建任务
      await Promise.all(tasks.map(task => api.createTask(task)));
      handleTaskCreated(); // 刷新列表和侧边栏
    } catch (error) {
      console.error('Failed to create tasks:', error);
      // 这里可以添加一个用户提示，例如使用 react-hot-toast
    }
  };

  const handleQuickAddBlur = () => {
    setShowSmartQuickAdd(false);
    setQuickAddInitialValue(''); // 关闭时重置初始值
  };

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

  const handleToggleAIChatPanel = () => {
    setIsAIChatPanelOpen(prev => !prev);
  };

  // 定义快捷键
  const shortcuts = [
    // Ctrl+N 或 Cmd+N：快速添加任务
    {
      key: 'n',
      ctrlKey: true,
      metaKey: true,
      action: () => handleOpenAdvancedAdd('') // 快捷键默认不带初始值
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
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isAIChatPanelOpen ? 'mr-96' : ''}`}>
        {/* 头部 */}
        <Header />

        {/* 主要内容 */}
        <main className="flex-1 overflow-auto p-6">
  
          {/* 智能快速添加 */}
          <SmartQuickAdd
            isOpen={showSmartQuickAdd}
            initialInput={quickAddInitialValue}
            onTasksAdded={handleTaskCreated}
            onClose={handleQuickAddBlur}
          />

          {/* 新的任务添加栏 */}
          <TaskAddBar 
            onTaskSubmit={handleSimpleTaskSubmit}
            onTasksSubmit={handleBatchTasksSubmit}
            onOpenAdvanced={handleOpenAdvancedAdd}
            onToggleAIAssistant={handleToggleAIChatPanel}
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

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={isAIChatPanelOpen}
        onClose={() => setIsAIChatPanelOpen(false)}
        onTasksGenerated={handleBatchTasksSubmit}
      />

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