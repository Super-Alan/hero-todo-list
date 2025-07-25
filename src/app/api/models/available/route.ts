import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 根据endpoint推断provider类型
function inferProviderFromEndpoint(endpoint: string | null): 'OpenAI' | 'Anthropic' | 'Aliyun' | 'Baidu' | 'VolcEngine' | 'Generic' {
  if (!endpoint) return 'Generic'
  
  if (endpoint.includes('openai.com')) return 'OpenAI'
  if (endpoint.includes('anthropic.com')) return 'Anthropic'
  if (endpoint.includes('baidubce.com')) return 'Baidu'
  if (endpoint.includes('aliyuncs.com') || endpoint.includes('dashscope.aliyuncs.com')) return 'Aliyun'
  if (endpoint.includes('volcengine.com') || endpoint.includes('volces.com')) return 'VolcEngine'
  
  return 'Generic'
}

// 获取当前用户的可用模型（仅返回活跃状态的模型）
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 从数据库获取当前用户已配置且激活的模型列表
    const models = await prisma.modelProvider.findMany({
      where: {
        userId: user.id,
        isActive: true
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
      type: inferProviderFromEndpoint(model.endpoint)
    }))

    return NextResponse.json({ models: formattedModels })
  } catch (error: any) {
    console.error('获取模型列表失败:', error)
    return NextResponse.json({ error: error.message || '获取失败' }, { status: 500 })
  }
} 