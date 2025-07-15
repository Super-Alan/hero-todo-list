// 智能模式检测逻辑
import { QuickAddMode, ModeDetectionResult } from '@/types/quickAdd'

export class ModeDetector {
  // AI 模式触发关键词
  private static AI_TRIGGERS = [
    // 学习相关
    '学会', '学习', '掌握', '了解', '研究',
    // 计划相关  
    '计划', '准备', '制定', '安排', '规划',
    // 目标相关
    '我想', '希望', '打算', '目标', '实现', '达成', '完成',
    // 项目相关
    '项目', '开发', '设计', '建设', '搭建',
    // 时间相关
    '个月', '周内', '天内', '阶段', '步骤'
  ]

  // 快速模式触发关键词
  private static FAST_TRIGGERS = [
    // 简单动作
    '买', '打电话', '发邮件', '发短信', '联系',
    // 日常事务
    '缴费', '预约', '提醒', '检查', '确认',
    // 会议相关
    '开会', '会议', '讨论', '汇报',
    // 简单任务
    '整理', '清理', '备份', '更新'
  ]

  // 复杂度指标
  private static COMPLEXITY_INDICATORS = {
    // 时间范围指标
    timeframe: /(\d+)\s*(天|周|个?月|年)/g,
    // 多步骤指标
    multiStep: /(然后|接着|之后|第\d+步|步骤|阶段)/g,
    // 学习指标
    learning: /(学|教程|课程|培训|练习)/g,
    // 项目指标
    project: /(项目|系统|平台|应用|网站)/g
  }

  /**
   * 检测输入文本应该使用的模式
   */
  static detectMode(input: string): ModeDetectionResult {
    const cleanInput = input.trim().toLowerCase()
    
    if (cleanInput.length === 0) {
      return {
        suggestedMode: 'auto',
        confidence: 1.0,
        reasons: ['输入为空，使用自动检测模式'],
        triggers: []
      }
    }

    const aiScore = this.calculateAIScore(cleanInput)
    const fastScore = this.calculateFastScore(cleanInput)
    const complexityScore = this.calculateComplexityScore(cleanInput)

    // 综合评分
    const totalAIScore = aiScore.score + complexityScore.score
    const totalFastScore = fastScore.score

    const reasons: string[] = []
    const triggers: string[] = []

    // 决策逻辑
    if (totalAIScore > totalFastScore && totalAIScore > 0.3) {
      reasons.push(...aiScore.reasons, ...complexityScore.reasons)
      triggers.push(...aiScore.triggers, ...complexityScore.triggers)
      
      return {
        suggestedMode: 'ai',
        confidence: Math.min(totalAIScore, 0.95),
        reasons,
        triggers
      }
    } else if (totalFastScore > 0.5) {
      reasons.push(...fastScore.reasons)
      triggers.push(...fastScore.triggers)
      
      return {
        suggestedMode: 'fast',
        confidence: Math.min(totalFastScore, 0.9),
        reasons,
        triggers
      }
    } else {
      return {
        suggestedMode: 'auto',
        confidence: 0.6,
        reasons: ['无明确模式特征，建议手动选择'],
        triggers: []
      }
    }
  }

  /**
   * 计算 AI 模式得分
   */
  private static calculateAIScore(input: string) {
    const triggers: string[] = []
    const reasons: string[] = []
    let score = 0

    // 检查 AI 触发词
    for (const trigger of this.AI_TRIGGERS) {
      if (input.includes(trigger)) {
        triggers.push(trigger)
        score += 0.2
      }
    }

    if (triggers.length > 0) {
      reasons.push(`包含目标导向关键词: ${triggers.slice(0, 3).join(', ')}`)
    }

    // 长文本倾向于复杂任务
    if (input.length > 20) {
      score += 0.1
      reasons.push('输入文本较长，可能是复杂目标')
    }

    if (input.length > 50) {
      score += 0.1
      reasons.push('输入文本很长，建议使用 AI 分解')
    }

    return { score: Math.min(score, 1.0), reasons, triggers }
  }

  /**
   * 计算快速模式得分
   */
  private static calculateFastScore(input: string) {
    const triggers: string[] = []
    const reasons: string[] = []
    let score = 0

    // 检查快速触发词
    for (const trigger of this.FAST_TRIGGERS) {
      if (input.includes(trigger)) {
        triggers.push(trigger)
        score += 0.3
      }
    }

    if (triggers.length > 0) {
      reasons.push(`包含简单任务关键词: ${triggers.slice(0, 3).join(', ')}`)
    }

    // 短文本倾向于简单任务
    if (input.length <= 15) {
      score += 0.2
      reasons.push('输入简短，适合快速添加')
    }

    // 单一动作词
    const actionWords = input.split(/\s+/).length
    if (actionWords <= 3) {
      score += 0.1
      reasons.push('词汇简单，单一动作')
    }

    return { score: Math.min(score, 1.0), reasons, triggers }
  }

  /**
   * 计算复杂度得分
   */
  private static calculateComplexityScore(input: string) {
    const triggers: string[] = []
    const reasons: string[] = []
    let score = 0

    // 检查时间范围
    const timeMatches = Array.from(input.matchAll(this.COMPLEXITY_INDICATORS.timeframe))
    if (timeMatches.length > 0) {
      score += 0.3
      reasons.push(`包含时间规划: ${timeMatches[0][0]}`)
      triggers.push(timeMatches[0][0])
    }

    // 检查多步骤
    const stepMatches = Array.from(input.matchAll(this.COMPLEXITY_INDICATORS.multiStep))
    if (stepMatches.length > 0) {
      score += 0.2
      reasons.push('包含多步骤描述')
      triggers.push(...stepMatches.map(m => m[0]))
    }

    // 检查学习相关
    const learningMatches = Array.from(input.matchAll(this.COMPLEXITY_INDICATORS.learning))
    if (learningMatches.length > 0) {
      score += 0.2
      reasons.push('涉及学习内容')
      triggers.push(...learningMatches.map(m => m[0]))
    }

    // 检查项目相关
    const projectMatches = Array.from(input.matchAll(this.COMPLEXITY_INDICATORS.project))
    if (projectMatches.length > 0) {
      score += 0.2
      reasons.push('涉及项目开发')
      triggers.push(...projectMatches.map(m => m[0]))
    }

    return { score: Math.min(score, 1.0), reasons, triggers }
  }

  /**
   * 获取模式建议文案
   */
  static getModeRecommendationText(result: ModeDetectionResult): string {
    switch (result.suggestedMode) {
      case 'ai':
        return `检测到复杂目标，建议使用 AI 模式获得详细规划 (置信度: ${Math.round(result.confidence * 100)}%)`
      case 'fast':
        return `检测到简单任务，建议使用快速模式立即添加 (置信度: ${Math.round(result.confidence * 100)}%)`
      default:
        return '请选择合适的添加模式'
    }
  }
}
