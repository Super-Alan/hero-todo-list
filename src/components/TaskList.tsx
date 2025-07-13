'use client'

import { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'
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
import { api } from '@/lib/api'
import { TaskWithDetails } from '@/types'
import TaskDetail from './TaskDetail'

interface TaskListProps {
  selectedView: 'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag'
  selectedTag?: string | null
  searchFilters?: any
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
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setShowQuickActions(false)
      }
    }

    if (showQuickActions) {
      document.addEventListener('mousedown', handleClickOutside)
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow ${
        task.isCompleted ? 'opacity-60' : ''
      } ${isDragOverlay ? 'rotate-3 shadow-lg' : ''} ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
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
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="text-gray-400 hover:text-gray-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          
          {/* 快速操作菜单 */}
          {showQuickActions && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              <button
                onClick={() => {
                  onOpenDetail(task.id)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                <span>查看详情</span>
              </button>
              <button
                onClick={() => {
                  onOpenDetail(task.id)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="h-4 w-4" />
                <span>编辑任务</span>
              </button>
              

              
              <button
                onClick={() => {
                  onToggleComplete(task.id)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
              <hr className="my-2" />
              <button
                onClick={() => {
                  onDeleteTask(task.id)
                  setShowQuickActions(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>删除任务</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const TaskList = forwardRef<TaskListHandle, TaskListProps>(({ selectedView, selectedTag }, ref) => {
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


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 获取任务数据
  useEffect(() => {
    fetchTasks()
  }, [selectedView, selectedTag])

  const fetchTasks = async () => {
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
      
      const data = await api.getTasks(params)
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务失败')
      console.error('获取任务失败:', err)
    } finally {
      setLoading(false)
    }
  }



  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    refreshTasks: fetchTasks
  }))

  const toggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const updatedTask = await api.updateTask(taskId, {
        id: taskId,
        isCompleted: !task.isCompleted
      })

      setTasks(tasks.map(t => 
        t.id === taskId ? updatedTask : t
      ))
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
      await api.deleteTask(taskId)
      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (err) {
      console.error('删除任务失败:', err)
    }
  }

  const handleTaskUpdated = () => {
    fetchTasks()
  }

  const handleTaskTitleUpdate = async (taskId: string, updates: { title: string }) => {
    try {
      const updatedTask = await api.updateTask(taskId, {
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
    fetchTasks()
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(tasks.map(t => t.id))
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
          api.updateTask(taskId, {
            id: taskId,
            isCompleted: targetStatus
          })
        )
      )

      // 更新本地状态
      setTasks(tasks.map(t => 
        selectedTaskIds.includes(t.id) 
          ? { ...t, isCompleted: targetStatus }
          : t
      ))

      setSelectedTaskIds([])
      setBulkEditMode(false)
    } catch (err) {
      console.error('批量更新任务状态失败:', err)
    } finally {
      setBulkOperationLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return

    if (!confirm(`确定要删除 ${selectedTaskIds.length} 个任务吗？`)) return

    try {
      setBulkOperationLoading(true)
      
      await Promise.all(
        selectedTaskIds.map(taskId => api.deleteTask(taskId))
      )

      setTasks(tasks.filter(t => !selectedTaskIds.includes(t.id)))
      setSelectedTaskIds([])
      setBulkEditMode(false)
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
          api.updateTask(update.id, { id: update.id, sortOrder: update.sortOrder })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <Circle className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h2>
          <button
            onClick={handleToggleBulkEditMode}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              bulkEditMode 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {bulkEditMode ? '取消批量编辑' : '批量编辑'}
          </button>
        </div>
        <span className="text-sm text-gray-500">
          {tasks.length} 个任务
        </span>
      </div>

      {/* 批量操作栏 */}
      {bulkEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-blue-700 hover:text-blue-900"
              >
                {selectedTaskIds.length === tasks.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>
                  {selectedTaskIds.length === tasks.length ? '取消全选' : '全选'}
                </span>
              </button>
              <span className="text-sm text-blue-600">
                已选择 {selectedTaskIds.length} 个任务
              </span>
                </div>
                
            {selectedTaskIds.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkToggleComplete}
                  disabled={bulkOperationLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {bulkOperationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>批量完成</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkOperationLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {bulkOperationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>批量删除</span>
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
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
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
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Circle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有任务</h3>
          <p className="text-gray-600">创建您的第一个任务开始使用吧！</p>
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