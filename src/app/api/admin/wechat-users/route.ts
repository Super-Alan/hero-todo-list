import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const bound = searchParams.get('bound') // 'true', 'false', or null for all
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {}
    
    if (bound === 'true') {
      where.isBindUser = true
    } else if (bound === 'false') {
      where.isBindUser = false
    }

    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { openid: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.wechatUser.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { lastActiveAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.wechatUser.count({ where })
    ])

    return NextResponse.json(users)

  } catch (error) {
    console.error('获取微信用户列表失败:', error)
    return NextResponse.json(
      { error: '获取微信用户列表失败' },
      { status: 500 }
    )
  }
}