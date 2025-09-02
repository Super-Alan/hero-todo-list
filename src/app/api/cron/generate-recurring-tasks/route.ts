import { NextRequest, NextResponse } from 'next/server'
import { RecurringTaskScheduler } from '@/lib/recurringTaskScheduler'

/**
 * GET/POST /api/cron/generate-recurring-tasks
 * 系统定时任务：每日生成周期性任务实例
 * 
 * 可以通过以下方式触发：
 * 1. 系统 cron job (推荐每日凌晨运行)
 * 2. Vercel Cron Jobs (vercel.json 配置)
 * 3. 外部调度服务（如 GitHub Actions, AWS EventBridge）
 */
export async function GET(request: NextRequest) {
  return handleRecurringTaskGeneration(request)
}

export async function POST(request: NextRequest) {
  return handleRecurringTaskGeneration(request)
}

async function handleRecurringTaskGeneration(request: NextRequest) {
  try {
    // 验证授权（可选：添加 API 密钥验证）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: '未授权的定时任务请求' }, { status: 401 })
    }

    console.log('🔄 开始定时生成周期性任务...')
    const startTime = Date.now()

    // 生成未来 30 天的任务实例
    await RecurringTaskScheduler.generateUpcomingTasks(30)

    // 清理 7 天前过期的未完成任务
    await RecurringTaskScheduler.cleanupExpiredInstances(7)

    const executionTime = Date.now() - startTime

    console.log(`✅ 定时任务完成，耗时 ${executionTime}ms`)

    return NextResponse.json({
      success: true,
      message: '周期性任务生成完成',
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ 定时生成周期性任务失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '定时任务执行失败',
      details: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}