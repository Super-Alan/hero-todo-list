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

  // 解析并移除标签
  const tagRegex = /#([\w-]+)/g;
  const tags: string[] = [];
  title = title.replace(tagRegex, (match, tagName) => {
    tags.push(tagName);
    return '';
  }).trim();

  // 解析并移除优先级
  const highPriorityWords = ['紧急', '重要', '!!!', '!'];
  const lowPriorityWords = ['有空', '稍后', '不急'];
  let priority: Priority | undefined = undefined;

  const words = title.split(/\s+/);
  const filteredWords: string[] = [];
  let prioritySet = false;

  words.forEach(word => {
    if (!prioritySet) {
      if (!prioritySet) {
        const urgentWords = ['紧急', '!!!', 'urgent'];
        if (urgentWords.some(p => word.includes(p))) {
          priority = Priority.URGENT;
          prioritySet = true;
        } else if (highPriorityWords.some(p => word.includes(p))) {
          priority = Priority.HIGH;
          prioritySet = true;
        } else if (lowPriorityWords.some(p => word.includes(p))) {
          priority = Priority.LOW;
          prioritySet = true;
        }
      }
    }
    filteredWords.push(word);
  });
  
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
