import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateTaskInput, Priority } from '@/types'
import { RecurrenceRule, RecurrenceType } from '@/types/recurring'

export async function POST(request: NextRequest) {
  let input = ''
  try {
    const body = await request.json()
    input = body.input
    const modelId = body.modelId

    if (!input || !modelId) {
      return NextResponse.json(
        { error: 'Input and model ID are required' },
        { status: 400 }
      )
    }

    // Get the selected model
    const model = await prisma.modelProvider.findUnique({
      where: { id: modelId, isActive: true }
    })

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found or inactive' },
        { status: 404 }
      )
    }

    // Parse the task using AI model
    const parsedTask = await parseTaskWithAI(input, model)
    
    return NextResponse.json({
      success: true,
      data: parsedTask
    })
  } catch (error) {
    console.error('AI task parsing failed:', error)
    return NextResponse.json(
      { 
        error: 'AI task parsing failed',
        fallback: generateFallbackTask(input || '')
      },
      { status: 500 }
    )
  }
}

async function parseTaskWithAI(input: string, model: any): Promise<CreateTaskInput> {
  const currentTime = new Date()
  console.log('🕐 Parse Context:', {
    input,
    currentTime: currentTime.toISOString(),
    localTime: currentTime.toLocaleString('zh-CN'),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: currentTime.getTimezoneOffset()
  })

  const systemPrompt = `你是一个专业的任务解析助手。将用户的自然语言输入解析为结构化的任务数据，支持一次性任务和周期性任务。

🚨 **关键要求**：优先识别周期性任务！任何包含"每日"、"每天"、"天天"、"每工作日"、"每周"、"每月"、"每年"等关键词的任务都必须设置isRecurring=true！

请严格按照以下JSON格式返回，不要添加任何其他内容：

{
  "title": "任务标题（清理后的，移除时间、标签、优先级、周期性信息）",
  "description": "任务详细描述（如果有）",
  "dueDate": "2024-01-15T10:30:00+08:00", // ISO 8601格式，包含时区信息，周期性任务为第一次执行时间
  "dueTime": "2024-01-15T10:30:00+08:00", // 同上，包含具体时间和时区
  "timeDescription": "今天下午3点", // 原始时间描述
  "priority": "HIGH", // LOW, MEDIUM, HIGH, URGENT
  "tagIds": ["工作", "重要"], // 标签名称数组
  "isRecurring": false, // 是否为周期性任务
  "recurringRule": { // 周期性规则（仅当isRecurring为true时必须填写）
    "type": "daily", // 必填：daily, weekly, monthly, yearly
    "interval": 1, // 必填：间隔数（每1天、每2周等）
    // 以下字段仅在特定type时需要，其他情况不要包含：
    "daysOfWeek": [1,2,3,4,5], // 仅weekly+指定星期几时需要
    "dayOfMonth": 15, // 仅monthly+指定日期时需要
    "monthOfYear": 3, // 仅yearly+指定月份时需要
    // endDate和occurrences通常不需要，除非用户明确指定
  }
}

解析规则：

**⚠️ 重要**：
1. 周期性任务识别优先级最高，必须先判断是否为周期性任务，再处理具体时间！
2. 只返回必要的字段，不要包含不相关的可选字段！
3. 非周期性任务不要包含recurringRule字段
4. 周期性任务的recurringRule只包含必要字段：type和interval必须有，其他字段仅在需要时包含

**字段返回规则**：
- description：只有明确描述时才返回，否则设为null
- dueDate/dueTime：只有明确时间时才返回，否则设为null  
- timeDescription：只有原文包含时间描述时才返回
- tagIds：只返回识别到的标签，没有则返回空数组[]
- recurringRule：非周期性任务不要包含此字段
- recurringRule.daysOfWeek：只有weekly且指定星期几时才包含
- recurringRule.dayOfMonth：只有monthly且指定日期时才包含
- recurringRule.monthOfYear：只有yearly且指定月份时才包含

1. **周期性任务识别规则（优先处理）**：
   - **关键词检测**：包含"每日"、"每天"、"天天"、"每工作日"、"每周"、"每月"、"每年"等关键词的任务都是周期性任务
   - **每日/每天/天天**：type="daily", interval=1, isRecurring=true
   - **每N天**：type="daily", interval=N, isRecurring=true
   - **每周/每星期**：type="weekly", interval=1, isRecurring=true
   - **每周X（一二三四五六日）**：type="weekly", interval=1, daysOfWeek=[对应数字], isRecurring=true
   - **每工作日/工作日**：type="weekly", interval=1, daysOfWeek=[1,2,3,4,5], isRecurring=true
   - **每月/每个月**：type="monthly", interval=1, isRecurring=true
   - **每月X号/每月X日**：type="monthly", interval=1, dayOfMonth=X, isRecurring=true
   - **每年/每个年**：type="yearly", interval=1, isRecurring=true

2. **时间识别（周期性任务中的时间为第一次执行时间）**：
   - 今天、明天、后天、具体日期(12月25日)、时间点(下午3点、15:30)
   - 周期性任务的dueDate/dueTime设为第一次执行的具体时间

3. **优先级识别**：紧急->URGENT，重要/高->HIGH，中等/一般->MEDIUM，低->LOW

4. **标签识别**：#标签名 或 直接识别相关关键词

5. **标题清理**：移除时间、标签、优先级、周期性信息后的核心任务内容
   
7. **星期转换**：周日=0, 周一=1, 周二=2, 周三=3, 周四=4, 周五=5, 周六=6

8. **时区处理**：时间必须包含正确的时区信息，用户在中国时区(UTC+8)

**解析检查清单**：
1. ✅ 输入是否包含周期性关键词？("每日"、"每天"、"天天"、"每工作日"、"每周"、"每月"、"每年")
2. ✅ 如果包含 → 立即设置 isRecurring=true，并确定recurringRule
3. ✅ 然后处理具体时间作为第一次执行时间
4. ✅ 最后清理标题，移除周期性和时间信息

**典型中文周期性任务示例**：
- "每日晚上10点背诵英语单词" → isRecurring=true, type="daily", dueTime="今天22:00"
- "每天早上6点晨跑" → isRecurring=true, type="daily", dueTime="今天06:00" 
- "每工作日上午9点开会" → isRecurring=true, type="weekly", daysOfWeek=[1,2,3,4,5]
- "每周一下午3点团队会议" → isRecurring=true, type="weekly", daysOfWeek=[1]
- "每月15号交房租" → isRecurring=true, type="monthly", dayOfMonth=15

**非周期性任务示例**：
- "明天下午3点开会" → isRecurring=false
- "今天完成项目报告" → isRecurring=false

当前时间：${currentTime.toISOString()}
当前本地时间：${currentTime.toLocaleString('zh-CN')}
时区偏移：${currentTime.getTimezoneOffset()}分钟`

  const userPrompt = `请解析以下任务输入：\n\n"${input}"\n\n🚨 特别提醒：这个输入${input.includes('每日') || input.includes('每天') || input.includes('天天') || input.includes('每工作日') || input.includes('每周') || input.includes('每月') || input.includes('每年') ? '包含周期性关键词，必须设置isRecurring=true' : '看起来是一次性任务'}！`

  try {
    // Call the actual AI model API
    const response = await callAIModel(model, systemPrompt, userPrompt)
    
    // Parse the AI response
    const parsed = JSON.parse(response)
    console.log('📋 AI Parse Result (raw):', {
      input,
      parsed,
      parsedDueDate: parsed.dueDate,
      parsedDueTime: parsed.dueTime,
      isRecurring: parsed.isRecurring,
      recurringRule: parsed.recurringRule
    })
    
    // Validate and normalize the response
    const normalized = normalizeTaskData(parsed)
    console.log('📋 AI Parse Result (normalized):', {
      input,
      normalized,
      normalizedDueDate: normalized.dueDate?.toISOString(),
      normalizedDueTime: normalized.dueTime?.toISOString(),
      isRecurring: normalized.isRecurring,
      recurringRuleString: normalized.recurringRule
    })
    
    return normalized
  } catch (error) {
    console.error('❌ AI model call failed for input:', input, error)
    throw new Error('Failed to parse task with AI')
  }
}

async function callAIModel(model: any, systemPrompt: string, userPrompt: string): Promise<string> {
  const extractedInput = userPrompt.replace('请解析以下任务输入：\n\n"', '').replace('"', '')
  console.log('🔄 AI Parse Request:', {
    input: extractedInput,
    modelId: model.id,
    modelName: model.name,
    timestamp: new Date().toISOString()
  })
  
  try {
    // Import ModelService dynamically to avoid circular dependencies
    const { ModelService } = await import('@/lib/model-service')
    
    // Call the actual model service with the system prompt and user prompt
    const response = await ModelService.callModel(
      model.id, 
      userPrompt, 
      {
        systemPrompt,
        temperature: 0.3, // Lower temperature for more consistent parsing
        maxTokens: 2048,
        stream: false, // Disable streaming for parsing
        enableThinking: false // Disable thinking mode for parsing
      }
    )
    
    console.log('✅ AI Model Response:', {
      input: extractedInput,
      rawContent: response.content,
      modelName: response.modelName,
      responseTime: response.responseTime + 'ms'
    })
    
    return response.content
    
  } catch (error) {
    console.error('❌ AI model call failed for input:', extractedInput, error)
    
    // Fallback to intelligent parsing if model call fails
    const fallbackResult = intelligentParse(extractedInput)
    console.log('🔄 Fallback Parse Result:', {
      input: extractedInput,
      result: fallbackResult,
      source: 'local_fallback'
    })
    return JSON.stringify(fallbackResult)
  }
}

function intelligentParse(input: string): CreateTaskInput {
  let title = input.trim()
  let priority: Priority = Priority.MEDIUM
  let tagIds: string[] = []
  let dueDate: Date | null = null
  let dueTime: Date | null = null
  let timeDescription: string | null = null
  let isRecurring: boolean = false
  let recurringRule: RecurrenceRule | null = null

  // Extract tags
  const tagMatches = input.match(/#([^\s]+)/g)
  if (tagMatches) {
    tagIds = tagMatches.map(tag => tag.substring(1))
    title = title.replace(/#[^\s]+/g, '').trim()
  }

  // Extract priority
  if (input.includes('紧急') || input.includes('!紧急')) {
    priority = Priority.URGENT
    title = title.replace(/!?紧急/g, '').trim()
  } else if (input.includes('重要') || input.includes('!重要') || input.includes('!高')) {
    priority = Priority.HIGH
    title = title.replace(/!?(重要|高)/g, '').trim()
  } else if (input.includes('!低') || input.includes('不急')) {
    priority = Priority.LOW
    title = title.replace(/!?低|不急/g, '').trim()
  }

  // 周期性任务识别
  const recurringResult = parseRecurringPattern(input)
  if (recurringResult.isRecurring) {
    isRecurring = true
    recurringRule = recurringResult.rule
    title = recurringResult.cleanedTitle
    console.log('🔄 [Fallback] Detected recurring pattern:', {
      input,
      cleanedTitle: title,
      rule: recurringRule
    })
  }

  // Intelligent tag detection
  if (input.includes('会议') || input.includes('开会')) tagIds.push('会议')
  if (input.includes('项目')) tagIds.push('项目')
  if (input.includes('工作')) tagIds.push('工作')
  if (input.includes('学习')) tagIds.push('学习')

  // Parse time expressions (enhanced logic)
  if (input.includes('今天')) {
    console.log('🕐 [Fallback] Parsing 今天 time for input:', input)
    
    // Enhanced pattern to capture "前", "半", and "分" indicators
    const timeMatch = input.match(/(上午|下午|晚上|中午)(\d{1,2})(?:[点:](\d{1,2})[分]?|点半|[点:]?(\d{1,2})分)?[前]?/)
    if (timeMatch) {
      const period = timeMatch[1]
      let hour = parseInt(timeMatch[2])
      // Handle different time formats: 点半 (half), 点分, or 分
      let minute = 0
      if (input.includes('半')) {
        minute = 30
      } else if (timeMatch[3]) {
        minute = parseInt(timeMatch[3])
      } else if (timeMatch[4]) {
        minute = parseInt(timeMatch[4])
      }
      const isBefore = input.includes('前')
      
      console.log('⏰ [Fallback] Time Match Details:', {
        input,
        timeMatch: timeMatch[0],
        period,
        originalHour: parseInt(timeMatch[2]),
        minute,
        isBefore
      })
      
      // Correct time period conversion
      if (period === '下午' && hour !== 12) {
        hour += 12
      } else if (period === '上午' && hour === 12) {
        hour = 0
      } else if (period === '晚上' && hour < 12) {
        hour += 12
      } else if (period === '中午') {
        hour = hour === 12 ? 12 : (hour < 12 ? hour + 12 : hour)
      }
      
      console.log('⏰ [Fallback] Hour Conversion:', {
        period,
        originalHour: parseInt(timeMatch[2]),
        convertedHour: hour,
        minute
      })
      
      dueDate = getTodayAt(hour, minute)
      dueTime = getTodayAt(hour, minute)
      
      // Generate appropriate time description
      const beforeText = isBefore ? '前' : ''
      timeDescription = `今天${period}${timeMatch[2]}${timeMatch[3] ? ':' + timeMatch[3] : '点'}${beforeText}`
      
      console.log('📅 [Fallback] Final Time Result:', {
        input,
        timeDescription,
        dueDate: dueDate.toISOString(),
        dueTime: dueTime.toISOString(),
        localTime: dueDate.toLocaleString('zh-CN')
      })
    } else {
      console.log('⚠️ [Fallback] No time match found for 今天, using default end of day')
      dueDate = getTodayAt(23, 59) // Default to end of day
      timeDescription = '今天'
    }
    // More precise title cleaning for complex time expressions
    title = title.replace(/(今天|今日)((上午|下午|晚上|中午)\d{1,2}(?:[点:]?\d{1,2}[分]?|点半|[点:]?\d{1,2}分)?[前]?)?/g, '').trim()
  } else if (input.includes('明天')) {
    const timeMatch = input.match(/(上午|下午|晚上|中午)(\d{1,2})(?:[点:](\d{1,2})[分]?|点半|[点:]?(\d{1,2})分)?[前]?/)
    if (timeMatch) {
      const period = timeMatch[1]
      let hour = parseInt(timeMatch[2])
      // Handle different time formats: 点半 (half), 点分, or 分
      let minute = 0
      if (input.includes('半')) {
        minute = 30
      } else if (timeMatch[3]) {
        minute = parseInt(timeMatch[3])
      } else if (timeMatch[4]) {
        minute = parseInt(timeMatch[4])
      }
      const isBefore = input.includes('前')
      
      // Correct time period conversion
      if (period === '下午' && hour !== 12) {
        hour += 12
      } else if (period === '上午' && hour === 12) {
        hour = 0
      } else if (period === '晚上' && hour < 12) {
        hour += 12
      } else if (period === '中午') {
        hour = hour === 12 ? 12 : (hour < 12 ? hour + 12 : hour)
      }
      
      dueDate = getTomorrowAt(hour, minute)
      dueTime = getTomorrowAt(hour, minute)
      
      const beforeText = isBefore ? '前' : ''
      timeDescription = `明天${period}${timeMatch[2]}${timeMatch[3] ? ':' + timeMatch[3] : '点'}${beforeText}`
    } else {
      dueDate = getTomorrowAt(23, 59) // Default to end of day
      timeDescription = '明天'
    }
    // More precise title cleaning for complex time expressions
    title = title.replace(/明天((上午|下午|晚上|中午)\d{1,2}(?:[点:]?\d{1,2}[分]?|点半|[点:]?\d{1,2}分)?[前]?)?/g, '').trim()
  }

  const result: CreateTaskInput = {
    title: title || input.trim(),
    description: undefined,
    dueDate: dueDate || undefined,
    dueTime: dueTime || undefined,
    timeDescription: timeDescription || undefined,
    priority,
    tagIds: [...new Set(tagIds)] // Remove duplicates
  }

  // 添加周期性信息
  if (isRecurring && recurringRule) {
    result.isRecurring = true
    result.recurringRule = JSON.stringify(recurringRule)
  } else {
    result.isRecurring = false
  }

  return result
}

function normalizeTaskData(data: any): CreateTaskInput {
  const result: CreateTaskInput = {
    title: data.title || '',
    description: data.description || undefined,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    dueTime: data.dueTime ? new Date(data.dueTime) : undefined,
    timeDescription: data.timeDescription || undefined,
    priority: validatePriority(data.priority),
    tagIds: Array.isArray(data.tagIds) ? data.tagIds : []
  }

  // 处理周期性任务字段
  if (data.isRecurring === true && data.recurringRule) {
    result.isRecurring = true
    
    // 验证和标准化周期规则
    const rule = normalizeRecurringRule(data.recurringRule)
    if (rule) {
      result.recurringRule = JSON.stringify(rule)
      console.log('📅 Normalized Recurring Rule:', {
        input: data.recurringRule,
        normalized: rule
      })
    } else {
      console.warn('⚠️ Invalid recurring rule, falling back to non-recurring task:', data.recurringRule)
      result.isRecurring = false
    }
  } else {
    result.isRecurring = false
  }

  return result
}

function parseRecurringPattern(input: string): { isRecurring: boolean; rule: RecurrenceRule | null; cleanedTitle: string } {
  let title = input.trim()
  let isRecurring = false
  let rule: RecurrenceRule | null = null

  console.log('🔄 [Fallback] Analyzing recurring pattern for:', input)

  // 每日/每天 - daily
  if (/每(日|天|天天)|天天/.test(input)) {
    isRecurring = true
    rule = { type: 'daily' as RecurrenceType, interval: 1 }
    title = title.replace(/(每)?(日|天|天天)|天天/g, '').trim()
    console.log('📅 [Fallback] Detected daily pattern')
  }
  // 每工作日 - weekly with weekdays
  else if (/每?工作日/.test(input)) {
    isRecurring = true
    rule = { 
      type: 'weekly' as RecurrenceType, 
      interval: 1,
      daysOfWeek: [1, 2, 3, 4, 5] // 周一到周五
    }
    title = title.replace(/每?工作日/g, '').trim()
    console.log('📅 [Fallback] Detected weekdays pattern')
  }
  // 每周 - weekly  
  else if (/每(周|星期)/.test(input)) {
    isRecurring = true
    rule = { type: 'weekly' as RecurrenceType, interval: 1 }
    title = title.replace(/每(周|星期)/g, '').trim()
    
    // 检查是否指定了具体的星期几
    const weekdayMatch = input.match(/(每?)周([一二三四五六日])/)
    if (weekdayMatch) {
      const weekdays = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0 }
      const day = weekdays[weekdayMatch[2] as keyof typeof weekdays]
      if (day !== undefined) {
        rule.daysOfWeek = [day]
        // 完整清理包括"每周X"
        title = title.replace(/(每?)周[一二三四五六日]/g, '').trim()
      }
    }
    console.log('📅 [Fallback] Detected weekly pattern:', rule)
  }
  // 每月 - monthly
  else if (/每(月|个月)/.test(input)) {
    isRecurring = true
    rule = { type: 'monthly' as RecurrenceType, interval: 1 }
    title = title.replace(/每(月|个月)/g, '').trim()
    
    // 检查是否指定了具体日期
    const dayMatch = input.match(/每月(\d{1,2})([号日])/)
    if (dayMatch) {
      const day = parseInt(dayMatch[1])
      if (day >= 1 && day <= 31) {
        rule.dayOfMonth = day
        // 完整清理包括"每月X号"和剩余的数字
        title = title.replace(/每月\d{1,2}[号日]/g, '').replace(/\d{1,2}[号日]/g, '').trim()
      }
    }
    console.log('📅 [Fallback] Detected monthly pattern:', rule)
  }
  // 每年 - yearly
  else if (/每年/.test(input)) {
    isRecurring = true
    rule = { type: 'yearly' as RecurrenceType, interval: 1 }
    title = title.replace(/每年/g, '').trim()
    console.log('📅 [Fallback] Detected yearly pattern')
  }

  // 清理可能剩余的周期性关键词
  title = title.replace(/^(每|的)?\s*/, '').trim()
  
  return {
    isRecurring,
    rule,
    cleanedTitle: title
  }
}

function normalizeRecurringRule(rule: any): RecurrenceRule | null {
  if (!rule || typeof rule !== 'object') return null

  try {
    const validTypes: RecurrenceType[] = ['daily', 'weekly', 'monthly', 'yearly']
    if (!validTypes.includes(rule.type)) return null

    const normalized: RecurrenceRule = {
      type: rule.type as RecurrenceType,
      interval: Math.max(1, parseInt(rule.interval) || 1)
    }

    // 处理星期几（仅用于weekly）
    if (rule.type === 'weekly' && Array.isArray(rule.daysOfWeek)) {
      const validDays = rule.daysOfWeek.filter((day: any) => 
        Number.isInteger(day) && day >= 0 && day <= 6
      )
      if (validDays.length > 0) {
        normalized.daysOfWeek = validDays.sort()
      }
    }

    // 处理月份中的天（仅用于monthly）
    if (rule.type === 'monthly' && rule.dayOfMonth) {
      const day = parseInt(rule.dayOfMonth)
      if (day >= 1 && day <= 31) {
        normalized.dayOfMonth = day
      }
    }

    // 处理年份中的月（仅用于yearly）
    if (rule.type === 'yearly' && rule.monthOfYear) {
      const month = parseInt(rule.monthOfYear)
      if (month >= 1 && month <= 12) {
        normalized.monthOfYear = month
      }
    }

    // 处理结束日期
    if (rule.endDate) {
      const endDate = new Date(rule.endDate)
      if (!isNaN(endDate.getTime())) {
        normalized.endDate = endDate
      }
    }

    // 处理重复次数
    if (rule.occurrences) {
      const occurrences = parseInt(rule.occurrences)
      if (occurrences > 0) {
        normalized.occurrences = occurrences
      }
    }

    // 验证规则的有效性（轻量级验证）
    const validationErrors = validateRecurrenceRule(normalized)
    if (validationErrors.length > 0) {
      console.warn('⚠️ Recurring rule validation failed:', {
        rule: normalized,
        errors: validationErrors
      })
      return null
    }

    console.log('✅ Recurring rule validated successfully:', normalized)
    return normalized
  } catch (error) {
    console.error('❌ Error normalizing recurring rule:', error)
    return null
  }
}

function validateRecurrenceRule(rule: any): string[] {
  const errors: string[] = []

  if (!rule.type) {
    errors.push('必须指定重复类型')
    return errors
  }

  if (!rule.interval || rule.interval < 1) {
    errors.push('间隔必须是正整数')
  }

  if (rule.type === 'weekly' && rule.daysOfWeek) {
    if (!Array.isArray(rule.daysOfWeek) || rule.daysOfWeek.some((day: number) => day < 0 || day > 6)) {
      errors.push('星期几必须在0-6之间')
    }
  }

  if (rule.type === 'monthly' && rule.dayOfMonth) {
    if (rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
      errors.push('月份中的日期必须在1-31之间')
    }
  }

  if (rule.type === 'yearly' && rule.monthOfYear) {
    if (rule.monthOfYear < 1 || rule.monthOfYear > 12) {
      errors.push('月份必须在1-12之间')
    }
  }

  if (rule.occurrences && rule.occurrences < 1) {
    errors.push('重复次数必须是正整数')
  }

  if (rule.endDate && rule.endDate < new Date()) {
    errors.push('结束日期不能早于当前日期')
  }

  return errors
}

function validatePriority(priority: string): Priority {
  const validPriorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT]
  return validPriorities.includes(priority as Priority) ? priority as Priority : Priority.MEDIUM
}

function generateFallbackTask(input: string): CreateTaskInput {
  return {
    title: input.trim(),
    description: undefined,
    dueDate: undefined,
    dueTime: undefined,
    timeDescription: undefined,
    priority: Priority.MEDIUM,
    tagIds: []
  }
}

function getTodayAt(hour: number, minute: number): Date {
  // 创建中国时区（UTC+8）的今天指定时间
  // 关键：确保创建的是用户期望的本地时间，而不是服务器本地时间
  
  const now = new Date()
  const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  
  // 创建中国时区的日期（UTC+8）
  const chinaOffset = 8 * 60 // 中国时区偏移（分钟）
  const chinaTime = new Date(utcNow.getTime() + chinaOffset * 60 * 1000)
  
  // 设置指定的小时和分钟（中国时区）
  const targetTime = new Date(
    chinaTime.getFullYear(),
    chinaTime.getMonth(), 
    chinaTime.getDate(),
    hour,
    minute,
    0,
    0
  )
  
  // 转换回UTC时间存储
  const utcTarget = new Date(targetTime.getTime() - chinaOffset * 60 * 1000)
  
  console.log('📅 getTodayAt (China Time):', {
    input: `${hour}:${minute.toString().padStart(2, '0')}`,
    serverInfo: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: now.getTimezoneOffset()
    },
    result: {
      chinaLocalTime: targetTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      utcTime: utcTarget.toISOString(),
      // 验证：前端看到的时间应该是
      frontendWillShow: new Date(utcTarget.toISOString()).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    }
  })
  
  return utcTarget
}

function getTomorrowAt(hour: number, minute: number): Date {
  // 创建中国时区（UTC+8）的明天指定时间
  const now = new Date()
  const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  
  // 创建中国时区的明天日期（UTC+8）
  const chinaOffset = 8 * 60 // 中国时区偏移（分钟）
  const chinaToday = new Date(utcNow.getTime() + chinaOffset * 60 * 1000)
  const chinaTomorrow = new Date(chinaToday.getFullYear(), chinaToday.getMonth(), chinaToday.getDate() + 1)
  
  // 设置指定的小时和分钟（中国时区）
  const targetTime = new Date(
    chinaTomorrow.getFullYear(),
    chinaTomorrow.getMonth(),
    chinaTomorrow.getDate(),
    hour,
    minute,
    0,
    0
  )
  
  // 转换回UTC时间存储
  const utcTarget = new Date(targetTime.getTime() - chinaOffset * 60 * 1000)
  
  console.log('📅 getTomorrowAt (China Time):', {
    input: `${hour}:${minute.toString().padStart(2, '0')}`,
    serverInfo: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: now.getTimezoneOffset()
    },
    result: {
      chinaLocalTime: targetTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      utcTime: utcTarget.toISOString(),
      frontendWillShow: new Date(utcTarget.toISOString()).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    }
  })
  
  return utcTarget
}