'use client'

import { useSession } from 'next-auth/react'
import { CreateTaskInput } from '@/types';
import { useState, useRef } from 'react'
import { useTaskData } from '@/contexts/TaskDataContext'
import Header from './Header'
import Sidebar from './Sidebar'
import TaskList from './TaskList'
import SmartQuickAdd from './QuickAdd/SmartQuickAdd'
import TaskAddBar from './TaskAddBar'
import AIChatPanel from './AIChatPanel';
import ModelSettings from './ModelSettings'
import { useKeyboardShortcuts, createShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function Dashboard() {
  const { data: session } = useSession()
  const { createTask, refreshAll } = useTaskData()
  const [selectedView, setSelectedView] = useState<'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag'>('today')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchFilters, setSearchFilters] = useState<any>(null)
  const taskListRef = useRef<{ refreshTasks: () => void } | null>(null)
  const quickAddRef = useRef<{ focus: () => void; blur: () => void; isOpen: boolean } | null>(null)
  const [showSmartQuickAdd, setShowSmartQuickAdd] = useState(false)
  const [quickAddInitialValue, setQuickAddInitialValue] = useState('')
  const sidebarRef = useRef<{ refreshTags: () => void; refreshTaskStats: () => void } | null>(null)
  const [isAIChatPanelOpen, setIsAIChatPanelOpen] = useState(false);
  const [showModelSettings, setShowModelSettings] = useState(false);

  const handleTaskCreated = async () => {
    // 刷新所有数据
    await refreshAll();
    
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
      await createTask(task);
      handleTaskCreated(); // 刷新列表和侧边栏
    } catch (error) {
      console.error('Failed to create task:', error);
      // 这里可以添加一个用户提示，例如使用 react-hot-toast
    }
  };

  const handleBatchTasksSubmit = async (tasks: CreateTaskInput[]) => {
    try {
      // 批量创建任务
      await Promise.all(tasks.map(task => createTask(task)));
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
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
        <Header onOpenModelSettings={() => setShowModelSettings(true)} />

        {/* 主要内容 */}
        <main className="flex-1 overflow-auto p-6 animate-fade-in">
  
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

      {/* 模型设置弹窗 */}
      <ModelSettings 
        isOpen={showModelSettings}
        onClose={() => setShowModelSettings(false)}
      />

      {/* 快捷键提示 */}
      <div className="fixed bottom-6 right-6 glass rounded-2xl p-4 shadow-tech backdrop-blur-md border border-white/20">
        <div className="text-sm text-gray-700 space-y-2">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <div className="font-semibold text-gray-800 gradient-text">快捷键</div>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">快速添加</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-mono">⌘N</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">刷新列表</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-mono">⌘R</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">切换视图</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-mono">1/2/3</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-gray-600">关闭</span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs font-mono">ESC</span>
          </div>
        </div>
      </div>
    </div>
  )
} 