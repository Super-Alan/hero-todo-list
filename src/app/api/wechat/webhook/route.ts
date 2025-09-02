import { NextRequest, NextResponse } from 'next/server'
import { wechatAPI } from '@/lib/wechat/api'
import { messageProcessor } from '@/lib/wechat/message'
import { wechatBinding } from '@/lib/wechat/binding'
import { prisma } from '@/lib/prisma'
import { tagService } from '@/lib/tagService'

// GET 请求用于微信服务器验证
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const signature = searchParams.get('signature')
  const timestamp = searchParams.get('timestamp') 
  const nonce = searchParams.get('nonce')
  const echostr = searchParams.get('echostr')

  console.log('微信验证请求:', { signature, timestamp, nonce, echostr })

  if (!signature || !timestamp || !nonce || !echostr) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 })
  }

  try {
    const isValid = wechatAPI.verifySignature(signature, timestamp, nonce)
    
    if (isValid) {
      console.log('微信验证成功')
      return new NextResponse(echostr)
    } else {
      console.log('微信验证失败')
      return NextResponse.json({ error: '验证失败' }, { status: 403 })
    }
  } catch (error) {
    console.error('微信验证处理失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// POST 请求用于处理微信消息
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const signature = searchParams.get('signature')
  const timestamp = searchParams.get('timestamp')
  const nonce = searchParams.get('nonce')

  if (!signature || !timestamp || !nonce) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 })
  }

  // 验证签名
  const isValid = wechatAPI.verifySignature(signature, timestamp, nonce)
  if (!isValid) {
    console.log('微信消息签名验证失败')
    return NextResponse.json({ error: '验证失败' }, { status: 403 })
  }

  try {
    const rawBody = await request.text()
    console.log('收到微信消息:', rawBody)

    // 解析XML消息
    const message = await wechatAPI.parseMessage(rawBody)
    console.log('解析后的消息:', message)

    const openid = message.FromUserName
    const content = message.Content || ''
    const msgType = message.MsgType || 'text'
    const msgId = message.MsgId

    // 只处理文本消息
    if (msgType !== 'text') {
      const reply = wechatAPI.generateReplyXML(
        openid,
        message.ToUserName,
        '抱歉，目前只支持文本消息创建任务 😊'
      )
      return new NextResponse(reply, {
        headers: { 'Content-Type': 'application/xml' }
      })
    }

    // 记录消息
    await recordMessage(openid, msgId, msgType, content)

    // 处理消息并生成回复
    const replyContent = await processMessage(openid, content, msgId)
    
    const replyXML = wechatAPI.generateReplyXML(
      openid,
      message.ToUserName,
      replyContent
    )

    return new NextResponse(replyXML, {
      headers: { 'Content-Type': 'application/xml' }
    })

  } catch (error) {
    console.error('处理微信消息失败:', error)
    
    // 返回错误消息
    const errorReply = wechatAPI.generateReplyXML(
      '',
      '',
      '抱歉，服务暂时不可用，请稍后再试 😔'
    )
    
    return new NextResponse(errorReply, {
      headers: { 'Content-Type': 'application/xml' }
    })
  }
}

/**
 * 记录微信消息
 */
async function recordMessage(openid: string, msgId: string | null, msgType: string, content: string) {
  try {
    // 确保微信用户存在
    await prisma.wechatUser.upsert({
      where: { openid },
      update: { 
        lastActiveAt: new Date()
      },
      create: {
        openid,
        isBindUser: false
      }
    })

    // 记录消息
    await prisma.wechatMessage.create({
      data: {
        msgId,
        msgType,
        content,
        status: 'PENDING',
        wechatUser: {
          connect: { openid }
        }
      }
    })
  } catch (error) {
    console.error('记录微信消息失败:', error)
  }
}

/**
 * 处理微信消息
 */
async function processMessage(openid: string, content: string, msgId: string | null): Promise<string> {
  try {
    // 获取微信用户信息
    const wechatUser = await wechatBinding.getWechatUser(openid)
    
    // 解析指令
    const command = messageProcessor.parseCommand(content)
    
    if (command) {
      return await handleCommand(command, openid, wechatUser)
    }

    // 检查是否为任务内容
    if (messageProcessor.isTaskContent(content)) {
      return await handleTaskCreation(openid, content, wechatUser, msgId)
    }

    // 默认返回帮助信息
    return messageProcessor.getHelpMessage()

  } catch (error) {
    console.error('处理消息失败:', error)
    return messageProcessor.getErrorMessage(error instanceof Error ? error.message : '未知错误')
  }
}

/**
 * 处理指令
 */
async function handleCommand(command: any, openid: string, wechatUser: any): Promise<string> {
  switch (command.command) {
    case 'help':
      return messageProcessor.getHelpMessage()

    case 'bind':
      if (wechatUser?.isBindUser) {
        return '✅ 你的账号已经绑定，无需重复绑定\n\n发送任务内容即可创建任务'
      }
      const bindToken = await wechatBinding.createBindToken(openid)
      return messageProcessor.getBindInstructionMessage(bindToken)

    case 'unbind':
      if (!wechatUser?.isBindUser) {
        return '❌ 你的账号尚未绑定\n\n发送 /bind 进行账号绑定'
      }
      await wechatBinding.unbindUser(openid)
      return '✅ 账号绑定已解除\n\n如需重新绑定，请发送 /bind'

    case 'status':
      return messageProcessor.getStatusMessage(
        wechatUser?.isBindUser || false,
        wechatUser?.nickname
      )

    case 'stats':
      return messageProcessor.getStatsMessage(wechatUser?.taskCount || 0)

    case 'list':
      return await getRecentTasks(wechatUser?.userId)

    default:
      return messageProcessor.getHelpMessage()
  }
}

/**
 * 处理任务创建
 */
async function handleTaskCreation(openid: string, content: string, wechatUser: any, msgId: string | null): Promise<string> {
  // 检查用户是否已绑定
  if (!wechatUser?.isBindUser || !wechatUser.userId) {
    const bindToken = await wechatBinding.createBindToken(openid)
    return `❌ 请先绑定账号才能创建任务

🔗 点击以下链接完成绑定：
${process.env.NEXTAUTH_URL}/wechat/bind?token=${bindToken}

绑定后即可开始创建任务！`
  }

  try {
    // 解析任务内容，传入userId以获取用户的AI模型设置
    console.log('🤖 WeChat AI Parsing Start:', {
      content,
      userId: wechatUser.userId,
      openid,
      timestamp: new Date().toISOString()
    })
    
    const taskData = await messageProcessor.createTaskFromMessage(content, wechatUser.userId)
    
    console.log('✅ WeChat AI Parsing Result:', {
      input: content,
      parsed: {
        title: taskData.title,
        isRecurring: taskData.isRecurring,
        recurringRule: taskData.recurringRule,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        tags: taskData.tagIds
      }
    })
    
    // 处理标签
    let finalTagIds: string[] = []
    if (taskData.tagIds && taskData.tagIds.length > 0) {
      finalTagIds = await tagService.getOrCreateTagIds(taskData.tagIds, wechatUser.userId)
    }

    // 创建任务（包含周期性任务支持）
    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        priority: taskData.priority,
        userId: wechatUser.userId,
        isRecurring: taskData.isRecurring || false,
        recurringRule: taskData.recurringRule || null,
        taskTags: {
          create: finalTagIds.map((tagId: string) => ({
            tagId
          }))
        }
      },
      include: {
        taskTags: {
          include: {
            tag: true
          }
        }
      }
    })

    // 记录任务创建日志（包含更详细的解析信息）
    await prisma.wechatTaskLog.create({
      data: {
        originalMsg: content,
        parsedData: JSON.stringify({
          ...taskData,
          parseSource: taskData.isRecurring ? 'AI-recurring' : 'AI',
          parseTime: new Date().toISOString()
        }),
        success: true,
        taskId: task.id,
        userId: wechatUser.userId,
        wechatUserId: wechatUser.id
      }
    })

    // 更新消息状态
    if (msgId) {
      await prisma.wechatMessage.updateMany({
        where: {
          msgId: msgId,
          wechatUserId: wechatUser.id
        },
        data: {
          status: 'SUCCESS',
          taskId: task.id,
          response: '任务创建成功'
        }
      })
    }

    // 增加任务计数
    await wechatBinding.incrementTaskCount(openid)

    // 生成成功消息
    const taskWithTags = {
      ...taskData,
      tagIds: task.taskTags.map(tt => tt.tag.name)
    }
    
    return messageProcessor.getTaskCreatedMessage(taskWithTags)

  } catch (error) {
    console.error('创建任务失败:', error)
    
    // 记录失败日志
    if (wechatUser) {
      try {
        await prisma.wechatTaskLog.create({
          data: {
            originalMsg: content,
            parsedData: JSON.stringify({}),
            success: false,
            errorMsg: error instanceof Error ? error.message : '未知错误',
            userId: wechatUser.userId,
            wechatUserId: wechatUser.id
          }
        })
      } catch (logError) {
        console.error('记录失败日志失败:', logError)
      }
    }

    // 更新消息状态
    if (msgId && wechatUser) {
      try {
        await prisma.wechatMessage.updateMany({
          where: {
            msgId: msgId,
            wechatUserId: wechatUser.id
          },
          data: {
            status: 'FAILED',
            errorMsg: error instanceof Error ? error.message : '未知错误'
          }
        })
      } catch (updateError) {
        console.error('更新消息状态失败:', updateError)
      }
    }

    return messageProcessor.getErrorMessage(error instanceof Error ? error.message : '创建任务失败')
  }
}

/**
 * 获取最近任务
 */
async function getRecentTasks(userId: string | null): Promise<string> {
  if (!userId) {
    return '❌ 账号未绑定，无法查看任务\n\n发送 /bind 进行账号绑定'
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { 
        userId,
        isCompleted: false
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        taskTags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (tasks.length === 0) {
      return '📝 暂无未完成的任务\n\n发送任务内容即可创建新任务'
    }

    let message = '📋 最近的未完成任务：\n\n'
    
    tasks.forEach((task, index) => {
      message += `${index + 1}. ${task.title}`
      
      if (task.dueDate) {
        const date = new Date(task.dueDate)
        message += ` (${date.toLocaleDateString('zh-CN')})`
      }
      
      if (task.taskTags.length > 0) {
        const tags = task.taskTags.map(tt => tt.tag.name).join(', ')
        message += ` #${tags}`
      }
      
      message += '\n'
    })

    message += '\n💡 发送新任务内容即可继续创建'
    
    return message

  } catch (error) {
    console.error('获取最近任务失败:', error)
    return '❌ 获取任务列表失败\n\n请稍后再试'
  }
}