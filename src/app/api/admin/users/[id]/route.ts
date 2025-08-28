import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-utils'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

// 获取单个用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const resolvedParams = await params

    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        timezone: true,
        dateFormat: true,
        timeFormat: true,
        weekStartsOn: true,
        _count: {
          select: {
            tasks: true,
            tags: true,
            comments: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取用户详情失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const resolvedParams = await params
    const body = await request.json()
    const { name, email, role, password } = body

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 如果更新邮箱，检查是否冲突
    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email,
          id: { not: resolvedParams.id }
        }
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: '邮箱地址已被使用' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    
    // 处理密码更新
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updateData.password = hashedPassword
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('更新用户失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新用户失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const resolvedParams = await params

    // 防止管理员删除自己
    if (admin.id === resolvedParams.id) {
      return NextResponse.json(
        { error: '不能删除自己的账户' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    // 删除用户（级联删除相关数据）
    await prisma.user.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ message: '用户删除成功' })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除用户失败' },
      { status: error instanceof Error && error.message.includes('权限') ? 403 : 500 }
    )
  }
}