// 测试最终修复的时间解析逻辑

function simulateParseDateTimeString(dateTimeStr) {
  const now = new Date();
  let resultDate = null;
  let resultTime = null;
  let hasSpecificTime = false;
  let description = '';

  // 新的时间正则表达式 - 优先级：时段+时间 > 时间+时段 > 纯数字时间
  const timeRegex = /(上午|下午|晚上|早上|中午)(\d{1,2})[：:点]?(\d{0,2})分?|(\d{1,2})[：:点](\d{0,2})分?(上午|下午|晚上|早上|中午)?|(\d{1,2})[：:点](\d{0,2})分?/;
  const timeMatch = timeRegex.exec(dateTimeStr);
  
  console.log('输入字符串:', dateTimeStr);
  console.log('时间匹配结果:', timeMatch);
  
  if (timeMatch) {
    hasSpecificTime = true;
    let hour = 0;
    let minute = 0;
    let period = '';
    
    if (timeMatch[1] && timeMatch[2]) {
      // 格式: "上午9点" 或 "下午2点30分" - 最高优先级
      period = timeMatch[1];
      hour = parseInt(timeMatch[2], 10);
      minute = parseInt(timeMatch[3] || '0', 10);
      console.log('匹配模式1: 时段+时间', period, hour, minute);
      
      // 转换为24小时制
      if (period === '下午' || period === '晚上') {
        if (hour !== 12) hour += 12;
      } else if (period === '上午' || period === '早上') {
        if (hour === 12) hour = 0;
      } else if (period === '中午') {
        if (hour !== 12) hour = 12;
      }
    } else if (timeMatch[4] && timeMatch[5] !== undefined) {
      // 格式: "9点下午" - 时间+时段
      hour = parseInt(timeMatch[4], 10);
      minute = parseInt(timeMatch[5] || '0', 10);
      period = timeMatch[6] || '';
      console.log('匹配模式2: 时间+时段', hour, minute, period);
      
      if (period === '下午' || period === '晚上') {
        if (hour !== 12) hour += 12;
      } else if (period === '上午' || period === '早上') {
        if (hour === 12) hour = 0;
      }
    } else if (timeMatch[7] && timeMatch[8] !== undefined) {
      // 格式: "14:30" 或 "14点30分" - 纯数字时间，最低优先级
      hour = parseInt(timeMatch[7], 10);
      minute = parseInt(timeMatch[8] || '0', 10);
      console.log('匹配模式3: 纯数字时间', hour, minute);
    }
    
    // 验证时间的合理性
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      resultTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      description = `${hour}:${minute.toString().padStart(2, '0')}`;
    }
    
    console.log('解析出的时间:', resultTime);
  }

  // 解析日期部分
  if (dateTimeStr.includes('今天') || dateTimeStr.includes('今日')) {
    resultDate = new Date(now);
    description = '今天' + (resultTime ? ` ${description}` : '');
  } else if (dateTimeStr.includes('明天')) {
    resultDate = new Date(now);
    resultDate.setDate(now.getDate() + 1);
    description = '明天' + (resultTime ? ` ${description}` : '');
  }

  // 如果有具体时间，设置到日期对象中
  if (resultDate && resultTime && hasSpecificTime) {
    const [hour, minute] = resultTime.split(':').map(Number);
    resultDate.setHours(hour, minute, 0, 0);
  } else if (resultDate) {
    resultDate.setHours(0, 0, 0, 0);
  }

  return {
    date: resultDate,
    time: resultTime,
    hasSpecificTime,
    description: description || dateTimeStr
  };
}

// 测试关键用例
console.log('=== 测试关键修复 ===');
const testCases = [
  '今天下午10点完成任务',
  '明天上午9点开会',
  '后天晚上8点30分看电影',
  '下午2点提交报告'
];

testCases.forEach((testCase, index) => {
  console.log(`\n测试 ${index + 1}: ${testCase}`);
  const result = simulateParseDateTimeString(testCase);
  console.log('解析结果:', {
    date: result.date?.toLocaleString('zh-CN'),
    time: result.time,
    description: result.description,
    isInFuture: result.date ? result.date > new Date() : false
  });
  console.log('---');
});