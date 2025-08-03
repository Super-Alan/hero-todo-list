import { Priority } from '@/types'

export interface TaskQualityScore {
  totalScore: number
  breakdown: {
    specificity: number // 具体性 (0-20分)
    measurability: number // 可衡量性 (0-25分)
    timebound: number // 时限性 (0-20分)
    priority: number // 优先级 (0-20分)
    clarity: number // 清晰度 (0-15分)
  }
  suggestions: string[]
}

export class TaskQualityScorer {
  /**
   * 评估任务输入的质量
   * @param input 用户输入的任务文本
   * @returns 评分结果
   */
  static scoreTask(input: string): TaskQualityScore {
    const breakdown = {
      specificity: this.scoreSpecificity(input),
      measurability: this.scoreMeasurability(input),
      timebound: this.scoreTimebound(input),
      priority: this.scorePriority(input),
      clarity: this.scoreClarity(input)
    }

    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0)
    const suggestions = this.generateSuggestions(breakdown, input)

    return {
      totalScore,
      breakdown,
      suggestions
    }
  }

  /**
   * 评估任务的具体性 (0-20分)
   */
  private static scoreSpecificity(input: string): number {
    let score = 0
    const text = input.toLowerCase()

    // 检查否定词
    const negationWords = ['不', '别', '避免', '禁止', '不要', '不能', '不可', '勿']
    const hasNegation = negationWords.some(neg => text.includes(neg))

    // 基础分数：有具体动词（扩展同义词，特别是学习相关动词）
    const actionVerbs = [
      '完成', '写', '撰写', '编写', '做', '制作', '准备', '学习', '复习', '整理', '购买', '采购',
      '联系', '发送', '提交', '检查', '审查', '修改', '更新', '创建', '建立', '安排', '预约',
      '参加', '开会', '讨论', '分析', '研究', '设计', '开发', '测试', '部署', '优化',
      // 学习相关动词
      '阅读', '通读', '精读', '浏览', '标记', '摘抄', '记录', '背诵', '默写', '练习',
      '预习', '温习', '听课', '做题', '解题', '思考', '理解', '掌握', '记忆', '背书'
    ]
    
    // 使用正则避免误匹配，且排除否定句
    const hasActionVerb = actionVerbs.some(verb => {
      const regex = new RegExp(`(?<!不|别|避免|禁止|不要|不能|不可|勿)${verb}`, 'g')
      return regex.test(text)
    })
    
    if (hasActionVerb && !hasNegation) {
      score += 8
    }

    // 有具体对象或内容
    if (text.length > 10) {
      score += 4
    }

    // 包含数量词
    const quantifiers = ['个', '份', '页', '章', '节', '次', '遍', '小时', '分钟', '天', '周', '月', '件', '项', '条', '篇']
    if (quantifiers.some(q => text.includes(q))) {
      score += 4
    }

    // 包含具体地点或平台
    const locations = ['在', '到', '去', '从', '网上', '线上', '线下', '家里', '公司', '学校', '图书馆', '办公室', '会议室']
    if (locations.some(loc => text.includes(loc))) {
      score += 4
    }

    // 识别多步骤任务（结构化任务奖励）
    const stepIndicators = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '第一', '第二', '第三', '首先', '然后', '最后', '接着', '其次']
    if (stepIndicators.some(indicator => text.includes(indicator))) {
      score += 3 // 多步骤任务奖励
    }

    return Math.min(score, 20)
  }

  /**
   * 评估任务的可衡量性 (0-25分)
   */
  private static scoreMeasurability(input: string): number {
    let score = 0
    const text = input.toLowerCase()

    // 包含具体数字（更精确的匹配）
    const numberMatches = text.match(/\d+/g)
    if (numberMatches) {
      score += Math.min(numberMatches.length * 3, 10) // 每个数字3分，最多10分
    }

    // 包含完成标准的词汇（扩展词汇）
    const completionWords = [
      '完成', '结束', '提交', '发布', '上线', '交付', '达到', '实现', '搞定', '弄好',
      '做完', '写完', '看完', '学完', '背完', '记住', '掌握', '理解'
    ]
    if (completionWords.some(word => text.includes(word))) {
      score += 8
    }

    // 包含量化词汇（更全面，包括学习相关量化表达）
    const quantWords = [
      '全部', '所有', '一半', '部分', '至少', '最多', '超过', '不少于', '不超过',
      '大约', '左右', '以上', '以下', '之间', '每', '各', '若干',
      // 学习相关量化表达
      '约', '大概', '章节', '段落', '句子', '感想', '心得', '笔记', '要点', '总结'
    ]
    if (quantWords.some(word => text.includes(word))) {
      score += 7
    }

    return Math.min(score, 25)
  }

  /**
   * 评估任务的时限性 (0-20分)
   */
  private static scoreTimebound(input: string): number {
    let score = 0
    const text = input.toLowerCase()

    // 包含具体时间（更严格的验证）
    const timePatterns = [
      /\d{1,2}[：:点]\d{0,2}分?/, // 具体时间点
      /\d{1,2}[月\/]\d{1,2}[日号]?/, // 具体日期
      /\d{4}[年\/]\d{1,2}[月\/]\d{1,2}/, // 完整日期
    ]
    
    let hasValidTime = false
    timePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        // 简单验证时间合理性
        const timeStr = matches[0]
        if (timeStr.includes('点') || timeStr.includes(':')) {
          const hour = parseInt(timeStr.match(/\d{1,2}/)?.[0] || '0')
          if (hour >= 0 && hour <= 23) hasValidTime = true
        } else {
          hasValidTime = true
        }
      }
    })
    
    if (hasValidTime) {
      score += 12
    }

    // 包含相对时间（避免矛盾时间）
    const relativeTime = [
      '今天', '明天', '后天', '大后天', '本周', '下周', '本月', '下月', '今年', '明年',
      '周一', '周二', '周三', '周四', '周五', '周六', '周日',
      '今晚', '今早', '明早', '明晚', '后天早上', '后天晚上',
      '这周', '下周一', '下周二', '下周三', '下周四', '下周五', '下周六', '下周日'
    ]
    
    // 检查是否有矛盾的时间表达
    const contradictoryPairs = [
      ['今天', '明天'], ['明天', '后天'], ['上午', '下午'], ['早上', '晚上']
    ]
    
    let hasContradiction = false
    contradictoryPairs.forEach(pair => {
      if (pair.every(time => text.includes(time))) {
        hasContradiction = true
      }
    })
    
    if (relativeTime.some(time => text.includes(time)) && !hasContradiction) {
      score += 6
    }

    // 包含时间范围
    const timeRange = ['上午', '下午', '晚上', '早上', '中午', '夜里', '深夜', '凌晨']
    if (timeRange.some(range => text.includes(range))) {
      score += 2
    }

    return Math.min(score, 20)
  }

  /**
   * 评估任务的优先级 (0-20分)
   */
  private static scorePriority(input: string): number {
    let score = 0
    const text = input.toLowerCase()

    // 包含优先级关键词（扩展并分级）
    const highPriorityWords = ['紧急', '急', '火急', '立即', '马上', '赶紧', '优先']
    const mediumPriorityWords = ['重要', '关键', '核心', '主要']
    const lowPriorityWords = ['一般', '普通', '常规', '低', '次要']
    
    if (highPriorityWords.some(word => text.includes(word))) {
      score += 12
    } else if (mediumPriorityWords.some(word => text.includes(word))) {
      score += 8
    } else if (lowPriorityWords.some(word => text.includes(word))) {
      score += 4
    }

    // 包含标签或分类
    if (text.includes('@') || text.includes('#')) {
      score += 4
    }
    
    // 包含项目或类别信息
    const categoryWords = ['工作', '学习', '生活', '健康', '娱乐', '社交', '家庭', '个人']
    if (categoryWords.some(word => text.includes(word))) {
      score += 4
    }

    // 学习任务识别（阅读、课程等）
    const learningKeywords = ['阅读', '学习', '复习', '背书', '做题', '练习', '课程', '教材', '书籍', '听课', '预习']
    if (learningKeywords.some(word => text.includes(word))) {
      score += 4 // 学习类任务基础分
    }

    // 书籍/课程名称识别（《》书名号）
    if (text.includes('《') && text.includes('》')) {
      score += 4 // 有具体学习材料
    }

    return Math.min(score, 20)
  }

  /**
   * 评估任务的清晰度 (0-15分)
   */
  private static scoreClarity(input: string): number {
    let score = 0
    const text = input.trim()

    // 长度适中 (5-50字符)
    if (text.length >= 5 && text.length <= 50) {
      score += 8
    } else if (text.length > 50 && text.length <= 100) {
      score += 5
    } else if (text.length < 5) {
      score += 2
    }

    // 没有过多的标点符号（排除emoji符号）
    const punctuationCount = (text.match(/[！!？?。.，,；;：:](?![️⃣])/g) || []).length
    if (punctuationCount <= 3) {
      score += 4
    }

    // 对结构化任务给予奖励（使用emoji编号或数字编号）
    if (text.includes('1️⃣') || text.includes('2️⃣') || /\d+[、.]/.test(text)) {
      score += 2 // 结构化任务奖励
    }

    // 语法结构合理（主谓宾结构）
    if (text.length > 3 && !text.includes('？') && !text.includes('?')) {
      score += 3
    }

    return Math.min(score, 15)
  }

  /**
   * 根据评分结果生成改进建议
   */
  private static generateSuggestions(breakdown: TaskQualityScore['breakdown'], input: string): string[] {
    const suggestions: string[] = []
    const text = input.toLowerCase()

    // 检查是否有否定词影响
    const negationWords = ['不', '别', '避免', '禁止', '不要', '不能', '不可', '勿']
    const hasNegation = negationWords.some(neg => text.includes(neg))
    
    if (hasNegation) {
      suggestions.push('检测到否定表达，建议改为正面的行动描述')
    }

    if (breakdown.specificity < 12) {
      suggestions.push('任务描述可以更具体，明确要做什么、在哪里做、用什么方式')
    }

    if (breakdown.measurability < 15) {
      suggestions.push('建议添加量化指标，如数量、时长、完成标准等')
    }

    if (breakdown.timebound < 12) {
      suggestions.push('建议设置明确的截止时间或时间范围')
    }

    if (breakdown.priority < 12) {
      suggestions.push('可以标注任务的重要程度、紧急程度或添加分类标签')
    }

    if (breakdown.clarity < 8) {
      if (input.length < 5) {
        suggestions.push('任务描述过于简短，建议补充更多细节')
      } else if (input.length > 100) {
        suggestions.push('任务描述过长，建议精简表达或拆分为多个子任务')
      } else {
        suggestions.push('任务表达可以更清晰，避免歧义')
      }
    }

    // 检查复合任务
    const conjunctions = ['和', '与', '以及', '并且', '还要', '同时', '另外']
    if (conjunctions.some(conj => text.includes(conj))) {
      suggestions.push('检测到复合任务，建议拆分为多个独立的子任务')
    }

    return suggestions
  }
}

export const taskQualityScorer = new TaskQualityScorer()