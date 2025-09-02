// Test script for the new AI task parsing system
// Run with: node test-ai-parser.js

const testCases = [
  {
    input: '今天下午10点完成任务',
    expected: {
      title: '完成任务',
      timeDescription: '今天下午10点',
      hasTime: true,
      priority: 'MEDIUM'
    }
  },
  {
    input: '明天上午9点开会 #工作 !重要',
    expected: {
      title: '开会',
      timeDescription: '明天上午9点',
      hasTime: true,
      tags: ['工作'],
      priority: 'HIGH'
    }
  },
  {
    input: '写项目报告 紧急',
    expected: {
      title: '写项目报告',
      priority: 'URGENT',
      hasTime: false
    }
  },
  {
    input: '学习Vue.js #学习 下周一',
    expected: {
      title: '学习Vue.js',
      tags: ['学习'],
      hasTime: true,
      priority: 'MEDIUM'
    }
  },
  {
    input: '买菜 !低',
    expected: {
      title: '买菜',
      priority: 'LOW',
      hasTime: false
    }
  }
];

// Mock the AI parsing logic (simplified version of what the API would do)
function mockAIParser(input) {
  console.log(`\n🤖 解析输入: "${input}"`);
  
  let title = input.trim();
  let priority = 'MEDIUM';
  let tags = [];
  let timeDescription = null;
  let hasTime = false;

  // Extract tags
  const tagMatches = input.match(/#([^\s]+)/g);
  if (tagMatches) {
    tags = tagMatches.map(tag => tag.substring(1));
    title = title.replace(/#[^\s]+/g, '').trim();
    console.log(`  📋 提取标签: ${tags.join(', ')}`);
  }

  // Extract priority
  if (input.includes('紧急') || input.includes('!紧急')) {
    priority = 'URGENT';
    title = title.replace(/!?紧急/g, '').trim();
    console.log(`  ⚡ 优先级: 紧急`);
  } else if (input.includes('重要') || input.includes('!重要') || input.includes('!高')) {
    priority = 'HIGH';
    title = title.replace(/!?(重要|高)/g, '').trim();
    console.log(`  ⭐ 优先级: 重要`);
  } else if (input.includes('!低') || input.includes('不急')) {
    priority = 'LOW';
    title = title.replace(/!?低|不急/g, '').trim();
    console.log(`  🔽 优先级: 低`);
  }

  // Parse time expressions
  if (input.includes('今天')) {
    const timeMatch = input.match(/(上午|下午|晚上|中午)(\d{1,2})[点:]?(\d{0,2})?/);
    if (timeMatch) {
      timeDescription = `今天${timeMatch[1]}${timeMatch[2]}${timeMatch[3] ? ':' + timeMatch[3] : '点'}`;
      hasTime = true;
      console.log(`  ⏰ 时间: ${timeDescription}`);
    } else {
      timeDescription = '今天';
      hasTime = true;
      console.log(`  📅 日期: 今天`);
    }
    title = title.replace(/(今天|今日)(上午|下午|晚上|中午)?(\d{1,2}[点:]?\d{0,2}?分?)?/g, '').trim();
  } else if (input.includes('明天')) {
    const timeMatch = input.match(/(上午|下午|晚上|中午)(\d{1,2})[点:]?(\d{0,2})?/);
    if (timeMatch) {
      timeDescription = `明天${timeMatch[1]}${timeMatch[2]}${timeMatch[3] ? ':' + timeMatch[3] : '点'}`;
      hasTime = true;
      console.log(`  ⏰ 时间: ${timeDescription}`);
    } else {
      timeDescription = '明天';
      hasTime = true;
      console.log(`  📅 日期: 明天`);
    }
    title = title.replace(/明天(上午|下午|晚上|中午)?(\d{1,2}[点:]?\d{0,2}?分?)?/g, '').trim();
  } else if (input.includes('下周一') || input.includes('星期一')) {
    timeDescription = '下周一';
    hasTime = true;
    title = title.replace(/(下周一|星期一)/g, '').trim();
    console.log(`  📅 日期: 下周一`);
  }

  console.log(`  📝 清理后标题: "${title}"`);

  return {
    title: title || input.trim(),
    timeDescription,
    hasTime,
    priority,
    tags,
    confidence: 0.9,
    source: 'ai'
  };
}

// Run tests
console.log('🧪 AI任务解析系统测试');
console.log('=' + '='.repeat(50));

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`\n📝 测试用例 ${index + 1}/${totalTests}`);
  
  const result = mockAIParser(testCase.input);
  const expected = testCase.expected;
  
  let passed = true;
  let issues = [];

  // Check title
  if (result.title !== expected.title) {
    passed = false;
    issues.push(`标题不匹配: 期望 "${expected.title}", 实际 "${result.title}"`);
  }

  // Check time
  if (result.hasTime !== expected.hasTime) {
    passed = false;
    issues.push(`时间检测不匹配: 期望 ${expected.hasTime}, 实际 ${result.hasTime}`);
  }

  if (expected.timeDescription && result.timeDescription !== expected.timeDescription) {
    passed = false;
    issues.push(`时间描述不匹配: 期望 "${expected.timeDescription}", 实际 "${result.timeDescription}"`);
  }

  // Check priority
  if (result.priority !== expected.priority) {
    passed = false;
    issues.push(`优先级不匹配: 期望 "${expected.priority}", 实际 "${result.priority}"`);
  }

  // Check tags
  if (expected.tags) {
    const expectedTags = expected.tags.sort();
    const actualTags = result.tags.sort();
    if (JSON.stringify(expectedTags) !== JSON.stringify(actualTags)) {
      passed = false;
      issues.push(`标签不匹配: 期望 [${expectedTags.join(', ')}], 实际 [${actualTags.join(', ')}]`);
    }
  }

  if (passed) {
    console.log(`  ✅ 测试通过`);
    passedTests++;
  } else {
    console.log(`  ❌ 测试失败:`);
    issues.forEach(issue => console.log(`     • ${issue}`));
  }
});

// Summary
console.log('\n' + '='.repeat(52));
console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过 (${Math.round(passedTests/totalTests*100)}%)`);

if (passedTests === totalTests) {
  console.log('🎉 所有测试通过！AI解析系统工作正常。');
} else {
  console.log(`⚠️  有 ${totalTests - passedTests} 个测试失败，需要优化AI解析逻辑。`);
}

console.log('\n💡 注意: 这是基于模拟AI逻辑的测试。实际使用中请确保:');
console.log('   1. AI模型已正确配置和选择');
console.log('   2. API端点正常工作');
console.log('   3. 网络连接稳定');
console.log('   4. 错误处理机制已就位');