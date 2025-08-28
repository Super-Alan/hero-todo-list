'use client'

import { useEffect, useState } from 'react'
import { 
  UsersIcon, 
  CpuChipIcon, 
  CheckCircleIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'

interface AdminStats {
  overview: {
    totalUsers: number
    adminUsers: number
    regularUsers: number
    activeProviders: number
    inactiveProviders: number
    totalProviders: number
    totalTasks: number
    completedTasks: number
    pendingTasks: number
  }
  charts: {
    userRegistrations: Array<{
      date: string
      count: number
    }>
  }
  recent: {
    users: Array<{
      id: string
      name: string | null
      email: string
      role: string
      createdAt: string
    }>
    tasks: Array<{
      id: string
      title: string
      isCompleted: boolean
      createdAt: string
      user: {
        name: string | null
        email: string
      }
    }>
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">加载统计数据失败</p>
      </div>
    )
  }

  const statCards = [
    {
      name: '总用户数',
      value: stats.overview.totalUsers,
      icon: UsersIcon,
      color: 'blue'
    },
    {
      name: '活跃模型',
      value: stats.overview.activeProviders,
      icon: CpuChipIcon,
      color: 'green'
    },
    {
      name: '总任务数',
      value: stats.overview.totalTasks,
      icon: ClockIcon,
      color: 'purple'
    },
    {
      name: '已完成任务',
      value: stats.overview.completedTasks,
      icon: CheckCircleIcon,
      color: 'emerald'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">管理仪表板</h1>
        <p className="text-gray-600 mt-1">系统概览和关键指标</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 详细信息网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近用户 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">最近注册用户</h3>
          </div>
          <div className="p-6">
            {stats.recent.users.length > 0 ? (
              <div className="space-y-3">
                {stats.recent.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || '匿名用户'}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'ADMIN' ? '管理员' : '用户'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">暂无数据</p>
            )}
          </div>
        </div>

        {/* 最近任务 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">最近创建任务</h3>
          </div>
          <div className="p-6">
            {stats.recent.tasks.length > 0 ? (
              <div className="space-y-3">
                {stats.recent.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        创建者: {task.user.name || task.user.email}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        task.isCompleted
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.isCompleted ? '已完成' : '进行中'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      {/* 系统概览 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">系统概览</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">用户分布</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">管理员</span>
                  <span className="text-sm font-medium">{stats.overview.adminUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">普通用户</span>
                  <span className="text-sm font-medium">{stats.overview.regularUsers}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">模型提供商</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">活跃</span>
                  <span className="text-sm font-medium">{stats.overview.activeProviders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">停用</span>
                  <span className="text-sm font-medium">{stats.overview.inactiveProviders}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">任务统计</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">已完成</span>
                  <span className="text-sm font-medium">{stats.overview.completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">待完成</span>
                  <span className="text-sm font-medium">{stats.overview.pendingTasks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}