import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// 注册请求验证模式
const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string()
    .min(8, '密码至少需要8个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含至少一个大写字母、一个小写字母和一个数字'),
  name: z.string().min(1, '请输入姓名').max(50, '姓名不能超过50个字符')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证请求数据
    const validatedData = registerSchema.parse(body)
    const { email, password, name } = validatedData

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册，请使用其他邮箱或尝试登录' },
        { status: 409 }
      )
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        emailVerified: new Date(), // 如果不需要邮箱验证，可以直接设置为已验证
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    return NextResponse.json(
      { 
        message: '注册成功！您现在可以登录了',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('注册失败:', error)

    // 处理验证错误
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => err.message).join(', ')
      return NextResponse.json(
        { error: errorMessages },
        { status: 400 }
      )
    }

    // 处理数据库约束错误
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: '注册过程中发生错误，请稍后重试' },
      { status: 500 }
    )
  }
}