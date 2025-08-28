import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 获取系统级别的模型提供商
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const models = await prisma.modelProvider.findMany({
      where: { isActive: true },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(models)
  } catch (error) {
    console.error('获取模型列表失败:', error)
    return NextResponse.json(
      { error: '获取模型列表失败' },
      { status: 500 }
    )
  }
}

// 创建新的系统级别模型提供商
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, endpoint, apiKey } = body

    // 验证必填字段
    if (!name || !endpoint) {
      return NextResponse.json(
        { error: '模型名称和API端点为必填项' },
        { status: 400 }
      )
    }

    // 检查系统级别的模型名称是否已存在
    const existingModel = await prisma.modelProvider.findFirst({
      where: { name }
    })

    if (existingModel) {
      return NextResponse.json(
        { error: '模型名称已存在' },
        { status: 400 }
      )
    }

    const model = await prisma.modelProvider.create({
      data: {
        name,
        description,
        endpoint,
        apiKey,
        isActive: true
      }
    })

    return NextResponse.json(model, { status: 201 })
  } catch (error) {
    console.error('创建模型失败:', error)
    return NextResponse.json(
      { error: '创建模型失败' },
      { status: 500 }
    )
  }
} 