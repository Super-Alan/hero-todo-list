/**
 * Test WeChat AI Task Parsing via API
 * 
 * This script tests the AI parsing functionality through the API endpoint
 * to verify that WeChat messages are properly parsed using AI models.
 */

const testCases = [
  // Basic tasks
  "买菜",
  "明天下午3点开会",
  "今天晚上8点看电影 #娱乐",
  
  // Recurring tasks
  "每天早上6点晨跑 #健康",
  "每周一下午3点团队会议 #工作 !重要",
  "每月15号交房租 #生活",
  
  // Complex tasks
  "明天下午2-4点和客户讨论项目方案 #工作 !紧急",
  "后天提交季度报告 !重要",
  
  // Tasks with descriptions
  "准备演讲稿 明天截止 需要包含市场分析和竞品对比",
  "每周五下午整理办公室 清理垃圾和整理文件"
];

async function testAIParsing() {
  console.log('🚀 Testing WeChat AI Task Parsing via API...\n');
  console.log('=' .repeat(80));
  
  const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3010';
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase}"`);
    console.log('-'.repeat(60));
    
    try {
      const startTime = Date.now();
      
      // Call the AI parsing API directly
      const response = await fetch(`${apiUrl}/api/ai/parse-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: testCase,
          // Note: In production, this would use the user's configured model
          // For testing, we'll let it use the default
        })
      });
      
      const parseTime = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ AI Parsing Successful!');
          console.log(`⏱️  Response time: ${parseTime}ms`);
          console.log('\n📋 Parsed Result:');
          console.log('  Title:', result.data.title);
          
          if (result.data.description) {
            console.log('  Description:', result.data.description);
          }
          
          if (result.data.dueDate) {
            console.log('  Due Date:', new Date(result.data.dueDate).toLocaleString('zh-CN'));
          }
          
          if (result.data.dueTime) {
            console.log('  Due Time:', new Date(result.data.dueTime).toLocaleString('zh-CN'));
          }
          
          if (result.data.priority && result.data.priority !== 'MEDIUM') {
            console.log('  Priority:', result.data.priority);
          }
          
          if (result.data.tagIds && result.data.tagIds.length > 0) {
            console.log('  Tags:', result.data.tagIds.join(', '));
          }
          
          if (result.data.isRecurring) {
            console.log('  🔄 Recurring: Yes');
            if (result.data.recurringRule) {
              try {
                const rule = JSON.parse(result.data.recurringRule);
                console.log('  Recurring Pattern:');
                console.log('    - Type:', rule.type);
                console.log('    - Interval:', rule.interval);
                if (rule.daysOfWeek) {
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const days = rule.daysOfWeek.map(d => dayNames[d]).join(', ');
                  console.log('    - Days:', days);
                }
                if (rule.dayOfMonth) {
                  console.log('    - Day of Month:', rule.dayOfMonth);
                }
              } catch (e) {
                console.log('  Recurring Rule:', result.data.recurringRule);
              }
            }
          }
        } else {
          console.log('⚠️  API returned success but no data');
          console.log('Response:', result);
        }
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        if (errorText) {
          console.log('Error details:', errorText);
        }
      }
      
    } catch (error) {
      console.log('❌ Request Failed!');
      console.log('  Error:', error.message);
      if (error.cause) {
        console.log('  Cause:', error.cause);
      }
    }
    
    console.log('-'.repeat(60));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✨ Test Complete!');
  console.log(`📊 Tested ${testCases.length} cases`);
  
  // Test edge cases
  console.log('\n' + '='.repeat(80));
  console.log('🔬 Testing Edge Cases...\n');
  
  const edgeCases = [
    { input: '', description: 'Empty input' },
    { input: '😊😊😊', description: 'Pure emojis' },
    { input: '这是一个非常长的任务描述，' + '包含很多细节信息。'.repeat(10), description: 'Very long input' }
  ];
  
  for (const edgeCase of edgeCases) {
    console.log(`Testing ${edgeCase.description}...`);
    try {
      const response = await fetch(`${apiUrl}/api/ai/parse-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: edgeCase.input
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log(`✅ Handled: Title = "${result.data.title.substring(0, 50)}${result.data.title.length > 50 ? '...' : ''}"`);
        } else {
          console.log('⚠️  No data returned');
        }
      } else {
        console.log(`❌ Error: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎉 All tests completed!');
  console.log('\n💡 Note: In production, WeChat webhook will use the user\'s configured AI model.');
  console.log('   This test uses the API directly without authentication.');
}

// Run the tests
testAIParsing().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});