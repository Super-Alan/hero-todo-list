import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'

// 获取模型提供商列表
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit
    
    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { endpoint: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {},
        isActive !== null ? { isActive: isActive === 'true' } : {}
      ].filter(Boolean) as any[]
    }

    const [providers, total] = await Promise.all([
      prisma.modelProvider.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          endpoint: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // 不返回apiKey到前端
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.modelProvider.count({ where })
    ])

    return NextResponse.json({
      providers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取模型提供商列表失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取模型提供商列表失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}

// 创建模型提供商
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, description, endpoint, apiKey } = body

    // 验证必填字段
    if (!name || !endpoint || !apiKey) {
      return NextResponse.json(
        { error: '名称、端点和API密钥为必填项' },
        { status: 400 }
      )
    }

    // 检查名称是否已存在
    const existingProvider = await prisma.modelProvider.findFirst({
      where: { name }
    })

    if (existingProvider) {
      return NextResponse.json(
        { error: '模型提供商名称已存在' },
        { status: 400 }
      )
    }

    const provider = await prisma.modelProvider.create({
      data: {
        name,
        description,
        endpoint,
        apiKey,
        isActive: true
      },
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

    return NextResponse.json(provider, { status: 201 })
  } catch (error) {
    console.error('创建模型提供商失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建模型提供商失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}