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
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-modern">
              <CogIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold gradient-text">模型设置</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500 group-hover:text-gray-700 group-hover:scale-110 transition-all" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow bg-white/95 backdrop-blur-sm">
          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative mb-4 animate-slide-up" role="alert">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                <strong className="font-semibold">出错了: </strong>
                <span className="block sm:inline">{globalError}</span>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-tech animate-pulse-glow mb-4">
                <ArrowPathIcon className="animate-spin h-8 w-8 text-white" />
              </div>
              <span className="text-gray-600 font-medium">加载中...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {models.map((model) => {
                const status = testStatus[model.id]?.status || 'idle'
                const message = testStatus[model.id]?.message

                return (
                  <div key={model.id} className="card-modern rounded-xl p-5 hover:shadow-tech transition-all duration-300 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{model.name}</h3>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={model.isActive}
                          onChange={(e) => toggleModelStatus(model.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="relative w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        <span className="ms-3 text-sm font-medium text-gray-700">启用</span>
                      </label>
                    </div>
                    
                    {model.description && (
                      <p className="text-sm text-gray-600 mb-4">{model.description}</p>
                    )}

                    {editingModel === model.id ? (
                      <div className="space-y-4">
                        <input
                          type="password"
                          value={editForm.apiKey || ''}
                          onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                          placeholder="输入您的 API Key"
                          className="input-modern w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        <div className="flex justify-end space-x-3">
                          <button 
                            onClick={handleCancel} 
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200"
                          >
                            取消
                          </button>
                          <button 
                            onClick={handleSave} 
                            disabled={!editForm.apiKey} 
                            className="btn-modern px-6 py-2 text-sm font-medium disabled:opacity-50"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          API Key: 
                          <span className={`ml-1 font-medium ${model.apiKey ? 'text-green-600' : 'text-red-600'}`}>
                            {model.apiKey ? '已配置' : '未配置'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {model.apiKey && (
                            <button 
                              onClick={() => handleTestConnection(model.id)} 
                              disabled={status === 'testing'} 
                              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200"
                            >
                              {status === 'testing' && <ArrowPathIcon className="animate-spin w-4 h-4" />}
                              {status === 'success' && <CheckIcon className="w-4 h-4 text-green-500" />}
                              {status === 'error' && <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />}
                              <span>测试连接</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(model)} 
                            className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-all duration-200"
                          >
                            配置
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {message && (
                      <div className={`mt-3 p-3 rounded-xl text-sm ${
                        status === 'success' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : status === 'error' 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-gray-50 text-gray-600'
                      }`}>
                        {message}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/50 p-6 bg-gradient-to-r from-gray-50 to-primary-50/30 backdrop-blur-sm sticky bottom-0">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-600">
              💡 提示：配置并启用模型后，您就可以在 AI 助手中选择并使用它了。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
