'use client'

import React, { useState, useEffect } from 'react'
import { 
  Repeat, 
  Calendar, 
  Clock, 
  BarChart3, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface RecurringStats {
  totalRecurring: number
  totalInstances: number
  upcomingInstances: number
  overdueInstances: number
}

const RecurringTaskManager: React.FC = () => {
  const [stats, setStats] = useState<RecurringStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tasks/recurring/generate')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('获取周期任务统计失败:', error)
      showMessage('error', '获取统计信息失败')
    }
  }

  // 生成周期任务实例
  const generateTasks = async (daysAhead: number = 30) => {
    setLoading(true)
    try {
      const response = await fetch('/api/tasks/recurring/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAhead })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        showMessage('success', data.message)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('生成周期任务失败:', error)
      showMessage('error', '生成任务失败')
    } finally {
      setLoading(false)
    }
  }

  // 清理过期任务
  const cleanupTasks = async (daysPastDue: number = 7) => {
    setLoading(true)
    try {
      const response = await fetch('/api/tasks/recurring/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysPastDue })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        showMessage('success', data.message)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('清理过期任务失败:', error)
      showMessage('error', '清理任务失败')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (!stats) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <Repeat className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">周期性任务管理</h2>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* 统计信息卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Repeat className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">周期任务</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {stats.totalRecurring}
          </div>
          <div className="text-xs text-blue-500">活跃的原始任务</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">未来实例</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600">
            {stats.upcomingInstances}
          </div>
          <div className="text-xs text-green-500">等待执行的任务</div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">过期实例</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-orange-600">
            {stats.overdueInstances}
          </div>
          <div className="text-xs text-orange-500">未完成的过期任务</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">总实例数</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-600">
            {stats.totalInstances}
          </div>
          <div className="text-xs text-gray-500">历史生成的所有实例</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">管理操作</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* 生成任务 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-700">生成未来任务</span>
            </div>
            <p className="text-sm text-gray-500">
              根据周期规则自动生成未来 30 天内的任务实例
            </p>
            <button
              onClick={() => generateTasks(30)}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>立即生成</span>
                </>
              )}
            </button>
          </div>

          {/* 清理过期任务 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="font-medium text-gray-700">清理过期任务</span>
            </div>
            <p className="text-sm text-gray-500">
              删除 7 天前过期且未完成的任务实例，保持清单整洁
            </p>
            <button
              onClick={() => cleanupTasks(7)}
              disabled={loading}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>清理中...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>清理过期</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 说明信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">系统说明：</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>系统会在您访问任务列表时自动生成周期性任务实例</li>
              <li>周期任务（蓝色标识）是原始模板，定期任务（绿色标识）是生成的实例</li>
              <li>完成定期任务不会影响原始的周期任务模板</li>
              <li>可以手动生成更多未来任务或清理过期任务</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecurringTaskManager