import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/tasks/[id] - 获取单个任务
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const resolvedParams = await params
    const task = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id
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

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 转换数据格式
    const formattedTask = {
      ...task,
      tags: task.taskTags.map(tt => tt.tag)
    }

    return NextResponse.json(formattedTask)
  } catch (error) {
    console.error('获取任务详情失败:', error)
    return NextResponse.json({ error: '获取任务详情失败' }, { status: 500 })
  }
}

// PUT /api/tasks/[id] - 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const resolvedParams = await params
    const data = await request.json()
    const {
      title,
      description,
      dueDate,
      dueTime,
      priority,
      isCompleted,
      status,
      parentTaskId,
      tagIds,
      sortOrder
    } = data

    // 验证任务权限
    const existingTask = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }



    // 验证父任务权限
    if (parentTaskId && parentTaskId !== existingTask.parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: { id: parentTaskId, userId: session.user.id }
      })
      if (!parentTask) {
        return NextResponse.json({ error: '无效的父任务ID' }, { status: 400 })
      }
    }

    // 验证标签权限
    if (tagIds && tagIds.length > 0) {
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

    // 构建更新数据
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (dueTime !== undefined) updateData.dueTime = dueTime ? new Date(dueTime) : null
    if (priority !== undefined) updateData.priority = priority
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted
      if (isCompleted) {
        updateData.completedAt = new Date()
        updateData.status = 'COMPLETED'
      } else {
        updateData.completedAt = null
        updateData.status = 'TODO'
      }
    }
    if (status !== undefined) updateData.status = status
    if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    // 更新任务
    const task = await prisma.task.update({
      where: { id: resolvedParams.id },
      data: updateData,
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

    // 更新标签关联
    if (tagIds !== undefined) {
      // 删除现有标签关联
      await prisma.taskTag.deleteMany({
        where: { taskId: resolvedParams.id }
      })
      
      // 创建新的标签关联
      if (tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: tagIds.map((tagId: string) => ({
            taskId: resolvedParams.id,
            tagId
          }))
        })
      }
    }

    // 重新获取更新后的任务
    const updatedTask = await prisma.task.findFirst({
      where: { id: resolvedParams.id },
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
      ...updatedTask,
      tags: updatedTask!.taskTags.map(tt => tt.tag)
    }

    return NextResponse.json(formattedTask)
  } catch (error) {
    console.error('更新任务失败:', error)
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 验证任务权限
    const existingTask = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 删除任务（级联删除子任务、标签关联、评论等）
    await prisma.task.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: '任务删除成功' })
  } catch (error) {
    console.error('删除任务失败:', error)
    return NextResponse.json({ error: '删除任务失败' }, { status: 500 })
  }
} 