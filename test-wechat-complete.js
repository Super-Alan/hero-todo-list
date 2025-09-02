/**
 * 完整测试微信 AI 任务解析功能
 * 包括普通任务和周期性任务
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 测试用例 - 涵盖各种场景
const testCases = [
  // 普通任务
  { input: "买菜", type: "simple" },
  { input: "明天下午3点开会 #工作", type: "normal" },
  { input: "后天提交报告 !重要", type: "priority" },
  
  // 周期性任务 - 每日
  { input: "每日晚间10点学习英语", type: "recurring-daily" },
  { input: "每天早上6点晨跑 #健康", type: "recurring-daily" },
  { input: "每天晚上11点睡觉", type: "recurring-daily" },
  
  // 周期性任务 - 每周
  { input: "每周一下午3点团队会议 #工作 !重要", type: "recurring-weekly" },
  { input: "每周五晚上7点家庭聚餐", type: "recurring-weekly" },
  { input: "每周三和周五健身 #运动", type: "recurring-weekly" },
  
  // 周期性任务 - 每月
  { input: "每月15号交房租 #生活", type: "recurring-monthly" },
  { input: "每月1号整理财务报表", type: "recurring-monthly" },
  
  // 周期性任务 - 工作日
  { input: "每个工作日上午9点晨会", type: "recurring-workday" },
  { input: "工作日下午5点写日报", type: "recurring-workday" },
  
  // 复杂任务
  { input: "每天早上8点到9点学习编程 #学习", type: "recurring-complex" },
  { input: "每周一三五下午2点项目评审 #工作 !重要", type: "recurring-complex" },
];

async function testCompleteFlow() {
  console.log('🚀 完整测试微信 AI 任务解析\n');
  console.log('=' .repeat(80));
  
  try {
    // 获取可用的 AI 模型
    const model = await prisma.modelProvider.findFirst({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    if (!model) {
      console.log('❌ 没有找到可用的 AI 模型！');
      console.log('请先配置 AI 模型。');
      return;
    }
    
    console.log(`✅ 使用 AI 模型: ${model.name}`);
    console.log(`   ID: ${model.id}\n`);
    console.log('=' .repeat(80));
    
    const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3010';
    
    // 统计结果
    const stats = {
      total: testCases.length,
      success: 0,
      failed: 0,
      recurring: {
        expected: 0,
        detected: 0
      },
      byType: {}
    };
    
    // 计算预期的周期性任务数量
    stats.recurring.expected = testCases.filter(tc => tc.type.includes('recurring')).length;
    
    // 测试每个用例
    for (const testCase of testCases) {
      console.log(`\n📝 测试: "${testCase.input}"`);
      console.log(`   类型: ${testCase.type}`);
      console.log('-'.repeat(60));
      
      try {
        const startTime = Date.now();
        
        // 调用 AI 解析 API
        const response = await fetch(`${apiUrl}/api/ai/parse-task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: testCase.input,
            modelId: model.id
          })
        });
        
        const parseTime = Date.now() - startTime;
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            stats.success++;
            
            // 统计类型
            if (!stats.byType[testCase.type]) {
              stats.byType[testCase.type] = { total: 0, success: 0 };
            }
            stats.byType[testCase.type].total++;
            stats.byType[testCase.type].success++;
            
            console.log('✅ 解析成功！');
            console.log(`⏱️  响应时间: ${parseTime}ms`);
            console.log('\n📋 解析结果:');
            console.log('  标题:', result.data.title);
            
            if (result.data.description) {
              console.log('  描述:', result.data.description);
            }
            
            if (result.data.dueDate) {
              const date = new Date(result.data.dueDate);
              console.log('  日期:', date.toLocaleDateString('zh-CN'));
            }
            
            if (result.data.dueTime) {
              const time = new Date(result.data.dueTime);
              console.log('  时间:', time.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              }));
            }
            
            if (result.data.priority && result.data.priority !== 'MEDIUM') {
              console.log('  优先级:', result.data.priority);
            }
            
            if (result.data.tagIds && result.data.tagIds.length > 0) {
              console.log('  标签:', result.data.tagIds.join(', '));
            }
            
            // 重点检查周期性任务
            if (testCase.type.includes('recurring')) {
              if (result.data.isRecurring) {
                stats.recurring.detected++;
                console.log('  🔄 周期性: ✅ 正确识别');
                
                if (result.data.recurringRule) {
                  try {
                    const rule = JSON.parse(result.data.recurringRule);
                    console.log('  📅 周期规则:');
                    console.log('    - 类型:', rule.type);
                    console.log('    - 间隔:', rule.interval);
                    
                    if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
                      const cnDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                      const days = rule.daysOfWeek.map(d => cnDays[d]).join(', ');
                      console.log('    - 星期:', days);
                    }
                    
                    if (rule.dayOfMonth) {
                      console.log('    - 每月日期:', rule.dayOfMonth + '号');
                    }
                    
                    if (rule.weekdays !== undefined) {
                      console.log('    - 仅工作日:', rule.weekdays ? '是' : '否');
                    }
                    
                    if (rule.time) {
                      console.log('    - 时间:', rule.time);
                    }
                  } catch (e) {
                    console.log('  周期规则 (原始):', result.data.recurringRule);
                  }
                }
              } else {
                console.log('  🔄 周期性: ❌ 未识别（应该是周期性任务）');
              }
            } else {
              if (result.data.isRecurring) {
                console.log('  🔄 周期性: ⚠️ 误判（不应该是周期性任务）');
              } else {
                console.log('  🔄 周期性: ✅ 正确（非周期性）');
              }
            }
            
          } else {
            stats.failed++;
            console.log('⚠️  API 返回成功但没有数据');
          }
        } else {
          stats.failed++;
          console.log(`❌ API 错误: ${response.status}`);
        }
        
      } catch (error) {
        stats.failed++;
        console.log('❌ 请求失败:', error.message);
      }
      
      console.log('-'.repeat(60));
    }
    
    // 打印总结
    console.log('\n' + '='.repeat(80));
    console.log('📊 测试总结:\n');
    console.log(`总测试数: ${stats.total}`);
    console.log(`成功解析: ${stats.success} (${(stats.success / stats.total * 100).toFixed(1)}%)`);
    console.log(`失败数量: ${stats.failed}`);
    console.log(`\n周期性任务识别:`);
    console.log(`  预期数量: ${stats.recurring.expected}`);
    console.log(`  正确识别: ${stats.recurring.detected}`);
    console.log(`  识别率: ${(stats.recurring.detected / stats.recurring.expected * 100).toFixed(1)}%`);
    
    console.log(`\n各类型成功率:`);
    for (const [type, data] of Object.entries(stats.byType)) {
      console.log(`  ${type}: ${data.success}/${data.total} (${(data.success / data.total * 100).toFixed(1)}%)`);
    }
    
    // 评估结果
    console.log('\n' + '='.repeat(80));
    if (stats.success === stats.total && stats.recurring.detected === stats.recurring.expected) {
      console.log('🎉 完美！所有测试通过，周期性任务识别准确！');
    } else if (stats.recurring.detected / stats.recurring.expected >= 0.8) {
      console.log('✅ 良好！大部分测试通过，周期性任务识别率较高。');
    } else if (stats.recurring.detected / stats.recurring.expected >= 0.5) {
      console.log('⚠️  一般！周期性任务识别率需要改进。');
    } else {
      console.log('❌ 需要改进！周期性任务识别率较低。');
    }
    
    console.log('\n💡 提示:');
    console.log('  1. 微信消息现在会通过相同的 AI 解析管道处理');
    console.log('  2. 周期性任务会被正确识别并创建相应的调度规则');
    console.log('  3. 确保 AI 模型配置正确以获得最佳解析效果');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行测试
testCompleteFlow();