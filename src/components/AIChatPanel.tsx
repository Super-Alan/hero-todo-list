'use client'

import React, { useState, useRef, useEffect } from 'react'
import { XMarkIcon, PaperAirplaneIcon, SparklesIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useModelProvider } from '@/contexts/ModelProviderContext'
import { ChatMessage, SuggestedTask, StreamChunk } from '@/types/modelProvider'
import { CreateTaskInput } from '@/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AIChatPanelProps {
  isOpen: boolean
  onClose: () => void
  initialInput?: string
  onTasksGenerated: (tasks: CreateTaskInput[]) => void
  isMobile?: boolean
}

export default function AIChatPanel({ 
  isOpen, 
  onClose, 
  initialInput = '', 
  onTasksGenerated,
  isMobile = false
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState(initialInput)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([])
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [panelWidth, setPanelWidth] = useState(() => {
    // Load saved width from localStorage or use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiChatPanelWidth')
      return saved ? parseInt(saved, 10) : 480
    }
    return 480
  })
  const [isResizing, setIsResizing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const modelSelectorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  
  const { selectedModel, availableModels, selectModel, streamChat, isLoading } = useModelProvider()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (initialInput && isOpen && initialInput.trim()) {
      setInputValue(initialInput)
      // 自动发送任务分析请求
      handleAutoAnalysis(initialInput)
    }
  }, [initialInput, isOpen])

  // Close model selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false)
      }
    }

    if (showModelSelector) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModelSelector])

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = window.innerWidth - e.clientX
      const minWidth = 320 // Minimum width
      const maxWidth = Math.min(800, window.innerWidth * 0.6) // Maximum 60% of screen width
      
      const finalWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setPanelWidth(finalWidth)
      // Save to localStorage
      localStorage.setItem('aiChatPanelWidth', finalWidth.toString())
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleAutoAnalysis = async (taskInput: string) => {
    if (!selectedModel) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: taskInput.trim(),
      timestamp: new Date()
    }

    setMessages([userMessage])
    setIsAnalyzing(true)

    // Create assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      thinking: ''
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      const streamGenerator = streamChat(taskInput, {
        systemPrompt: `你是一个专业的任务管理助手。用户刚刚输入了一个任务，但是任务的质量评分较低（低于70分）。请根据SMART原则和"学霸"任务拆分原则，帮助用户优化这个任务。

**SMART 原则:**
- **S (Specific - 具体性)**: 任务是否足够具体？
- **M (Measurable - 可衡量性)**: 任务的完成度是否可以衡量？
- **A (Achievable - 可实现性)**: 这个任务在当前资源和时间下是否可以完成？
- **R (Relevant - 相关性)**: 这个任务是否与长期目标相关？
- **T (Time-bound - 时限性)**: 任务是否有明确的截止日期？

**"学霸"原则:**
- **任务拆解**: 如果任务比较复杂，是否可以分解成几个更小、更容易执行的步骤？
- **优先级**: 这个任务的重要程度如何？

请分析用户的任务，指出可以改进的地方，并提供1-2个优化后的任务版本。语气要友好、鼓励，像一个亲切的学长学姐。`,
        temperature: 0.7,
        maxTokens: 2000,
        enableThinking: true
      })

      for await (const chunk of streamGenerator) {
        if (chunk.type === 'thinking') {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, thinking: (msg.thinking || '') + chunk.content }
              : msg
          ))
        } else if (chunk.type === 'content') {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: msg.content + chunk.content }
              : msg
          ))
        } else if (chunk.type === 'done') {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          ))
          break
        } else if (chunk.type === 'error') {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: `错误: ${chunk.content}`, isStreaming: false }
              : msg
          ))
          break
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: '抱歉，处理您的请求时出现错误。请稍后重试。', isStreaming: false }
          : msg
      ))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isAnalyzing || !selectedModel) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsAnalyzing(true)
    
    const currentInput = inputValue.trim()
    setInputValue('')

    // Create assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      thinking: ''
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      const streamGenerator = streamChat(currentInput, {
        systemPrompt: `你是一个专业的任务管理助手。请帮助用户分析和分解任务，提供具体可执行的建议。

请以友好、专业的语气回复用户，并在适当时候提供具体的任务分解建议。

如果用户描述了一个复杂的目标或项目，请帮助他们将其分解为具体的、可执行的任务步骤。`,
        temperature: 0.7,
        maxTokens: 2000,
        enableThinking: true
      })

      for await (const chunk of streamGenerator) {
        if (chunk.type === 'thinking') {
          // Update thinking content
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, thinking: (msg.thinking || '') + chunk.content }
              : msg
          ))
        } else if (chunk.type === 'content') {
          // Update main content
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: msg.content + chunk.content }
              : msg
          ))
        } else if (chunk.type === 'done') {
          // Mark as complete
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, isStreaming: false }
              : msg
          ))
          break
        } else if (chunk.type === 'error') {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: `错误: ${chunk.content}`, isStreaming: false }
              : msg
          ))
          break
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: '抱歉，处理您的请求时出现错误。请稍后重试。', isStreaming: false }
          : msg
      ))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleConfirmTasks = () => {
    const tasks: CreateTaskInput[] = suggestedTasks.map(task => ({
      title: task.title,
      description: task.description,
      priority: task.priority as any,
      tagIds: task.tags || [],
      dueDate: task.dueDate,
    }))
    
    onTasksGenerated(tasks)
    onClose()
  }

  const handleEditTask = (taskId: string, field: keyof SuggestedTask, value: any) => {
    setSuggestedTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, [field]: value } : task
      )
    )
  }

  if (!isOpen) return null

  return (
    <div 
      ref={panelRef}
      className={`
        ${isMobile ? 'fixed inset-0 z-50 bg-white' : 'fixed right-0 top-0 h-full bg-white border-l border-gray-200 shadow-xl'}
        flex flex-col
      `}
      style={!isMobile ? { width: panelWidth } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">AI 助手</h2>
        </div>
        <div className="flex items-center space-x-2">
          {/* Model Selector */}
          <div className="relative" ref={modelSelectorRef}>
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center space-x-2 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  selectedModel ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="font-medium">
                  {selectedModel ? selectedModel.name : '选择模型'}
                </span>
              </div>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${
                showModelSelector ? 'rotate-180' : ''
              }`} />
            </button>
            
            {showModelSelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-gray-500">加载模型中...</div>
                ) : availableModels.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">暂无可用模型</div>
                ) : (
                  availableModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        selectModel(model)
                        setShowModelSelector(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                        selectedModel?.id === model.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        selectedModel?.id === model.id ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <div className="font-medium">{model.name}</div>
                        {model.description && (
                          <div className="text-xs text-gray-500">{model.description}</div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Resize handle for desktop */}
        {!isMobile && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
            onMouseDown={handleResizeStart}
          />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <SparklesIcon className="w-8 h-8 lg:w-12 lg:h-12 text-gray-300 mx-auto mb-3 lg:mb-4" />
            <p className="text-sm">描述您的目标，我来帮您分解任务</p>
          </div>
        )}
        
        {messages.map(message => (
          <div key={message.id} className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}>
            <div
              className={`max-w-[85%] lg:max-w-[80%] px-3 lg:px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {/* Thinking content for assistant messages */}
              {message.role === 'assistant' && message.thinking && (
                <div className="mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-gray-300">
                  <div className="font-medium mb-1 flex items-center">
                    <SparklesIcon className="w-3 h-3 mr-1" />
                    思考过程
                  </div>
                  <div className="prose prose-xs max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.thinking}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              {/* Main content */}
              <div className="text-sm">
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-gray-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                )}
              </div>
              
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
                {message.isStreaming && ' • 正在输入...'}
              </p>
            </div>
          </div>
        ))}
        
        {isAnalyzing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 lg:px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">正在分析...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Tasks */}
      {suggestedTasks.length > 0 && (
        <div className="border-t border-gray-200 p-3 lg:p-4 max-h-48 lg:max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">建议的任务</h3>
            <button
              onClick={handleConfirmTasks}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
            >
              确认添加
            </button>
          </div>
          
          <div className="space-y-2">
            {suggestedTasks.map(task => (
              <div key={task.id} className="bg-gray-50 p-3 rounded-lg">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleEditTask(task.id, 'title', e.target.value)}
                  className="w-full font-medium text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                />
                {task.description && (
                  <textarea
                    value={task.description}
                    onChange={(e) => handleEditTask(task.id, 'description', e.target.value)}
                    className="w-full text-xs text-gray-600 mt-1 bg-transparent border-none resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                    rows={2}
                  />
                )}
                <div className="flex items-center justify-between mt-2">
                  <select
                    value={task.priority}
                    onChange={(e) => handleEditTask(task.id, 'priority', e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="LOW">低优先级</option>
                    <option value="MEDIUM">中优先级</option>
                    <option value="HIGH">高优先级</option>
                    <option value="URGENT">紧急</option>
                  </select>
                  {task.estimatedDuration && (
                    <span className="text-xs text-gray-500">{task.estimatedDuration}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3 lg:p-4">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="描述您的目标或任务..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isAnalyzing || !selectedModel}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            title={!selectedModel ? '请先选择一个模型' : ''}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
