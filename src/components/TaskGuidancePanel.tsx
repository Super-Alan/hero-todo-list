'use client'

import React, { useState, useEffect } from 'react'
import { 
  LightBulbIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StudentTaskGuide, TaskExample, TaskGuideResult } from '@/lib/student-task-guide'
import Portal from './Portal'

interface TaskGuidancePanelProps {
  inputValue: string
  isVisible: boolean
  onClose: () => void
  onApplySuggestion: (suggestion: string) => void
  isMobile?: boolean
}

const TaskGuidancePanel: React.FC<TaskGuidancePanelProps> = ({
  inputValue,
  isVisible,
  onClose,
  onApplySuggestion,
  isMobile = false
}) => {
  const [guidance, setGuidance] = useState<TaskGuideResult | null>(null)
  const [activeTab, setActiveTab] = useState<'issues' | 'examples' | 'tips'>('issues')
  const [selectedExample, setSelectedExample] = useState<TaskExample | null>(null)

  useEffect(() => {
    if (inputValue.trim().length > 2) {
      const result = StudentTaskGuide.analyzeStudentTask(inputValue)
      setGuidance(result)
    } else {
      setGuidance(null)
    }
  }, [inputValue])

  if (!isVisible || !guidance) {
    return null
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🎉'
    if (score >= 60) return '🤔'
    return '🚨'
  }

  const handleApplyExample = (example: TaskExample) => {
    onApplySuggestion(example.improved)
    onClose()
  }

  const handleApplyQuickFix = (fix: string) => {
    // 提取修复建议中的实际文本，去掉说明部分
    const fixText = fix.split('：')[1] || fix
    onApplySuggestion(fixText)
    onClose()
  }

  return (
    <Portal>
      <div 
        className={`
          ${isMobile ? 'fixed inset-x-2 bottom-20' : 'absolute top-full left-0 right-0 mt-2'} 
          bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden
          animate-in slide-in-from-top-2 duration-200
        `}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(guidance.score)}`}>
            {getScoreEmoji(guidance.score)} 任务质量: {guidance.score}/100
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === 'issues' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
          问题分析 ({guidance.issues.length})
        </button>
        <button
          onClick={() => setActiveTab('examples')}
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === 'examples' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ClipboardDocumentListIcon className="w-4 h-4 inline mr-1" />
          参考示例 ({guidance.examples.length})
        </button>
        <button
          onClick={() => setActiveTab('tips')}
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            activeTab === 'tips' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <AcademicCapIcon className="w-4 h-4 inline mr-1" />
          学习技巧
        </button>
      </div>

      {/* Content */}
      <div className="p-3 max-h-64 overflow-y-auto">
        {activeTab === 'issues' && (
          <div className="space-y-3">
            {/* 问题列表 */}
            {guidance.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mr-1" />
                  发现的问题
                </h4>
                <ul className="space-y-1">
                  {guidance.issues.map((issue, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start">
                      <span className="text-red-400 mr-1">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 快速修复 */}
            {guidance.quickFixes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                  快速修复建议
                </h4>
                <div className="space-y-2">
                  {guidance.quickFixes.map((fix, index) => (
                    <button
                      key={index}
                      onClick={() => handleApplyQuickFix(fix)}
                      className="w-full text-left p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
                    >
                      <div className="text-xs text-green-700 flex items-center justify-between">
                        <span>{fix}</span>
                        <ArrowRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 改进建议 */}
            {guidance.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                  <LightBulbIcon className="w-4 h-4 text-blue-500 mr-1" />
                  改进建议
                </h4>
                <ul className="space-y-1">
                  {guidance.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start">
                      <span className="text-blue-400 mr-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-3">
              点击下面的示例，直接应用到你的任务中
            </p>
            {guidance.examples.map((example, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedExample(selectedExample?.original === example.original ? null : example)}
                  className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-2">
                    {/* 原始任务 */}
                    <div className="flex items-start space-x-2">
                      <span className="text-xs text-red-500 font-medium mt-0.5">原始:</span>
                      <span className="text-xs text-red-600 line-through">{example.original}</span>
                    </div>
                    
                    {/* 改进后任务 */}
                    <div className="flex items-start space-x-2">
                      <span className="text-xs text-green-500 font-medium mt-0.5">改进:</span>
                      <span className="text-xs text-green-700 font-medium">{example.improved}</span>
                    </div>
                    
                    {/* 说明 */}
                    {selectedExample?.original === example.original && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-600 mb-3">
                          <span className="font-medium text-gray-700">改进说明: </span>
                          {example.explanation}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApplyExample(example)
                          }}
                          className="w-full py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                        >
                          <span>应用这个示例</span>
                          <ArrowRightIcon className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-3">
              这些学习技巧可以帮助你更好地完成任务
            </p>
            {guidance.learningTips.map((tip, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {guidance.score < 60 && '💡 任务质量较低，建议参考示例进行优化'}
          {guidance.score >= 60 && guidance.score < 80 && '✨ 任务质量不错，可以进一步完善细节'}
          {guidance.score >= 80 && '🎉 任务质量很好！可以直接使用'}
        </p>
      </div>
      </div>
    </Portal>
  )
}

export default TaskGuidancePanel