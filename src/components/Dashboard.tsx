'use client'

import { useSession } from 'next-auth/react'
import { CreateTaskInput } from '@/types';
import { useState, useRef, useEffect } from 'react'
import { useTaskData } from '@/contexts/TaskDataContext'
import Header from './Header'
import Sidebar from './Sidebar'
import TaskList from './TaskList'
import SmartQuickAdd from './QuickAdd/SmartQuickAdd'
import TaskAddBar from './TaskAddBar'
import AIChatPanel from './AIChatPanel';
import { useKeyboardShortcuts, createShortcuts } from '@/hooks/useKeyboardShortcuts'
import { Menu, X } from 'lucide-react'

export default function Dashboard() {
  const { data: session } = useSession()
  const { createTask, refreshAll } = useTaskData()
  const [selectedView, setSelectedView] = useState<'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag'>('today')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchFilters, setSearchFilters] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const taskListRef = useRef<{ refreshTasks: () => void } | null>(null)
  const quickAddRef = useRef<{ focus: () => void; blur: () => void; isOpen: boolean } | null>(null)
  const [showSmartQuickAdd, setShowSmartQuickAdd] = useState(false)
  const [quickAddInitialValue, setQuickAddInitialValue] = useState('')
  const sidebarRef = useRef<{ refreshTags: () => void; refreshTaskStats: () => void } | null>(null)
  const [isAIChatPanelOpen, setIsAIChatPanelOpen] = useState(false);
  const [aiChatInitialInput, setAiChatInitialInput] = useState('');
  
  // 移动端状态管理
  const [isMobile, setIsMobile] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 移动端时自动关闭侧边栏
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false)
    }
  }, [isMobile])

  const handleTaskCreated = async () => {
    await refreshAll()
    if (taskListRef.current) {
      taskListRef.current.refreshTasks()
    }
    if (sidebarRef.current) {
      sidebarRef.current.refreshTaskStats()
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
    // 移动端选择视图后关闭侧边栏
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  const handleTagSelect = (tagId: string | null) => {
    setSelectedTag(tagId)
    // 移动端选择标签后关闭侧边栏
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  const handleSearch = (filters: any) => {
    setSearchFilters(filters)
    setSelectedView('all') // 搜索时切换到所有任务视图
    setSelectedTag(null)
  }

  const handleClearSearch = () => {
    setSearchFilters(null)
  }

  // 处理搜索查询
  const handleSearchQuery = (query: string) => {
    setSearchQuery(query)
    setIsSearching(query.trim().length > 0)
    
    if (query.trim().length > 0) {
      setSelectedView('all') // 搜索时切换到所有任务视图
      setSelectedTag(null)
    }
  }

  // 清除搜索查询
  const handleClearSearchQuery = () => {
    setSearchQuery('')
    setIsSearching(false)
  }

  const handleToggleAIChatPanel = () => {
    if (isMobile) {
      setIsAIPanelOpen(!isAIPanelOpen)
    } else {
      setIsAIChatPanelOpen(prev => !prev);
    }
  };

  const handleOpenAIChat = (initialInput: string) => {
    setAiChatInitialInput(initialInput);
    if (isMobile) {
      setIsAIPanelOpen(true)
    } else {
      setIsAIChatPanelOpen(true);
    }
  };

  // 定义快捷键（仅在桌面端生效）
  const shortcuts = isMobile ? [] : [
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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 overflow-hidden">
      {/* 移动端遮罩层 */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out h-screen' : 'relative h-full'}
        ${isMobile && !isSidebarOpen ? '-translate-x-full' : ''}
        ${!isMobile ? 'w-64' : 'w-80'}
      `}>
        <Sidebar
          ref={sidebarRef}
          selectedView={selectedView}
          selectedTag={selectedTag}
          onViewSelect={handleViewChange}
          onTagSelect={handleTagSelect}
        />
      </div>

      {/* 主内容区域 */}
      <div className={`
        flex-1 flex flex-col transition-all duration-300 h-full
        ${!isMobile && isAIChatPanelOpen ? 'mr-96' : ''}
        ${isMobile ? 'w-full' : ''}
      `}>
        {/* 头部 */}
        <Header 
          onSearch={handleSearchQuery}
          onClearSearch={handleClearSearchQuery}
          searchQuery={searchQuery}
          isMobile={isMobile}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* 主要内容 */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in">
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
            onOpenAIChat={handleOpenAIChat}
            isMobile={isMobile}
          />

          {/* 任务列表 */}
          <TaskList
            ref={taskListRef}
            selectedView={selectedView}
            selectedTag={selectedTag}
            searchFilters={searchFilters}
            searchQuery={searchQuery}
            isSearching={isSearching}
            onSidebarRefresh={handleRefreshSidebar}
            isMobile={isMobile}
          />
        </main>
      </div>

      {/* AI Chat Panel - 桌面端 */}
      {!isMobile && (
        <AIChatPanel
          isOpen={isAIChatPanelOpen}
          onClose={() => {
            setIsAIChatPanelOpen(false)
            setAiChatInitialInput('') // 关闭时清空初始输入
          }}
          onTasksGenerated={handleBatchTasksSubmit}
          initialInput={aiChatInitialInput}
        />
      )}

      {/* AI Chat Panel - 移动端 */}
      {isMobile && (
        <div className={`
          fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
          ${isAIPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <AIChatPanel
            isOpen={isAIPanelOpen}
            onClose={() => {
              setIsAIPanelOpen(false)
              setAiChatInitialInput('') // 关闭时清空初始输入
            }}
            onTasksGenerated={handleBatchTasksSubmit}
            initialInput={aiChatInitialInput}
            isMobile={true}
          />
        </div>
      )}

    </div>
  )
}