'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Calendar, 
  Clock, 
  Flag, 
  Hash, 
  Tag, 
  Trash2, 
  Save,
  Loader2,
  CheckCircle,
  Circle,
  RotateCcw,
  Edit3,
  Info,
  Plus,
  XCircle
} from 'lucide-react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import { TaskWithDetails, TagWithDetails } from '@/types'
import { Priority } from '@prisma/client'
import { RecurringTaskUtils } from '@/lib/recurringTasks'
import { RecurrenceRule } from '@/types/recurring'
import { tagService } from '@/lib/tagService'

interface TaskDetailProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
  onTaskUpdated?: () => void
  onTaskDeleted?: () => void
  autoEdit?: boolean // 新增：是否自动进入编辑模式
}

export default function TaskDetail({ 
  taskId, 
  isOpen, 
  onClose, 
  onTaskUpdated, 
  onTaskDeleted,
  autoEdit = false
}: TaskDetailProps) {
  const [task, setTask] = useState<TaskWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'MEDIUM' as Priority,
    isCompleted: false
  })
  const [isEditMode, setIsEditMode] = useState(autoEdit)
  const [recurringRule, setRecurringRule] = useState<RecurrenceRule | null>(null)
  
  // 标签管理状态
  const [availableTags, setAvailableTags] = useState<TagWithDetails[]>([])
  const [taskTags, setTaskTags] = useState<TagWithDetails[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [showAddTag, setShowAddTag] = useState(false)
  const [tagColors] = useState([
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
  ])
  const [selectedTagColor, setSelectedTagColor] = useState(tagColors[0])
  
  // refs
  const tagInputRef = useRef<HTMLInputElement>(null)

  // 获取任务详情
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetail()
    }
  }, [isOpen, taskId])

  // 加载可用标签
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await tagService.getAllTags()
        setAvailableTags(tags)
      } catch (error) {
        console.error('Failed to load tags:', error)
      }
    }
    
    if (isEditMode) {
      loadTags()
    }
  }, [isEditMode])

  // 当任务数据变化时更新标签
  useEffect(() => {
    if (task?.tags) {
      setTaskTags(task.tags as TagWithDetails[])
    }
  }, [task])

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            if (isEditMode && task) {
              handleSave()
            }
            break
          case 'e':
            e.preventDefault()
            if (!isEditMode) {
              setIsEditMode(true)
            }
            break
          case 'Escape':
            if (isEditMode && !showAddTag) {
              setIsEditMode(false)
            } else if (showAddTag) {
              setShowAddTag(false)
              setNewTagName('')
            }
            break
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isEditMode, showAddTag, task])

  // 自动聚焦到标签输入框
  useEffect(() => {
    if (showAddTag && tagInputRef.current) {
      tagInputRef.current.focus()
    }
  }, [showAddTag])

  const fetchTaskDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const taskData = await api.getTask(taskId)
      setTask(taskData)
      
      // 设置表单数据
      setFormData({
        title: taskData.title,
        description: taskData.description || '',
        dueDate: taskData.dueDate ? (taskData.dueDate instanceof Date ? taskData.dueDate.toISOString().split('T')[0] : String(taskData.dueDate).split('T')[0]) : '',
        dueTime: taskData.dueTime ? (() => {
          // 使用UTC时间提取，确保所见即所得
          const date = new Date(taskData.dueTime)
          const hours = date.getUTCHours().toString().padStart(2, '0')
          const minutes = date.getUTCMinutes().toString().padStart(2, '0')
          return `${hours}:${minutes}`
        })() : '',
        priority: taskData.priority,
        isCompleted: taskData.isCompleted
      })
      
      // 解析周期性任务规则
      if (taskData.isRecurring && taskData.recurringRule) {
        try {
          const rule = RecurringTaskUtils.ruleFromJson(taskData.recurringRule)
          setRecurringRule(rule)
        } catch (error) {
          console.error('Failed to parse recurring rule:', error)
          setRecurringRule(null)
        }
      } else {
        setRecurringRule(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!task) return
    
    try {
      setSaving(true)
      setError(null)
      
      // 处理日期时间
      let dueDate: Date | undefined
      let dueTime: Date | undefined
      
      if (formData.dueDate) {
        // 使用 UTC 方法确保日期不受时区影响
        const [year, month, day] = formData.dueDate.split('-').map(Number)
        dueDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        
        if (formData.dueTime) {
          const [hours, minutes] = formData.dueTime.split(':').map(Number)
          dueTime = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
        }
      }
      
      const updatedTask = await api.updateTask(taskId, {
        id: taskId,
        title: formData.title,
        description: formData.description || undefined,
        dueDate,
        dueTime,
        priority: formData.priority,
        isCompleted: formData.isCompleted,
        tagIds: taskTags.map(t => t.id)
      })
      
      setTask(updatedTask)
      onTaskUpdated?.()
      setIsEditMode(false) // 退出编辑模式
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    
    if (!confirm('确定要删除这个任务吗？')) {
      return
    }
    
    try {
      await api.deleteTask(taskId)
      onTaskDeleted?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleToggleComplete = async () => {
    if (!task) return
    
    try {
      const updatedTask = await api.updateTask(taskId, {
        id: taskId,
        isCompleted: !task.isCompleted
      })
      
      setTask(updatedTask)
      setFormData(prev => ({ ...prev, isCompleted: !prev.isCompleted }))
      onTaskUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新状态失败')
    }
  }

  // 标签管理函数
  const handleAddTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      const tagId = await tagService.getOrCreateTagId(newTagName.trim())
      if (tagId) {
        const tags = await tagService.getAllTags()
        const newTag = tags.find(t => t.id === tagId)
        if (newTag && !taskTags.some(t => t.id === tagId)) {
          const updatedTags = [...taskTags, newTag]
          setTaskTags(updatedTags)
          // 更新任务标签
          await api.updateTask(taskId, {
            id: taskId,
            tagIds: updatedTags.map(t => t.id)
          })
        }
      }
      
      setNewTagName('')
      setShowAddTag(false)
      onTaskUpdated?.()
    } catch (error) {
      console.error('Failed to add tag:', error)
      setError('添加标签失败')
    }
  }

  const handleRemoveTag = async (tagToRemove: TagWithDetails) => {
    try {
      const updatedTags = taskTags.filter(t => t.id !== tagToRemove.id)
      setTaskTags(updatedTags)
      
      // 更新任务标签
      await api.updateTask(taskId, {
        id: taskId,
        tagIds: updatedTags.map(t => t.id)
      })
      
      onTaskUpdated?.()
    } catch (error) {
      console.error('Failed to remove tag:', error)
      setError('移除标签失败')
    }
  }

  const handleAddExistingTag = async (tag: TagWithDetails) => {
    if (taskTags.some(t => t.id === tag.id)) return
    
    try {
      const updatedTags = [...taskTags, tag]
      setTaskTags(updatedTags)
      
      // 更新任务标签
      await api.updateTask(taskId, {
        id: taskId,
        tagIds: updatedTags.map(t => t.id)
      })
      
      onTaskUpdated?.()
    } catch (error) {
      console.error('Failed to add existing tag:', error)
      setError('添加标签失败')
    }
  }

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      const newTag = await tagService.createTag(newTagName.trim(), selectedTagColor)
      if (newTag) {
        setAvailableTags(prev => [...prev, newTag])
        setTaskTags(prev => [...prev, newTag])
        
        // 更新任务标签
        const updatedTags = [...taskTags, newTag]
        await api.updateTask(taskId, {
          id: taskId,
          tagIds: updatedTags.map(t => t.id)
        })
        
        setNewTagName('')
        setShowAddTag(false)
        onTaskUpdated?.()
      }
    } catch (error) {
      console.error('Failed to create tag:', error)
      setError('创建标签失败')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9997]">
              <div className="card-modern rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-tech animate-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-primary-50 to-purple-50/50">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-800">任务详情</h2>
            {task?.isRecurring && (
              <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                <span>周期性</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* 键盘快捷键提示 */}
            {isEditMode && (
              <div className="hidden sm:flex items-center space-x-3 text-xs text-gray-500 mr-4">
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">⌘+S</kbd>
                  <span className="ml-1">保存</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd>
                  <span className="ml-1">退出</span>
                </span>
              </div>
            )}
            
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                isEditMode 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title={isEditMode ? '查看模式 (⌘+E)' : '编辑模式 (⌘+E)'}
            >
              <Edit3 className="h-4 w-4" />
              <span className="text-sm">{isEditMode ? '查看' : '编辑'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="bg-gradient-to-b from-white to-gray-50/50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600 font-medium">加载中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Circle className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchTaskDetail}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                重试
              </button>
            </div>
          ) : task ? (
            <div className="divide-y divide-gray-100">
              {/* 任务基本信息卡片 */}
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <button
                    onClick={handleToggleComplete}
                    className={`mt-1.5 rounded-full p-2 transition-all duration-200 ${
                      formData.isCompleted
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {formData.isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1 space-y-3">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full text-xl font-semibold p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
                          formData.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                        placeholder="任务标题"
                      />
                    ) : (
                      <h3 className={`text-xl font-semibold ${
                        formData.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {formData.title}
                      </h3>
                    )}
                    
                    {/* 任务元信息 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {/* 创建时间 */}
                      <div className="flex items-center space-x-1">
                        <Info className="h-4 w-4" />
                        <span>创建于 {new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                      
                      {/* 完成状态 */}
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        formData.isCompleted 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span>{formData.isCompleted ? '已完成' : '待完成'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 周期性任务信息 */}
              {task.isRecurring && recurringRule && (
                <div className="px-6 py-4 bg-blue-50/50">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ArrowPathIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">周期性任务设置</h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">重复规则：</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            {RecurringTaskUtils.formatRuleDescription(recurringRule)}
                          </span>
                        </div>
                        {recurringRule.endDate && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">结束日期：</span>
                            <span>{new Date(recurringRule.endDate).toLocaleDateString('zh-CN')}</span>
                          </div>
                        )}
                        {recurringRule.occurrences && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">重复次数：</span>
                            <span>{recurringRule.occurrences} 次</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 描述区域 */}
              <div className="p-6">
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Hash className="h-4 w-4 mr-2 text-blue-500" />
                    描述
                  </label>
                  {isEditMode ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      rows={4}
                      placeholder="添加任务描述..."
                    />
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border min-h-[100px]">
                      {formData.description ? (
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{formData.description}</p>
                      ) : (
                        <p className="text-gray-400 italic">暂无描述</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 任务详情网格 */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 截止日期 */}
                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      截止日期
                    </label>
                    {isEditMode ? (
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-xl border">
                        <span className="text-gray-700">
                          {formData.dueDate ? new Date(formData.dueDate + 'T00:00:00').toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          }) : '未设置'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 截止时间 */}
                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      截止时间
                    </label>
                    {isEditMode ? (
                      <input
                        type="time"
                        value={formData.dueTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-xl border">
                        <span className="text-gray-700">
                          {formData.dueTime || '未设置'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 优先级 */}
                  <div className="space-y-3">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Flag className="h-4 w-4 mr-2 text-blue-500" />
                      优先级
                    </label>
                    {isEditMode ? (
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <option value="LOW">低优先级</option>
                        <option value="MEDIUM">中优先级</option>
                        <option value="HIGH">高优先级</option>
                        <option value="URGENT">紧急</option>
                      </select>
                    ) : (
                      <div className={`inline-flex items-center px-4 py-2 rounded-xl border font-medium ${getPriorityColor(formData.priority)}`}>
                        <Flag className="h-4 w-4 mr-2" />
                        <span>
                          {formData.priority === 'URGENT' ? '紧急' :
                           formData.priority === 'HIGH' ? '高优先级' :
                           formData.priority === 'MEDIUM' ? '中优先级' : '低优先级'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 标签管理 */}
                  <div className="space-y-3 md:col-span-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Tag className="h-4 w-4 mr-2 text-blue-500" />
                      标签
                    </label>
                    
                    {isEditMode ? (
                      <div className="space-y-4">
                        {/* 当前标签列表 */}
                        <div className="flex flex-wrap gap-2">
                          {taskTags.map((tag) => (
                            <div
                              key={tag.id}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border shadow-sm group"
                              style={{ 
                                backgroundColor: `${tag.color}15`, 
                                color: tag.color, 
                                borderColor: `${tag.color}40` 
                              }}
                            >
                              <div 
                                className="w-2.5 h-2.5 rounded-full mr-2"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 p-0.5 rounded"
                              >
                                <XCircle className="h-3 w-3 text-red-500" />
                              </button>
                            </div>
                          ))}
                          
                          {/* 添加标签按钮 */}
                          <button
                            onClick={() => setShowAddTag(true)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            添加标签
                          </button>
                        </div>
                        
                        {/* 添加标签界面 */}
                        {showAddTag && (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                            <div className="flex items-center space-x-3">
                              <input
                                ref={tagInputRef}
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="输入标签名称"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCreateNewTag()
                                  } else if (e.key === 'Escape') {
                                    setShowAddTag(false)
                                    setNewTagName('')
                                  }
                                }}
                              />
                              
                              {/* 颜色选择器 */}
                              <div className="flex space-x-1">
                                {tagColors.map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setSelectedTagColor(color)}
                                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                                      selectedTagColor === color 
                                        ? 'border-gray-600 scale-110' 
                                        : 'border-gray-300 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            {/* 现有标签建议 */}
                            {availableTags.length > 0 && newTagName.trim() && (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-600">建议标签：</p>
                                <div className="flex flex-wrap gap-1">
                                  {availableTags
                                    .filter(tag => 
                                      tag.name.toLowerCase().includes(newTagName.toLowerCase()) &&
                                      !taskTags.some(t => t.id === tag.id)
                                    )
                                    .slice(0, 5)
                                    .map(tag => (
                                      <button
                                        key={tag.id}
                                        onClick={() => {
                                          handleAddExistingTag(tag)
                                          setNewTagName('')
                                          setShowAddTag(false)
                                        }}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border hover:bg-gray-100 transition-colors"
                                        style={{ 
                                          backgroundColor: `${tag.color}10`, 
                                          color: tag.color, 
                                          borderColor: `${tag.color}30` 
                                        }}
                                      >
                                        <div 
                                          className="w-2 h-2 rounded-full mr-1"
                                          style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                            
                            {/* 操作按钮 */}
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setShowAddTag(false)
                                  setNewTagName('')
                                }}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                取消
                              </button>
                              <button
                                onClick={handleCreateNewTag}
                                disabled={!newTagName.trim()}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                创建标签
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 查看模式的标签显示 */
                      <div className="flex flex-wrap gap-2">
                        {taskTags.length > 0 ? taskTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border shadow-sm"
                            style={{ 
                              backgroundColor: `${tag.color}15`, 
                              color: tag.color, 
                              borderColor: `${tag.color}40` 
                            }}
                          >
                            <div 
                              className="w-2.5 h-2.5 rounded-full mr-2"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </span>
                        )) : (
                          <p className="text-gray-400 italic text-sm">暂无标签</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                  <p className="text-sm text-red-600 font-medium flex items-center">
                    <Circle className="h-4 w-4 mr-2" />
                    {error}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-5 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-md border border-red-200/50"
          >
            <Trash2 className="h-4 w-4" />
            <span>删除</span>
          </button>
          
          <div className="flex items-center space-x-3">
            {isEditMode ? (
              <>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-5 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200"
                >
                  取消编辑
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.title.trim()}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{saving ? '保存中...' : '保存'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 text-white hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 