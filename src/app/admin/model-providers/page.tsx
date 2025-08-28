'use client'

import { useEffect, useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline'

interface ModelProvider {
  id: string
  name: string
  description: string | null
  endpoint: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ProvidersResponse {
  providers: ModelProvider[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ModelProvidersPage() {
  const [providers, setProviders] = useState<ModelProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(null)
  const [newProvider, setNewProvider] = useState({
    name: '',
    description: '',
    endpoint: '',
    apiKey: ''
  })
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    endpoint: '',
    apiKey: ''
  })

  useEffect(() => {
    fetchProviders()
  }, [pagination.page, search, statusFilter])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'ALL' && { isActive: statusFilter === 'ACTIVE' ? 'true' : 'false' })
      })

      const response = await fetch(`/api/admin/model-providers?${params}`)
      if (response.ok) {
        const data: ProvidersResponse = await response.json()
        setProviders(data.providers)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProvider = async () => {
    try {
      const response = await fetch('/api/admin/model-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProvider)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewProvider({ name: '', description: '', endpoint: '', apiKey: '' })
        await fetchProviders()
      } else {
        const error = await response.json()
        alert(`创建失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to create provider:', error)
      alert('创建模型提供商失败')
    }
  }

  const handleDeleteProvider = async (providerId: string, providerName: string) => {
    if (!confirm(`确定要删除模型提供商 ${providerName} 吗？此操作不可撤销。`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/model-providers/${providerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProviders()
      } else {
        const error = await response.json()
        alert(`删除失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete provider:', error)
      alert('删除模型提供商失败')
    }
  }

  const handleToggleStatus = async (providerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/model-providers/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        await fetchProviders()
      } else {
        const error = await response.json()
        alert(`更新失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update provider status:', error)
      alert('更新模型提供商状态失败')
    }
  }

  const handleEditProvider = (provider: ModelProvider) => {
    setEditingProvider(provider)
    setEditForm({
      name: provider.name,
      description: provider.description || '',
      endpoint: provider.endpoint,
      apiKey: '' // 安全起见，不显示现有API密钥
    })
  }

  const handleUpdateProvider = async () => {
    if (!editingProvider) return

    try {
      const updateData: any = {
        name: editForm.name,
        description: editForm.description || null,
        endpoint: editForm.endpoint
      }
      
      // 只有在输入了新API密钥时才更新
      if (editForm.apiKey.trim()) {
        updateData.apiKey = editForm.apiKey
      }

      const response = await fetch(`/api/admin/model-providers/${editingProvider.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setEditingProvider(null)
        setEditForm({ name: '', description: '', endpoint: '', apiKey: '' })
        await fetchProviders()
      } else {
        const error = await response.json()
        alert(`更新失败: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update provider:', error)
      alert('更新模型提供商失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">模型提供商管理</h1>
          <p className="text-gray-600 mt-1">管理系统AI模型提供商配置</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>添加提供商</span>
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
                placeholder="搜索提供商名称或端点..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">所有状态</option>
            <option value="ACTIVE">活跃</option>
            <option value="INACTIVE">停用</option>
          </select>
        </div>
      </div>

      {/* 提供商列表 */}
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
                      提供商
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      端点
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {provider.name}
                          </div>
                          {provider.description && (
                            <div className="text-sm text-gray-500">{provider.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {provider.endpoint}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(provider.id, provider.isActive)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            provider.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {provider.isActive ? '活跃' : '停用'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEditProvider(provider)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteProvider(provider.id, provider.name)}
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

      {/* 创建提供商模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加模型提供商</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">名称</label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：OpenAI GPT-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">描述</label>
                <input
                  type="text"
                  value={newProvider.description}
                  onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="可选描述..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API端点</label>
                <input
                  type="url"
                  value={newProvider.endpoint}
                  onChange={(e) => setNewProvider({ ...newProvider, endpoint: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API密钥</label>
                <input
                  type="password"
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="sk-..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleCreateProvider}
                disabled={!newProvider.name || !newProvider.endpoint || !newProvider.apiKey}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑提供商模态框 */}
      {editingProvider && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">编辑模型提供商</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">名称</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如：OpenAI GPT-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">描述</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="可选描述..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API端点</label>
                <input
                  type="url"
                  value={editForm.endpoint}
                  onChange={(e) => setEditForm({ ...editForm, endpoint: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API密钥</label>
                <input
                  type="password"
                  value={editForm.apiKey}
                  onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="留空保持不变，或输入新密钥..."
                />
                <p className="text-xs text-gray-500 mt-1">出于安全考虑，不显示现有密钥</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingProvider(null)
                  setEditForm({ name: '', description: '', endpoint: '', apiKey: '' })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleUpdateProvider}
                disabled={!editForm.name || !editForm.endpoint}
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