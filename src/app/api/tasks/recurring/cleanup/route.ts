import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecurringTaskScheduler } from '@/lib/recurringTaskScheduler'

/**
 * POST /api/tasks/recurring/cleanup - 清理过期的未完成周期性任务实例
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

    // 尝试解析请求体，如果失败或为空则使用默认值
    let daysPastDue = 7
    try {
      const body = await request.text()
      if (body) {
        const parsed = JSON.parse(body)
        // 兼容前端发送的 daysAgo 参数
        if (parsed.daysPastDue !== undefined) {
          daysPastDue = parsed.daysPastDue
        } else if (parsed.daysAgo !== undefined) {
          daysPastDue = parsed.daysAgo
        }
      }
    } catch (e) {
      // 使用默认值
      console.log('使用默认值: daysPastDue = 7')
    }

    // 验证参数
    if (typeof daysPastDue !== 'number' || daysPastDue < 1 || daysPastDue > 30) {
      return NextResponse.json({ error: '无效的天数参数（1-30）' }, { status: 400 })
    }

    console.log(`🧹 用户 ${session.user.id} 请求清理 ${daysPastDue} 天前的过期任务`)

    // 清理过期实例
    const deletedCount = await RecurringTaskScheduler.cleanupExpiredInstances(daysPastDue)

    // 获取更新后的统计信息
    const stats = await RecurringTaskScheduler.getRecurringTaskStats(session.user.id)

    return NextResponse.json({
      success: true,
      message: `成功清理 ${deletedCount} 个过期的周期性任务实例`,
      deletedCount,
      stats
    })

  } catch (error) {
    console.error('清理过期任务失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '清理过期任务失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}