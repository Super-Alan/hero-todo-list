import { ParsedTaskInput } from '@/types'
import { Priority } from '@/types'

export interface NLPResult {
  title: string
  dueDate?: Date
  dueTime?: Date
  priority?: Priority
  tagNames?: string[]
  description?: string
}

export class NaturalLanguageParser {
  // 时间关键词映射 - 扩展支持更多今日相关表达
  private timeKeywords = {
    // 今日相关（统一处理为今天）
    今天: 0,
    今日: 0,
    上午: 0,
    下午: 0,
    今晚: 0,
    今夜: 0,
    早上: 0,
    中午: 0,
    晚上: 0,
    夜里: 0,
    
    // 明日相关
    明天: 1,
    明日: 1,
    明早: 1,
    明晚: 1,
    明夜: 1,
    
    // 后日相关
    后天: 2,
    后日: 2,
    
    // 周相关
    下周: 7,
    下个月: 30,
    周一: this.getNextWeekday(1),
    周二: this.getNextWeekday(2),
    周三: this.getNextWeekday(3),
    周四: this.getNextWeekday(4),
    周五: this.getNextWeekday(5),
    周六: this.getNextWeekday(6),
    周日: this.getNextWeekday(0),
  }

  // 优先级关键词映射
  private priorityKeywords = {
    紧急: 'URGENT' as Priority,
    重要: 'HIGH' as Priority,
    高: 'HIGH' as Priority,
    中: 'MEDIUM' as Priority,
    低: 'LOW' as Priority,
    一般: 'MEDIUM' as Priority,
  }

  // 时间格式正则表达式
  private timeRegex = /(\d{1,2})[：:点](\d{1,2})?分?/g
  private dateRegex = /(\d{1,2})[\/月](\d{1,2})[日号]?/g

  private getNextWeekday(targetDay: number): number {
    const today = new Date()
    const currentDay = today.getDay()
    const daysUntilTarget = (targetDay - currentDay + 7) % 7
    return daysUntilTarget === 0 ? 7 : daysUntilTarget
  }

  parse(input: string): ParsedTaskInput {
    const result: ParsedTaskInput = {
      title: input.trim()
    }

    // 先解析优先级（避免优先级关键词被当作标签）
    for (const [keyword, priority] of Object.entries(this.priorityKeywords)) {
      if (input.includes(keyword)) {
        result.priority = priority
        result.title = result.title.replace(new RegExp(`@?${keyword}`, 'g'), '').trim()
        // 从输入中移除优先级关键词，包括可能的@ 符号
        input = input.replace(new RegExp(`@?${keyword}`, 'g'), '')
        break
      }
    }

    // 提取标签（@开头），但排除优先级关键词
    const tagMatches = input.match(/@([^\s#@]+)/g)
    if (tagMatches) {
      // 过滤掉优先级关键词
      const filteredTags = tagMatches
        .map(tag => tag.slice(1))
        .filter(tag => !Object.keys(this.priorityKeywords).includes(tag))
      
      if (filteredTags.length > 0) {
        result.tagNames = filteredTags
      }
      result.title = result.title.replace(/@([^\s#@]+)/g, '').trim()
    }

    // 解析日期
    result.dueDate = this.parseDate(input)
    if (result.dueDate) {
      // 移除已解析的日期文本
      for (const [keyword] of Object.entries(this.timeKeywords)) {
        if (input.includes(keyword)) {
          result.title = result.title.replace(new RegExp(keyword, 'g'), '').trim()
          break
        }
      }
      
      // 移除日期格式
      result.title = result.title.replace(this.dateRegex, '').trim()
    }

    // 解析时间
    result.dueTime = this.parseTime(input)
    if (result.dueTime) {
      // 移除已解析的时间文本
      result.title = result.title.replace(this.timeRegex, '').trim()
      // 移除时间相关词汇（上午、下午、晚上等）
      result.title = result.title.replace(/[上下][午晚]/g, '').trim()
      result.title = result.title.replace(/[早中晚夜]上?/g, '').trim()
      // 移除"点"字
      result.title = result.title.replace(/点/g, '').trim()
    }

    // 清理标题
    result.title = result.title.replace(/\s+/g, ' ').trim()

    return result
  }

  private parseDate(input: string): Date | undefined {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 检查相对时间关键词
    for (const [keyword, daysToAdd] of Object.entries(this.timeKeywords)) {
      if (input.includes(keyword)) {
        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() + daysToAdd)
        return targetDate
      }
    }

    // 检查具体日期格式 (MM/DD 或 MM月DD日)
    const dateMatch = input.match(this.dateRegex)
    if (dateMatch) {
      const [, month, day] = dateMatch[0].match(/(\d{1,2})[\/月](\d{1,2})[日号]?/) || []
      if (month && day) {
        const targetDate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day))
        if (targetDate < today) {
          targetDate.setFullYear(today.getFullYear() + 1)
        }
        return targetDate
      }
    }

    return undefined
  }

  private parseTime(input: string): Date | undefined {
    const timeMatch = input.match(this.timeRegex)
    if (!timeMatch) return undefined

    const [, hour, minute] = timeMatch[0].match(/(\d{1,2})[：:点](\d{1,2})?分?/) || []
    if (!hour) return undefined

    let parsedHour = parseInt(hour)
    const parsedMinute = minute ? parseInt(minute) : 0

    // 处理上午/下午/晚上等时间表达
    if (input.includes('下午') || input.includes('晚上') || input.includes('今晚') || input.includes('今夜')) {
      if (parsedHour < 12) {
        parsedHour += 12
      }
    } else if (input.includes('上午') || input.includes('早上') || input.includes('早')) {
      if (parsedHour === 12) {
        parsedHour = 0
      }
    } else if (input.includes('中午')) {
      // 中午保持12点
      if (parsedHour !== 12) {
        parsedHour = 12
      }
    }

    const timeDate = new Date()
    timeDate.setHours(parsedHour, parsedMinute, 0, 0)
    return timeDate
  }

  // 示例用法提示 - 更新示例以展示新的时间表达
  static getExamples(): string[] {
    return [
      '明天下午3点 开会 @重要',
      '周五 完成项目报告 @工作',
      '今晚8点 看电影 @娱乐',
      '上午10点 开会 #工作',
      '下午2点 完成文档 #项目',
      '下周一 医生预约 @健康',
      '12月25日 圣诞聚会 @家庭',
      '紧急 修复生产bug @开发',
    ]
  }
}

export const nlp = new NaturalLanguageParser() 