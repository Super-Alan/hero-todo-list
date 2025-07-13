import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/tags - 获取标签列表
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'
    const search = searchParams.get('search')

    const where: any = {
      userId: session.user.id
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const tags = await prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        ...(includeStats ? {
          taskTags: {
            include: {
              task: {
                select: {
                  id: true,
                  isCompleted: true,
                  priority: true,
                  dueDate: true
                }
              }
            }
          }
        } : {})
      }
    })

    // 计算统计信息
    const tagsWithStats = tags.map(tag => {
      if (includeStats && 'taskTags' in tag && tag.taskTags) {
        const totalTasks = tag.taskTags.length
        const completedTasks = tag.taskTags.filter((tt: any) => tt.task.isCompleted).length
        const pendingTasks = totalTasks - completedTasks
        const overdueTasks = tag.taskTags.filter((tt: any) => 
          !tt.task.isCompleted && tt.task.dueDate && tt.task.dueDate < new Date()
        ).length
        const highPriorityTasks = tag.taskTags.filter((tt: any) => 
          !tt.task.isCompleted && (tt.task.priority === 'HIGH' || tt.task.priority === 'URGENT')
        ).length

        return {
          ...tag,
          stats: {
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            highPriorityTasks
          }
        }
      }

      return tag
    })

    return NextResponse.json(tagsWithStats)
  } catch (error) {
    console.error('获取标签列表失败:', error)
    return NextResponse.json({ error: '获取标签列表失败' }, { status: 500 })
  }
}

// POST /api/tags - 创建新标签
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const data = await request.json()
    const {
      name,
      color = '#6b7280'
    } = data

    // 验证必填字段
    if (!name?.trim()) {
      return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 })
    }

    // 检查标签名称是否已存在
    const existingTag = await prisma.tag.findFirst({
      where: {
        name: name.trim(),
        userId: session.user.id
      }
    })

    if (existingTag) {
      return NextResponse.json({ error: '标签名称已存在' }, { status: 400 })
    }

    // 创建标签
    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color,
        userId: session.user.id
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('创建标签失败:', error)
    return NextResponse.json({ error: '创建标签失败' }, { status: 500 })
  }
} 