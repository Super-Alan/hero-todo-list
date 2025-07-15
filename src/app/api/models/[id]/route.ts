import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取单个模型
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const model = await prisma.modelProvider.findUnique({
      where: { id: params.id }
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, endpoint, apiKey, isActive } = body

    // 验证必填字段
    if (!name || !endpoint) {
      return NextResponse.json(
        { error: '模型名称和API端点为必填项' },
        { status: 400 }
      )
    }

    // 检查模型是否存在
    const existingModel = await prisma.modelProvider.findUnique({
      where: { id: params.id }
    })

    if (!existingModel) {
      return NextResponse.json(
        { error: '模型不存在' },
        { status: 404 }
      )
    }

    // 检查名称冲突（排除当前模型）
    const nameConflict = await prisma.modelProvider.findFirst({
      where: {
        name,
        id: { not: params.id }
      }
    })

    if (nameConflict) {
      return NextResponse.json(
        { error: '模型名称已存在' },
        { status: 400 }
      )
    }

    const updatedModel = await prisma.modelProvider.update({
      where: { id: params.id },
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

// 删除模型
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查模型是否存在
    const existingModel = await prisma.modelProvider.findUnique({
      where: { id: params.id }
    })

    if (!existingModel) {
      return NextResponse.json(
        { error: '模型不存在' },
        { status: 404 }
      )
    }

    // 检查是否有相关评估数据
    const evaluationCount = await prisma.promptEvaluation.count({
      where: { modelId: params.id }
    })

    if (evaluationCount > 0) {
      return NextResponse.json(
        { error: '该模型已有评估数据，无法删除。请先停用模型。' },
        { status: 400 }
      )
    }

    await prisma.modelProvider.delete({
      where: { id: params.id }
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