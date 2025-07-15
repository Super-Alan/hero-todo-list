'use client'

import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { Plus, Loader2, Calendar, Flag, Hash, Tag } from 'lucide-react'
import { api } from '@/lib/api'
import { nlp } from '@/lib/nlp'
import { ParsedTaskInput } from '@/types'

interface QuickAddProps {
  onTaskCreated?: () => void
}

interface QuickAddHandle {
  focus: () => void
  blur: () => void
  isOpen: boolean
}

const QuickAdd = forwardRef<QuickAddHandle, QuickAddProps>(({ onTaskCreated }, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [parsedResult, setParsedResult] = useState<ParsedTaskInput | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (!isOpen) {
        setIsOpen(true)
      }
      // 使用setTimeout确保DOM更新后再聚焦
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    },
    blur: () => {
      setIsOpen(false)
      setTaskTitle('')
      setError(null)
      setSuccessMessage(null)
      setParsedResult(null)
    },
    isOpen
  }))

  // 实时解析用户输入
  useEffect(() => {
    if (taskTitle.trim()) {
      const result = nlp.parse(taskTitle)
      setParsedResult(result)
    } else {
      setParsedResult(null)
    }
  }, [taskTitle])

  // 当组件打开时自动聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim() || loading) return

    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      // 使用解析结果或原始输入
      const finalResult = parsedResult || { title: taskTitle.trim() }
      console.log('[QuickAdd] Final result before processing tags:', finalResult);
      
      // 处理标签：根据标签名称获取或创建标签ID
      let tagIds: string[] = []
      let createdTagNames: string[] = []
      if (finalResult.tagNames && finalResult.tagNames.length > 0) {
        // 获取或创建标签
        const tagPromises = finalResult.tagNames.map(async (tagName) => {
          try {
            // 首先尝试获取现有标签 - 使用精确匹配
            const existingTags = await api.getTags()
            const existingTag = existingTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
            
            if (existingTag) {
              return { id: existingTag.id, isNew: false }
            } else {
              // 创建新标签，使用随机颜色
              const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#6b7280']
              const randomColor = colors[Math.floor(Math.random() * colors.length)]
              
              const newTag = await api.createTag({
                name: tagName,
                color: randomColor
              })
              createdTagNames.push(tagName)
              return { id: newTag.id, isNew: true }
            }
          } catch (err) {
            console.error(`处理标签 ${tagName} 失败:`, err)
            return null
          }
        })
        
        const resolvedTags = await Promise.all(tagPromises)
        tagIds = resolvedTags.filter(result => result !== null).map(result => result!.id)
      }

      // 项目功能已移除

      // 创建任务
      const taskData = {
        title: finalResult.title,
        description: finalResult.description,
        dueDate: finalResult.dueDate,
        dueTime: finalResult.dueTime,
        priority: finalResult.priority || 'MEDIUM',
        tagIds: tagIds,
      }
      console.log('[QuickAdd] Data sent to API:', taskData);
      await api.createTask(taskData)

      // 重置表单
      setTaskTitle('')
      setIsOpen(false)
      setParsedResult(null)
      
      // 如果创建了新标签，显示提示
      if (createdTagNames.length > 0) {
        setSuccessMessage(`任务创建成功！自动创建了新标签: ${createdTagNames.join(', ')}`)
        // 3秒后清除成功消息
        setTimeout(() => setSuccessMessage(null), 3000)
      }
      
      // 通知父组件刷新任务列表
      if (onTaskCreated) {
        onTaskCreated()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败')
      console.error('创建任务失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setTaskTitle('')
      setError(null)
      setSuccessMessage(null)
      setParsedResult(null)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('zh-CN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    })
  }

  const getPriorityColor = (priority: string) => {
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '紧急'
      case 'HIGH':
        return '高优先级'
      case 'MEDIUM':
        return '中优先级'
      case 'LOW':
        return '低优先级'
      default:
        return priority
    }
  }

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 w-full p-3 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>添加任务...</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4">
          <input
            ref={inputRef}
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入任务标题..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          
          {/* 解析结果预览 */}
          {parsedResult && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <div className="text-sm text-gray-700 mb-2">
                <strong>解析结果：</strong>
                <span className="ml-2 text-blue-600">{parsedResult.title}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {parsedResult.dueDate && (
                  <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(parsedResult.dueDate)}</span>
                  </span>
                )}
                {parsedResult.dueTime && (
                  <span className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    <Calendar className="h-3 w-3" />
                    <span>{formatTime(parsedResult.dueTime)}</span>
                  </span>
                )}
                {parsedResult.priority && (
                  <span className={`flex items-center space-x-1 px-2 py-1 rounded border ${getPriorityColor(parsedResult.priority)}`}>
                    <Flag className="h-3 w-3" />
                    <span>{getPriorityLabel(parsedResult.priority)}</span>
                  </span>
                )}

                {parsedResult.tagNames && parsedResult.tagNames.map((tag, index) => (
                  <span key={index} className="flex items-center space-x-1 px-2 py-1 bg-pink-100 text-pink-700 rounded">
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 错误提示 */}
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
          
          {/* 成功提示 */}
          {successMessage && (
            <div className="mt-2 text-sm text-green-600">
              {successMessage}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                提示：输入"明天下午3点 开会 @标签 重要"或"下午10点参加会议 #工作"来快速设置属性。不存在的标签会自动创建。
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setTaskTitle('')
                  setError(null)
                  setSuccessMessage(null)
                  setParsedResult(null)
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                disabled={loading || !taskTitle.trim()}
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{loading ? '添加中...' : '添加'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
})

QuickAdd.displayName = 'QuickAdd'

export default QuickAdd 