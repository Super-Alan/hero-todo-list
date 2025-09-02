// 测试修复后的时间解析逻辑

function testFixedTimeRegex() {
  // 修复后的正则表达式
  const timeRegex = /(上午|下午|晚上|早上|中午)(\d{1,2})[：:点]?(\d{0,2})分?|(\d{1,2})[：:点](\d{0,2})分?(上午|下午|晚上|早上|中午)?|(\d{1,2})[：:点](\d{0,2})分?/;
  
  const testCases = [
    "下午10点",
    "今天下午10点", 
    "今天 下午 10点",  // 这是问题的关键测试用例
    "上午9点",
    "晚上8点30分",
    "中午12点",
    "14:30"
  ];
  
  testCases.forEach(test => {
    const match = timeRegex.exec(test);
    console.log(`\n测试: "${test}"`);
    console.log('匹配结果:', match);
    
    if (match) {
      // 模拟新的解析逻辑
      let hour = 0, minute = 0, period = '';
      
      if (match[1] && match[2]) {
        // 格式: "上午9点" 或 "下午2点30分" - 最高优先级
        period = match[1];
        hour = parseInt(match[2], 10);
        minute = parseInt(match[3] || '0', 10);
        console.log('匹配模式1: 时段+时间', period, hour, minute);
        
        // 转换为24小时制
        if (period === '下午' || period === '晚上') {
          if (hour !== 12) hour += 12;
        } else if (period === '上午' || period === '早上') {
          if (hour === 12) hour = 0;
        } else if (period === '中午') {
          if (hour !== 12) hour = 12;
        }
      } else if (match[4] && match[5] !== undefined) {
        // 格式: "9点下午" - 时间+时段
        hour = parseInt(match[4], 10);
        minute = parseInt(match[5] || '0', 10);
        period = match[6] || '';
        console.log('匹配模式2: 时间+时段', hour, minute, period);
        
        if (period === '下午' || period === '晚上') {
          if (hour !== 12) hour += 12;
        } else if (period === '上午' || period === '早上') {
          if (hour === 12) hour = 0;
        }
      } else if (match[7] && match[8] !== undefined) {
        // 格式: "14:30" 或 "14点30分" - 纯数字时间
        hour = parseInt(match[7], 10);
        minute = parseInt(match[8] || '0', 10);
        console.log('匹配模式3: 纯数字时间', hour, minute);
      }
      
      const resultTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      console.log('最终时间:', resultTime);
    }
  });
}

// 测试完整的时间+日期组合
function testFullParsing() {
  console.log('\n=== 测试完整解析流程 ===');
  
  // 模拟新的正则表达式匹配
  const input = '今天下午10点完成任务';
  const timeRegex = /(今天|明天|后天|大后天|今日|\d{4}[-年]\d{1,2}[-月]\d{1,2}日?|\d{1,2}月\d{1,2}日|周[一二三四五六日]|星期[一二三四五六日天]|\d{1,2}[：:点]\d{0,2}分?|上午|下午|晚上|早上|中午)/g;

  const timeMatches = [];
  let match;
  const regex = new RegExp(timeRegex.source, 'g');
  while ((match = regex.exec(input)) !== null) {
    timeMatches.push(match[0]);
  }

  console.log('时间匹配:', timeMatches);
  const combinedTimeStr = timeMatches.join(' ');
  console.log('组合时间字符串:', combinedTimeStr);
  
  // 使用新的时间正则表达式
  const fixedTimeRegex = /(上午|下午|晚上|早上|中午)(\d{1,2})[：:点]?(\d{0,2})分?|(\d{1,2})[：:点](\d{0,2})分?(上午|下午|晚上|早上|中午)?|(\d{1,2})[：:点](\d{0,2})分?/;
  const timeMatch = fixedTimeRegex.exec(combinedTimeStr);
  
  console.log('修复后的时间匹配:', timeMatch);
  
  if (timeMatch && timeMatch[1] && timeMatch[2]) {
    const period = timeMatch[1];
    let hour = parseInt(timeMatch[2], 10);
    const minute = parseInt(timeMatch[3] || '0', 10);
    
    console.log('解析到:', period, hour, minute);
    
    if (period === '下午' || period === '晚上') {
      if (hour !== 12) hour += 12;
    }
    
    const resultTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    console.log('最终结果时间:', resultTime);
    
    // 创建日期对象
    const now = new Date();
    const resultDate = new Date(now);
    resultDate.setHours(hour, minute, 0, 0);
    console.log('完整日期时间:', resultDate);
    console.log('是否在未来:', resultDate > now);
  }
}

testFixedTimeRegex();
testFullParsing();