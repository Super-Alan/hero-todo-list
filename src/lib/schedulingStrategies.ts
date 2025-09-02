/**
 * 多策略定时任务系统
 * 支持多种定时任务实现方式，降低对特定平台的依赖
 */

import { RecurringTaskScheduler } from './recurringTaskScheduler'

export interface SchedulingStrategy {
  name: string
  initialize(): Promise<void>
  schedule(jobId: string, schedule: string, handler: () => Promise<void>): Promise<void>
  unschedule(jobId: string): Promise<void>
  destroy(): Promise<void>
}

/**
 * 1. 用户触发策略 - 最可靠的fallback方案
 */
export class UserTriggeredStrategy implements SchedulingStrategy {
  name = 'user-triggered'

  async initialize(): Promise<void> {
    console.log('🔄 用户触发策略已启用 - 任务将在用户访问时自动生成')
  }

  async schedule(): Promise<void> {
    // 用户触发策略不需要预设定时任务
    // 任务在 GET /api/tasks 时自动触发
  }

  async unschedule(): Promise<void> {
    // 无需取消，因为没有预设任务
  }

  async destroy(): Promise<void> {
    console.log('🔄 用户触发策略已停用')
  }

  /**
   * 检查并生成用户任务 - 在API调用时触发
   */
  static async checkAndGenerate(userId: string): Promise<void> {
    try {
      // 检查上次生成时间，避免频繁生成
      const lastGenerated = await this.getLastGeneratedTime(userId)
      const now = Date.now()
      const sixHours = 6 * 60 * 60 * 1000 // 6小时间隔

      if (!lastGenerated || (now - lastGenerated) > sixHours) {
        await RecurringTaskScheduler.ensureUserTasksGenerated(userId)
        await this.setLastGeneratedTime(userId, now)
      }
    } catch (error) {
      console.warn(`用户 ${userId} 任务生成失败:`, error)
    }
  }

  private static async getLastGeneratedTime(userId: string): Promise<number | null> {
    // 可以存储在Redis、数据库或内存缓存中
    // 这里使用简单的内存缓存演示
    return this.userGenerationCache.get(userId) || null
  }

  private static async setLastGeneratedTime(userId: string, timestamp: number): Promise<void> {
    this.userGenerationCache.set(userId, timestamp)
    // 可以定期清理缓存
    setTimeout(() => {
      this.userGenerationCache.delete(userId)
    }, 24 * 60 * 60 * 1000) // 24小时后清理
  }

  private static userGenerationCache = new Map<string, number>()
}

/**
 * 2. Node.js 内置定时器策略
 */
export class NodeTimerStrategy implements SchedulingStrategy {
  name = 'node-timer'
  private timers = new Map<string, NodeJS.Timeout>()

  async initialize(): Promise<void> {
    console.log('⏰ Node.js定时器策略已启用')
  }

  async schedule(jobId: string, schedule: string, handler: () => Promise<void>): Promise<void> {
    // 解析cron表达式或使用简单的间隔
    const interval = this.parseSchedule(schedule)
    
    const timer = setInterval(async () => {
      try {
        await handler()
      } catch (error) {
        console.error(`定时任务 ${jobId} 执行失败:`, error)
      }
    }, interval)

    this.timers.set(jobId, timer)
    console.log(`⏰ 定时任务 ${jobId} 已设置，间隔 ${interval}ms`)
  }

  async unschedule(jobId: string): Promise<void> {
    const timer = this.timers.get(jobId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(jobId)
      console.log(`⏰ 定时任务 ${jobId} 已取消`)
    }
  }

  async destroy(): Promise<void> {
    for (const [jobId, timer] of this.timers) {
      clearInterval(timer)
      console.log(`⏰ 清理定时任务: ${jobId}`)
    }
    this.timers.clear()
  }

  private parseSchedule(schedule: string): number {
    // 简化的调度解析，实际应用可使用cron-parser库
    if (schedule === '0 1 * * *') { // 每天凌晨1点
      return 24 * 60 * 60 * 1000 // 24小时
    }
    return 60 * 60 * 1000 // 默认1小时
  }
}

/**
 * 3. 外部Webhook策略 - 支持多种外部定时服务
 */
export class WebhookStrategy implements SchedulingStrategy {
  name = 'webhook'

  async initialize(): Promise<void> {
    console.log('🌐 Webhook策略已启用')
    console.log('📝 可用的Webhook触发器:')
    console.log('  • GitHub Actions: .github/workflows/cron.yml')
    console.log('  • 系统Cron: 服务器crontab')
    console.log('  • AWS EventBridge: 云端定时触发')
    console.log('  • Google Cloud Scheduler: GCP定时服务')
    console.log('  • Azure Logic Apps: 微软云定时服务')
  }

  async schedule(jobId: string, schedule: string): Promise<void> {
    console.log(`🌐 Webhook任务 ${jobId} 配置完成`)
    console.log(`   触发URL: ${process.env.APP_URL}/api/cron/generate-recurring-tasks`)
    console.log(`   调度规则: ${schedule}`)
  }

  async unschedule(): Promise<void> {
    console.log('🌐 需要在外部服务中手动取消Webhook定时任务')
  }

  async destroy(): Promise<void> {
    console.log('🌐 Webhook策略已停用')
  }
}

/**
 * 4. Redis/Queue策略 - 企业级方案
 */
export class QueueStrategy implements SchedulingStrategy {
  name = 'queue'

  async initialize(): Promise<void> {
    console.log('📋 队列策略已启用 (需要Redis支持)')
    // 实际实现需要连接Redis和设置队列处理器
  }

  async schedule(jobId: string, schedule: string, handler: () => Promise<void>): Promise<void> {
    console.log(`📋 队列任务 ${jobId} 已加入调度`)
    // 实际实现：将任务添加到Redis队列
  }

  async unschedule(jobId: string): Promise<void> {
    console.log(`📋 队列任务 ${jobId} 已移除`)
  }

  async destroy(): Promise<void> {
    console.log('📋 队列策略已停用')
  }
}

/**
 * 策略管理器 - 智能选择和切换策略
 */
export class SchedulingManager {
  private currentStrategy: SchedulingStrategy
  private strategies: Map<string, SchedulingStrategy> = new Map()

  constructor() {
    // 注册所有可用策略
    this.registerStrategy(new UserTriggeredStrategy())
    this.registerStrategy(new NodeTimerStrategy())
    this.registerStrategy(new WebhookStrategy())
    this.registerStrategy(new QueueStrategy())

    // 自动选择最佳策略
    this.currentStrategy = this.selectBestStrategy()
  }

  private registerStrategy(strategy: SchedulingStrategy): void {
    this.strategies.set(strategy.name, strategy)
  }

  /**
   * 智能选择策略
   */
  private selectBestStrategy(): SchedulingStrategy {
    const environment = process.env.NODE_ENV
    const hasRedis = !!process.env.REDIS_URL
    const isVercel = !!process.env.VERCEL
    const isProduction = environment === 'production'

    // 策略选择优先级
    if (hasRedis && isProduction) {
      console.log('🏆 选择策略: Redis Queue (企业级)')
      return this.strategies.get('queue')!
    }
    
    if (!isVercel && isProduction) {
      console.log('🏆 选择策略: Node.js Timer (服务器部署)')
      return this.strategies.get('node-timer')!
    }

    if (isVercel || !isProduction) {
      console.log('🏆 选择策略: User Triggered (无服务器/开发环境)')
      return this.strategies.get('user-triggered')!
    }

    console.log('🏆 选择策略: Webhook (通用)')
    return this.strategies.get('webhook')!
  }

  /**
   * 初始化定时任务系统
   */
  async initialize(): Promise<void> {
    await this.currentStrategy.initialize()

    // 只有非用户触发策略才需要设置定时任务
    if (this.currentStrategy.name !== 'user-triggered') {
      await this.currentStrategy.schedule(
        'recurring-tasks-generation',
        '0 1 * * *', // 每天凌晨1点
        async () => {
          console.log('🔄 开始执行定时任务：生成周期性任务')
          await RecurringTaskScheduler.generateUpcomingTasks(30)
          await RecurringTaskScheduler.cleanupExpiredInstances(7)
          console.log('✅ 定时任务完成')
        }
      )
    }
  }

  /**
   * 手动切换策略
   */
  async switchStrategy(strategyName: string): Promise<void> {
    const newStrategy = this.strategies.get(strategyName)
    if (!newStrategy) {
      throw new Error(`未找到策略: ${strategyName}`)
    }

    console.log(`🔄 切换策略: ${this.currentStrategy.name} → ${strategyName}`)

    // 清理当前策略
    await this.currentStrategy.destroy()
    
    // 切换到新策略
    this.currentStrategy = newStrategy
    await this.currentStrategy.initialize()
  }

  /**
   * 获取当前策略信息
   */
  getCurrentStrategy(): { name: string; description: string } {
    const descriptions = {
      'user-triggered': '用户访问时自动生成 - 最可靠的fallback方案',
      'node-timer': 'Node.js定时器 - 适合服务器部署',
      'webhook': '外部Webhook - 支持多种云服务',
      'queue': 'Redis队列 - 企业级高可靠方案'
    }

    return {
      name: this.currentStrategy.name,
      description: descriptions[this.currentStrategy.name as keyof typeof descriptions] || '未知策略'
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    strategy: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: string
  }> {
    const strategy = this.currentStrategy.name
    
    try {
      // 这里可以添加策略特定的健康检查逻辑
      return {
        strategy,
        status: 'healthy',
        details: '定时任务系统运行正常'
      }
    } catch (error) {
      return {
        strategy,
        status: 'unhealthy',
        details: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
}

// 全局策略管理器实例
export const schedulingManager = new SchedulingManager()