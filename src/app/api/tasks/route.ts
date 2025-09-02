import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RecurringTaskScheduler } from '@/lib/recurringTaskScheduler'

// GET /api/tasks - 获取任务列表
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

    // 使用智能策略生成周期性任务（异步，不阻塞响应）
    const { UserTriggeredStrategy } = await import('@/lib/schedulingStrategies')
    UserTriggeredStrategy.checkAndGenerate(user.id).catch(error => {
      console.warn('自动生成周期性任务失败（不影响主功能）:', error)
    })

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')
    const tagId = searchParams.get('tagId')
    const search = searchParams.get('search') // 新增搜索参数
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    
    // 构建查询条件
    const where: any = { userId: user.id }

    // 视图过滤
    if (view) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      switch (view) {
        case 'today':
          where.dueDate = {
            gte: today,
            lt: tomorrow
          }
          break
        case 'upcoming':
          where.dueDate = {
            gt: now
          }
          where.isCompleted = false
          break
        case 'overdue':
          where.dueDate = {
            lt: now
          }
          where.isCompleted = false
          break
        case 'completed':
          where.isCompleted = true
          break
        case 'important':
          where.priority = {
            in: ['HIGH', 'URGENT']
          }
          break
        case 'recent':
          const weekAgo = new Date(now)
          weekAgo.setDate(weekAgo.getDate() - 7)
          where.updatedAt = {
            gt: weekAgo
          }
          break
        case 'nodate':
          where.dueDate = null
          where.isCompleted = false
          break
        case 'thisweek':
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          where.dueDate = {
            gte: weekStart,
            lte: weekEnd
          }
          where.isCompleted = false
          break
      }
    }

    // 标签过滤
    if (tagId) {
      where.taskTags = {
        some: {
          tagId: tagId
        }
      }
    }

    // 搜索过滤
    if (search && search.trim()) {
      const searchTerm = search.trim()
      where.OR = [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          taskTags: {
        some: {
              tag: {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            }
        }
      }
      ]
    }

    // 优先级过滤
    if (priority) {
      where.priority = priority
    }

    // 状态过滤
    if (status) {
      if (status === 'completed') {
        where.isCompleted = true
      } else if (status === 'pending') {
        where.isCompleted = false
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        taskTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // 转换数据格式
    const formattedTasks = tasks.map(task => ({
      ...task,
      tags: task.taskTags.map(tt => tt.tag)
    }))

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error('获取任务失败:', error)
    return NextResponse.json(
      { error: '获取任务失败' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - 创建新任务
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const data = await request.json()
    const {
      title,
      description,
      dueDate,
      dueTime,
      priority = 'MEDIUM',
      parentTaskId,
      tagIds = [],
      isRecurring = false,
      recurringRule = null
    } = data

    // 验证必填字段
    if (!title?.trim()) {
      return NextResponse.json({ error: '任务标题不能为空' }, { status: 400 })
    }

    // 验证父任务权限
    if (parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: { id: parentTaskId, userId: session.user.id }
      })
      if (!parentTask) {
        return NextResponse.json({ error: '无效的父任务ID' }, { status: 400 })
      }
    }

    // 验证标签权限
    if (tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { 
          id: { in: tagIds },
          userId: session.user.id
        }
      })
      if (tags.length !== tagIds.length) {
        return NextResponse.json({ error: '无效的标签ID' }, { status: 400 })
      }
    }

    // 验证周期性任务规则
    if (isRecurring && recurringRule) {
      try {
        JSON.parse(recurringRule)
      } catch (error) {
        return NextResponse.json({ error: '无效的周期性规则格式' }, { status: 400 })
      }
    }

    // 创建任务
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime: dueTime ? new Date(dueTime) : null,
        priority,
        userId: session.user.id,
        parentTaskId,
        isRecurring,
        recurringRule,
        taskTags: {
          create: tagIds.map((tagId: string) => ({
            tagId
          }))
        }
      },
      include: {
        taskTags: {
          include: {
            tag: true
          }
        },
        subTasks: {
          orderBy: { sortOrder: 'asc' }
        },
        parentTask: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    // 转换数据格式
    const formattedTask = {
      ...task,
      tags: task.taskTags.map(tt => tt.tag)
    }

    return NextResponse.json(formattedTask, { status: 201 })
  } catch (error) {
    console.error('创建任务失败:', error)
    return NextResponse.json({ error: '创建任务失败' }, { status: 500 })
  }
} 