// QuickAdd 功能相关类型定义

import { CreateTaskInput } from './index';

// QuickAdd 功能相关类型定义

export type QuickAddMode = 'auto' | 'fast' | 'ai'

export interface ParsedTask {
  title: string
  description?: string
  dueDate?: string
  priority: 'high' | 'medium' | 'low'
  tags: string[]
  estimatedTime?: number
  suggestions?: {
    shouldBreakDown: boolean
    subTasks?: string[]
    relatedTags?: string[]
  }
}

export interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    isLoading?: boolean
    taskCount?: number
    analysisStage?: string
  }
}

export interface GeneratedTask {
  id: string
  title: string
  description: string
  dueDate?: string
  priority: 'high' | 'medium' | 'low'
  tags: string[]
  estimatedDays: number
  phase: string
  phaseOrder: number
  dependencies?: string[]
  resources?: string[]
  subTasks?: string[]
}

export interface TaskPhase {
  id: string
  name: string
  description: string
  duration: string
  tasks: GeneratedTask[]
  order: number
}

export interface AIAnalysisResult {
  goal: string
  complexity: 'simple' | 'medium' | 'complex'
  estimatedDuration: string
  phases: TaskPhase[]
  totalTasks: number
  recommendations: string[]
}

export interface QuickAddState {
  mode: QuickAddMode
  isOpen: boolean
  input: string
  
  // 快速模式状态
  fastMode: {
    parsedTask: CreateTaskInput | null
    isCustomizing: boolean
    showSuggestions: boolean
  }
  
  // AI 模式状态
  aiMode: {
    conversation: Message[]
    isAnalyzing: boolean
    analysisResult: AIAnalysisResult | null
    editingTaskId: string | null
    selectedPhases: string[]
  }
  
  // 共享状态
  selectedTasks: (ParsedTask | GeneratedTask)[]
  isConfirming: boolean
  confirmationSettings: {
    targetView: string
    defaultTags: string[]
    enableReminders: boolean
  }
}

export interface ModeDetectionResult {
  suggestedMode: QuickAddMode
  confidence: number
  reasons: string[]
  triggers: string[]
}
