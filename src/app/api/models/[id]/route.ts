import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 获取单个模型
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const model = await prisma.modelProvider.findFirst({
      where: { 
        id: resolvedParams.id,
        userId: user.id
      }
    })

    if (!model) {
      return NextResponse.json(
        { error: '模型不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(model)
  } catch (error) {
    console.error('获取模型失败:', error)
    return NextResponse.json(
      { error: '获取模型失败' },
      { status: 500 }
    )
  }
}

// 更新模型
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const body = await request.json()
    const { name, description, endpoint, apiKey, isActive } = body

    // 验证必填字段
    if (!name || !endpoint) {
      return NextResponse.json(
        { error: '模型名称和API端点为必填项' },
        { status: 400 }
      )
    }

    // 检查模型是否存在且属于当前用户
    const existingModel = await prisma.modelProvider.findFirst({
      where: { 
        id: resolvedParams.id,
        userId: user.id
      }
    })

    if (!existingModel) {
      return NextResponse.json(
        { error: '模型不存在' },
        { status: 404 }
      )
    }

    // 检查名称冲突（排除当前模型，且在同一用户下）
    const nameConflict = await prisma.modelProvider.findFirst({
      where: {
        name,
        userId: user.id,
        id: { not: resolvedParams.id }
      }
    })

    if (nameConflict) {
      return NextResponse.json(
        { error: '模型名称已存在' },
        { status: 400 }
      )
    }

    const updatedModel = await prisma.modelProvider.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description,
        endpoint,
        apiKey,
        isActive
      }
    })

    return NextResponse.json(updatedModel)
  } catch (error) {
    console.error('更新模型失败:', error)
    return NextResponse.json(
      { error: '更新模型失败' },
      { status: 500 }
    )
  }
}

// 部分更新模型
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const body = await request.json()
    const { apiKey, isActive } = body

    // 检查模型是否存在且属于当前用户
    const existingModel = await prisma.modelProvider.findFirst({
      where: { 
        id: resolvedParams.id,
        userId: user.id
      }
    })

    if (!existingModel) {
      return NextResponse.json(
        { error: '模型不存在' },
        { status: 404 }
      )
    }

    // 构建更新数据
    const updateData: any = {}
    if (apiKey !== undefined) updateData.apiKey = apiKey
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedModel = await prisma.modelProvider.update({
      where: { id: resolvedParams.id },
      data: updateData
    })

    return NextResponse.json(updatedModel)
  } catch (error) {
    console.error('更新模型失败:', error)
    return NextResponse.json(
      { error: '更新模型失败' },
      { status: 500 }
    )
  }
}

// 删除模型
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    
    // 检查模型是否存在且属于当前用户
    const existingModel = await prisma.modelProvider.findFirst({
      where: { 
        id: resolvedParams.id,
        userId: user.id
      }
    })

    if (!existingModel) {
      return NextResponse.json(
        { error: '模型不存在' },
        { status: 404 }
      )
    }

    // 删除模型
    await prisma.modelProvider.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: '模型删除成功' })
  } catch (error) {
    console.error('删除模型失败:', error)
    return NextResponse.json(
      { error: '删除模型失败' },
      { status: 500 }
    )
  }
} 