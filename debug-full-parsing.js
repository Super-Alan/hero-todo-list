// 完整的时间解析流程调试脚本

// 模拟当前的 parseDateTimeString 函数
function parseDateTimeString(dateTimeStr) {
  const now = new Date();
  let resultDate = null;
  let resultTime = null;
  let hasSpecificTime = false;
  let description = '';

  // 先尝试解析具体时间
  const timeRegex = /(\d{1,2})[：:点](\d{0,2})分?|(上午|下午|晚上|早上|中午)(\d{1,2})[：:点]?(\d{0,2})分?|(\d{1,2})[：:点](\d{0,2})分?(上午|下午|晚上|早上|中午)?/;
  const timeMatch = timeRegex.exec(dateTimeStr);
  
  if (timeMatch) {
    hasSpecificTime = true;
    let hour = 0;
    let minute = 0;
    let period = '';
    
    console.log('时间匹配结果:', timeMatch);
    
    if (timeMatch[1] && timeMatch[2] !== undefined) {
      // 格式: "14:30" 或 "14点30分"
      hour = parseInt(timeMatch[1], 10);
      minute = parseInt(timeMatch[2] || '0', 10);
      console.log('匹配模式1: 纯数字时间', hour, minute);
    } else if (timeMatch[3] && timeMatch[4]) {
      // 格式: "上午9点" 或 "下午2点30分"
      period = timeMatch[3];
      hour = parseInt(timeMatch[4], 10);
      minute = parseInt(timeMatch[5] || '0', 10);
      
      console.log('匹配模式2: 时段+时间', period, hour, minute);
      
      // 转换为24小时制
      if (period === '下午' || period === '晚上') {
        console.log('下午/晚上转换前:', hour);
        if (hour !== 12) hour += 12;
        console.log('下午/晚上转换后:', hour);
      } else if (period === '上午' || period === '早上') {
        if (hour === 12) hour = 0;
      } else if (period === '中午') {
        if (hour !== 12) hour = 12;
      }
    } else if (timeMatch[6] && timeMatch[7] !== undefined) {
      // 格式: "9点下午"
      hour = parseInt(timeMatch[6], 10);
      minute = parseInt(timeMatch[7] || '0', 10);
      period = timeMatch[8] || '';
      
      console.log('匹配模式3: 时间+时段', hour, minute, period);
      
      if (period === '下午' || period === '晚上') {
        if (hour !== 12) hour += 12;
      } else if (period === '上午' || period === '早上') {
        if (hour === 12) hour = 0;
      }
    }
    
    // 验证时间的合理性
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      resultTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      description = `${hour}:${minute.toString().padStart(2, '0')}`;
      console.log('最终时间字符串:', resultTime);
    }
  }

  // 解析日期部分
  if (dateTimeStr.includes('今天') || dateTimeStr.includes('今日')) {
    resultDate = new Date(now);
    description = '今天' + (resultTime ? ` ${description}` : '');
    console.log('解析为今天:', resultDate);
  } else if (dateTimeStr.includes('明天')) {
    resultDate = new Date(now);
    resultDate.setDate(now.getDate() + 1);
    description = '明天' + (resultTime ? ` ${description}` : '');
  }

  // 如果有具体时间，设置到日期对象中
  if (resultDate && resultTime && hasSpecificTime) {
    const [hour, minute] = resultTime.split(':').map(Number);
    console.log('设置时间到Date对象:', hour, minute);
    resultDate.setHours(hour, minute, 0, 0);
    console.log('设置后的完整时间:', resultDate);
  } else if (resultDate) {
    // 如果只有日期没有具体时间，设置为当天的开始时间
    resultDate.setHours(0, 0, 0, 0);
  }

  return {
    date: resultDate,
    time: resultTime,
    hasSpecificTime,
    description: description || dateTimeStr
  };
}

// 测试解析
console.log('=== 测试 "今天下午10点完成任务" ===');
const result1 = parseDateTimeString('今天下午10点');
console.log('解析结果:', result1);
console.log('当前时间:', new Date());
console.log('解析的时间是否在未来:', result1.date > new Date());

console.log('\n=== 测试 "下午10点" ===');
const result2 = parseDateTimeString('下午10点');
console.log('解析结果:', result2);

console.log('\n=== 测试完整输入处理 ===');
// 模拟完整的解析流程
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
const parsedResult = parseDateTimeString(combinedTimeStr);
console.log('最终解析结果:', parsedResult);