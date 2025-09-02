/**
 * Test WeChat AI Task Parsing with Model ID
 * 
 * This script tests the AI parsing functionality with a specific model ID
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
];

async function testWithModel() {
  console.log('🚀 Testing WeChat AI Task Parsing with Model...\n');
  console.log('=' .repeat(80));
  
  try {
    // Get the first active model
    const model = await prisma.modelProvider.findFirst({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    if (!model) {
      console.log('❌ No active AI model found in database!');
      console.log('Please configure an AI model first.');
      return;
    }
    
    console.log(`✅ Using model: ${model.name} (ID: ${model.id})\n`);
    console.log('=' .repeat(80));
    
    const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3010';
    
    for (const testCase of testCases) {
      console.log(`\n📝 Testing: "${testCase}"`);
      console.log('-'.repeat(60));
      
      try {
        const startTime = Date.now();
        
        // Call the AI parsing API with model ID
        const response = await fetch(`${apiUrl}/api/ai/parse-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: testCase,
            modelId: model.id
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
            try {
              const errorJson = JSON.parse(errorText);
              console.log('Error:', errorJson.error);
              if (errorJson.fallback) {
                console.log('Fallback provided:', errorJson.fallback);
              }
            } catch {
              console.log('Error details:', errorText);
            }
          }
        }
        
      } catch (error) {
        console.log('❌ Request Failed!');
        console.log('  Error:', error.message);
      }
      
      console.log('-'.repeat(60));
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✨ Test Complete!');
    console.log(`📊 Tested ${testCases.length} cases with model: ${model.name}`);
    
    // Test the WeChat message processor directly
    console.log('\n' + '='.repeat(80));
    console.log('🔬 Testing WeChat Message Processor...\n');
    
    // Import the message processor
    const { messageProcessor } = require('./dist/lib/wechat/message.js');
    
    const testMessage = "明天下午3点开会 #工作 !重要";
    console.log(`Testing direct message processing: "${testMessage}"`);
    
    try {
      const result = await messageProcessor.createTaskFromMessage(testMessage, 'test-user-id');
      console.log('✅ Direct processing successful!');
      console.log('Result:', result);
    } catch (error) {
      console.log('❌ Direct processing failed:', error.message);
      console.log('\nNote: The message processor is designed to work within the Next.js environment.');
      console.log('It should work correctly when called through the WeChat webhook.');
    }
    
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n🎉 All tests completed!');
  console.log('\n💡 The WeChat webhook will automatically use this model for parsing.');
}

// Run the tests
testWithModel();