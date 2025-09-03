'use client'

import { useState, useEffect } from 'react'
import { ArrowPathIcon, ClockIcon, UserIcon, PauseIcon, PlayIcon, SparklesIcon, CalendarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminGuard from '@/components/AdminGuard'

interface SchedulingStatus {
  currentStrategy: { name: string; description: string }
  lastGenerated?: string
  nextScheduled?: string
  tasksGenerated?: number
  isEnabled: boolean
  health?: any
  system?: any
}

export default function SchedulingAdminPage() {
  return (
    <AdminGuard>
      <SchedulingAdminContent />
    </AdminGuard>
  )
}

function SchedulingAdminContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [schedulingStatus, setSchedulingStatus] = useState<SchedulingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 获取当前状态
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/scheduling')
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      setSchedulingStatus(data)
    } catch (error) {
      console.error('Error fetching status:', error)
      setMessage({ type: 'error', text: '获取状态失败' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // 每30秒刷新一次状态
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // 切换策略
  const changeStrategy = async (strategy: string) => {
    setUpdating(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy })
      })
      if (!response.ok) throw new Error('Failed to update strategy')
      const data = await response.json()
      // 刷新状态
      await fetchStatus()
      setMessage({ type: 'success', text: `已切换到${getStrategyName(strategy)}策略` })
    } catch (error) {
      console.error('Error updating strategy:', error)
      setMessage({ type: 'error', text: '更新策略失败' })
    } finally {
      setUpdating(false)
    }
  }

  // 手动生成任务
  const generateTasks = async () => {
    setGenerating(true)
    setMessage(null)
    try {
      const response = await fetch('/api/tasks/recurring/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysAhead: 30 })
      })
      if (!response.ok) throw new Error('Failed to generate tasks')
      const data = await response.json()
      setMessage({ 
        type: 'success', 
        text: `成功生成 ${data.generatedCount || 0} 个周期性任务` 
      })
      // 刷新状态
      await fetchStatus()
    } catch (error) {
      console.error('Error generating tasks:', error)
      setMessage({ type: 'error', text: '生成任务失败' })
    } finally {
      setGenerating(false)
    }
  }

  // 清理过期任务
  const cleanupTasks = async () => {
    setUpdating(true)
    setMessage(null)
    try {
      const response = await fetch('/api/tasks/recurring/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysAgo: 7 })
      })
      if (!response.ok) throw new Error('Failed to cleanup tasks')
      const data = await response.json()
      setMessage({ 
        type: 'success', 
        text: `已清理 ${data.deletedCount || 0} 个过期任务` 
      })
    } catch (error) {
      console.error('Error cleaning up tasks:', error)
      setMessage({ type: 'error', text: '清理任务失败' })
    } finally {
      setUpdating(false)
    }
  }

  const getStrategyName = (strategy: string) => {
    switch (strategy) {
      case 'user-triggered': return '用户触发'
      case 'node-timer': return 'Node.js定时器'
      case 'webhook': return '外部Webhook'
      case 'queue': return 'Redis队列'
      default: return strategy
    }
  }

  const getStrategyDescription = (strategy: string) => {
    switch (strategy) {
      case 'user-triggered': 
        return '当用户访问任务列表时自动生成周期性任务（每24小时最多一次）'
      case 'node-timer': 
        return '使用Node.js内置定时器，适合长期运行的服务器'
      case 'webhook': 
        return '通过外部服务（如Vercel Cron、GitHub Actions）触发'
      case 'queue': 
        return '基于Redis的企业级队列系统，高可靠性'
      default: 
        return ''
    }
  }

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'user-triggered': return <UserIcon className="h-5 w-5" />
      case 'node-timer': return <ClockIcon className="h-5 w-5" />
      case 'webhook': return <CalendarIcon className="h-5 w-5" />
      case 'queue': return <SparklesIcon className="h-5 w-5" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <SparklesIcon className="h-7 w-7 mr-2 text-blue-600" />
                周期性任务调度管理
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                管理周期性任务的生成策略和调度设置
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              返回首页
            </button>
          </div>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-6 rounded-lg p-4 flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' 
              ? <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              : <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            }
            <span>{message.text}</span>
          </div>
        )}

        {/* 当前状态 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">当前状态</h2>
          {schedulingStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">当前策略：</span>
                <div className="flex items-center space-x-2">
                  {getStrategyIcon(schedulingStatus.currentStrategy.name)}
                  <span className="font-medium text-gray-900">
                    {getStrategyName(schedulingStatus.currentStrategy.name)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">状态：</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  schedulingStatus.isEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {schedulingStatus.isEnabled ? '已启用' : '已禁用'}
                </span>
              </div>
              {schedulingStatus.lastGenerated && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">上次生成：</span>
                  <span className="text-gray-900">
                    {new Date(schedulingStatus.lastGenerated).toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
              {schedulingStatus.nextScheduled && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">下次调度：</span>
                  <span className="text-gray-900">
                    {new Date(schedulingStatus.nextScheduled).toLocaleString('zh-CN')}
                  </span>
                </div>
              )}
              {schedulingStatus.tasksGenerated !== undefined && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">已生成任务数：</span>
                  <span className="font-medium text-gray-900">
                    {schedulingStatus.tasksGenerated}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 策略选择 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">调度策略</h2>
          <div className="space-y-3">
            {['user-triggered', 'node-timer', 'webhook'].map((strategy) => (
              <div
                key={strategy}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  schedulingStatus?.currentStrategy?.name === strategy
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => changeStrategy(strategy)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStrategyIcon(strategy)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        {getStrategyName(strategy)}
                      </h3>
                      {schedulingStatus?.currentStrategy?.name === strategy && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {getStrategyDescription(strategy)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">手动操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={generateTasks}
              disabled={generating || updating}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  立即生成周期性任务
                </>
              )}
            </button>
            
            <button
              onClick={cleanupTasks}
              disabled={updating || generating}
              className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  清理过期任务
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">说明：</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>立即生成：</strong>手动触发一次周期性任务生成，为所有用户生成未来30天的任务</li>
              <li>• <strong>清理过期：</strong>删除已过期且未完成的周期性任务实例</li>
              <li>• 所有操作都会记录在系统日志中</li>
            </ul>
          </div>
        </div>

        {/* API 文档 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API 端点</h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-gray-600">查看状态：</div>
              <div className="text-gray-900">GET /api/admin/scheduling</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-gray-600">切换策略：</div>
              <div className="text-gray-900">POST /api/admin/scheduling</div>
              <div className="text-gray-500 text-xs mt-1">
                Body: {`{ "strategy": "user-triggered" | "scheduled" | "passive" }`}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-gray-600">生成任务：</div>
              <div className="text-gray-900">POST /api/tasks/recurring/generate</div>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <div className="text-gray-600">清理任务：</div>
              <div className="text-gray-900">POST /api/tasks/recurring/cleanup</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}