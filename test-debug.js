// 简单的时间解析测试脚本
function testTimeRegex() {
  const timeRegex = /(\d{1,2})[：:点](\d{0,2})分?|(上午|下午|晚上|早上|中午)(\d{1,2})[：:点]?(\d{0,2})分?|(\d{1,2})[：:点](\d{0,2})分?(上午|下午|晚上|早上|中午)?/g;
  
  const testCases = [
    "下午10点",
    "今天下午10点",
    "上午9点",
    "晚上8点30分",
    "中午12点"
  ];
  
  testCases.forEach(test => {
    const regex = new RegExp(timeRegex.source); // 创建新实例避免g标志问题
    const match = regex.exec(test);
    console.log(`\n测试: "${test}"`);
    console.log('匹配结果:', match);
    if (match) {
      console.log('分组1-2:', match[1], match[2]);
      console.log('分组3-5:', match[3], match[4], match[5]);
      console.log('分组6-8:', match[6], match[7], match[8]);
    }
  });
}

// 测试时间转换逻辑
function testTimeConversion() {
  console.log('\n=== 时间转换测试 ===');
  
  const cases = [
    { period: '下午', hour: 10, expected: 22 },
    { period: '上午', hour: 10, expected: 10 },
    { period: '下午', hour: 12, expected: 12 },
    { period: '上午', hour: 12, expected: 0 },
    { period: '晚上', hour: 8, expected: 20 },
    { period: '中午', hour: 12, expected: 12 }
  ];
  
  cases.forEach(({ period, hour, expected }) => {
    let convertedHour = hour;
    
    if (period === '下午' || period === '晚上') {
      if (hour !== 12) convertedHour += 12;
    } else if (period === '上午' || period === '早上') {
      if (hour === 12) convertedHour = 0;
    } else if (period === '中午') {
      if (hour !== 12) convertedHour = 12;
    }
    
    console.log(`${period}${hour}点 → ${convertedHour}:00 (期望: ${expected}:00) ${convertedHour === expected ? '✓' : '✗'}`);
  });
}

testTimeRegex();
testTimeConversion();