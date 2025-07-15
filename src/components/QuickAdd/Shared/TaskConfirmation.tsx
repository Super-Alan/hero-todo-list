'use client'

import React, { useState } from 'react'
import { ParsedTask, GeneratedTask } from '@/types/quickAdd'

interface TaskConfirmationProps {
  tasks: (ParsedTask | GeneratedTask)[]
  settings: {
    targetView: string
    defaultTags: string[]
    enableReminders: boolean
  }
  onConfirm: (tasks: any[]) => void
  onBack: () => void
  onSettingsChange: (settings: any) => void
}

export default function TaskConfirmation({
  tasks,
  settings,
  onConfirm,
  onBack,
  onSettingsChange
}: TaskConfirmationProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>(
    tasks.map((_, index) => index.toString())
  )

  const handleTaskToggle = (taskIndex: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskIndex)
        ? prev.filter(id => id !== taskIndex)
        : [...prev, taskIndex]
    )
  }

  const handleSelectAll = () => {
    setSelectedTasks(tasks.map((_, index) => index.toString()))
  }

  const handleDeselectAll = () => {
    setSelectedTasks([])
  }

  const handleConfirm = () => {
    const selectedTaskObjects = tasks.filter((_, index) => 
      selectedTasks.includes(index.toString())
    )
    onConfirm(selectedTaskObjects)
  }

  const getTasksByPhase = () => {
    const phases: { [key: string]: (ParsedTask | GeneratedTask)[] } = {}
    
    tasks.forEach(task => {
      const phase = 'phase' in task ? task.phase : '单个任务'
      if (!phases[phase]) {
        phases[phase] = []
      }
      phases[phase].push(task)
    })
    
    return phases
  }

  const tasksByPhase = getTasksByPhase()
  const selectedCount = selectedTasks.length
  const totalCount = tasks.length

  return (
    <div className="flex flex-col h-full">
      {/* 头部统计 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            ✅ 确认添加任务
          </h3>
          <span className="text-sm text-gray-600">
            已选择 {selectedCount}/{totalCount} 个任务
          </span>
        </div>

        {/* 任务分布统计 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 mb-1">📊 任务分布</div>
            <div className="space-y-1">
              {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
                <div key={phase} className="flex justify-between">
                  <span className="text-gray-700">{phase}:</span>
                  <span className="font-medium">{phaseTasks.length}个</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 mb-1">⏱️ 时间预估</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-700">总计:</span>
                <span className="font-medium">{getTotalEstimatedDays()}天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">平均:</span>
                <span className="font-medium">{getAverageEstimatedDays()}天/任务</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 设置区域 */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">⚙️ 添加设置</h4>
        
        <div className="grid grid-cols-1 gap-4">
          {/* 目标视图 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              添加到视图
            </label>
            <select
              value={settings.targetView}
              onChange={(e) => onSettingsChange({ targetView: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">📋 所有任务</option>
              <option value="today">📅 今天</option>
              <option value="upcoming">📆 即将到来</option>
              <option value="thisweek">📊 本周</option>
            </select>
          </div>

          {/* 默认标签 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              默认标签
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {settings.defaultTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  #{tag}
                  <button
                    onClick={() => {
                      const newTags = settings.defaultTags.filter((_, i) => i !== index)
                      onSettingsChange({ defaultTags: newTags })
                    }}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="添加标签"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim()
                  if (value && !settings.defaultTags.includes(value)) {
                    onSettingsChange({ 
                      defaultTags: [...settings.defaultTags, value] 
                    })
                    ;(e.target as HTMLInputElement).value = ''
                  }
                }
              }}
            />
          </div>

          {/* 提醒设置 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.enableReminders}
                onChange={(e) => onSettingsChange({ enableReminders: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-700">🔔 启用任务提醒</span>
            </label>
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">📝 任务清单</h4>
          <div className="flex space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              全选
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              取消全选
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
            <div key={phase} className="bg-white rounded-lg border border-gray-200">
              <div className="p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                <h5 className="font-medium text-gray-900">{phase}</h5>
                <p className="text-xs text-gray-600 mt-1">
                  {phaseTasks.length} 个任务 • 预计 {phaseTasks.reduce((sum, task) => sum + (getTaskEstimatedDays(task) || 0), 0)} 天
                </p>
              </div>
              
              <div className="p-3 space-y-3">
                {phaseTasks.map((task, taskIndex) => {
                  const globalIndex = tasks.indexOf(task).toString()
                  const isSelected = selectedTasks.includes(globalIndex)
                  
                  return (
                    <div
                      key={globalIndex}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTaskToggle(globalIndex)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h6 className="font-medium text-gray-900 text-sm">
                          {task.title}
                        </h6>
                        
                        {task.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {task.dueDate && (
                            <span className="flex items-center space-x-1">
                              <span>📅</span>
                              <span>{formatDate(task.dueDate)}</span>
                            </span>
                          )}
                          
                          <span className="flex items-center space-x-1">
                            <span>⭐</span>
                            <span className={`px-1 py-0.5 rounded ${getPriorityStyle(task.priority)}`}>
                              {getPriorityText(task.priority)}
                            </span>
                          </span>
                          
                          {getTaskEstimatedDays(task) && (
                            <span className="flex items-center space-x-1">
                              <span>⏱️</span>
                              <span>{getTaskEstimatedDays(task)}天</span>
                            </span>
                          )}
                        </div>
                        
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ⬅️ 返回编辑
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            ✅ 确认添加 ({selectedCount} 个任务)
          </button>
        </div>
      </div>
    </div>
  )

  function getTotalEstimatedDays(): number {
    return tasks.reduce((sum, task) => sum + (getTaskEstimatedDays(task) || 1), 0)
  }

  function getAverageEstimatedDays(): number {
    const total = getTotalEstimatedDays()
    return Math.round((total / tasks.length) * 10) / 10
  }

  function getTaskEstimatedDays(task: ParsedTask | GeneratedTask): number {
    if ('estimatedDays' in task) {
      return task.estimatedDays
    }
    if ('estimatedTime' in task) {
      return task.estimatedTime || 1
    }
    return 1
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天'
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

function getPriorityStyle(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700'
    case 'low':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-yellow-100 text-yellow-700'
  }
}

function getPriorityText(priority: string): string {
  switch (priority) {
    case 'high':
      return '高'
    case 'low':
      return '低'
    default:
      return '中'
  }
}
