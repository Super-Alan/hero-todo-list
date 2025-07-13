import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT /api/tags/[id] - 更新标签
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const data = await request.json()
    const { name, color } = data

    // 验证标签权限
    const existingTag = await prisma.tag.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id
      }
    })

    if (!existingTag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    // 验证标签名称唯一性
    if (name && name.trim() !== existingTag.name) {
      const nameConflict = await prisma.tag.findFirst({
        where: {
          name: name.trim(),
          userId: session.user.id,
          id: { not: resolvedParams.id }
        }
      })

      if (nameConflict) {
        return NextResponse.json({ error: '标签名称已存在' }, { status: 400 })
      }
    }

    // 构建更新数据
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (color !== undefined) updateData.color = color

    // 更新标签
    const tag = await prisma.tag.update({
      where: { id: resolvedParams.id },
      data: updateData
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error('更新标签失败:', error)
    return NextResponse.json({ error: '更新标签失败' }, { status: 500 })
  }
}

// DELETE /api/tags/[id] - 删除标签
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

    // 验证标签权限
    const existingTag = await prisma.tag.findFirst({
      where: {
        id: resolvedParams.id,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            taskTags: true
          }
        }
      }
    })

    if (!existingTag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    // 删除标签（级联删除任务标签关联）
    await prisma.tag.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ 
      message: '标签删除成功',
      affectedTasks: existingTag._count.taskTags
    })
  } catch (error) {
    console.error('删除标签失败:', error)
    return NextResponse.json({ error: '删除标签失败' }, { status: 500 })
  }
} 