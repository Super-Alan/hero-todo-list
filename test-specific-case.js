#!/usr/bin/env node

/**
 * 测试特定的周期性任务识别问题
 * 专门测试 "每日晚上 10 点背诵英语单词" 类型的输入
 */

const testCases = [
  // 问题案例
  {
    input: "每日晚上 10 点背诵英语单词",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      title: "背诵英语单词",
      hasTime: true
    },
    description: "原始问题用例"
  },
  
  // 类似的每日任务
  {
    input: "每日早上 8 点晨跑",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      title: "晨跑",
      hasTime: true
    },
    description: "每日早上任务"
  },
  {
    input: "每天下午 3 点喝水",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      title: "喝水",
      hasTime: true
    },
    description: "每天下午任务"
  },
  {
    input: "天天中午12点吃饭",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      title: "吃饭",
      hasTime: true
    },
    description: "天天中午任务"
  },
  
  // 对照组：非周期性任务
  {
    input: "明天晚上 10 点背诵英语单词",
    expected: {
      isRecurring: false,
      rule: null,
      title: "背诵英语单词",
      hasTime: true
    },
    description: "明天任务（非周期性）"
  },
  {
    input: "今天晚上10点开会",
    expected: {
      isRecurring: false,
      rule: null,
      title: "开会",
      hasTime: true
    },
    description: "今天任务（非周期性）"
  }
]

// 模拟检测函数（基于当前的parseRecurringPattern逻辑）
function detectRecurringPattern(input) {
  let title = input.trim()
  let isRecurring = false
  let rule = null

  console.log('🔍 分析输入:', input)

  // 每日/每天 - daily
  if (/每(日|天)|天天/.test(input)) {
    isRecurring = true
    rule = { type: 'daily', interval: 1 }
    title = title.replace(/(每)?(日|天)|天天/g, '').trim()
    console.log('  ✅ 检测到每日模式')
  }
  // 非周期性关键词检查
  else if (/明天|今天|后天/.test(input)) {
    console.log('  ❌ 检测到非周期性关键词')
    isRecurring = false
  }
  else {
    console.log('  ⚠️  未检测到周期性模式')
  }

  // 时间检测
  const timePattern = /((早上|上午|中午|下午|晚上)\s*\d{1,2}\s*[点时])/
  const hasTime = timePattern.test(input)
  
  if (hasTime) {
    // 清理时间信息
    title = title.replace(timePattern, '').trim()
    console.log('  🕐 检测到时间信息')
  }

  // 最终标题清理
  title = title.replace(/^\s*的?\s*/, '').trim()

  return {
    isRecurring,
    rule,
    cleanedTitle: title,
    hasTime
  }
}

async function runSpecificTest() {
  console.log('🧪 开始测试特定周期性任务识别问题...\n')
  
  let passed = 0
  let total = testCases.length
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`📝 测试用例 ${i + 1}: "${testCase.input}"`)
    console.log(`   描述: ${testCase.description}`)
    
    try {
      const result = detectRecurringPattern(testCase.input)
      
      // 检查结果
      let success = true
      const issues = []
      
      // 检查周期性
      if (result.isRecurring !== testCase.expected.isRecurring) {
        success = false
        issues.push(`❌ isRecurring: 期望 ${testCase.expected.isRecurring}, 实际 ${result.isRecurring}`)
      } else {
        console.log(`   ✅ isRecurring: ${result.isRecurring}`)
      }
      
      // 检查时间识别
      if (result.hasTime !== testCase.expected.hasTime) {
        success = false  
        issues.push(`❌ hasTime: 期望 ${testCase.expected.hasTime}, 实际 ${result.hasTime}`)
      } else {
        console.log(`   ✅ hasTime: ${result.hasTime}`)
      }
      
      // 检查标题清理
      if (result.cleanedTitle !== testCase.expected.title) {
        success = false
        issues.push(`❌ title: 期望 "${testCase.expected.title}", 实际 "${result.cleanedTitle}"`)
      } else {
        console.log(`   ✅ title: "${result.cleanedTitle}"`)
      }
      
      // 检查周期规则
      if (testCase.expected.isRecurring && testCase.expected.rule) {
        if (!result.rule) {
          success = false
          issues.push(`❌ rule: 期望规则对象, 实际 null`)
        } else if (result.rule.type !== testCase.expected.rule.type) {
          success = false
          issues.push(`❌ rule.type: 期望 ${testCase.expected.rule.type}, 实际 ${result.rule.type}`)
        } else {
          console.log(`   ✅ rule.type: ${result.rule.type}`)
        }
      }
      
      if (success) {
        console.log(`🎉 测试通过！`)
        passed++
      } else {
        console.log(`💥 测试失败:`)
        issues.forEach(issue => console.log(`     ${issue}`))
      }
      
    } catch (error) {
      console.log(`❌ 测试执行失败: ${error.message}`)
    }
    
    console.log('') // 空行分隔
  }
  
  // 测试结果汇总
  console.log(`📊 测试结果: ${passed}/${total} 通过 (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('🎉 所有测试都通过了！')
    return true
  } else {
    console.log('⚠️ 有测试失败，说明检测逻辑需要优化')
    
    // 分析失败原因
    console.log('\n🔧 建议修复方案:')
    console.log('1. 确保系统提示词明确要求优先识别周期性关键词')
    console.log('2. 在JSON示例中展示更多"每日+时间"的组合案例')
    console.log('3. 强调isRecurring字段的重要性和判断逻辑')
    console.log('4. 验证AI模型是否正确理解中文周期性表达')
    
    return false
  }
}

// 运行测试
if (require.main === module) {
  runSpecificTest().catch(error => {
    console.error('测试运行失败:', error)
    process.exit(1)
  })
}

module.exports = { runSpecificTest, testCases }