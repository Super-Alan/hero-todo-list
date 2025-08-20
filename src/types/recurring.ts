'use client'

// 周期性任务类型定义
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurrenceRule {
  type: RecurrenceType
  interval: number // 间隔数，例如每2天、每3周
  daysOfWeek?: number[] // 用于周复制，0=周日，1=周一，...，6=周六
  dayOfMonth?: number // 用于月复制，1-31
  monthOfYear?: number // 用于年复制，1-12
  endDate?: Date // 结束日期（可选）
  occurrences?: number // 重复次数（可选）
}

export interface RecurringTaskInput {
  isRecurring: boolean
  recurringRule?: RecurrenceRule
}

// 扩展现有的CreateTaskInput以支持周期性任务
export interface CreateTaskInputWithRecurring {
  title: string
  description?: string
  dueDate?: Date
  dueTime?: Date
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  parentTaskId?: string
  tagIds?: string[]
  isRecurring?: boolean
  recurringRule?: RecurrenceRule
}

// 周期性任务预览
export interface RecurrencePreview {
  dates: Date[]
  description: string
  count: number
}