import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { schedulingManager } from '@/lib/schedulingStrategies'

/**
 * GET /api/admin/scheduling - 获取定时任务系统状态
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 可以添加管理员权限检查
    // const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    // if (user?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    // }

    // 获取当前策略信息
    const currentStrategy = schedulingManager.getCurrentStrategy()
    
    // 执行健康检查
    const healthStatus = await schedulingManager.healthCheck()

    // 收集系统信息
    const systemInfo = {
      environment: process.env.NODE_ENV,
      platform: process.env.VERCEL ? 'Vercel' : 'Self-hosted',
      hasRedis: !!process.env.REDIS_URL,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      currentStrategy,
      health: healthStatus,
      system: systemInfo,
      strategies: {
        'user-triggered': {
          name: '用户触发',
          description: '用户访问时自动生成，最可靠的fallback方案',
          suitable: '无服务器环境、开发环境',
          pros: ['零配置', '高可靠性', '无平台依赖'],
          cons: ['响应延迟', '被动触发']
        },
        'node-timer': {
          name: 'Node.js定时器',
          description: '服务器内置定时器',
          suitable: '长期运行的服务器',
          pros: ['简单直接', '无外部依赖', '实时性好'],
          cons: ['服务重启后丢失', '单点故障']
        },
        'webhook': {
          name: '外部Webhook',
          description: '通过外部服务触发',
          suitable: '需要高可靠性的生产环境',
          pros: ['平台无关', '高可靠性', '多种选择'],
          cons: ['配置复杂', '依赖外部服务']
        },
        'queue': {
          name: 'Redis队列',
          description: '基于Redis的企业级队列系统',
          suitable: '高并发、高可靠性要求',
          pros: ['企业级', '高并发', '可监控'],
          cons: ['需要Redis', '复杂度高', '资源消耗']
        }
      }
    })
  } catch (error) {
    console.error('获取调度系统状态失败:', error)
    return NextResponse.json(
      { error: '获取系统状态失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/scheduling - 切换定时任务策略
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { strategy } = await request.json()

    if (!strategy || typeof strategy !== 'string') {
      return NextResponse.json({ error: '无效的策略名称' }, { status: 400 })
    }

    const validStrategies = ['user-triggered', 'node-timer', 'webhook', 'queue']
    if (!validStrategies.includes(strategy)) {
      return NextResponse.json({ 
        error: `无效的策略名称，可选值: ${validStrategies.join(', ')}` 
      }, { status: 400 })
    }

    console.log(`🔄 管理员 ${session.user.id} 请求切换策略到: ${strategy}`)

    // 切换策略
    await schedulingManager.switchStrategy(strategy)
    
    // 获取切换后的状态
    const newStrategy = schedulingManager.getCurrentStrategy()
    const healthStatus = await schedulingManager.healthCheck()

    return NextResponse.json({
      success: true,
      message: `成功切换到策略: ${strategy}`,
      currentStrategy: newStrategy,
      health: healthStatus
    })

  } catch (error) {
    console.error('切换调度策略失败:', error)
    return NextResponse.json({
      success: false,
      error: '切换策略失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}