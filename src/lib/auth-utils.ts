import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { Role } from '@prisma/client'

// 检查用户是否为管理员
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.role === Role.ADMIN
}

// 检查用户是否已登录
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return !!session?.user?.id
}

// 获取当前用户会话
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user || null
}

// API路由管理员权限检查
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('未授权访问')
  }
  
  if (session.user.role !== Role.ADMIN) {
    throw new Error('需要管理员权限')
  }
  
  return session.user
}

// API路由认证检查
export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('未授权访问')
  }
  
  return session.user
}