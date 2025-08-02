'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ModelProviderContextType, AvailableModel, AITaskAnalysis, StreamChunk, StreamingChatOptions } from '@/types/modelProvider'

const ModelProviderContext = createContext<ModelProviderContextType | undefined>(undefined)

interface ModelProviderProviderProps {
  children: React.ReactNode
}

export function ModelProviderProvider({ children }: ModelProviderProviderProps) {
  const { data: session, status } = useSession()
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([])
  const [selectedModel, setSelectedModel] = useState<AvailableModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshModels = useCallback(async () => {
    // 只有在用户已登录时才获取模型
    if (status !== 'authenticated' || !session) {
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/models/available')
      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }
      
      const data = await response.json()
      setAvailableModels(data.models || [])
      
      // Auto-select first model if none selected
      setSelectedModel(prev => {
        if (!prev && data.models?.length > 0) {
          return data.models[0]
        }
        return prev
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [session, status])

  const selectModel = useCallback((model: AvailableModel) => {
    setSelectedModel(model)
    localStorage.setItem('selectedModel', JSON.stringify(model))
  }, [])

  const analyzeTask = useCallback(async (input: string): Promise<AITaskAnalysis> => {
    if (!selectedModel) {
      throw new Error('No model selected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          modelId: selectedModel.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze task')
      }

      const analysis = await response.json()
      return analysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [selectedModel])

  const streamChat = useCallback(async function* (input: string, options?: StreamingChatOptions): AsyncGenerator<StreamChunk, void, unknown> {
    if (!selectedModel) {
      throw new Error('No model selected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          modelId: selectedModel.id,
          systemPrompt: options?.systemPrompt,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
          enableThinking: options?.enableThinking,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start chat stream')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                return
              }
              
              try {
                const chunk: StreamChunk = JSON.parse(data)
                yield chunk
                
                if (chunk.type === 'done' || chunk.type === 'error') {
                  return
                }
              } catch (e) {
                // Ignore parsing errors for malformed chunks
                console.warn('Failed to parse chunk:', data)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Stream failed'
      setError(errorMessage)
      yield {
        type: 'error',
        content: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedModel])

  // Load saved model selection on mount and refresh models when authenticated
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel')
    if (savedModel) {
      try {
        setSelectedModel(JSON.parse(savedModel))
      } catch {
        // Ignore invalid saved data
      }
    }
    
    // 只有在用户已认证时才刷新模型列表
    if (status === 'authenticated') {
      refreshModels()
    }
  }, [refreshModels, status])

  const value: ModelProviderContextType = {
    availableModels,
    selectedModel,
    isLoading,
    error,
    selectModel,
    refreshModels,
    analyzeTask,
    streamChat,
  }

  return (
    <ModelProviderContext.Provider value={value}>
      {children}
    </ModelProviderContext.Provider>
  )
}

export function useModelProvider() {
  const context = useContext(ModelProviderContext)
  if (context === undefined) {
    throw new Error('useModelProvider must be used within a ModelProviderProvider')
  }
  return context
}
