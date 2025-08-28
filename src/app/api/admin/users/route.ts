import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { Role } from '@prisma/client'

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') as Role | null

    const skip = (page - 1) * limit
    
    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {},
        role ? { role } : {}
      ].filter(Boolean) as any[]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              tasks: true,
              tags: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取用户列表失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}

// 创建用户（管理员功能）
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, email, role = Role.USER } = body

    if (!email) {
      return NextResponse.json(
        { error: '邮箱地址必填' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '邮箱地址已存在' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('创建用户失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建用户失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}