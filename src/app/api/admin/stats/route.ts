import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { Role } from '@prisma/client'

// 获取管理端统计信息
export async function GET() {
  try {
    await requireAdmin()

    // 获取各种统计数据
    const [
      totalUsers,
      adminUsers,
      activeProviders,
      inactiveProviders,
      totalTasks,
      completedTasks,
      recentUsers,
      recentTasks
    ] = await Promise.all([
      // 用户统计
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      
      // 模型提供商统计
      prisma.modelProvider.count({ where: { isActive: true } }),
      prisma.modelProvider.count({ where: { isActive: false } }),
      
      // 任务统计
      prisma.task.count(),
      prisma.task.count({ where: { isCompleted: true } }),
      
      // 最近注册的用户
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // 最近创建的任务
      prisma.task.findMany({
        select: {
          id: true,
          title: true,
          isCompleted: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    // 按日期统计用户注册数（最近7天）
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const userRegistrations = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      }
    })

    // 处理注册统计数据
    const registrationsByDay = new Map<string, number>()
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      registrationsByDay.set(dateStr, 0)
    }

    userRegistrations.forEach(reg => {
      const dateStr = reg.createdAt.toISOString().split('T')[0]
      registrationsByDay.set(dateStr, reg._count.id)
    })

    const registrationChartData = Array.from(registrationsByDay, ([date, count]) => ({
      date,
      count
    }))

    const stats = {
      overview: {
        totalUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        activeProviders,
        inactiveProviders,
        totalProviders: activeProviders + inactiveProviders,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks
      },
      charts: {
        userRegistrations: registrationChartData
      },
      recent: {
        users: recentUsers,
        tasks: recentTasks
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取管理端统计信息失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取统计信息失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}