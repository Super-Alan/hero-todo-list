'use client'

import React, { useState, useEffect } from 'react'
import { CogIcon, CheckIcon, XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useModelProvider } from '@/contexts/ModelProviderContext'

interface ModelProvider {
  id: string
  name: string
  description?: string
  endpoint: string
  apiKey: string
  isActive: boolean
}

interface ModelSettingsProps {
  isOpen: boolean
  onClose: () => void
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export default function ModelSettings({ isOpen, onClose }: ModelSettingsProps) {
  const [models, setModels] = useState<ModelProvider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ModelProvider>>({})
  const [testStatus, setTestStatus] = useState<Record<string, { status: TestStatus; message?: string }>>({}) 
  const [globalError, setGlobalError] = useState<string | null>(null)

  const { refreshModels } = useModelProvider()

  useEffect(() => {
    if (isOpen) {
      fetchModels()
      setGlobalError(null)
      setTestStatus({})
    }
  }, [isOpen])

  const fetchModels = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/models')
      if (!response.ok) throw new Error('Failed to fetch models')
      const data = await response.json()
      setModels(data)
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (model: ModelProvider) => {
    setEditingModel(model.id)
    setEditForm({ ...model, apiKey: '' })
    setGlobalError(null)
    setTestStatus(prev => ({ ...prev, [model.id]: { status: 'idle' } }))
  }

  const handleSave = async () => {
    if (!editingModel || !editForm.apiKey) return
    setGlobalError(null)

    try {
      const response = await fetch(`/api/models/${editingModel}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: editForm.apiKey, isActive: editForm.isActive }),
      })

      if (response.ok) {
        await fetchModels()
        await refreshModels()
        const savedModelId = editingModel
        setEditingModel(null)
        setEditForm({})
        // Automatically test connection on successful save
        await handleTestConnection(savedModelId)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update model')
      }
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'An unknown error occurred')
    }
  }

  const handleCancel = () => {
    setEditingModel(null)
    setEditForm({})
    setGlobalError(null)
  }

  const toggleModelStatus = async (modelId: string, isActive: boolean) => {
    setGlobalError(null)
    try {
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        await fetchModels()
        await refreshModels()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle model status')
      }
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'An unknown error occurred')
    }
  }

  const handleTestConnection = async (modelId: string) => {
    setTestStatus(prev => ({ ...prev, [modelId]: { status: 'testing' } }))
    setGlobalError(null)

    try {
      const response = await fetch(`/api/models/${modelId}/test`, { method: 'POST' })
      const data = await response.json()

      if (response.ok && data.success) {
        setTestStatus(prev => ({ ...prev, [modelId]: { status: 'success', message: `成功！响应时间: ${data.testResult.responseTime}` } }))
      } else {
        throw new Error(data.error || 'Test failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setTestStatus(prev => ({ ...prev, [modelId]: { status: 'error', message: errorMessage } }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <CogIcon className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">模型设置</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {globalError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">
              <strong className="font-bold">出错了: </strong>
              <span className="block sm:inline">{globalError}</span>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="animate-spin h-8 w-8 text-blue-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {models.map((model) => {
                const status = testStatus[model.id]?.status || 'idle'
                const message = testStatus[model.id]?.message

                return (
                  <div key={model.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{model.name}</h3>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={model.isActive}
                          onChange={(e) => toggleModelStatus(model.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ms-3 text-sm font-medium text-gray-700">启用</span>
                      </label>
                    </div>
                    {model.description && <p className="text-sm text-gray-600 mt-1 mb-3">{model.description}</p>}

                    {editingModel === model.id ? (
                      <div className="space-y-3">
                        <input
                          type="password"
                          value={editForm.apiKey || ''}
                          onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                          placeholder="输入您的 API Key"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end space-x-2">
                          <button onClick={handleCancel} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">取消</button>
                          <button onClick={handleSave} disabled={!editForm.apiKey} className="px-4 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:bg-gray-300">保存</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">API Key: {model.apiKey ? '已配置' : '未配置'}</div>
                        <div className="flex items-center space-x-2">
                          {model.apiKey && (
                            <button onClick={() => handleTestConnection(model.id)} disabled={status === 'testing'} className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center">
                              {status === 'testing' && <ArrowPathIcon className="animate-spin w-4 h-4 mr-1" />}
                              {status === 'success' && <CheckIcon className="w-4 h-4 mr-1 text-green-500" />}
                              {status === 'error' && <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-red-500" />}
                              测试连接
                            </button>
                          )}
                          <button onClick={() => handleEdit(model)} className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800">配置</button>
                        </div>
                      </div>
                    )}
                    {message && (
                      <p className={`text-xs mt-2 ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                        {message}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 mt-auto">
          <p className="text-sm text-gray-600">💡 提示：配置并启用模型后，您就可以在 AI 助手中选择并使用它了。</p>
        </div>
      </div>
    </div>
  )
}
