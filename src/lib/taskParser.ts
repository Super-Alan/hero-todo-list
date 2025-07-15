import { CreateTaskInput } from '@/types';
import { Priority } from '@/types';

// 辅助函数，用于解析日期字符串
function parseDateString(dateStr: string): Date {
  const now = new Date();
  if (dateStr === '今天') {
    return now;
  }
  if (dateStr === '明天') {
    now.setDate(now.getDate() + 1);
    return now;
  }
  if (dateStr === '后天') {
    now.setDate(now.getDate() + 2);
    return now;
  }
  // 简单处理 M月d日 格式
  const monthDayMatch = dateStr.match(/(\d{1,2})月(\d{1,2})日/);
  if (monthDayMatch) {
    const date = new Date();
    date.setMonth(parseInt(monthDayMatch[1], 10) - 1);
    date.setDate(parseInt(monthDayMatch[2], 10));
    return date;
  }
  return new Date(dateStr);
}

export function parseTaskFromInput(input: string): CreateTaskInput {
  let title = input.trim();

  // 解析并移除标签 (#标签格式)
  const tagRegex = /#([\w\u4e00-\u9fa5-]+)/g;
  const tags: string[] = [];
  title = title.replace(tagRegex, (match, tagName) => {
    tags.push(tagName);
    return '';
  }).trim();

  // 解析并移除优先级 (!重要 格式)
  const priorityRegex = /!([\w\u4e00-\u9fa5]+)/g;
  let priority: Priority | undefined = undefined;
  
  title = title.replace(priorityRegex, (match, priorityText) => {
    // 优先级关键词映射
    const priorityMap: { [key: string]: Priority } = {
      '紧急': Priority.URGENT,
      '重要': Priority.HIGH,
      '高': Priority.HIGH,
      '中': Priority.MEDIUM,
      '低': Priority.LOW,
      '一般': Priority.MEDIUM,
      'urgent': Priority.URGENT,
      'high': Priority.HIGH,
      'medium': Priority.MEDIUM,
      'low': Priority.LOW,
    };
    
    const mappedPriority = priorityMap[priorityText];
    if (mappedPriority && !priority) {
      priority = mappedPriority;
      return '';
    }
    return match; // 如果不是优先级关键词，保留原文本
  });

  // 解析并移除内联优先级关键词（不带!符号）
  const highPriorityWords = ['紧急', '重要', '!!!'];
  const mediumPriorityWords = ['中', '一般'];
  const lowPriorityWords = ['有空', '稍后', '不急', '低'];
  
  const words = title.split(/\s+/);
  const filteredWords: string[] = [];
  
  words.forEach(word => {
    if (!priority) {
      if (highPriorityWords.some(p => word.includes(p))) {
        priority = Priority.HIGH;
        // 如果这个词就是优先级关键词，跳过它
        if (highPriorityWords.includes(word)) {
          return; // 跳过这个词
        }
      } else if (mediumPriorityWords.some(p => word.includes(p))) {
        priority = Priority.MEDIUM;
        // 如果这个词就是优先级关键词，跳过它
        if (mediumPriorityWords.includes(word)) {
          return; // 跳过这个词
        }
      } else if (lowPriorityWords.some(p => word.includes(p))) {
        priority = Priority.LOW;
        // 如果这个词就是优先级关键词，跳过它
        if (lowPriorityWords.includes(word)) {
          return; // 跳过这个词
        }
      }
    }
    filteredWords.push(word);
  });
  
  // 重新组合标题
  title = filteredWords.join(' ').trim();
  
  // 简单的日期解析
  const timeRegex = /(今天|明天|后天|\d{4}-\d{2}-\d{2}|\d{1,2}月\d{1,2}日)/;
  const timeMatch = title.match(timeRegex);
  let dueDate: Date | undefined = undefined;

  if (timeMatch) {
    dueDate = parseDateString(timeMatch[0]);
    // 从标题中移除日期字符串
    title = title.replace(timeMatch[0], '').trim();
  }

  return {
    title,
    dueDate,
    priority,
    tagIds: tags, // 暂时将标签名作为ID，实际应用中需要转换
  };
}
