import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// 根据endpoint推断provider类型
function inferProviderFromEndpoint(endpoint: string | null): string {
  if (!endpoint) return 'Unknown'
  
  if (endpoint.includes('openai.com')) return 'OpenAI'
  if (endpoint.includes('anthropic.com')) return 'Anthropic'
  if (endpoint.includes('baidubce.com')) return 'Baidu'
  if (endpoint.includes('aliyuncs.com')) return 'Qwen'
  if (endpoint.includes('volcengine.com') || endpoint.includes('volces.com')) return 'VolcEngine'
  if (endpoint.includes('dashscope.aliyuncs.com')) return 'Qwen'
  
  return 'Generic'
}

// 获取所有可用的模型（仅返回活跃状态的模型）
export async function GET() {
  try {
    // 从数据库获取已配置且激活的模型列表
    const models = await prisma.modelProvider.findMany({
      where: {
        isActive: true,
        endpoint: { not: null },
        apiKey: { not: null }
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        endpoint: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 转换为前端需要的格式
    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      type: model.endpoint?.includes('openai') ? 'OpenAI' :
            model.endpoint?.includes('anthropic') ? 'Anthropic' :
            model.endpoint?.includes('aliyun') ? 'Aliyun' :
            'Other'
    }))

    return NextResponse.json({ models: formattedModels })
  } catch (error: any) {
    console.error('获取模型列表失败:', error)
    return NextResponse.json({ error: error.message || '获取失败' }, { status: 500 })
  }
} 