import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wechatBinding } from '@/lib/wechat/binding'

export async function GET(
  request: NextRequest,
  { params }: { params: { openid: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // 只有管理员可以查看微信用户信息
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { openid } = params
    
    if (!openid) {
      return NextResponse.json({ error: 'OpenID不能为空' }, { status: 400 })
    }

    const wechatUser = await wechatBinding.getWechatUser(openid)
    
    if (!wechatUser) {
      return NextResponse.json({ error: '微信用户不存在' }, { status: 404 })
    }

    // 返回微信用户信息（不包含敏感信息）
    return NextResponse.json({
      id: wechatUser.id,
      openid: wechatUser.openid,
      nickname: wechatUser.nickname,
      avatar: wechatUser.avatar,
      isBindUser: wechatUser.isBindUser,
      taskCount: wechatUser.taskCount,
      lastActiveAt: wechatUser.lastActiveAt,
      createdAt: wechatUser.createdAt,
      user: wechatUser.user ? {
        id: wechatUser.user.id,
        name: wechatUser.user.name,
        email: wechatUser.user.email
      } : null
    })

  } catch (error) {
    console.error('获取微信用户信息失败:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '获取失败' 
    }, { status: 500 })
  }
}