import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 并行查询统计数据
    const [
      totalUsers,
      boundUsers,
      unboundUsers,
      totalTasks,
      activeToday,
      recentMessages
    ] = await Promise.all([
      // 总用户数
      prisma.wechatUser.count(),
      
      // 已绑定用户数
      prisma.wechatUser.count({
        where: { isBindUser: true }
      }),
      
      // 未绑定用户数  
      prisma.wechatUser.count({
        where: { isBindUser: false }
      }),
      
      // 通过微信创建的任务总数
      prisma.wechatTaskLog.count({
        where: { success: true }
      }),
      
      // 今日活跃用户数
      prisma.wechatUser.count({
        where: {
          lastActiveAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),

      // 最近消息统计
      prisma.wechatMessage.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
          }
        }
      })
    ])

    // 处理消息统计
    const messageStats = recentMessages.reduce((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    const stats = {
      totalUsers,
      boundUsers,
      unboundUsers,
      totalTasks,
      activeToday,
      messageStats: {
        pending: messageStats.PENDING || 0,
        processing: messageStats.PROCESSING || 0,
        success: messageStats.SUCCESS || 0,
        failed: messageStats.FAILED || 0
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('获取微信统计数据失败:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}