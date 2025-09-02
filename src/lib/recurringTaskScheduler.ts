import { prisma } from '@/lib/prisma'
import { RecurringTaskUtils } from '@/lib/recurringTasks'
import { RecurrenceRule } from '@/types/recurring'

/**
 * 周期性任务调度器
 * 负责自动生成未来的周期性任务实例
 */
export class RecurringTaskScheduler {
  
  /**
   * 为所有用户生成未来的周期性任务实例
   * 建议在每日凌晨运行
   */
  static async generateUpcomingTasks(daysAhead: number = 30): Promise<void> {
    console.log('🔄 开始生成周期性任务实例...')
    
    try {
      // 获取所有有周期性任务的用户
      const users = await prisma.user.findMany({
        where: {
          tasks: {
            some: {
              isRecurring: true,
              isCompleted: false
            }
          }
        },
        select: { id: true, name: true }
      })

      let totalGenerated = 0
      
      for (const user of users) {
        const userGenerated = await this.generateUserRecurringTasks(user.id, daysAhead)
        totalGenerated += userGenerated
        console.log(`👤 用户 ${user.name} 生成 ${userGenerated} 个任务实例`)
      }
      
      console.log(`✅ 完成：共生成 ${totalGenerated} 个周期性任务实例`)
    } catch (error) {
      console.error('❌ 生成周期性任务失败:', error)
      throw error
    }
  }

  /**
   * 为特定用户生成周期性任务实例
   */
  static async generateUserRecurringTasks(userId: string, daysAhead: number = 30): Promise<number> {
    // 获取用户的所有活跃周期性任务（原始任务，非生成的实例）
    const recurringTasks = await prisma.task.findMany({
      where: {
        userId,
        isRecurring: true,
        isCompleted: false,
        originalTaskId: null, // 只获取原始任务，不包括生成的实例
        recurringRule: {
          not: null
        }
      },
      include: {
        taskTags: {
          include: { tag: true }
        }
      }
    })

    let generatedCount = 0
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)

    for (const task of recurringTasks) {
      try {
        const count = await this.generateTaskInstances(task, endDate)
        generatedCount += count
      } catch (error) {
        console.error(`生成任务 ${task.title} 的实例时出错:`, error)
      }
    }

    return generatedCount
  }

  /**
   * 为单个周期性任务生成实例
   */
  private static async generateTaskInstances(task: any, endDate: Date): Promise<number> {
    if (!task.recurringRule) return 0

    try {
      const rule: RecurrenceRule = JSON.parse(task.recurringRule)
      
      // 验证规则
      const validationErrors = RecurringTaskUtils.validateRule(rule)
      if (validationErrors.length > 0) {
        console.warn(`任务 ${task.title} 的周期规则无效:`, validationErrors)
        return 0
      }

      // 获取已存在的实例，找到最后一个实例的日期
      const existingInstances = await prisma.task.findMany({
        where: {
          originalTaskId: task.id,
          isCompleted: false
        },
        orderBy: { dueDate: 'desc' },
        take: 1
      })

      // 确定开始生成的日期
      let startDate: Date
      if (existingInstances.length > 0 && existingInstances[0].dueDate) {
        // 从最后一个实例的下一个周期开始
        startDate = RecurringTaskUtils.getNextOccurrence(rule, existingInstances[0].dueDate) || new Date()
      } else {
        // 从原始任务的到期时间或当前时间开始
        startDate = task.dueDate || new Date()
      }

      // 生成未来的日期
      const futureDates = this.generateFutureDates(rule, startDate, endDate)
      
      if (futureDates.length === 0) return 0

      // 创建任务实例
      const createdInstances = await Promise.all(
        futureDates.map(date => this.createTaskInstance(task, date))
      )

      console.log(`📅 任务 "${task.title}" 生成 ${createdInstances.length} 个实例`)
      return createdInstances.length

    } catch (error) {
      console.error(`解析任务 ${task.title} 的周期规则时出错:`, error)
      return 0
    }
  }

  /**
   * 生成未来的日期列表
   */
  private static generateFutureDates(rule: RecurrenceRule, startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = []
    let currentDate = new Date(startDate)
    let iterationCount = 0
    const maxIterations = 365 // 防止无限循环

    while (currentDate <= endDate && iterationCount < maxIterations) {
      // 检查是否超过规则的结束条件
      if (rule.endDate && currentDate > rule.endDate) break
      if (rule.occurrences && dates.length >= rule.occurrences) break

      // 只添加未来的日期
      if (currentDate > new Date()) {
        dates.push(new Date(currentDate))
      }

      // 获取下一个日期
      const nextDate = RecurringTaskUtils.getNextOccurrence(rule, currentDate)
      if (!nextDate || nextDate <= currentDate) break // 防止无限循环
      
      currentDate = nextDate
      iterationCount++
    }

    return dates
  }

  /**
   * 创建任务实例
   */
  private static async createTaskInstance(originalTask: any, dueDate: Date): Promise<any> {
    // 计算 dueTime（如果原始任务有时间）
    let dueTime: Date | null = null
    if (originalTask.dueTime && originalTask.dueDate) {
      const originalDueTime = new Date(originalTask.dueTime)
      dueTime = new Date(dueDate)
      dueTime.setHours(originalDueTime.getHours(), originalDueTime.getMinutes(), 0, 0)
    }

    const taskInstance = await prisma.task.create({
      data: {
        title: originalTask.title,
        description: originalTask.description,
        dueDate,
        dueTime,
        priority: originalTask.priority,
        userId: originalTask.userId,
        parentTaskId: originalTask.parentTaskId,
        isRecurring: false, // 实例不是周期性的
        recurringRule: null, // 实例没有周期规则
        originalTaskId: originalTask.id, // 指向原始任务
        sortOrder: originalTask.sortOrder,
        // 复制标签关联
        taskTags: {
          create: originalTask.taskTags.map((taskTag: any) => ({
            tagId: taskTag.tagId
          }))
        }
      }
    })

    return taskInstance
  }

  /**
   * 清理过期的未完成周期性任务实例
   * 避免任务列表过于拥挤
   */
  static async cleanupExpiredInstances(daysPastDue: number = 7): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysPastDue)

    try {
      const deletedTasks = await prisma.task.deleteMany({
        where: {
          originalTaskId: { not: null }, // 只删除生成的实例
          isCompleted: false,
          dueDate: { lt: cutoffDate }
        }
      })

      console.log(`🧹 清理了 ${deletedTasks.count} 个过期的未完成任务实例`)
    } catch (error) {
      console.error('清理过期任务实例时出错:', error)
    }
  }

  /**
   * 获取任务的周期性统计信息
   */
  static async getRecurringTaskStats(userId: string): Promise<{
    totalRecurring: number
    totalInstances: number
    upcomingInstances: number
    overdueInstances: number
  }> {
    const [totalRecurring, totalInstances, upcomingInstances, overdueInstances] = await Promise.all([
      // 原始周期性任务数量
      prisma.task.count({
        where: {
          userId,
          isRecurring: true,
          originalTaskId: null,
          isCompleted: false
        }
      }),
      // 总实例数量
      prisma.task.count({
        where: {
          userId,
          originalTaskId: { not: null }
        }
      }),
      // 未来的实例
      prisma.task.count({
        where: {
          userId,
          originalTaskId: { not: null },
          isCompleted: false,
          dueDate: { gt: new Date() }
        }
      }),
      // 过期的实例
      prisma.task.count({
        where: {
          userId,
          originalTaskId: { not: null },
          isCompleted: false,
          dueDate: { lt: new Date() }
        }
      })
    ])

    return {
      totalRecurring,
      totalInstances,
      upcomingInstances,
      overdueInstances
    }
  }

  /**
   * 手动触发为特定用户生成任务
   * 可以在用户登录时调用
   */
  static async ensureUserTasksGenerated(userId: string): Promise<void> {
    console.log(`🔄 为用户 ${userId} 生成周期性任务...`)
    
    try {
      const generatedCount = await this.generateUserRecurringTasks(userId, 30)
      if (generatedCount > 0) {
        console.log(`✅ 为用户生成了 ${generatedCount} 个周期性任务实例`)
      }
    } catch (error) {
      console.error('为用户生成周期性任务时出错:', error)
    }
  }
}

export default RecurringTaskScheduler