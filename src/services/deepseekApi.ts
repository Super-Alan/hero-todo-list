import { AIAnalysisResult, Message } from '@/types/quickAdd'

// DeepSeek API 配置
interface DeepSeekConfig {
  apiKey: string
  apiEndpoint: string
  modelName: string
  temperature: number
  maxTokens: number
}

// 默认配置
const defaultConfig: DeepSeekConfig = {
  apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
  apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
  modelName: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2000
}

// 分析阶段
export enum AnalysisStage {
  UNDERSTANDING = 'understanding',
  PLANNING = 'planning',
  GENERATING = 'generating',
  OPTIMIZING = 'optimizing',
  COMPLETE = 'complete'
}

// 分析阶段消息
export const stageMessages: Record<AnalysisStage, string> = {
  [AnalysisStage.UNDERSTANDING]: '正在理解你的目标和需求...',
  [AnalysisStage.PLANNING]: '正在规划任务结构和时间安排...',
  [AnalysisStage.GENERATING]: '正在生成详细任务清单...',
  [AnalysisStage.OPTIMIZING]: '正在优化任务分配和时间估计...',
  [AnalysisStage.COMPLETE]: '分析完成！'
}

// 模拟分析进度（开发环境使用）
export const simulateAnalysisProgress = async (
  onStageChange: (stage: AnalysisStage) => void,
  onComplete: (result: AIAnalysisResult) => void
) => {
  const stages = Object.values(AnalysisStage)
  
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i] as AnalysisStage
    onStageChange(stage)
    
    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 最后一个阶段完成后返回模拟结果
    if (stage === AnalysisStage.COMPLETE) {
      onComplete(getMockAnalysisResult())
    }
  }
}

// 获取模拟分析结果（开发环境使用）
export const getMockAnalysisResult = (): AIAnalysisResult => {
  return {
    goal: '学习 React 开发并构建个人项目',
    complexity: 'medium',
    estimatedDuration: '约 3 个月',
    totalTasks: 15,
    recommendations: ['先掌握基础再进阶', '实践项目与理论学习结合', '定期复习巩固知识点'],
    phases: [
      {
        id: 'phase-1',
        name: '基础学习阶段',
        description: '掌握 React 核心概念和基础用法',
        duration: '3 周',
        order: 1,
        tasks: [
          { id: 'task-1-1', title: '学习 JavaScript ES6+ 特性', description: '掌握箭头函数、解构、模块等现代JS特性', priority: 'high', estimatedDays: 3, tags: ['学习', '前端'], phase: 'phase-1', phaseOrder: 1 },
          { id: 'task-1-2', title: '理解 React 组件和 JSX 语法', description: '学习组件创建、属性传递和JSX语法规则', priority: 'high', estimatedDays: 2, tags: ['学习', 'React'], phase: 'phase-1', phaseOrder: 2 },
          { id: 'task-1-3', title: '学习 React Hooks 和状态管理', description: '掌握useState、useEffect等核心钩子的使用方法', priority: 'medium', estimatedDays: 3, tags: ['学习', 'React'], phase: 'phase-1', phaseOrder: 3 },
          { id: 'task-1-4', title: '完成 React 官方教程项目', description: '跟随官方教程完成一个简单的React应用', priority: 'medium', estimatedDays: 2, tags: ['实践', 'React'], phase: 'phase-1', phaseOrder: 4 }
        ]
      },
      {
        id: 'phase-2',
        name: '进阶学习阶段',
        description: '学习 React 生态系统和常用库',
        duration: '4 周',
        order: 2,
        tasks: [
          { id: 'task-2-1', title: '学习 React Router 路由管理', description: '掌握路由配置、参数传递和导航控制', priority: 'high', estimatedDays: 2, tags: ['学习', 'React'], phase: 'phase-2', phaseOrder: 1 },
          { id: 'task-2-2', title: '掌握 Redux 状态管理', description: '学习Store、Action和Reducer的概念和使用方法', priority: 'high', estimatedDays: 4, tags: ['学习', 'React'], phase: 'phase-2', phaseOrder: 2 },
          { id: 'task-2-3', title: '学习 Styled Components 样式方案', description: '掌握组件级CSS样式管理和主题配置', priority: 'medium', estimatedDays: 2, tags: ['学习', 'React'], phase: 'phase-2', phaseOrder: 3 },
          { id: 'task-2-4', title: '了解 React 性能优化技巧', description: '学习memo、useMemo、useCallback等优化方法', priority: 'medium', estimatedDays: 3, tags: ['学习', 'React'], phase: 'phase-2', phaseOrder: 4 },
          { id: 'task-2-5', title: '构建一个中型 React 应用', description: '整合所学知识，开发一个功能完整的应用', priority: 'high', estimatedDays: 5, tags: ['实践', 'React'], phase: 'phase-2', phaseOrder: 5 }
        ]
      },
      {
        id: 'phase-3',
        name: '项目实践阶段',
        description: '应用所学知识构建个人项目',
        duration: '5 周',
        order: 3,
        tasks: [
          { id: 'task-3-1', title: '设计个人项目需求和架构', description: '明确项目目标、功能需求和技术选型', priority: 'high', estimatedDays: 3, tags: ['规划', '项目'], phase: 'phase-3', phaseOrder: 1 },
          { id: 'task-3-2', title: '搭建项目基础结构和配置', description: '初始化项目、配置开发环境和依赖管理', priority: 'high', estimatedDays: 2, tags: ['开发', '项目'], phase: 'phase-3', phaseOrder: 2 },
          { id: 'task-3-3', title: '实现核心功能和页面', description: '按照设计要求开发主要功能模块和界面', priority: 'high', estimatedDays: 7, tags: ['开发', '项目'], phase: 'phase-3', phaseOrder: 3 },
          { id: 'task-3-4', title: '添加测试和错误处理', description: '编写单元测试和集成测试，完善错误处理机制', priority: 'medium', estimatedDays: 3, tags: ['测试', '项目'], phase: 'phase-3', phaseOrder: 4 },
          { id: 'task-3-5', title: '优化性能和用户体验', description: '进行性能分析和优化，改进用户交互体验', priority: 'medium', estimatedDays: 3, tags: ['优化', '项目'], phase: 'phase-3', phaseOrder: 5 },
          { id: 'task-3-6', title: '部署项目并编写文档', description: '配置生产环境部署，编写使用文档和开发文档', priority: 'low', estimatedDays: 2, tags: ['部署', '项目'], phase: 'phase-3', phaseOrder: 6 }
        ]
      }
    ]
  }
}

// DeepSeek API 客户端
class DeepSeekAPI {
  private config: DeepSeekConfig

  constructor(config: Partial<DeepSeekConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // 发送聊天请求
  async sendChatRequest(messages: Message[]): Promise<string> {
    try {
      // 格式化消息以适应 DeepSeek API 格式
      const formattedMessages = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : msg.type === 'ai' ? 'assistant' : 'system',
        content: msg.content
      }))

      // 添加系统提示以指导 AI 行为
      const systemPrompt = {
        role: 'system',
        content: `你是一个专业的任务规划助手，擅长将复杂目标分解为可执行的任务清单。
        请根据用户的目标、时间范围和经验水平，提供结构化的任务计划。
        回答应包括：阶段划分、每个阶段的任务列表、时间估计和优先级建议。
        请确保每个任务都包含以下属性：id、title、description、priority（high/medium/low）、estimatedDays、tags、phase、phaseOrder。`
      }

      // 准备请求数据
      const requestData = {
        model: this.config.modelName,
        messages: [systemPrompt, ...formattedMessages],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      }

      // 发送请求
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      console.error('DeepSeek API Error:', error)
      throw error
    }
  }

  // 分析用户目标并生成任务计划
  async analyzeGoal(
    conversation: Message[],
    onStageChange: (stage: AnalysisStage) => void
  ): Promise<AIAnalysisResult> {
    try {
      // 检查是否有 API Key
      if (!this.config.apiKey) {
        console.warn('DeepSeek API Key not found, using mock data')
        return new Promise((resolve) => {
          simulateAnalysisProgress(onStageChange, resolve)
        })
      }

      // 通知开始理解阶段
      onStageChange(AnalysisStage.UNDERSTANDING)

      // 提取用户目标
      const userMessages = conversation.filter(msg => msg.type === 'user')
      const lastUserMessage = userMessages[userMessages.length - 1].content

      // 构建分析提示
      const analysisPrompt = {
        role: 'system',
        content: `请分析以下用户目标，并创建一个结构化的任务计划：
        
        "${lastUserMessage}"
        
        请以JSON格式返回结果，包含以下结构：
        {
          "goal": "总体目标描述",
          "estimatedDuration": "总体预估时间",
          "phases": [
            {
              "id": "唯一标识符",
              "name": "阶段名称",
              "description": "阶段描述",
              "duration": "预估时间",
              "tasks": [
                {
                  "id": "任务ID",
                  "title": "任务标题",
                  "estimatedDays": 预估天数,
                  "tags": ["标签1", "标签2"]
                }
              ]
            }
          ]
        }`
      }

      // 通知规划阶段
      onStageChange(AnalysisStage.PLANNING)

      // 发送请求
      const messages = [analysisPrompt, { role: 'user', content: lastUserMessage }]
      const response = await this.sendChatRequest(conversation.concat({
        id: 'analysis-prompt',
        type: 'system',
        content: analysisPrompt.content,
        timestamp: new Date()
      }))

      // 通知生成阶段
      onStageChange(AnalysisStage.GENERATING)

      // 解析 JSON 响应
      let result: AIAnalysisResult
      try {
        // 尝试提取 JSON 部分
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                          response.match(/{[\s\S]*}/)
        
        const jsonStr = jsonMatch ? jsonMatch[0] : response
        result = JSON.parse(jsonStr.replace(/```json|```/g, '').trim())
        
        // 计算总任务数
        result.totalTasks = result.phases.reduce(
          (sum, phase) => sum + phase.tasks.length, 0
        )
      } catch (error) {
        console.error('Failed to parse AI response:', error)
        // 使用模拟数据作为备选
        result = getMockAnalysisResult()
      }

      // 通知优化阶段
      onStageChange(AnalysisStage.OPTIMIZING)
      
      // 等待一小段时间以显示优化阶段
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 通知完成
      onStageChange(AnalysisStage.COMPLETE)
      
      return result
    } catch (error) {
      console.error('Goal analysis error:', error)
      // 出错时使用模拟数据
      return getMockAnalysisResult()
    }
  }
}

export default DeepSeekAPI
