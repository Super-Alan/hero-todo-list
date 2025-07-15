'use client'

import React from 'react'
import { QuickAddMode, ModeDetectionResult } from '@/types/quickAdd'

interface ModeSelectorProps {
  currentMode: QuickAddMode
  onModeChange: (mode: QuickAddMode) => void
  detectionResult?: ModeDetectionResult
  showRecommendation?: boolean
}

export default function ModeSelector({ 
  currentMode, 
  onModeChange, 
  detectionResult,
  showRecommendation = true 
}: ModeSelectorProps) {
  const modes = [
    {
      key: 'fast' as QuickAddMode,
      icon: '🎯',
      label: '快速添加',
      description: '单个任务，即时添加'
    },
    {
      key: 'ai' as QuickAddMode,
      icon: '🤖',
      label: 'AI 助手',
      description: '复杂目标，智能分解'
    },
    {
      key: 'auto' as QuickAddMode,
      icon: '🔄',
      label: '自动检测',
      description: '智能推荐最佳模式'
    }
  ]

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* 模式选择器 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex space-x-1">
          {modes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => onModeChange(mode.key)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${currentMode === mode.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }
              `}
            >
              <span className="text-base">{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* 模式指示器 */}
        <div className="text-xs text-gray-500">
          当前模式: {modes.find(m => m.key === currentMode)?.label}
        </div>
      </div>

      {/* 智能推荐提示 */}
      {showRecommendation && detectionResult && detectionResult.suggestedMode !== currentMode && (
        <div className="px-4 pb-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-amber-500 text-sm">💡</span>
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">
                  建议切换模式
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {getModeRecommendationText(detectionResult)}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => onModeChange(detectionResult.suggestedMode)}
                    className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded transition-colors"
                  >
                    切换到 {modes.find(m => m.key === detectionResult.suggestedMode)?.label}
                  </button>
                  <button className="text-xs text-amber-600 hover:text-amber-800">
                    不再提示
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模式说明 */}
      <div className="px-4 pb-3">
        <div className="text-xs text-gray-500">
          {modes.find(m => m.key === currentMode)?.description}
        </div>
      </div>
    </div>
  )
}

function getModeRecommendationText(result: ModeDetectionResult): string {
  const confidence = Math.round(result.confidence * 100)
  
  switch (result.suggestedMode) {
    case 'ai':
      return `检测到复杂目标，AI 模式可以帮你制定详细计划 (${confidence}% 匹配)`
    case 'fast':
      return `检测到简单任务，快速模式可以立即添加 (${confidence}% 匹配)`
    default:
      return '建议手动选择合适的模式'
  }
}
