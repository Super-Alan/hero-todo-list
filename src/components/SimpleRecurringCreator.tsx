'use client'

import React, { useState, useEffect } from 'react'
import { 
  CalendarDaysIcon, 
  ClockIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { RecurrenceRule, RecurrenceType, RecurringTaskInput, RecurrencePreview } from '@/types/recurring'

interface SimpleRecurringCreatorProps {
  value: RecurringTaskInput
  onChange: (value: RecurringTaskInput) => void
  baseDate?: Date
  className?: string
}

const SimpleRecurringCreator: React.FC<SimpleRecurringCreatorProps> = ({
  value,
  onChange,
  baseDate = new Date(),
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [preview, setPreview] = useState<RecurrencePreview | null>(null)

  // 生成周期性任务预览
  const generatePreview = (rule: RecurrenceRule, startDate: Date): RecurrencePreview => {
    const dates: Date[] = []
    const maxPreview = 5 // 最多显示5个预览日期
    let currentDate = new Date(startDate)
    
    for (let i = 0; i < maxPreview && (!rule.occurrences || i < rule.occurrences); i++) {
      if (rule.endDate && currentDate > rule.endDate) break
      
      dates.push(new Date(currentDate))
      
      // 计算下一个日期
      switch (rule.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + rule.interval)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (rule.interval * 7))
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + rule.interval)
          break
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + rule.interval)
          break
      }
    }

    let description = ''
    switch (rule.type) {
      case 'daily':
        description = rule.interval === 1 ? '每天' : `每${rule.interval}天`
        break
      case 'weekly':
        description = rule.interval === 1 ? '每周' : `每${rule.interval}周`
        break
      case 'monthly':
        description = rule.interval === 1 ? '每月' : `每${rule.interval}个月`
        break
      case 'yearly':
        description = rule.interval === 1 ? '每年' : `每${rule.interval}年`
        break
    }

    return {
      dates,
      description,
      count: rule.occurrences || (rule.endDate ? dates.length : Infinity)
    }
  }

  // 更新预览
  useEffect(() => {
    if (value.isRecurring && value.recurringRule) {
      const newPreview = generatePreview(value.recurringRule, baseDate)
      setPreview(newPreview)
    } else {
      setPreview(null)
    }
  }, [value, baseDate])

  const handleRecurrenceToggle = (enabled: boolean) => {
    if (enabled) {
      // 启用周期性任务，设置默认规则
      const defaultRule: RecurrenceRule = {
        type: 'weekly',
        interval: 1
      }
      onChange({
        isRecurring: true,
        recurringRule: defaultRule
      })
    } else {
      // 禁用周期性任务
      onChange({
        isRecurring: false,
        recurringRule: undefined
      })
    }
  }

  const handleRuleChange = (updates: Partial<RecurrenceRule>) => {
    if (!value.recurringRule) return
    
    const newRule = { ...value.recurringRule, ...updates }
    onChange({
      ...value,
      recurringRule: newRule
    })
  }

  const quickPresets = [
    { label: '每天', rule: { type: 'daily' as RecurrenceType, interval: 1 } },
    { label: '每周', rule: { type: 'weekly' as RecurrenceType, interval: 1 } },
    { label: '每月', rule: { type: 'monthly' as RecurrenceType, interval: 1 } },
    { label: '工作日', rule: { type: 'weekly' as RecurrenceType, interval: 1, daysOfWeek: [1, 2, 3, 4, 5] } }
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 周期性任务开关 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ArrowPathIcon className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">周期性任务</span>
        </div>
        <button
          type="button"
          onClick={() => handleRecurrenceToggle(!value.isRecurring)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value.isRecurring ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value.isRecurring ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 周期性配置 */}
      {value.isRecurring && value.recurringRule && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          {/* 快速预设 */}
          <div className="grid grid-cols-2 gap-2">
            {quickPresets.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleRuleChange(preset.rule)}
                className={`p-2 text-sm rounded-lg border transition-colors ${
                  JSON.stringify(preset.rule) === JSON.stringify({
                    type: value.recurringRule?.type,
                    interval: value.recurringRule?.interval,
                    daysOfWeek: value.recurringRule?.daysOfWeek
                  })
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 高级选项 */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <span>高级设置</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-blue-200">
              {/* 重复类型和间隔 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">重复类型</label>
                  <select
                    value={value.recurringRule.type}
                    onChange={(e) => handleRuleChange({ type: e.target.value as RecurrenceType })}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="daily">每天</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                    <option value="yearly">每年</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">间隔</label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={value.recurringRule.interval}
                    onChange={(e) => handleRuleChange({ interval: parseInt(e.target.value) || 1 })}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                  />
                </div>
              </div>

              {/* 结束条件 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">重复次数</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="无限制"
                    value={value.recurringRule.occurrences || ''}
                    onChange={(e) => handleRuleChange({ 
                      occurrences: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={value.recurringRule.endDate ? value.recurringRule.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleRuleChange({ 
                      endDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                    className="w-full text-sm border border-gray-300 rounded-md px-2 py-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 预览 */}
          {preview && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">预览：{preview.description}</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                {preview.dates.slice(0, 3).map((date, index) => (
                  <div key={index}>
                    {date.toLocaleDateString('zh-CN', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </div>
                ))}
                {preview.dates.length > 3 && (
                  <div className="text-gray-500">...等 {preview.count === Infinity ? '无限' : preview.count} 次</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SimpleRecurringCreator