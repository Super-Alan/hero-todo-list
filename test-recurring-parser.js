#!/usr/bin/env node

/**
 * 周期性任务解析测试脚本
 * 测试AI解析器对中文周期性任务表达的识别能力
 */

const testCases = [
  // 每日任务
  {
    input: "每日晚上 8 点前完成英语学习",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      title: "完成英语学习",
      time: "20:00"
    }
  },
  {
    input: "每天早上 6 点晨跑",
    expected: {
      isRecurring: true,
      rule: { type: "daily", interval: 1 },
      title: "晨跑",
      time: "06:00"
    }
  },
  
  // 工作日任务
  {
    input: "每工作日上午9点开始工作",
    expected: {
      isRecurring: true,
      rule: { type: "weekly", interval: 1, daysOfWeek: [1,2,3,4,5] },
      title: "开始工作",
      time: "09:00"
    }
  },
  
  // 每周任务
  {
    input: "每周一下午3点团队会议",
    expected: {
      isRecurring: true,
      rule: { type: "weekly", interval: 1, daysOfWeek: [1] },
      title: "团队会议",
      time: "15:00"
    }
  },
  {
    input: "每周二上午10点例会",
    expected: {
      isRecurring: true,
      rule: { type: "weekly", interval: 1, daysOfWeek: [2] },
      title: "例会",
      time: "10:00"
    }
  },
  
  // 每月任务
  {
    input: "每月15号交房租",
    expected: {
      isRecurring: true,
      rule: { type: "monthly", interval: 1, dayOfMonth: 15 },
      title: "交房租",
      time: null
    }
  },
  {
    input: "每月第一天查看账单",
    expected: {
      isRecurring: true,
      rule: { type: "monthly", interval: 1 },
      title: "查看账单",
      time: null
    }
  },
  
  // 每年任务
  {
    input: "每年体检",
    expected: {
      isRecurring: true,
      rule: { type: "yearly", interval: 1 },
      title: "体检",
      time: null
    }
  },
  
  // 非周期性任务（对照组）
  {
    input: "明天下午3点开会",
    expected: {
      isRecurring: false,
      rule: null,
      title: "开会",
      time: "15:00"
    }
  },
  {
    input: "完成项目报告",
    expected: {
      isRecurring: false,
      rule: null,
      title: "完成项目报告",
      time: null
    }
  }
]

async function testRecurringParser() {
  console.log('🧪 开始测试周期性任务解析器...\n')
  
  let passed = 0
  let total = testCases.length
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]
    console.log(`📝 测试用例 ${i + 1}: "${testCase.input}"`)
    
    try {
      // 调用AI解析API
      const response = await fetch('http://localhost:3000/api/ai/parse-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: testCase.input,
          modelId: 'test-model' // 需要一个有效的模型ID
        })
      })
      
      if (!response.ok) {
        console.log(`❌ API调用失败: ${response.status} ${response.statusText}`)
        continue
      }
      
      const result = await response.json()
      const data = result.success ? result.data : null
      
      if (!data) {
        console.log(`❌ 解析失败`)
        continue
      }
      
      // 检查结果
      let success = true
      const issues = []
      
      // 检查周期性
      if (data.isRecurring !== testCase.expected.isRecurring) {
        success = false
        issues.push(`isRecurring: 期望 ${testCase.expected.isRecurring}, 实际 ${data.isRecurring}`)
      }
      
      // 检查标题
      if (data.title.trim() !== testCase.expected.title) {
        success = false
        issues.push(`title: 期望 "${testCase.expected.title}", 实际 "${data.title.trim()}"`)
      }
      
      // 检查周期规则
      if (testCase.expected.isRecurring && data.recurringRule) {
        try {
          const rule = JSON.parse(data.recurringRule)
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
          
          if (expectedRule.dayOfMonth) {
            if (rule.dayOfMonth !== expectedRule.dayOfMonth) {
              success = false
              issues.push(`rule.dayOfMonth: 期望 ${expectedRule.dayOfMonth}, 实际 ${rule.dayOfMonth}`)
            }
          }
        } catch (error) {
          success = false
          issues.push(`周期规则解析失败: ${error.message}`)
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
        title: data.title,
        isRecurring: data.isRecurring,
        recurringRule: data.recurringRule ? JSON.parse(data.recurringRule) : null,
        dueDate: data.dueDate,
        dueTime: data.dueTime
      })
      
    } catch (error) {
      console.log(`❌ 测试执行失败: ${error.message}`)
    }
    
    console.log('') // 空行分隔
  }
  
  // 测试结果汇总
  console.log(`\n📊 测试结果: ${passed}/${total} 通过 (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('🎉 所有测试都通过了！')
    process.exit(0)
  } else {
    console.log('⚠️ 有测试失败，需要进一步优化')
    process.exit(1)
  }
}

// 运行测试
if (require.main === module) {
  testRecurringParser().catch(error => {
    console.error('测试运行失败:', error)
    process.exit(1)
  })
}

module.exports = { testCases, testRecurringParser }