import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecurringTaskScheduler } from '@/lib/recurringTaskScheduler'

/**
 * POST /api/tasks/recurring/generate - 手动生成用户的周期性任务实例
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 检查管理员权限
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
    }

    const { daysAhead = 30 } = await request.json()

    // 验证参数
    if (typeof daysAhead !== 'number' || daysAhead < 1 || daysAhead > 365) {
      return NextResponse.json({ error: '无效的天数参数（1-365）' }, { status: 400 })
    }

    console.log(`🔄 用户 ${session.user.id} 请求生成 ${daysAhead} 天内的周期性任务`)

    // 生成任务实例
    const generatedCount = await RecurringTaskScheduler.generateUserRecurringTasks(
      session.user.id,
      daysAhead
    )

    // 获取统计信息
    const stats = await RecurringTaskScheduler.getRecurringTaskStats(session.user.id)

    return NextResponse.json({
      success: true,
      message: `成功生成 ${generatedCount} 个周期性任务实例`,
      generatedCount,
      stats
    })

  } catch (error) {
    console.error('生成周期性任务失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '生成周期性任务失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tasks/recurring/generate - 获取周期性任务统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const stats = await RecurringTaskScheduler.getRecurringTaskStats(session.user.id)

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('获取周期性任务统计失败:', error)
    return NextResponse.json(
      { error: '获取统计信息失败' },
      { status: 500 }
    )
  }
}