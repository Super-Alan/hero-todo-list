import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AITaskAnalysis, SuggestedTask } from '@/types/modelProvider'

export async function POST(request: NextRequest) {
  try {
    const { input, modelId } = await request.json()

    if (!input || !modelId) {
      return NextResponse.json(
        { error: 'Input and model ID are required' },
        { status: 400 }
      )
    }

    // Get the selected model
    const model = await prisma.modelProvider.findUnique({
      where: { id: modelId, isActive: true }
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found or inactive' },
        { status: 404 }
      )
    }

    // Analyze the task using the selected model
    const analysis = await analyzeTaskWithModel(input, model)
    
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Task analysis failed:', error)
    return NextResponse.json(
      { error: 'Task analysis failed' },
      { status: 500 }
    )
  }
}

async function analyzeTaskWithModel(input: string, model: any): Promise<AITaskAnalysis> {
  // This is a simplified implementation
  // In a real scenario, you would call the actual AI model API
  
  const prompt = `
分析以下任务描述，将其分解为具体的可执行任务：

用户输入: "${input}"

请返回JSON格式的分析结果，包含：
1. 建议的任务列表
2. 每个任务的优先级、预估时间等
3. 整体分析说明

格式要求：
{
  "suggestedTasks": [
    {
      "title": "任务标题",
      "description": "详细描述",
      "priority": "MEDIUM",
      "estimatedDuration": "30分钟",
      "tags": ["标签1", "标签2"]
    }
  ],
  "analysis": "整体分析说明",
  "confidence": 0.85
}
`

  try {
    // Mock implementation - replace with actual AI API call
    const mockAnalysis: AITaskAnalysis = {
      originalInput: input,
      suggestedTasks: generateMockTasks(input),
      analysis: `基于您的输入"${input}"，我为您分解了以下任务。这些任务按照逻辑顺序排列，建议您按优先级逐步完成。`,
      confidence: 0.85
    }

    return mockAnalysis
  } catch (error) {
    throw new Error('Failed to analyze task with AI model')
  }
}

function generateMockTasks(input: string): SuggestedTask[] {
  // Simple mock task generation based on input keywords
  const tasks: SuggestedTask[] = []
  
  if (input.includes('学习') || input.includes('学会')) {
    tasks.push({
      id: '1',
      title: '制定学习计划',
      description: '根据目标制定详细的学习计划和时间安排',
      priority: 'HIGH',
      estimatedDuration: '1小时',
      tags: ['学习', '计划']
    })
    
    tasks.push({
      id: '2',
      title: '收集学习资料',
      description: '搜集相关的学习资料、教程和文档',
      priority: 'MEDIUM',
      estimatedDuration: '2小时',
      tags: ['学习', '资料']
    })
  }
  
  if (input.includes('项目') || input.includes('开发')) {
    tasks.push({
      id: '3',
      title: '项目需求分析',
      description: '明确项目需求和功能规格',
      priority: 'HIGH',
      estimatedDuration: '3小时',
      tags: ['项目', '需求']
    })
    
    tasks.push({
      id: '4',
      title: '技术方案设计',
      description: '设计技术架构和实现方案',
      priority: 'HIGH',
      estimatedDuration: '4小时',
      tags: ['项目', '设计']
    })
  }
  
  // Default fallback task
  if (tasks.length === 0) {
    tasks.push({
      id: '1',
      title: input,
      description: '根据您的输入创建的任务',
      priority: 'MEDIUM',
      estimatedDuration: '1小时',
      tags: ['任务']
    })
  }
  
  return tasks
}
