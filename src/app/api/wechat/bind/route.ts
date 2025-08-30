import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wechatBinding } from '@/lib/wechat/binding'

// POST 请求处理绑定
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { bindToken } = await request.json()
    
    if (!bindToken) {
      return NextResponse.json({ error: '绑定令牌不能为空' }, { status: 400 })
    }

    const success = await wechatBinding.bindUser(bindToken, session.user.id)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: '绑定成功！现在可以通过微信创建任务了' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '绑定失败，请重试' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('微信绑定失败:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '绑定失败' 
    }, { status: 500 })
  }
}

// GET 请求检查绑定状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bindToken = searchParams.get('token')
    
    if (!bindToken) {
      return NextResponse.json({ error: '绑定令牌不能为空' }, { status: 400 })
    }

    // 验证令牌是否有效
    const wechatUser = await wechatBinding.getWechatUser('')
    
    return NextResponse.json({
      valid: true,
      message: '绑定令牌有效'
    })

  } catch (error) {
    console.error('检查绑定状态失败:', error)
    return NextResponse.json({ 
      valid: false,
      error: error instanceof Error ? error.message : '检查失败' 
    }, { status: 500 })
  }
}