'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Message, AIAnalysisResult } from '@/types/quickAdd'
import DeepSeekAPI, { AnalysisStage, stageMessages } from '@/services/deepseekApi'

interface AIModeProps {
  input: string
  conversation: Message[]
  isAnalyzing: boolean
  analysisResult: AIAnalysisResult | null
  selectedPhases: string[]
  onInputChange: (value: string) => void
  onConversationUpdate: (conversation: Message[]) => void
  onAnalysisStart: () => void
  onAnalysisComplete: (result: AIAnalysisResult | null) => void
  onPhaseToggle: (phaseId: string) => void
  onConfirm: () => void
}

export default function AIModeChat({
  input,
  conversation,
  isAnalyzing,
  analysisResult,
  selectedPhases,
  onInputChange,
  onConversationUpdate,
  onAnalysisStart,
  onAnalysisComplete,
  onPhaseToggle,
  onConfirm
}: AIModeProps) {
  const [currentInput, setCurrentInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, isAnalyzing])

  // 初始化对话
  useEffect(() => {
    if (conversation.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: '你好！我是你的 AI 任务助手 🤖\n\n我可以帮你将复杂的目标分解为具体可执行的任务清单。请告诉我：\n• 你想达成的目标\n• 可用的时间范围\n• 你的经验水平（可选）',
        timestamp: new Date()
      }
      onConversationUpdate([welcomeMessage])
    }
  }, [conversation.length, onConversationUpdate])

  // 初始化 DeepSeek API 客户端
  const deepseekApi = useRef(new DeepSeekAPI())
  
  const handleSendMessage = async () => {
    const messageContent = currentInput.trim() || input.trim()
    if (!messageContent) return

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    const updatedConversation = [...conversation, userMessage]
    onConversationUpdate(updatedConversation)
    setCurrentInput('')
    onInputChange('')

    // 开始 AI 分析
    onAnalysisStart()
    
    try {
      // 添加分析进度消息
      const handleStageChange = (stage: AnalysisStage) => {
        const stageMessage: Message = {
          id: `stage-${stage}`,
          type: 'system',
          content: stageMessages[stage],
          timestamp: new Date()
        }
        
        // 更新或添加阶段消息
        const stageMessageIndex = updatedConversation.findIndex(msg => 
          msg.id.startsWith('stage-')
        )
        
        if (stageMessageIndex >= 0) {
          const newConversation = [...updatedConversation]
          newConversation[stageMessageIndex] = stageMessage
          onConversationUpdate(newConversation)
        } else {
          onConversationUpdate([...updatedConversation, stageMessage])
        }
      }
      
      // 调用 DeepSeek API 分析目标
      const result = await deepseekApi.current.analyzeGoal(
        updatedConversation,
        handleStageChange
      )
      
      // 分析完成，更新结果
      onAnalysisComplete(result)
      
      // 添加 AI 回复消息
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: `我已经分析了你的目标，并创建了一个任务计划。\n\n这个计划包含 ${result.phases.length} 个阶段，总共 ${result.totalTasks} 个任务，预计需要 ${result.estimatedDuration}。\n\n你可以查看下方的任务清单，选择你想要添加的阶段和任务。`,
        timestamp: new Date()
      }
      
      // 移除进度消息，添加 AI 回复
      const finalConversation = updatedConversation.filter(msg => 
        !msg.id.startsWith('stage-')
      )
      
      onConversationUpdate([...finalConversation, aiMessage])
    } catch (error) {
      console.error('AI analysis failed:', error)
      
      // 添加错误消息
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: '很抱歉，分析过程中出现了错误。请稍后再试，或者尝试提供更详细的目标描述。',
        timestamp: new Date()
      }
      
      onConversationUpdate([...updatedConversation, errorMessage])
      onAnalysisComplete(null) // 重置分析状态
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getSelectedTaskCount = (): number => {
    if (!analysisResult) return 0
    
    if (selectedPhases.length === 0) {
      return analysisResult.totalTasks
    }
    
    return analysisResult.phases
      .filter(phase => selectedPhases.includes(phase.id))
      .reduce((total, phase) => total + phase.tasks.length, 0)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${getMessageStyle(message.type)}`}>
              {message.type === 'ai' && <span className="text-lg mr-2">🤖</span>}
              {message.type === 'system' && <span className="text-lg mr-2">⚙️</span>}
              
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* 分析结果展示 */}
        {analysisResult && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 {analysisResult.goal}
              </h3>
              <span className="text-sm text-gray-600">
                {analysisResult.estimatedDuration}
              </span>
            </div>

            <div className="space-y-3">
              {analysisResult.phases.map((phase) => (
                <div key={phase.id} className="bg-white rounded-lg border border-gray-200">
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedPhases.length === 0 || selectedPhases.includes(phase.id)}
                          onChange={() => onPhaseToggle(phase.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {phase.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {phase.description} • {phase.duration} • {phase.tasks.length} 个任务
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 任务预览 */}
                    <div className="mt-3 ml-6 space-y-1">
                      {phase.tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>•</span>
                          <span>{task.title}</span>
                          <span className="text-xs text-gray-400">({task.estimatedDays}天)</span>
                        </div>
                      ))}
                      {phase.tasks.length > 3 && (
                        <div className="text-xs text-gray-500 ml-2">
                          还有 {phase.tasks.length - 3} 个任务...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={onConfirm}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                ✅ 确认添加 ({getSelectedTaskCount()} 个任务)
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                ✏️ 编辑任务
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentInput || input}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={analysisResult ? "继续对话或提出修改建议..." : "描述你的目标，例如：我想在3个月内学会 React 开发"}
            disabled={isAnalyzing}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={isAnalyzing || (!currentInput.trim() && !input.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              '发送'
            )}
          </button>
        </div>
        
        {!analysisResult && (
          <div className="mt-2 text-xs text-gray-500">
            💡 提示：详细描述你的目标和时间安排，我能为你制定更精准的计划
          </div>
        )}
      </div>
    </div>
  )
}

function getMessageStyle(type: string): string {
  switch (type) {
    case 'user':
      return 'bg-blue-600 text-white'
    case 'ai':
      return 'bg-gray-100 text-gray-900'
    case 'system':
      return 'bg-yellow-50 text-yellow-800 border border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-900'
  }
}
