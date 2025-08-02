import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 获取当前用户的模型
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    const models = await prisma.modelProvider.findMany({
      where: { userId: user.id },
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

// 创建新模型
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
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

    // 检查当前用户的模型名称是否已存在
    const existingModel = await prisma.modelProvider.findFirst({
      where: { 
        name,
        userId: user.id
      }
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
        isActive: true,
        userId: user.id
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