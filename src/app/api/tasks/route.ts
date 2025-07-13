import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/tasks - 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // 解析查询参数
    const tagId = searchParams.get('tagId')
    const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean)
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const isCompleted = searchParams.get('isCompleted')
    const search = searchParams.get('search')
    const view = searchParams.get('view') // today, upcoming, all
    
    // 构建查询条件
    const where: any = {
      userId: session.user.id,
    }

    // 标签过滤
    if (tagId) {
      where.taskTags = {
        some: {
          tagId: tagId
        }
      }
    } else if (tagIds && tagIds.length > 0) {
      where.taskTags = {
        some: {
          tagId: { in: tagIds }
        }
      }
    }

    // 优先级过滤
    if (priority) {
      where.priority = priority
    }

    // 状态过滤
    if (status) {
      where.status = status
    }

    // 完成状态过滤
    if (isCompleted !== null) {
      where.isCompleted = isCompleted === 'true'
    }

    // 搜索过滤
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 视图过滤
    if (view === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // 今天视图：只显示今天截止的任务和过期的未完成任务
      where.OR = [
        // 今天截止的任务
        { 
          dueDate: { 
            gte: today, 
            lt: tomorrow 
          } 
        },
        // 过期的未完成任务
        { 
          dueDate: { lt: today },
          isCompleted: false
        },
        // 没有截止日期但创建于今天的任务
        {
          dueDate: null,
          createdAt: { gte: today, lt: tomorrow }
        }
      ]
    } else if (view === 'upcoming') {
      const today = new Date()
      today.setHours(23, 59, 59, 999) // 今天结束时间
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      // 即将到来：未完成且截止日期在未来7天内的任务
      where.AND = [
        { isCompleted: false },
        {
          OR: [
            {
              dueDate: {
                gt: today,
                lte: nextWeek
              }
            },
            // 没有截止日期但不是今天创建的未完成任务
            {
              dueDate: null,
              createdAt: { lt: today }
            }
          ]
        }
      ]
    }

    // 排序
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    const orderBy: any = {}
    orderBy[sortField] = sortDirection

    // 获取任务
    const tasks = await prisma.task.findMany({
      where,
      orderBy,
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
    const formattedTasks = tasks.map(task => ({
      ...task,
      tags: task.taskTags.map(tt => tt.tag)
    }))

    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return NextResponse.json({ error: '获取任务列表失败' }, { status: 500 })
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
      tagIds = []
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