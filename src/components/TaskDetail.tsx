'use client'

import { useState, useEffect } from 'react'
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
  Circle
} from 'lucide-react'
import { api } from '@/lib/api'
import { TaskWithDetails } from '@/types'
import { Priority } from '@/generated/prisma'

interface TaskDetailProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
  onTaskUpdated?: () => void
  onTaskDeleted?: () => void
}

export default function TaskDetail({ 
  taskId, 
  isOpen, 
  onClose, 
  onTaskUpdated, 
  onTaskDeleted 
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

  // 获取任务详情
  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetail()
    }
  }, [isOpen, taskId])

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
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
        dueTime: taskData.dueTime ? new Date(taskData.dueTime).toTimeString().slice(0, 5) : '',
        priority: taskData.priority,
        isCompleted: taskData.isCompleted
      })
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
        dueDate = new Date(formData.dueDate)
        if (formData.dueTime) {
          const [hours, minutes] = formData.dueTime.split(':')
          dueTime = new Date(formData.dueDate)
          dueTime.setHours(parseInt(hours), parseInt(minutes))
        }
      }
      
      const updatedTask = await api.updateTask(taskId, {
        id: taskId,
        title: formData.title,
        description: formData.description || undefined,
        dueDate,
        dueTime,
        priority: formData.priority,
        isCompleted: formData.isCompleted
      })
      
      setTask(updatedTask)
      onTaskUpdated?.()
      
      // 显示成功提示
      setTimeout(() => {
        onClose()
      }, 1000)
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-800">任务详情</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 bg-gradient-to-b from-white to-gray-50/50">
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
            <div className="space-y-8">
              {/* 标题和完成状态 */}
              <div className="flex items-start space-x-3">
                <button
                  onClick={handleToggleComplete}
                  className={`mt-1 rounded-full p-2 transition-all duration-200 ${
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
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full text-lg font-medium border-0 outline-none resize-none bg-transparent placeholder-gray-400 ${
                      formData.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                    placeholder="任务标题"
                  />
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  rows={4}
                  placeholder="任务描述..."
                />
              </div>

              {/* 日期和时间 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Calendar className="inline h-4 w-4 mr-2 text-blue-500" />
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="inline h-4 w-4 mr-2 text-blue-500" />
                    截止时间
                  </label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  />
                </div>
              </div>

              {/* 优先级 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Flag className="inline h-4 w-4 mr-2 text-blue-500" />
                  优先级
                </label>
                <div className="space-y-3">
                  {/* 当前优先级显示 */}
                  <div className={`inline-flex items-center px-4 py-2 rounded-xl border ${getPriorityColor(formData.priority)}`}>
                    <Flag className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {formData.priority === 'URGENT' ? '紧急' :
                       formData.priority === 'HIGH' ? '高优先级' :
                       formData.priority === 'MEDIUM' ? '中优先级' : '低优先级'}
                    </span>
                  </div>
                  
                  {/* 优先级选择器 */}
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <option value="LOW">低优先级</option>
                    <option value="MEDIUM">中优先级</option>
                    <option value="HIGH">高优先级</option>
                    <option value="URGENT">紧急</option>
                  </select>
                </div>
              </div>



              {/* 标签信息 */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Tag className="inline h-4 w-4 mr-2 text-blue-500" />
                    标签
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium border shadow-sm"
                        style={{ 
                          backgroundColor: `${tag.color}15`, 
                          color: tag.color, 
                          borderColor: `${tag.color}40` 
                        }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
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
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              取消
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
          </div>
        </div>
      </div>
    </div>
  )
} 