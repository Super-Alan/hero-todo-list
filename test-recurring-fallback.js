#!/usr/bin/env node

/**
 * 周期性任务Fallback解析器单元测试
 * 直接测试parseRecurringPattern函数
 */

// 模拟parseRecurringPattern函数
function parseRecurringPattern(input) {
  let title = input.trim()
  let isRecurring = false
  let rule = null

  console.log('🔄 [Fallback] Analyzing recurring pattern for:', input)

  // 每日/每天 - daily
  if (/每(日|天|天天)|天天/.test(input)) {
    isRecurring = true
    rule = { type: 'daily', interval: 1 }
    title = title.replace(/(每)?(日|天|天天)|天天/g, '').trim()
    console.log('📅 [Fallback] Detected daily pattern')
  }
  // 每工作日 - weekly with weekdays
  else if (/每?工作日/.test(input)) {
    isRecurring = true
    rule = { 
      type: 'weekly', 
      interval: 1,
      daysOfWeek: [1, 2, 3, 4, 5] // 周一到周五
    }
    title = title.replace(/每?工作日/g, '').trim()
    console.log('📅 [Fallback] Detected weekdays pattern')
  }
  // 每周 - weekly  
  else if (/每(周|星期)/.test(input)) {
    isRecurring = true
    rule = { type: 'weekly', interval: 1 }
    title = title.replace(/每(周|星期)/g, '').trim()
    
    // 检查是否指定了具体的星期几
    const weekdayMatch = input.match(/每?周([一二三四五六日])/)
    if (weekdayMatch) {
      const weekdays = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 }
      const day = weekdays[weekdayMatch[1]]
      if (day !== undefined) {
        rule.daysOfWeek = [day]
        title = title.replace(/每?周[一二三四五六日]/g, '').trim()
      }
    }
    console.log('📅 [Fallback] Detected weekly pattern:', rule)
  }
  // 每月 - monthly
  else if (/每(月|个月)/.test(input)) {
    isRecurring = true
    rule = { type: 'monthly', interval: 1 }
    title = title.replace(/每(月|个月)/g, '').trim()
    
    // 检查是否指定了具体日期
    const dayMatch = input.match(/每月(\d{1,2})([号日])/)
    if (dayMatch) {
      const day = parseInt(dayMatch[1])
      if (day >= 1 && day <= 31) {
        rule.dayOfMonth = day
        title = title.replace(/每月\d{1,2}[号日]/g, '').trim()
      }
    }
    console.log('📅 [Fallback] Detected monthly pattern:', rule)
  }
  // 每年 - yearly
  else if (/每年/.test(input)) {
    isRecurring = true
    rule = { type: 'yearly', interval: 1 }
    title = title.replace(/每年/g, '').trim()
    console.log('📅 [Fallback] Detected yearly pattern')
  }

  // 清理可能剩余的周期性关键词
  title = title.replace(/^(每|的)?\s*/, '').trim()
  
  return {
    isRecurring,
    rule,
    cleanedTitle: title
  }
}

// 测试用例
const testCases = [
  // 每日任务
  {
    input: "每日晚上 8 点前完成英语学习",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      cleanedTitle: "晚上 8 点前完成英语学习"
    }
  },
  {
    input: "每天早上 6 点晨跑",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      cleanedTitle: "早上 6 点晨跑"
    }
  },
  {
    input: "天天练习钢琴",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      cleanedTitle: "练习钢琴"
    }
  },
  
  // 工作日任务
  {
    input: "每工作日上午9点开始工作",
    expected: {
      isRecurring: true,
      rule: { type: "weekly", interval: 1, daysOfWeek: [1,2,3,4,5] },
      cleanedTitle: "上午9点开始工作"
    }
  },
  {
    input: "工作日检查邮件",
    expected: {
      isRecurring: true,
      rule: { type: "weekly", interval: 1, daysOfWeek: [1,2,3,4,5] },
      cleanedTitle: "检查邮件"
    }
  },
  
  // 每周任务
  {
    input: "每周一下午3点团队会议",
    expected: {
      isRecurring: true,
      rule: { type: "weekly", interval: 1, daysOfWeek: [1] },
      cleanedTitle: "下午3点团队会议"
    }
  },
  {
    input: "每周二上午10点例会",
    expected: {
      isRecurring: true,
      rule: { type: "weekly", interval: 1, daysOfWeek: [2] },
      cleanedTitle: "上午10点例会"
    }
  },
  {
    input: "每周健身三次",
    expected: {
      isRecurring: true,
      rule: { type: "weekly", interval: 1 },
      cleanedTitle: "健身三次"
    }
  },
  
  // 每月任务
  {
    input: "每月15号交房租",
    expected: {
      isRecurring: true,
      rule: { type: "monthly", interval: 1, dayOfMonth: 15 },
      cleanedTitle: "交房租"
    }
  },
  {
    input: "每月第一天查看账单",
    expected: {
      isRecurring: true,
      rule: { type: "monthly", interval: 1 },
      cleanedTitle: "第一天查看账单"
    }
  },
  
  // 每年任务
  {
    input: "每年体检",
    expected: {
      isRecurring: true,
      rule: { type: "yearly", interval: 1 },
      cleanedTitle: "体检"
    }
  },
  
  // 非周期性任务（对照组）
  {
    input: "明天下午3点开会",
    expected: {
      isRecurring: false,
      rule: null,
      cleanedTitle: "明天下午3点开会"
    }
  },
  {
    input: "完成项目报告",
    expected: {
      isRecurring: false,
      rule: null,
      cleanedTitle: "完成项目报告"
    }
  }
]

function testFallbackParser() {
  console.log('🧪 开始测试周期性任务Fallback解析器...\n')
  
  let passed = 0
  let total = testCases.length
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`📝 测试用例 ${i + 1}: "${testCase.input}"`)
    
    try {
      const result = parseRecurringPattern(testCase.input)
      
      // 检查结果
      let success = true
      const issues = []
      
      // 检查周期性
      if (result.isRecurring !== testCase.expected.isRecurring) {
        success = false
        issues.push(`isRecurring: 期望 ${testCase.expected.isRecurring}, 实际 ${result.isRecurring}`)
      }
      
      // 检查标题
      if (result.cleanedTitle !== testCase.expected.cleanedTitle) {
        success = false
        issues.push(`cleanedTitle: 期望 "${testCase.expected.cleanedTitle}", 实际 "${result.cleanedTitle}"`)
      }
      
      // 检查周期规则
      if (testCase.expected.isRecurring && testCase.expected.rule) {
        if (!result.rule) {
          success = false
          issues.push(`rule: 期望规则对象, 实际 null`)
        } else {
          const rule = result.rule
          const expectedRule = testCase.expected.rule
          
          if (rule.type !== expectedRule.type) {
            success = false
            issues.push(`rule.type: 期望 ${expectedRule.type}, 实际 ${rule.type}`)
          }
          
          if (rule.interval !== expectedRule.interval) {
            success = false
            issues.push(`rule.interval: 期望 ${expectedRule.interval}, 实际 ${rule.interval}`)
          }
          
          if (expectedRule.daysOfWeek) {
            if (!rule.daysOfWeek || JSON.stringify(rule.daysOfWeek.sort()) !== JSON.stringify(expectedRule.daysOfWeek.sort())) {
              success = false
              issues.push(`rule.daysOfWeek: 期望 [${expectedRule.daysOfWeek}], 实际 [${rule.daysOfWeek || 'null'}]`)
            }
          }
          
          if (expectedRule.dayOfMonth !== undefined) {
            if (rule.dayOfMonth !== expectedRule.dayOfMonth) {
              success = false
              issues.push(`rule.dayOfMonth: 期望 ${expectedRule.dayOfMonth}, 实际 ${rule.dayOfMonth}`)
            }
          }
        }
      }
      
      if (success) {
        console.log(`✅ 通过`)
        passed++
      } else {
        console.log(`❌ 失败:`)
        issues.forEach(issue => console.log(`   - ${issue}`))
      }
      
      // 显示解析结果
      console.log(`   解析结果:`, {
        cleanedTitle: result.cleanedTitle,
        isRecurring: result.isRecurring,
        rule: result.rule
      })
      
    } catch (error) {
      console.log(`❌ 测试执行失败: ${error.message}`)
    }
    
    console.log('') // 空行分隔
  }
  
  // 测试结果汇总
  console.log(`📊 测试结果: ${passed}/${total} 通过 (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('🎉 所有Fallback测试都通过了！')
    return true
  } else {
    console.log('⚠️ 有Fallback测试失败，需要进一步优化')
    return false
  }
}

// 运行测试
if (require.main === module) {
  const success = testFallbackParser()
  process.exit(success ? 0 : 1)
}

module.exports = { testFallbackParser }