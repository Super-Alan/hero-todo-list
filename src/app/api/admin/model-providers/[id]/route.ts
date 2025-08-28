import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

// 获取单个模型提供商详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const resolvedParams = await params

    const provider = await prisma.modelProvider.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        description: true,
        endpoint: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // 管理员可以看到API密钥的部分信息
        apiKey: true
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: '模型提供商不存在' },
        { status: 404 }
      )
    }

    // 隐藏API密钥的大部分内容
    const maskedProvider = {
      ...provider,
      apiKey: provider.apiKey ? `${provider.apiKey.substring(0, 8)}${'*'.repeat(provider.apiKey.length - 8)}` : null
    }

    return NextResponse.json(maskedProvider)
  } catch (error) {
    console.error('获取模型提供商详情失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取模型提供商详情失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}

// 更新模型提供商
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const resolvedParams = await params
    const body = await request.json()
    const { name, description, endpoint, apiKey, isActive } = body

    // 检查提供商是否存在
    const existingProvider = await prisma.modelProvider.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingProvider) {
      return NextResponse.json(
        { error: '模型提供商不存在' },
        { status: 404 }
      )
    }

    // 如果更新名称，检查是否冲突
    if (name && name !== existingProvider.name) {
      const nameConflict = await prisma.modelProvider.findFirst({
        where: {
          name,
          id: { not: resolvedParams.id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: '模型提供商名称已存在' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (endpoint !== undefined) updateData.endpoint = endpoint
    if (apiKey !== undefined) updateData.apiKey = apiKey
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedProvider = await prisma.modelProvider.update({
      where: { id: resolvedParams.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        endpoint: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
        // 不返回apiKey
      }
    })

    return NextResponse.json(updatedProvider)
  } catch (error) {
    console.error('更新模型提供商失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新模型提供商失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}

// 删除模型提供商
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const resolvedParams = await params

    // 检查提供商是否存在
    const provider = await prisma.modelProvider.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!provider) {
      return NextResponse.json(
        { error: '模型提供商不存在' },
        { status: 404 }
      )
    }

    // 删除模型提供商
    await prisma.modelProvider.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: '模型提供商删除成功' })
  } catch (error) {
    console.error('删除模型提供商失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除模型提供商失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}