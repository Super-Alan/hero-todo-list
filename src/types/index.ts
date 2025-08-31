import { Task, Tag, User, Priority, TaskStatus } from '@prisma/client'

// 基础类型扩展
export interface TaskWithDetails extends Task {
  subTasks?: Task[]
  tags?: Tag[]
  parentTask?: Task | null
  user?: User
}

export interface TagWithDetails extends Tag {
  tasks?: TaskWithDetails[]
  user?: User
}

// 表单类型
export interface CreateTaskInput {
  title: string
  description?: string
  dueDate?: Date
  dueTime?: Date
  timeDescription?: string // 时间描述，如"明天下午3点"
  priority?: Priority
  parentTaskId?: string
  tagIds?: string[]
  isRecurring?: boolean
  recurringRule?: string // JSON格式的周期规则
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string
  isCompleted?: boolean
  status?: TaskStatus
  sortOrder?: number
}

export interface CreateTagInput {
  name: string
  color?: string
}

export interface UpdateTagInput extends Partial<CreateTagInput> {
  id: string
}

// 视图类型
export interface TaskFilter {
  tagIds?: string[]
  priority?: Priority
  status?: TaskStatus
  dueDate?: Date
  isCompleted?: boolean
  search?: string
}

export interface TaskSort {
  field: 'title' | 'dueDate' | 'priority' | 'createdAt' | 'updatedAt'
  direction: 'asc' | 'desc'
}

// 自然语言解析结果
export interface ParsedTaskInput {
  title: string
  dueDate?: Date
  dueTime?: Date
  timeDescription?: string // 时间描述，如"明天下午3点"
  priority?: Priority
  tagNames?: string[]
  description?: string
}

// 统计数据
export interface TaskStats {
  total: number
  completed: number
  pending: number
  overdue: number
  today: number
  thisWeek: number
  thisMonth: number
}

// 导出 Prisma 类型
export { Priority, TaskStatus } 
export type { Task, Tag, User }  