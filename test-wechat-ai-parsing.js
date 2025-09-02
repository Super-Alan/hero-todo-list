/**
 * 测试微信消息的AI解析功能
 * 
 * 使用方法：
 * node test-wechat-ai-parsing.js
 */

const { messageProcessor } = require('./src/lib/wechat/message')

// 测试用例
const testCases = [
  // 基础任务
  "买菜",
  "明天下午3点开会",
  "今天晚上8点看电影 #娱乐",
  
  // 周期性任务
  "每天早上6点晨跑 #健康",
  "每周一下午3点团队会议 #工作 !重要",
  "每月15号交房租 #生活",
  "每工作日上午9点晨会",
  
  // 复杂任务
  "明天下午2-4点和客户讨论项目方案 #工作 !紧急",
  "每天晚上10点背诵英语单词30分钟 #学习",
  "后天提交季度报告 !重要",
  
  // 带描述的任务
  "准备演讲稿 明天截止 需要包含市场分析和竞品对比",
  "每周五下午整理办公室 清理垃圾和整理文件"
]

async function testWeChatParsing() {
  console.log('🚀 开始测试微信AI任务解析...\n')
  console.log('=' .repeat(80))
  
  // 模拟用户ID（实际使用时应该是真实的用户ID）
  const mockUserId = 'test-user-id'
  
  for (const testCase of testCases) {
    console.log(`\n📝 测试输入: "${testCase}"`)
    console.log('-'.repeat(60))
    
    try {
      // 调用消息处理器的任务创建方法
      const startTime = Date.now()
      const result = await messageProcessor.createTaskFromMessage(testCase, mockUserId)
      const parseTime = Date.now() - startTime
      
      console.log('✅ 解析成功！')
      console.log(`⏱️  解析耗时: ${parseTime}ms`)
      console.log('\n📋 解析结果:')
      console.log('  标题:', result.title)
      
      if (result.description) {
        console.log('  描述:', result.description)
      }
      
      if (result.dueDate) {
        console.log('  截止日期:', new Date(result.dueDate).toLocaleString('zh-CN'))
      }
      
      if (result.dueTime) {
        console.log('  具体时间:', new Date(result.dueTime).toLocaleString('zh-CN'))
      }
      
      if (result.timeDescription) {
        console.log('  时间描述:', result.timeDescription)
      }
      
      if (result.priority && result.priority !== 'MEDIUM') {
        console.log('  优先级:', result.priority)
      }
      
      if (result.tagIds && result.tagIds.length > 0) {
        console.log('  标签:', result.tagIds.join(', '))
      }
      
      if (result.isRecurring) {
        console.log('  🔄 周期性任务: 是')
        if (result.recurringRule) {
          try {
            const rule = JSON.parse(result.recurringRule)
            console.log('  周期规则:')
            console.log('    - 类型:', rule.type)
            console.log('    - 间隔:', rule.interval)
            if (rule.daysOfWeek) {
              const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
              const days = rule.daysOfWeek.map(d => dayNames[d]).join(', ')
              console.log('    - 星期:', days)
            }
            if (rule.dayOfMonth) {
              console.log('    - 每月日期:', rule.dayOfMonth + '号')
            }
          } catch (e) {
            console.log('  周期规则:', result.recurringRule)
          }
        }
      }
      
    } catch (error) {
      console.log('❌ 解析失败!')
      console.log('  错误:', error.message)
    }
    
    console.log('-'.repeat(60))
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('✨ 测试完成！')
  console.log(`📊 共测试 ${testCases.length} 个用例`)
  
  // 测试特殊情况
  console.log('\n' + '='.repeat(80))
  console.log('🔬 测试特殊情况...\n')
  
  // 测试空输入
  console.log('测试空输入...')
  const emptyResult = await messageProcessor.createTaskFromMessage('', mockUserId)
  console.log('空输入结果:', emptyResult)
  
  // 测试纯表情
  console.log('\n测试纯表情...')
  const emojiResult = await messageProcessor.createTaskFromMessage('😊😊😊', mockUserId)
  console.log('纯表情结果:', emojiResult)
  
  // 测试超长输入
  console.log('\n测试超长输入...')
  const longInput = '这是一个非常长的任务描述，' + '包含很多细节信息。'.repeat(10)
  const longResult = await messageProcessor.createTaskFromMessage(longInput, mockUserId)
  console.log('超长输入结果（标题长度）:', longResult.title.length)
  
  console.log('\n🎉 所有测试完成！')
}

// 运行测试
testWeChatParsing().catch(error => {
  console.error('测试过程中发生错误:', error)
  process.exit(1)
})