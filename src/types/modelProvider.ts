// Model Provider Types (系统级别配置)
export interface ModelProvider {
  id: string
  name: string
  description?: string
  endpoint: string
  apiKey: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // userId保留用于迁移，将来会移除
  userId?: string
}

export interface CreateModelProviderInput {
  name: string
  description?: string
  endpoint: string
  apiKey: string
}

export interface UpdateModelProviderInput {
  name?: string
  description?: string
  endpoint?: string
  apiKey?: string
  isActive?: boolean
}

// Available Model Types
export interface AvailableModel {
  id: string
  name: string
  description?: string
  type: 'OpenAI' | 'Anthropic' | 'Aliyun' | 'Baidu' | 'VolcEngine' | 'Generic'
}

// Chat Message Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
  thinking?: string
}

// Streaming Chat Types
export interface StreamChunk {
  type: 'thinking' | 'content' | 'done' | 'error'
  content: string
  usage?: any
  responseTime?: number
  modelName?: string
}

export interface StreamingChatOptions {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  enableThinking?: boolean
}

// AI Analysis Types
export interface AITaskAnalysis {
  originalInput: string
  suggestedTasks: SuggestedTask[]
  analysis: string
  confidence: number
}

export interface SuggestedTask {
  id: string
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date
  tags?: string[]
  estimatedDuration?: string
}

// Model Provider Context
export interface ModelProviderContextType {
  availableModels: AvailableModel[]
  selectedModel: AvailableModel | null
  isLoading: boolean
  error: string | null
  selectModel: (model: AvailableModel) => void
  refreshModels: () => Promise<void>
  analyzeTask: (input: string) => Promise<AITaskAnalysis>
  streamChat: (input: string, options?: StreamingChatOptions) => AsyncGenerator<StreamChunk, void, unknown>
}
