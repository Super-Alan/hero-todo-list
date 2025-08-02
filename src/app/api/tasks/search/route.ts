import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/tasks/search - 搜索任务
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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') // 搜索关键词
    const limit = parseInt(searchParams.get('limit') || '50') // 限制结果数量
    const includeCompleted = searchParams.get('includeCompleted') === 'true' // 是否包含已完成任务

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ tasks: [], total: 0 })
    }

    const searchTerm = query.trim()

    // 构建搜索条件
    const where: any = { 
      userId: user.id,
      OR: [
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

    // 如果不包含已完成任务，添加过滤条件
    if (!includeCompleted) {
      where.isCompleted = false
    }

    // 执行搜索
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
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
        },
        orderBy: [
          { priority: 'desc' }, // 高优先级优先
          { dueDate: 'asc' },   // 截止日期早的优先
          { createdAt: 'desc' } // 最新创建的优先
        ],
        take: limit
      }),
      prisma.task.count({ where })
    ])

    // 转换数据格式
    const formattedTasks = tasks.map(task => ({
      ...task,
      tags: task.taskTags.map(tt => tt.tag)
    }))

    return NextResponse.json({
      tasks: formattedTasks,
      total,
      query: searchTerm
    })
  } catch (error) {
    console.error('搜索任务失败:', error)
    return NextResponse.json(
      { error: '搜索任务失败' },
      { status: 500 }
    )
  }
} 