'use client'

import { useEffect, useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string | null
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
  _count: {
    tasks: number
    tags: number
  }
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, search, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(roleFilter !== 'ALL' && { role: roleFilter })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data: UsersResponse = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`确定要删除用户 ${userEmail} 吗？此操作不可撤销。`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchUsers() // 重新加载数据
      } else {
        const error = await response.json()
        alert(`删除失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('删除用户失败')
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })

      if (response.ok) {
        await fetchUsers() // 重新加载数据
      } else {
        const error = await response.json()
        alert(`更新失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update user role:', error)
      alert('更新用户角色失败')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name || '',
      email: user.email,
      password: ''
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const updateData: any = {
        name: editForm.name || null,
        email: editForm.email
      }
      
      // 只有在输入了新密码时才更新密码
      if (editForm.password.trim()) {
        updateData.password = editForm.password
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingUser(null)
        setEditForm({ name: '', email: '', password: '' })
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(`更新失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('更新用户信息失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-1">管理系统用户和权限</p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          onClick={() => {/* TODO: 实现创建用户模态框 */}}
        >
          <PlusIcon className="h-4 w-4" />
          <span>添加用户</span>
        </button>
      </div>

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'USER' | 'ADMIN')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">所有角色</option>
            <option value="USER">普通用户</option>
            <option value="ADMIN">管理员</option>
          </select>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      数据统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || '未设置姓名'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'USER' | 'ADMIN')}
                          className={`text-sm rounded-full px-3 py-1 border-0 ${
                            user.role === 'ADMIN' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="USER">普通用户</option>
                          <option value="ADMIN">管理员</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>任务: {user._count.tasks}</div>
                        <div>标签: {user._count.tags}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEditUser(user)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      显示第 <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> 到{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      条，共 <span className="font-medium">{pagination.total}</span> 条结果
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        上一页
                      </button>
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === i + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 编辑用户模态框 */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">编辑用户信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">姓名</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入用户姓名..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入邮箱地址..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">新密码</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="留空保持不变，或输入新密码..."
                />
                <p className="text-xs text-gray-500 mt-1">留空则不修改密码</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">当前角色</label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                  editingUser.role === 'ADMIN' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {editingUser.role === 'ADMIN' ? '管理员' : '普通用户'}
                </div>
                <p className="text-xs text-gray-500 mt-1">角色修改请在列表中直接切换</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                  setEditForm({ name: '', email: '', password: '' })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={!editForm.email.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}