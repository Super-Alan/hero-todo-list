'use client'

import React from 'react'
import { Repeat, Clock, Calendar, AlertCircle } from 'lucide-react'
import { RecurringTaskUtils } from '@/lib/recurringTasks'

interface RecurringTaskBadgeProps {
  isRecurring?: boolean
  recurringRule?: string | null
  originalTaskId?: string | null
  className?: string
  showDetails?: boolean
}

const RecurringTaskBadge: React.FC<RecurringTaskBadgeProps> = ({
  isRecurring = false,
  recurringRule,
  originalTaskId,
  className = '',
  showDetails = true
}) => {
  // 如果既不是周期性任务，也不是生成的实例，则不显示任何标识
  if (!isRecurring && !originalTaskId) {
    return null
  }

  // 解析周期规则
  let rule = null
  let ruleDescription = ''
  
  if (recurringRule) {
    try {
      // 确保 recurringRule 是字符串
      const ruleString = typeof recurringRule === 'string' ? recurringRule : JSON.stringify(recurringRule)
      rule = RecurringTaskUtils.ruleFromJson(ruleString)
      if (rule) {
        const desc = RecurringTaskUtils.formatRuleDescription(rule)
        // 确保返回的是字符串
        ruleDescription = typeof desc === 'string' ? desc : JSON.stringify(desc)
      }
    } catch (error) {
      console.warn('解析周期规则失败:', error, recurringRule)
    }
  }

  // 原始周期性任务
  if (isRecurring && !originalTaskId) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
          <Repeat className="w-3 h-3" />
          <span className="font-medium">周期任务</span>
        </div>
        {showDetails && ruleDescription && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs border border-gray-200">
            <Clock className="w-3 h-3" />
            <span>{ruleDescription}</span>
          </div>
        )}
      </div>
    )
  }

  // 生成的周期任务实例
  if (originalTaskId) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
          <Calendar className="w-3 h-3" />
          <span className="font-medium">定期</span>
        </div>
        {showDetails && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-500 rounded-full text-xs border border-gray-200">
            <span>来自周期任务</span>
          </div>
        )}
      </div>
    )
  }

  // 异常情况：既是周期性任务又有原始任务ID
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs border border-yellow-200">
        <AlertCircle className="w-3 h-3" />
        <span className="font-medium">异常状态</span>
      </div>
    </div>
  )
}

export default RecurringTaskBadge