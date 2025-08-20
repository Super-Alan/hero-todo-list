import { Priority } from '@/types'

export interface TaskExample {
  original: string
  improved: string
  explanation: string
  category: 'study' | 'project' | 'daily' | 'skill' | 'exam'
}

export interface TaskGuideResult {
  score: number
  issues: string[]
  suggestions: string[]
  examples: TaskExample[]
  quickFixes: string[]
  learningTips: string[]
}

/**
 * 学生任务指导系统
 * 专门为学生群体设计的任务优化和指导工具
 */
export class StudentTaskGuide {
  
  /**
   * 分析学生输入的任务并提供综合指导
   */
  static analyzeStudentTask(input: string): TaskGuideResult {
    const cleanInput = input.trim().toLowerCase()
    const issues: string[] = []
    const suggestions: string[] = []
    const quickFixes: string[] = []
    const learningTips: string[] = []
    
    let score = 60 // 基础分数
    
    // 检测任务类别
    const category = this.detectTaskCategory(cleanInput)
    
    // 检测常见问题
    const problemAnalysis = this.detectCommonProblems(cleanInput)
    issues.push(...problemAnalysis.issues)
    score -= problemAnalysis.penalty
    
    // 生成针对性建议
    const categoryAdvice = this.getCategorySpecificAdvice(category, cleanInput)
    suggestions.push(...categoryAdvice.suggestions)
    quickFixes.push(...categoryAdvice.quickFixes)
    
    // 获取相关样例
    const examples = this.getRelevantExamples(category, cleanInput)
    
    // 添加学习技巧
    learningTips.push(...this.getLearningTips(category, cleanInput))
    
    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      suggestions,
      examples,
      quickFixes,
      learningTips
    }
  }
  
  /**
   * 检测任务类别
   */
  private static detectTaskCategory(input: string): TaskExample['category'] {
    const studyKeywords = ['学习', '复习', '背书', '看书', '阅读', '记忆', '理解', '掌握', '预习', '听课']
    const projectKeywords = ['项目', '作业', '报告', '论文', '设计', '制作', '完成', '提交']
    const examKeywords = ['考试', '测验', '期中', '期末', '模拟', '练习题', '真题', '刷题']
    const skillKeywords = ['练习', '训练', '学会', '掌握', '熟练', '提高', '改进', '技能']
    
    if (examKeywords.some(keyword => input.includes(keyword))) return 'exam'
    if (projectKeywords.some(keyword => input.includes(keyword))) return 'project'
    if (skillKeywords.some(keyword => input.includes(keyword))) return 'skill'
    if (studyKeywords.some(keyword => input.includes(keyword))) return 'study'
    
    return 'daily'
  }
  
  /**
   * 检测常见问题
   */
  private static detectCommonProblems(input: string): { issues: string[], penalty: number } {
    const issues: string[] = []
    let penalty = 0
    
    // 问题1: 任务太宽泛
    const vagueKeywords = ['学好', '搞懂', '弄会', '了解一下', '看看', '学学']
    if (vagueKeywords.some(keyword => input.includes(keyword))) {
      issues.push('任务描述过于宽泛，缺乏具体的行动和目标')
      penalty += 20
    }
    
    // 问题2: 缺少时间限制
    const hasTime = /\d+[点时分秒天周月]|今天|明天|本周|下周/.test(input)
    if (!hasTime) {
      issues.push('缺少明确的时间限制，建议设定具体的完成时间')
      penalty += 15
    }
    
    // 问题3: 没有量化指标
    const hasQuantity = /\d+[页章节题道遍次]|全部|完整|所有/.test(input)
    if (!hasQuantity) {
      issues.push('缺少量化的完成标准，建议明确具体的数量或范围')
      penalty += 15
    }
    
    // 问题4: 任务过于复杂
    const complexKeywords = ['和', '并且', '以及', '同时', '还要', '另外']
    if (complexKeywords.some(keyword => input.includes(keyword))) {
      issues.push('任务可能包含多个目标，建议拆分为独立的子任务')
      penalty += 10
    }
    
    // 问题5: 消极表达
    const negativeKeywords = ['不要', '别', '避免', '不能']
    if (negativeKeywords.some(keyword => input.includes(keyword))) {
      issues.push('建议用积极的行动词汇替代消极表达')
      penalty += 10
    }
    
    // 问题6: 任务过短
    if (input.length < 4) {
      issues.push('任务描述过于简单，建议补充更多细节')
      penalty += 20
    }
    
    return { issues, penalty }
  }
  
  /**
   * 获取分类特定建议
   */
  private static getCategorySpecificAdvice(
    category: TaskExample['category'], 
    input: string
  ): { suggestions: string[], quickFixes: string[] } {
    const suggestions: string[] = []
    const quickFixes: string[] = []
    
    switch (category) {
      case 'study':
        suggestions.push(
          '学习任务建议包含：具体的学习材料、学习方法、完成标准',
          '可以设定阶段性目标，比如先理解概念，再做练习',
          '建议安排复习时间，巩固学习效果'
        )
        quickFixes.push(
          '添加具体书名或章节：《xxx》第x章',
          '明确学习方法：阅读+笔记+总结',
          '设定完成标准：能够回答章节后的练习题'
        )
        break
        
      case 'project':
        suggestions.push(
          '项目任务建议分解为多个阶段：调研、规划、执行、检查',
          '明确交付物和质量标准',
          '设定里程碑时间节点'
        )
        quickFixes.push(
          '添加具体交付物：完成xxx报告/设计稿',
          '设定质量标准：不少于xxxx字/包含x个部分',
          '分阶段时间安排：第一周调研，第二周执行'
        )
        break
        
      case 'exam':
        suggestions.push(
          '考试准备建议制定详细复习计划',
          '区分重点和非重点内容',
          '安排模拟练习和真题训练'
        )
        quickFixes.push(
          '明确复习范围：第x章到第x章',
          '设定练习量：每天x道题',
          '安排模拟考试：周末进行全真模拟'
        )
        break
        
      case 'skill':
        suggestions.push(
          '技能练习建议设定递进式目标',
          '明确练习方法和频次',
          '设置检验标准'
        )
        quickFixes.push(
          '设定练习时长：每天练习x小时',
          '明确练习内容：重点练习xx技巧',
          '设置检验标准：能够独立完成xx'
        )
        break
        
      case 'daily':
        suggestions.push(
          '日常任务建议设定具体的执行时间',
          '明确完成后的具体状态',
          '考虑任务的优先级'
        )
        quickFixes.push(
          '添加具体时间：明天上午/下午x点',
          '明确完成标准：整理完成/购买齐全',
          '标注重要程度：重要/紧急/一般'
        )
        break
    }
    
    return { suggestions, quickFixes }
  }
  
  /**
   * 获取相关示例
   */
  private static getRelevantExamples(
    category: TaskExample['category'], 
    input: string
  ): TaskExample[] {
    const allExamples = this.getTaskExamples()
    
    // 先找同类别的示例
    let examples = allExamples.filter(example => example.category === category)
    
    // 如果同类别示例不足，补充其他类别
    if (examples.length < 2) {
      const otherExamples = allExamples.filter(example => example.category !== category)
      examples = [...examples, ...otherExamples.slice(0, 3 - examples.length)]
    }
    
    return examples.slice(0, 3)
  }
  
  /**
   * 获取任务示例库
   */
  private static getTaskExamples(): TaskExample[] {
    return [
      // 学习类示例
      {
        original: '学习英语',
        improved: '今晚8-9点阅读《新概念英语2》第15-17课，完成课后练习题，背诵5个生词',
        explanation: '明确了具体时间、学习材料、学习内容和完成标准',
        category: 'study'
      },
      {
        original: '复习数学',
        improved: '明天下午2-4点复习高等数学第3章极限，完成课后习题1-20题，整理错题笔记',
        explanation: '指定了时间、具体章节、练习数量和后续行动',
        category: 'study'
      },
      {
        original: '看书',
        improved: '本周内读完《人类简史》第1-3章，每章写200字读书笔记，记录3个核心观点',
        explanation: '明确了阅读范围、时间限制、输出要求和质量标准',
        category: 'study'
      },
      
      // 项目类示例
      {
        original: '做作业',
        improved: '周三前完成《计算机网络》课程作业：设计一个简单的网络拓扑图，包含至少5个节点，撰写500字说明文档',
        explanation: '指定了截止时间、具体作业内容、技术要求和文档要求',
        category: 'project'
      },
      {
        original: '写论文',
        improved: '本月内完成毕业论文第二章文献综述，梳理20篇相关文献，撰写3000字综述，建立参考文献库',
        explanation: '设定了时间范围、具体章节、工作量要求和可衡量的成果',
        category: 'project'
      },
      
      // 考试类示例
      {
        original: '准备考试',
        improved: '为下周二的线性代数期中考试准备：复习第1-6章，完成3套历年真题，整理公式清单',
        explanation: '明确了考试时间、复习范围、练习数量和准备成果',
        category: 'exam'
      },
      {
        original: '刷题',
        improved: '每天晚上9-10点做10道概率统计选择题，错题记录在错题本中，周末复习一遍',
        explanation: '规定了固定时间、具体数量、错题处理和复习安排',
        category: 'exam'
      },
      
      // 技能类示例
      {
        original: '练习编程',
        improved: '每天晚上7-8点练习Python编程，完成LeetCode上2道算法题，重点练习递归和动态规划',
        explanation: '设定了固定时间、具体平台、练习量和重点方向',
        category: 'skill'
      },
      {
        original: '学开车',
        improved: '本周末预约2小时驾校练习，重点练习侧方停车和倒车入库，达到连续3次成功的标准',
        explanation: '明确了时间安排、练习项目和成功标准',
        category: 'skill'
      },
      
      // 日常类示例
      {
        original: '整理房间',
        improved: '明天上午10-11点整理卧室：归置衣物、清理桌面、扔掉过期物品，达到能邀请朋友来访的整洁度',
        explanation: '指定了具体时间、整理范围、具体行动和完成标准',
        category: 'daily'
      },
      {
        original: '买东西',
        improved: '今晚下班后到超市购买本周食材：蔬菜、水果、肉类各3样，控制预算在200元内',
        explanation: '明确了时间、地点、购买类别、数量和预算限制',
        category: 'daily'
      }
    ]
  }
  
  /**
   * 获取学习技巧
   */
  private static getLearningTips(
    category: TaskExample['category'], 
    input: string
  ): string[] {
    const tips: string[] = []
    
    // 通用技巧
    tips.push('💡 使用番茄工作法：25分钟专注 + 5分钟休息')
    
    switch (category) {
      case 'study':
        tips.push(
          '📚 学习技巧：先概览 → 详读 → 总结 → 复习',
          '✍️ 记笔记时使用思维导图或康奈尔笔记法',
          '🔄 艾宾浩斯遗忘曲线：1天、3天、7天、15天后复习'
        )
        break
        
      case 'project':
        tips.push(
          '📋 项目管理：分解任务 → 评估时间 → 制定计划 → 监控进度',
          '⏰ 时间管理：为每个子任务预留20%的缓冲时间',
          '✅ 定期检查：设置里程碑，及时调整计划'
        )
        break
        
      case 'exam':
        tips.push(
          '📖 复习策略：重点突出，先难后易',
          '📝 错题管理：建立错题库，定期回顾',
          '🎯 模拟练习：按考试时间和环境进行全真模拟'
        )
        break
        
      case 'skill':
        tips.push(
          '🎯 刻意练习：专注薄弱环节，保持适度挑战',
          '📊 记录进步：用数据追踪练习效果',
          '👥 寻求反馈：请教老师或同学，获得改进建议'
        )
        break
        
      case 'daily':
        tips.push(
          '⭐ 优先级管理：重要紧急 > 重要不紧急 > 紧急不重要',
          '🔔 提醒设置：使用手机提醒或便签提醒',
          '🎉 奖励机制：完成任务后给自己小奖励'
        )
        break
    }
    
    return tips
  }
  
  /**
   * 生成快速优化建议
   */
  static generateQuickOptimization(input: string): string[] {
    const optimizations: string[] = []
    const cleanInput = input.trim()
    
    // 添加时间限制
    if (!/\d+[点时分秒天周月]|今天|明天|本周|下周/.test(input)) {
      optimizations.push(`${cleanInput} → 今天下午完成${cleanInput}`)
    }
    
    // 添加数量限制
    if (!/\d+[页章节题道遍次]/.test(input)) {
      if (input.includes('阅读') || input.includes('看书')) {
        optimizations.push(`${cleanInput} → ${cleanInput}20页`)
      } else if (input.includes('练习') || input.includes('做题')) {
        optimizations.push(`${cleanInput} → ${cleanInput}10道`)
      } else {
        optimizations.push(`${cleanInput} → 完成${cleanInput}的核心部分`)
      }
    }
    
    // 添加具体方法
    if (input.includes('学习') && !input.includes('方法')) {
      optimizations.push(`${cleanInput} → ${cleanInput}，通过阅读+笔记+练习的方式`)
    }
    
    return optimizations.slice(0, 3)
  }
}