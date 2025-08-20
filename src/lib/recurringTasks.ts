'use client'

import { RecurrenceRule, RecurrenceType } from '@/types/recurring'

/**
 * 周期性任务工具库
 */
export class RecurringTaskUtils {
  /**
   * 根据周期规则生成下一个任务日期
   */
  static getNextOccurrence(rule: RecurrenceRule, currentDate: Date): Date | null {
    if (!rule) return null

    const nextDate = new Date(currentDate)

    switch (rule.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + rule.interval)
        break
      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          // 找到下一个指定的星期几
          const currentDay = nextDate.getDay()
          const nextDay = rule.daysOfWeek.find(day => day > currentDay)
          
          if (nextDay !== undefined) {
            // 这周还有指定的日期
            nextDate.setDate(nextDate.getDate() + (nextDay - currentDay))
          } else {
            // 下周的第一个指定日期
            const firstDay = Math.min(...rule.daysOfWeek)
            const daysUntilNext = (7 - currentDay + firstDay) + (rule.interval - 1) * 7
            nextDate.setDate(nextDate.getDate() + daysUntilNext)
          }
        } else {
          nextDate.setDate(nextDate.getDate() + (rule.interval * 7))
        }
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + rule.interval)
        if (rule.dayOfMonth) {
          nextDate.setDate(rule.dayOfMonth)
        }
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + rule.interval)
        if (rule.monthOfYear) {
          nextDate.setMonth(rule.monthOfYear - 1) // JavaScript月份从0开始
        }
        if (rule.dayOfMonth) {
          nextDate.setDate(rule.dayOfMonth)
        }
        break
    }

    // 检查是否超过结束日期
    if (rule.endDate && nextDate > rule.endDate) {
      return null
    }

    return nextDate
  }

  /**
   * 生成周期性任务的所有日期（用于预览）
   */
  static generateOccurrences(
    rule: RecurrenceRule, 
    startDate: Date, 
    maxCount: number = 50
  ): Date[] {
    const dates: Date[] = []
    let currentDate = new Date(startDate)
    let count = 0

    while (count < maxCount) {
      // 检查结束条件
      if (rule.occurrences && count >= rule.occurrences) break
      if (rule.endDate && currentDate > rule.endDate) break

      dates.push(new Date(currentDate))
      count++

      // 获取下一个日期
      const nextDate = this.getNextOccurrence(rule, currentDate)
      if (!nextDate) break

      currentDate = nextDate
    }

    return dates
  }

  /**
   * 验证周期规则的有效性
   */
  static validateRule(rule: RecurrenceRule): string[] {
    const errors: string[] = []

    if (!rule.type) {
      errors.push('必须指定重复类型')
    }

    if (!rule.interval || rule.interval < 1) {
      errors.push('间隔必须是正整数')
    }

    if (rule.type === 'weekly' && rule.daysOfWeek) {
      if (rule.daysOfWeek.some(day => day < 0 || day > 6)) {
        errors.push('星期几必须在0-6之间')
      }
    }

    if (rule.type === 'monthly' && rule.dayOfMonth) {
      if (rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
        errors.push('月份中的日期必须在1-31之间')
      }
    }

    if (rule.type === 'yearly' && rule.monthOfYear) {
      if (rule.monthOfYear < 1 || rule.monthOfYear > 12) {
        errors.push('月份必须在1-12之间')
      }
    }

    if (rule.occurrences && rule.occurrences < 1) {
      errors.push('重复次数必须是正整数')
    }

    if (rule.endDate && rule.endDate < new Date()) {
      errors.push('结束日期不能早于当前日期')
    }

    return errors
  }

  /**
   * 格式化周期规则为人类可读的描述
   */
  static formatRuleDescription(rule: RecurrenceRule): string {
    if (!rule) return ''

    let description = ''

    switch (rule.type) {
      case 'daily':
        description = rule.interval === 1 ? '每天' : `每${rule.interval}天`
        break
      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
          const selectedDays = rule.daysOfWeek.map(day => dayNames[day]).join('、')
          description = rule.interval === 1 
            ? `每周的${selectedDays}`
            : `每${rule.interval}周的${selectedDays}`
        } else {
          description = rule.interval === 1 ? '每周' : `每${rule.interval}周`
        }
        break
      case 'monthly':
        if (rule.dayOfMonth) {
          description = rule.interval === 1 
            ? `每月${rule.dayOfMonth}日`
            : `每${rule.interval}个月的${rule.dayOfMonth}日`
        } else {
          description = rule.interval === 1 ? '每月' : `每${rule.interval}个月`
        }
        break
      case 'yearly':
        if (rule.monthOfYear && rule.dayOfMonth) {
          description = rule.interval === 1 
            ? `每年${rule.monthOfYear}月${rule.dayOfMonth}日`
            : `每${rule.interval}年的${rule.monthOfYear}月${rule.dayOfMonth}日`
        } else if (rule.monthOfYear) {
          description = rule.interval === 1 
            ? `每年${rule.monthOfYear}月`
            : `每${rule.interval}年的${rule.monthOfYear}月`
        } else {
          description = rule.interval === 1 ? '每年' : `每${rule.interval}年`
        }
        break
    }

    // 添加结束条件
    if (rule.occurrences) {
      description += `，共${rule.occurrences}次`
    }

    if (rule.endDate) {
      description += `，直到${rule.endDate.toLocaleDateString('zh-CN')}`
    }

    return description
  }

  /**
   * 将周期规则转换为JSON字符串（用于数据库存储）
   */
  static ruleToJson(rule: RecurrenceRule): string {
    return JSON.stringify(rule)
  }

  /**
   * 从JSON字符串解析周期规则
   */
  static ruleFromJson(json: string): RecurrenceRule | null {
    try {
      const rule = JSON.parse(json)
      // 恢复日期对象
      if (rule.endDate) {
        rule.endDate = new Date(rule.endDate)
      }
      return rule
    } catch (error) {
      console.error('解析周期规则失败:', error)
      return null
    }
  }
}