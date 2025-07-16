'use client'

import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, Circle, Calendar, Flag, MoreHorizontal, Loader2, GripVertical, Edit2, Trash2, ExternalLink, Square, CheckSquare, X, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent
} from '@dnd-kit/core'
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { 
  useSortable 
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskData } from '@/contexts/TaskDataContext'
import { TaskWithDetails } from '@/types'
import TaskDetail from './TaskDetail'
import { api } from '@/lib/api'

interface TaskListProps {
  selectedView: 'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag'
  selectedTag?: string | null
  searchFilters?: any
  searchQuery?: string
  isSearching?: boolean
  onSidebarRefresh?: () => void
}

interface TaskListHandle {
  refreshTasks: () => void
}

interface SortableTaskProps {
  task: TaskWithDetails
  onToggleComplete: (taskId: string) => void
  onOpenDetail: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onUpdateTask: (taskId: string, updates: { title: string }) => void
  getPriorityColor: (priority: string) => string
  getPriorityLabel: (priority: string) => string
  getPriorityBadgeStyle: (priority: string) => string
  formatDate: (dateString: string | Date | null) => string
  isDragOverlay?: boolean
  isSelected?: boolean
  bulkEditMode?: boolean
  onSelectTask?: (taskId: string) => void
}



const SortableTask = ({ 
  task, 
  onToggleComplete, 
  onOpenDetail,
  onDeleteTask,
  onUpdateTask,
  getPriorityColor,
  getPriorityLabel,
  getPriorityBadgeStyle,
  formatDate, 
  isDragOverlay = false,
  isSelected = false,
  bulkEditMode = false,
  onSelectTask
}: SortableTaskProps) => {
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTitle, setEditingTitle] = useState(task.title)
  const [isUpdating, setIsUpdating] = useState(false)
  const [menuPosition, setMenuPosition] = useState<'top' | 'bottom'>('bottom')
  const quickActionsRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // 当进入编辑模式时，聚焦输入框并选择全部文本
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  // 重置编辑状态当任务更新时
  useEffect(() => {
    setEditingTitle(task.title)
    setIsEditing(false)
  }, [task.title])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在菜单按钮或菜单内部
      const target = event.target as Node
      const isMenuButton = quickActionsRef.current?.contains(target)
      
      // 检查点击是否在菜单内部（菜单现在在 document.body 上）
      const menuElement = document.querySelector('[data-menu-id="task-menu"]')
      const isMenuContent = menuElement?.contains(target)
      
      if (!isMenuButton && !isMenuContent) {
        setShowQuickActions(false)
      }
    }

    if (showQuickActions) {
      document.addEventListener('mousedown', handleClickOutside)
      // 添加 ESC 键关闭菜单
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setShowQuickActions(false)
        }
      }
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showQuickActions])
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // 处理标题编辑
  const handleTitleClick = () => {
    if (!task.isCompleted) {
      setIsEditing(true)
      setEditingTitle(task.title)
    }
  }

  const handleEditingSave = async () => {
    if (editingTitle.trim() === '' || editingTitle.trim() === task.title) {
      setIsEditing(false)
      setEditingTitle(task.title)
      return
    }

    try {
      setIsUpdating(true)
      await onUpdateTask(task.id, { title: editingTitle.trim() })
      setIsEditing(false)
    } catch (err) {
      console.error('更新任务标题失败:', err)
      setEditingTitle(task.title)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditingCancel = () => {
    setIsEditing(false)
    setEditingTitle(task.title)
  }

  const handleEditingKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleEditingSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleEditingCancel()
    }
  }

  // 计算菜单位置
  const calculateMenuPosition = () => {
    if (quickActionsRef.current) {
      const rect = quickActionsRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const menuHeight = 200 // 预估菜单高度
      const menuWidth = 192 // 菜单宽度
      
      // 检查右侧空间
      const rightSpace = viewportWidth - rect.right
      const leftSpace = rect.left
      
      // 如果下方空间不足，则显示在上方
      if (rect.bottom + menuHeight > viewportHeight) {
        setMenuPosition('top')
      } else {
        setMenuPosition('bottom')
      }
      
      // 如果右侧空间不足，可以考虑调整水平位置
      if (rightSpace < menuWidth && leftSpace > menuWidth) {
        // 可以在这里添加向左偏移的逻辑
      }
    }
  }

  // 处理菜单点击
  const handleMenuClick = () => {
    if (!showQuickActions) {
      calculateMenuPosition()
    }
    setShowQuickActions(!showQuickActions)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-modern rounded-2xl p-4 transition-all duration-300 ${
        task.isCompleted ? 'opacity-60' : ''
      } ${isDragOverlay ? 'rotate-3 shadow-tech scale-105' : ''} ${isSelected ? 'bg-primary-50 border-primary-200 shadow-tech' : ''}`}
    >
      <div className="flex items-start space-x-3">
        {/* 批量编辑模式下的选择复选框 */}
        {bulkEditMode && onSelectTask && (
          <button
            onClick={() => onSelectTask(task.id)}
            className={`mt-1 rounded p-1 transition-colors ${
              isSelected 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-400 hover:text-blue-600'
            }`}
          >
            {isSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
        )}

        {/* 拖拽手柄 */}
        {!bulkEditMode && (
          <button
            {...attributes}
            {...listeners}
            className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* 完成状态 */}
        {!bulkEditMode && (
          <button
            onClick={() => onToggleComplete(task.id)}
            className={`mt-1 rounded-full p-1 transition-colors ${
              task.isCompleted
                ? 'bg-green-100 text-green-600'
                : 'text-gray-400 hover:text-green-600'
            }`}
          >
            {task.isCompleted ? (
              <Check className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
        )}

        {/* 批量编辑模式下的任务状态指示器 */}
        {bulkEditMode && (
          <div className={`mt-1 rounded-full p-1 ${
            task.isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {task.isCompleted ? (
              <Check className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </div>
        )}

        {/* 任务内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {/* 任务标题 - 支持行内编辑 */}
            {isEditing ? (
              <div className="flex-1 flex items-center space-x-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleEditingKeyDown}
                  onBlur={handleEditingSave}
                  className="flex-1 text-sm font-medium px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isUpdating}
                />
                {isUpdating && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
              </div>
            ) : (
              <h3 
                className={`text-sm font-medium flex-1 cursor-pointer hover:text-blue-600 transition-colors ${
                  task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
                onClick={handleTitleClick}
                title={task.isCompleted ? '' : '点击编辑'}
              >
                {task.title}
              </h3>
            )}
            
            {/* 优先级徽章 - 显示所有优先级 */}
            {task.priority && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityBadgeStyle(task.priority)}`}>
                <Flag className="h-3 w-3 mr-1" />
                {getPriorityLabel(task.priority)}
              </span>
            )}
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          )}

          {/* 元数据 */}
          <div className="flex items-center space-x-4 text-xs text-gray-500">


            {/* 截止日期 */}
            {task.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}

            {/* 标签 */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                    style={{ 
                      backgroundColor: `${tag.color}15`, 
                      color: tag.color,
                      borderColor: `${tag.color}40`
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-500 border border-gray-200">
                    +{task.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="relative" ref={quickActionsRef}>
          <button 
            onClick={handleMenuClick}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          
          {/* 快速操作菜单 */}
          {showQuickActions && createPortal(
            <div 
              data-menu-id="task-menu"
              className="fixed w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 py-2 z-[9999]"
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
                minWidth: '192px',
                top: quickActionsRef.current ? 
                  (menuPosition === 'top' ? 
                    quickActionsRef.current.getBoundingClientRect().top - 200 : 
                    quickActionsRef.current.getBoundingClientRect().bottom + 8
                  ) : 0,
                left: quickActionsRef.current ? 
                  quickActionsRef.current.getBoundingClientRect().right - 192 : 0
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onOpenDetail(task.id)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg mx-1"
              >
                <ExternalLink className="h-4 w-4" />
                <span>查看详情</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onOpenDetail(task.id)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-lg mx-1"
              >
                <Edit2 className="h-4 w-4" />
                <span>编辑任务</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleComplete(task.id)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors rounded-lg mx-1"
              >
                {task.isCompleted ? (
                  <>
                    <Circle className="h-4 w-4" />
                    <span>标记为未完成</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>标记为完成</span>
                  </>
                )}
              </button>
              <hr className="my-2 mx-2 border-gray-200" />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDeleteTask(task.id)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg mx-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>删除任务</span>
              </button>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  )
}

const TaskList = forwardRef<TaskListHandle, TaskListProps>(({ selectedView, selectedTag, searchQuery, isSearching, onSidebarRefresh }, ref) => {
  const { fetchTasks, updateTask, deleteTask } = useTaskData()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<TaskWithDetails | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<TaskWithDetails[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 获取任务数据
  useEffect(() => {
    if (isSearching && searchQuery?.trim()) {
      loadSearchResults()
    } else {
      loadTasks()
    }
  }, [selectedView, selectedTag, searchQuery, isSearching])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {}
      
      if (selectedTag) {
        params.tagId = selectedTag
      }
      
      if (selectedView && selectedView !== 'tag') {
        params.view = selectedView
      }
      
      const data = await fetchTasks(params)
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务失败')
      console.error('获取任务失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSearchResults = async () => {
    try {
      setSearchLoading(true)
      setError(null)
      
      const result = await api.searchTasks({
        query: searchQuery?.trim() || '',
        limit: 50,
        includeCompleted: true
      })
      
      setSearchResults(result.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索任务失败')
      console.error('搜索任务失败:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    refreshTasks: loadTasks
  }))

  const toggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const updatedTask = await updateTask(taskId, {
        id: taskId,
        isCompleted: !task.isCompleted
      })

      setTasks(tasks.map(t => 
        t.id === taskId ? updatedTask : t
      ))
      
      // 刷新侧边栏统计
      if (onSidebarRefresh) {
        onSidebarRefresh()
      }
    } catch (err) {
      console.error('更新任务状态失败:', err)
    }
  }

  const handleOpenDetail = (taskId: string) => {
    setSelectedTaskId(taskId)
    setShowTaskDetail(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return

    try {
      await deleteTask(taskId)
      setTasks(tasks.filter(t => t.id !== taskId))
      
      // 刷新侧边栏统计
      if (onSidebarRefresh) {
        onSidebarRefresh()
      }
    } catch (err) {
      console.error('删除任务失败:', err)
    }
  }

  const handleTaskUpdated = () => {
    loadTasks()
  }

  const handleTaskTitleUpdate = async (taskId: string, updates: { title: string }) => {
    try {
      const updatedTask = await updateTask(taskId, {
        id: taskId,
        title: updates.title
      })

      setTasks(tasks.map(t => 
        t.id === taskId ? updatedTask : t
      ))
    } catch (err) {
      console.error('更新任务标题失败:', err)
      throw err
    }
  }

  const handleTaskDeleted = () => {
    setShowTaskDetail(false)
    setSelectedTaskId(null)
    loadTasks()
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    const currentTasks = isSearching ? searchResults : tasks
    if (selectedTaskIds.length === currentTasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(currentTasks.map(t => t.id))
    }
  }

  const handleBulkToggleComplete = async () => {
    if (selectedTaskIds.length === 0) return

    try {
      setBulkOperationLoading(true)
      
      // 检查是否所有选中的任务都已完成
      const selectedTasks = tasks.filter(t => selectedTaskIds.includes(t.id))
      const allCompleted = selectedTasks.every(t => t.isCompleted)
      const targetStatus = !allCompleted

      // 批量更新任务状态
      await Promise.all(
        selectedTaskIds.map(taskId =>
          updateTask(taskId, {
            id: taskId,
            isCompleted: targetStatus
          })
        )
      )

      // 更新本地状态
      const updateTaskStatus = (task: TaskWithDetails) => 
        selectedTaskIds.includes(task.id) 
          ? { ...task, isCompleted: targetStatus }
          : task

      setTasks(tasks.map(updateTaskStatus))
      setSearchResults(searchResults.map(updateTaskStatus))

      setSelectedTaskIds([])
      setBulkEditMode(false)
      
      // 刷新侧边栏统计
      if (onSidebarRefresh) {
        onSidebarRefresh()
      }
    } catch (err) {
      console.error('批量更新任务状态失败:', err)
      setBulkOperationLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return

    if (!confirm(`确定要删除 ${selectedTaskIds.length} 个任务吗？`)) return

    try {
      setBulkOperationLoading(true)
      
      await Promise.all(
        selectedTaskIds.map(taskId => deleteTask(taskId))
      )

      setTasks(tasks.filter(t => !selectedTaskIds.includes(t.id)))
      setSearchResults(searchResults.filter(t => !selectedTaskIds.includes(t.id)))
      setSelectedTaskIds([])
      setBulkEditMode(false)
      
      // 刷新侧边栏统计
      if (onSidebarRefresh) {
        onSidebarRefresh()
      }
    } catch (err) {
      console.error('批量删除任务失败:', err)
    } finally {
      setBulkOperationLoading(false)
    }
  }

  const handleToggleBulkEditMode = () => {
    setBulkEditMode(!bulkEditMode)
    setSelectedTaskIds([])
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    const task = tasks.find(t => t.id === active.id)
    setDraggedTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // 可以在这里处理跨项目拖拽
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedTask(null)

    if (!over) return

    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id)
      const newIndex = tasks.findIndex(task => task.id === over.id)

      const newTasks = arrayMove(tasks, oldIndex, newIndex)
      setTasks(newTasks)

      // 更新排序到服务器
      try {
        await updateTaskOrder(newTasks)
      } catch (err) {
        console.error('更新任务排序失败:', err)
        // 如果失败，恢复原始排序
        setTasks(tasks)
      }
    }
  }

  const updateTaskOrder = async (orderedTasks: TaskWithDetails[]) => {
    try {
      // 创建排序更新请求
      const sortUpdates = orderedTasks.map((task, index) => ({
        id: task.id,
        sortOrder: index
      }))

      // 批量更新任务排序
      await Promise.all(
        sortUpdates.map(update => 
          updateTask(update.id, { id: update.id, sortOrder: update.sortOrder })
        )
      )
    } catch (err) {
      throw new Error('更新任务排序失败')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600'
      case 'HIGH':
        return 'text-orange-500'
      case 'MEDIUM':
        return 'text-yellow-500'
      case 'LOW':
        return 'text-green-500'
      default:
        return 'text-gray-400'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '紧急'
      case 'HIGH':
        return '高'
      case 'MEDIUM':
        return '中'
      case 'LOW':
        return '低'
      default:
        return ''
    }
  }

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'LOW':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getViewTitle = () => {
    if (isSearching && searchQuery?.trim()) {
      return `搜索: "${searchQuery}"`
    }
    
    if (selectedTag) {
      // 获取标签名称
      const task = tasks.find(task => task.tags?.some(tag => tag.id === selectedTag))
      const tagName = task?.tags?.find(tag => tag.id === selectedTag)?.name || '标签'
      return `# ${tagName}`
    }
    
    switch (selectedView) {
      case 'today':
        return '今天'
      case 'upcoming':
        return '即将到来'
      case 'all':
        return '所有任务'
      case 'tag':
        return '标签视图'
      default:
        return '任务'
    }
  }

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading || searchLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-tech animate-pulse-glow">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-neon-blue rounded-full animate-pulse"></div>
        </div>
        <span className="text-gray-600 font-medium">
          {isSearching ? '搜索中...' : '加载中...'}
        </span>
        <div className="flex items-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
            <Circle className="h-10 w-10 text-red-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">加载失败</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchTasks}
          className="btn-modern px-6 py-3 font-medium"
        >
          重试
        </button>
      </div>
    )
  }

  // 项目分组视图渲染


  return (
    <div className="space-y-4">
      {/* 标题和批量操作 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-bold gradient-text">{getViewTitle()}</h2>
          <button
            onClick={handleToggleBulkEditMode}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              bulkEditMode 
                ? 'bg-primary-100 text-primary-700 hover:bg-primary-200 shadow-modern'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-modern'
            }`}
          >
            {bulkEditMode ? '取消批量编辑' : '批量编辑'}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 font-medium">
            {isSearching ? searchResults.length : tasks.length} 个任务
          </span>
        </div>
      </div>

      {/* 批量操作栏 */}
      {bulkEditMode && (
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-2xl p-6 shadow-modern">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-primary-700 hover:text-primary-900 transition-colors"
              >
                {selectedTaskIds.length === (isSearching ? searchResults.length : tasks.length) ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {selectedTaskIds.length === (isSearching ? searchResults.length : tasks.length) ? '取消全选' : '全选'}
                </span>
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-primary-600 font-medium">
                  已选择 {selectedTaskIds.length} 个任务
                </span>
              </div>
            </div>
                
            {selectedTaskIds.length > 0 && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBulkToggleComplete}
                  disabled={bulkOperationLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 shadow-modern hover:shadow-tech"
                >
                  {bulkOperationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span className="font-medium">批量完成</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkOperationLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 disabled:opacity-50 shadow-modern hover:shadow-tech"
                >
                  {bulkOperationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="font-medium">批量删除</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 任务列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={(isSearching ? searchResults : tasks).map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {(isSearching ? searchResults : tasks).map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                isSelected={selectedTaskIds.includes(task.id)}
                bulkEditMode={bulkEditMode}
                onSelectTask={handleSelectTask}
                onToggleComplete={toggleComplete}
                onOpenDetail={handleOpenDetail}
                onDeleteTask={handleDeleteTask}
                onUpdateTask={handleTaskTitleUpdate}
                getPriorityColor={getPriorityColor}
                getPriorityLabel={getPriorityLabel}
                getPriorityBadgeStyle={getPriorityBadgeStyle}
                formatDate={formatDate}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {draggedTask && (
            <SortableTask
              task={draggedTask}
              isSelected={false}
              bulkEditMode={false}
              onSelectTask={handleSelectTask}
              onToggleComplete={toggleComplete}
              onOpenDetail={handleOpenDetail}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleTaskTitleUpdate}
              getPriorityColor={getPriorityColor}
              getPriorityLabel={getPriorityLabel}
              getPriorityBadgeStyle={getPriorityBadgeStyle}
              formatDate={formatDate}
              isDragOverlay={true}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* 空状态 */}
      {(isSearching ? searchResults.length === 0 : tasks.length === 0) && (
        <div className="text-center py-16">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto animate-float">
              <Circle className="h-12 w-12 text-primary-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-blue rounded-full animate-pulse-glow"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-neon-purple rounded-full animate-pulse-glow" style={{animationDelay: '0.5s'}}></div>
          </div>
          <h3 className="text-2xl font-bold gradient-text mb-3">
            {isSearching ? '没有找到相关任务' : '没有任务'}
          </h3>
          <p className="text-gray-600 text-lg mb-6">
            {isSearching ? `没有找到包含 "${searchQuery}" 的任务` : '创建您的第一个任务开始使用吧！'}
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span>智能解析</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
              <span>AI 助手</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
              <span>实时同步</span>
            </div>
          </div>
        </div>
      )}

      {/* 任务详情 Modal */}
      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          isOpen={showTaskDetail}
          onClose={() => {
            setShowTaskDetail(false)
            setSelectedTaskId(null)
          }}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  )
})

TaskList.displayName = 'TaskList'

export default TaskList 