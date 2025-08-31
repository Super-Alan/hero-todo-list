import { WechatMessage, WechatCommand, WechatTaskRequest } from '@/types/wechat'
import { parseTaskWithAI } from '@/lib/aiTaskParser'
import { CreateTaskInput } from '@/types'

/**
 * 微信消息处理器
 */
export class WechatMessageProcessor {
  
  /**
   * 解析微信指令
   */
  parseCommand(content: string): WechatCommand | null {
    const trimmed = content.trim()
    
    // 指令必须以/开头
    if (!trimmed.startsWith('/')) {
      return null
    }

    const parts = trimmed.slice(1).split(' ')
    const command = parts[0].toLowerCase()
    const params = parts.slice(1)

    const commands: { [key: string]: string } = {
      'help': '显示帮助信息',
      'bind': '绑定账号',
      'unbind': '解除绑定',
      'stats': '查看任务统计',
      'list': '列出最近任务',
      'status': '查看绑定状态'
    }

    if (commands[command]) {
      return {
        command,
        params,
        description: commands[command]
      }
    }

    return null
  }

  /**
   * 处理帮助指令
   */
  getHelpMessage(): string {
    return `🤖 HeroToDo 微信助手使用指南

📝 创建任务：
直接发送任务内容即可创建，例如：
• "明天下午2点开会 #工作 !重要"
• "学习Vue.js #学习"
• "买菜 后天"

🔧 指令功能：
• /help - 显示此帮助信息
• /bind - 绑定你的HeroToDo账号
• /unbind - 解除账号绑定
• /stats - 查看任务统计
• /list - 查看最近任务
• /status - 查看绑定状态

💡 任务格式说明：
• 时间：今天、明天、后天、12月25日
• 标签：#工作 #学习 #生活
• 优先级：!重要 !紧急 !低
• 描述：在任务标题后添加详细说明

需要帮助？发送 /help 查看此信息`
  }

  /**
   * 处理绑定状态查询
   */
  getStatusMessage(isBindUser: boolean, nickname?: string): string {
    if (isBindUser) {
      return `✅ 账号已绑定
👤 微信用户：${nickname || '未知'}
📱 状态：正常使用
🎯 可以直接发送消息创建任务`
    } else {
      return `❌ 账号未绑定
🔗 请使用 /bind 指令进行账号绑定
📝 绑定后即可开始创建任务`
    }
  }

  /**
   * 处理统计信息
   */
  getStatsMessage(taskCount: number): string {
    return `📊 任务统计
📝 通过微信创建的任务：${taskCount}
💪 继续加油！发送任务内容即可创建新任务`
  }

  /**
   * 处理任务创建
   */
  async createTaskFromMessage(content: string): Promise<CreateTaskInput> {
    try {
      // 使用AI任务解析器
      const parseResult = await parseTaskWithAI(content, {
        timeout: 8000, // WeChat可以等待更长时间
        enableFallback: true
      })
      
      let parsedTask = parseResult.task
      
      // 如果没有解析出标题，使用原始内容作为标题
      if (!parsedTask.title || parsedTask.title.trim().length === 0) {
        parsedTask.title = content.trim()
      }

      return parsedTask
    } catch (error) {
      console.error('WeChat task parsing failed:', error)
      
      // 提供基础的fallback解析
      return {
        title: content.trim(),
        tagIds: []
      }
    }
  }

  /**
   * 生成任务创建成功消息
   */
  getTaskCreatedMessage(task: CreateTaskInput): string {
    let message = `✅ 任务创建成功！

📝 任务标题：${task.title}`

    if (task.description) {
      message += `\n📄 任务描述：${task.description}`
    }

    if (task.dueDate) {
      const date = new Date(task.dueDate)
      message += `\n📅 截止日期：${date.toLocaleDateString('zh-CN')}`
    }

    if (task.priority && task.priority !== 'MEDIUM') {
      const priorityMap = {
        'URGENT': '🔴 紧急',
        'HIGH': '🟡 重要', 
        'LOW': '🟢 低优先级'
      }
      message += `\n⭐ 优先级：${priorityMap[task.priority] || task.priority}`
    }

    if (task.tagIds && task.tagIds.length > 0) {
      message += `\n🏷️ 标签：${task.tagIds.join(', ')}`
    }

    message += `\n\n💡 发送任务内容即可继续创建任务`

    return message
  }

  /**
   * 生成错误消息
   */
  getErrorMessage(error: string): string {
    return `❌ 处理失败：${error}

💡 请检查：
• 账号是否已绑定（发送 /status 查看）
• 任务格式是否正确
• 网络连接是否正常

需要帮助？发送 /help 查看使用说明`
  }

  /**
   * 生成绑定指导消息
   */
  getBindInstructionMessage(bindToken: string): string {
    const bindUrl = `${process.env.NEXTAUTH_URL}/wechat/bind?token=${bindToken}`
    
    return `🔗 账号绑定

请按以下步骤绑定你的HeroToDo账号：

1️⃣ 点击以下链接：
${bindUrl}

2️⃣ 使用你的邮箱登录HeroToDo

3️⃣ 完成绑定后即可开始使用

⏰ 绑定链接有效期：30分钟
🔄 如需重新绑定，请再次发送 /bind`
  }

  /**
   * 检查消息是否为任务内容
   */
  isTaskContent(content: string): boolean {
    // 排除指令
    if (content.startsWith('/')) {
      return false
    }

    // 排除过短的内容
    if (content.trim().length < 2) {
      return false
    }

    // 排除纯表情符号
    const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u
    if (emojiRegex.test(content.trim())) {
      return false
    }

    return true
  }
}

// 导出单例
export const messageProcessor = new WechatMessageProcessor()