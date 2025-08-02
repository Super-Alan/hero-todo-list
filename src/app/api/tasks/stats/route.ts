import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 获取所有任务（一次性查询）
    const allTasks = await prisma.task.findMany({
      where: { userId: user.id },
      include: {
        taskTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 计算本周的开始和结束
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    // 计算一周前的时间
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // 计算统计数据
    const stats = {
      all: allTasks.length,
      today: allTasks.filter(task => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= today && dueDate < tomorrow
      }).length,
      upcoming: allTasks.filter(task => {
        if (!task.dueDate || task.isCompleted) return false
        const dueDate = new Date(task.dueDate)
        return dueDate > now
      }).length,
      thisweek: allTasks.filter(task => {
        if (!task.dueDate || task.isCompleted) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= weekStart && dueDate <= weekEnd
      }).length,
      important: allTasks.filter(task => 
        task.priority === 'HIGH' || task.priority === 'URGENT'
      ).length,
      completed: allTasks.filter(task => task.isCompleted).length,
      recent: allTasks.filter(task => {
        if (!task.updatedAt) return false
        const updatedAt = new Date(task.updatedAt)
        return updatedAt > weekAgo
      }).length,
      overdue: allTasks.filter(task => {
        if (!task.dueDate || task.isCompleted) return false
        const dueDate = new Date(task.dueDate)
        return dueDate < now
      }).length,
      nodate: allTasks.filter(task => !task.dueDate && !task.isCompleted).length
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('获取任务统计失败:', error)
    return NextResponse.json(
      { error: '获取任务统计失败' },
      { status: 500 }
    )
  }
} 