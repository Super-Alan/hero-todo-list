import { prisma } from '@/lib/prisma'

export interface ModelResponse {
  content: string
  usage?: any
  cot?: string
  responseTime: number
  modelName: string
}

export interface ModelStreamChunk {
  type: 'thinking' | 'content' | 'done' | 'error'
  content: string
  usage?: any
  responseTime?: number
  modelName?: string
}

export interface ModelCallOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
  systemPrompt?: string
  enableThinking?: boolean  // 是否启用思维链模式
}

export class ModelService {
  /**
   * 调用指定模型进行推理
   */
  static async callModel(
    modelId: string, 
    prompt: string, 
    options: ModelCallOptions = {}
  ): Promise<ModelResponse> {
    const startTime = Date.now()
    
    // 获取模型配置
    const model = await prisma.modelProvider.findUnique({
      where: { id: modelId }
    })

    if (!model) {
      throw new Error('模型不存在')
    }

    if (!model.isActive) {
      throw new Error('模型已停用，无法进行调用')
    }

    if (!model.endpoint) {
      throw new Error('模型端点配置错误')
    }

    if (!model.apiKey) {
      throw new Error('模型API密钥未配置')
    }

    let response: Omit<ModelResponse, 'responseTime' | 'modelName'>

    try {
      // 根据不同的模型提供商调用相应的API
      if (model.endpoint.includes('openai.com')) {
        response = await this.callOpenAI(model, prompt, options)
      } else if (model.endpoint.includes('anthropic.com')) {
        response = await this.callAnthropic(model, prompt, options)
      } else if (model.endpoint.includes('baidubce.com')) {
        response = await this.callBaidu(model, prompt, options)
      } else if (model.endpoint.includes('aliyuncs.com')) {
        // 检查是否是兼容模式端点
        if (model.endpoint.includes('compatible-mode')) {
          response = await this.callOpenAI(model, prompt, options) // 使用OpenAI兼容格式
        } else {
          response = await this.callAliyun(model, prompt, options) // 使用阿里云原生格式
        }
      } else if (model.endpoint.includes('volcengine.com') || model.endpoint.includes('volces.com')) {
        // 添加火山引擎支持
        response = await this.callVolcEngine(model, prompt, options)
      } else {
        // 通用调用方式
        response = await this.callGeneric(model, prompt, options)
      }

      const endTime = Date.now()
      const responseTime = endTime - startTime

      return {
        ...response,
        responseTime,
        modelName: model.name
      }

    } catch (error) {
      console.error('详细错误信息:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : JSON.stringify(error)
      throw new Error(`模型调用失败: ${errorMessage}`)
    }
  }

  /**
   * 测试模型连接
   */
  static async testModel(modelId: string): Promise<ModelResponse> {
    const testPrompt = '请简单介绍一下您的功能'
    return this.callModel(modelId, testPrompt, { temperature: 0.7 })
  }

  /**
   * 获取所有可用的模型
   */
  static async getAvailableModels() {
    return prisma.modelProvider.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * 流式调用指定模型进行推理
   */
  static async *callModelStream(
    modelId: string, 
    prompt: string, 
    options: ModelCallOptions = {}
  ): AsyncGenerator<ModelStreamChunk, void, unknown> {
    const startTime = Date.now()
    
    // 获取模型配置
    const model = await prisma.modelProvider.findUnique({
      where: { id: modelId }
    })

    if (!model) {
      throw new Error('模型不存在')
    }

    if (!model.isActive) {
      throw new Error('模型已停用，无法进行调用')
    }

    if (!model.endpoint) {
      throw new Error('模型端点配置错误')
    }

    if (!model.apiKey) {
      throw new Error('模型API密钥未配置')
    }

    try {
      // 根据不同的模型提供商调用相应的流式API
      if (model.endpoint.includes('openai.com')) {
        yield* this.callOpenAIStream(model, prompt, options)
      } else if (model.endpoint.includes('anthropic.com')) {
        yield* this.callAnthropicStream(model, prompt, options)
      } else if (model.endpoint.includes('aliyuncs.com')) {
        if (model.endpoint.includes('compatible-mode')) {
          yield* this.callOpenAIStream(model, prompt, options) // 使用OpenAI兼容格式
        } else {
          yield* this.callAliyunStream(model, prompt, options) // 使用阿里云原生格式
        }
      } else if (model.endpoint.includes('volcengine.com') || model.endpoint.includes('volces.com')) {
        yield* this.callVolcEngineStream(model, prompt, options)
      } else {
        // 通用流式调用
        yield* this.callGenericStream(model, prompt, options)
      }

      const endTime = Date.now()
      const responseTime = endTime - startTime

      yield {
        type: 'done',
        content: '',
        responseTime,
        modelName: model.name
      }

    } catch (error) {
      yield {
        type: 'error',
        content: `模型调用失败: ${error instanceof Error ? error.message : '未知错误'}`
      }
    }
  }

  // OpenAI API 调用
  private static async callOpenAI(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): Promise<Omit<ModelResponse, 'responseTime' | 'modelName'>> {
    const messages = []
    
    // 构建系统提示词
    let systemPrompt = options.systemPrompt || ''
    
    // 针对千问模型的特殊处理
    if (model.endpoint.includes('dashscope.aliyuncs.com')) {
      // 千问模型使用兼容模式，但需要特殊的深度思考设置
      if (options.enableThinking) {
        systemPrompt += '\n\n请按照以下格式回复：\n<thinking>\n[在这里写出你的思考过程，包括分析、推理、判断等]\n</thinking>\n\n[最终答案]'
      }
    } else if (options.enableThinking) {
      // 其他 OpenAI 兼容模型的思维链格式
      systemPrompt += '\n\n请按照以下格式回复：\n<thinking>\n[在这里写出你的思考过程，包括分析、推理、判断等]\n</thinking>\n\n[最终答案]'
    }
    
    if (systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() })
    }
    
    // 针对千问模型，在用户消息中加入思考指令
    let userContent = prompt
    if (model.endpoint.includes('dashscope.aliyuncs.com') && options.enableThinking) {
      userContent = `${prompt}\n/think`
    }
    
    messages.push({ role: 'user', content: userContent })

    // 构建请求体
    const requestBody: any = {
      model: model.name,
      messages,
      stream: options.stream || false,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 10240
    }

    // 为千问模型添加特殊参数
    if (model.endpoint.includes('dashscope.aliyuncs.com') && options.enableThinking) {
      requestBody.extra_body = {
        enable_thinking: true
      }
    }

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      let errorMessage = 'OpenAI API调用失败'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error?.message || error.message || errorMessage
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''
    
    // 处理思维链内容
    let finalContent = content
    let cotContent = ''
    
    if (options.enableThinking && content.includes('<thinking>') && content.includes('</thinking>')) {
      const thinkingStartIndex = content.indexOf('<thinking>') + 10
      const thinkingEndIndex = content.indexOf('</thinking>')
      cotContent = content.slice(thinkingStartIndex, thinkingEndIndex)
      finalContent = content.slice(thinkingEndIndex + 12).trim()
    }
    
    return {
      content: finalContent,
      cot: cotContent,
      usage: data.usage
    }
  }

  // Anthropic Claude API 调用
  private static async callAnthropic(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): Promise<Omit<ModelResponse, 'responseTime' | 'modelName'>> {
    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': model.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model.name,
        max_tokens: options.maxTokens || 10240,
        messages: [
          ...(options.systemPrompt ? [{
            role: 'system',
            content: options.systemPrompt
          }] : []),
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      let errorMessage = 'Anthropic API调用失败'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error?.message || error.message || errorMessage
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return {
      content: data.content[0]?.text || '',
      usage: data.usage
    }
  }

  // 百度文心一言 API 调用
  private static async callBaidu(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): Promise<Omit<ModelResponse, 'responseTime' | 'modelName'>> {
    const response = await fetch(`${model.endpoint}?access_token=${model.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          ...(options.systemPrompt ? [{
            role: 'system',
            content: options.systemPrompt
          }] : []),
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: options.stream || false,
        temperature: options.temperature || 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      let errorMessage = '百度API调用失败'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error_msg || error.message || error.error || errorMessage
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return {
      content: data.result || '',
      usage: data.usage
    }
  }

  // 阿里通义千问 API 调用
  private static async callAliyun(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): Promise<Omit<ModelResponse, 'responseTime' | 'modelName'>> {
    try {
      const messages = []
      
      // 构建系统提示词
      const systemPrompt = options.systemPrompt || '你是一个有用的AI助手。'
      
      if (systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt.trim() })
      }
      
      // 根据深度思考开关构建用户消息
      const userContent = options.enableThinking 
        ? `${prompt}\n/think`   // 通过指令开关深度思考
        : `${prompt}\n/no_think`
      
      messages.push({ role: 'user', content: userContent })

      const requestBody = {
        model: model.name,
        input: {
          messages: messages
        },
        parameters: {
          result_format: 'message',
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 10240
        },
        // 通过参数控制思考模式
        extra_body: {
          enable_thinking: options.enableThinking || false
        }
      }

      const response = await fetch(model.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${model.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        
        let errorMessage = '阿里云API调用失败'
        try {
          const error = JSON.parse(errorText)
          errorMessage = error.message || error.error || error.code || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${errorText}`
        }
        
        throw new Error(errorMessage)
      }

      const responseText = await response.text()
      const data = JSON.parse(responseText)
      const content = data.output?.choices?.[0]?.message?.content || data.output?.text || ''
      
      // 处理思维链内容
      let finalContent = content
      let cotContent = ''
      
      if (options.enableThinking && content.includes('<thinking>') && content.includes('</thinking>')) {
        const thinkingStartIndex = content.indexOf('<thinking>') + 10
        const thinkingEndIndex = content.indexOf('</thinking>')
        cotContent = content.slice(thinkingStartIndex, thinkingEndIndex)
        finalContent = content.slice(thinkingEndIndex + 12).trim()
      }
      
      return {
        content: finalContent,
        cot: cotContent,
        usage: data.usage
      }
    } catch (error) {
      throw error
    }
  }

  // 通用 API 调用
  private static async callGeneric(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): Promise<Omit<ModelResponse, 'responseTime' | 'modelName'>> {
    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify({
        model: model.name,
        prompt: prompt,
        system_prompt: options.systemPrompt,  // 添加系统提示词支持
        max_tokens: options.maxTokens || 10240,
        temperature: options.temperature || 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      let errorMessage = '通用API调用失败'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error || error.message || errorMessage
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return {
      content: data.response || data.text || data.content || '',
      usage: data.usage
    }
  }

  // OpenAI 流式 API 调用
  private static async *callOpenAIStream(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): AsyncGenerator<ModelStreamChunk, void, unknown> {
    const messages = []
    
    // 构建系统提示词，包含思维链指令
    let systemPrompt = options.systemPrompt || ''
    
    // 针对千问模型的特殊处理
    if (model.endpoint.includes('dashscope.aliyuncs.com')) {
      // 千问模型使用兼容模式，但需要特殊的深度思考设置
      if (options.enableThinking) {
        systemPrompt += '\n\n请按照以下格式回复：\n<thinking>\n[在这里写出你的思考过程，包括分析、推理、判断等]\n</thinking>\n\n[最终答案]'
      }
    } else if (options.enableThinking) {
      // 其他 OpenAI 兼容模型的思维链格式
      systemPrompt += '\n\n请按照以下格式回复：\n<thinking>\n[在这里写出你的思考过程，包括分析、推理、判断等]\n</thinking>\n\n[最终答案]'
    }
    
    if (systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() })
    }
    
    // 针对千问模型，在用户消息中加入思考指令
    let userContent = prompt
    if (model.endpoint.includes('dashscope.aliyuncs.com') && options.enableThinking) {
      userContent = `${prompt}\n/think`
    }
    
    messages.push({ role: 'user', content: userContent })

    // 构建请求体
    const requestBody: any = {
      model: model.name,
      messages,
      stream: true,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 10240
    }

    // 为千问模型添加特殊参数
    if (model.endpoint.includes('dashscope.aliyuncs.com') && options.enableThinking) {
      requestBody.extra_body = {
        enable_thinking: true
      }
    }

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API调用失败: HTTP ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let isInThinking = false
    let thinkingStarted = false
    let afterThinkingStarted = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              
              if (content) {
                fullContent += content
                
                if (options.enableThinking) {
                  // 检测思维链开始
                  if (!thinkingStarted && fullContent.includes('<thinking>')) {
                    isInThinking = true
                    thinkingStarted = true
                    
                    // 发送思维链开始标记，但不包含 <thinking> 标签本身
                    const thinkingIndex = fullContent.indexOf('<thinking>')
                    const afterThinkingTag = fullContent.slice(thinkingIndex + 10)
                    
                    if (afterThinkingTag) {
                      yield {
                        type: 'thinking',
                        content: afterThinkingTag
                      }
                    }
                    continue
                  }
                  
                  // 在思维链中，流式发送思维链内容
                  if (isInThinking && !fullContent.includes('</thinking>')) {
                    yield {
                      type: 'thinking',
                      content: content
                    }
                    continue
                  }
                  
                  // 检测思维链结束
                  if (isInThinking && fullContent.includes('</thinking>')) {
                    isInThinking = false
                    afterThinkingStarted = true
                    
                    // 发送思维链结束前的剩余内容
                    const thinkingEndIndex = fullContent.lastIndexOf('</thinking>')
                    const lastThinkingContent = fullContent.slice(0, thinkingEndIndex)
                    const lastThinkingStart = lastThinkingContent.lastIndexOf('<thinking>') + 10
                    const remainingThinking = lastThinkingContent.slice(lastThinkingStart)
                    
                    // 计算当前增量中思维链部分
                    const currentThinkingPart = content.split('</thinking>')[0]
                    if (currentThinkingPart) {
                      yield {
                        type: 'thinking',
                        content: currentThinkingPart
                      }
                    }
                    
                    // 发送思维链后的内容
                    const afterThinking = content.split('</thinking>')[1] || ''
                    if (afterThinking.trim()) {
                      yield {
                        type: 'content',
                        content: afterThinking
                      }
                    }
                    continue
                  }
                  
                  // 思维链结束后的正常内容
                  if (afterThinkingStarted || !fullContent.includes('<thinking>')) {
                    yield {
                      type: 'content',
                      content: content
                    }
                  }
                } else {
                  // 没有启用思维链，直接发送内容
                  yield {
                    type: 'content',
                    content: content
                  }
                }
              }
              
              if (parsed.choices?.[0]?.finish_reason) {
                yield {
                  type: 'done',
                  content: '',
                  usage: parsed.usage
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // Anthropic Claude 流式 API 调用
  private static async *callAnthropicStream(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): AsyncGenerator<ModelStreamChunk, void, unknown> {
    // Anthropic 的流式实现
    // 类似 OpenAI，但使用 Anthropic 的 API 格式
    const messages = []
    
    const baseSystemPrompt = options.systemPrompt || ''
    const systemPrompt = options.enableThinking 
      ? baseSystemPrompt + '\n\n请按照以下格式回复：\n<thinking>\n[在这里写出你的思考过程]\n</thinking>\n\n[最终答案]'
      : baseSystemPrompt
    
    const requestBody = {
      model: model.name,
      max_tokens: options.maxTokens || 10240,
      messages: [
        ...(systemPrompt.trim() ? [{
          role: 'system',
          content: systemPrompt.trim()
        }] : []),
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      stream: true
    }

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': model.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API调用失败: HTTP ${response.status}: ${errorText}`)
    }

    // 处理 Anthropic 的流式响应
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || ''
                if (content) {
                  yield {
                    type: 'content',
                    content: content
                  }
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // 阿里云通义千问流式 API 调用
  private static async *callAliyunStream(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): AsyncGenerator<ModelStreamChunk, void, unknown> {
    const messages = []
    
    // 构建系统提示词
    const systemPrompt = options.systemPrompt || '你是一个有用的AI助手。'
    
    if (systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() })
    }
    
    // 根据深度思考开关构建用户消息
    const userContent = options.enableThinking 
      ? `${prompt}\n/think`   // 通过指令开关深度思考
      : `${prompt}\n/no_think`
    
    messages.push({ role: 'user', content: userContent })

    const requestBody = {
      model: model.name,
      input: {
        messages: messages
      },
      parameters: {
        result_format: 'message',
        incremental_output: true, // 阿里云的流式输出参数
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 10240
      },
      // 通过参数控制思考模式
      extra_body: {
        enable_thinking: options.enableThinking || false
      }
    }

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`,
        'X-DashScope-SSE': 'enable'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`阿里云API调用失败: HTTP ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let isInThinking = false
    let thinkingStarted = false
    let afterThinkingStarted = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const deltaContent = parsed.output?.choices?.[0]?.delta?.content || 
                                 parsed.output?.choices?.[0]?.message?.content || ''
              
              if (deltaContent) {
                fullContent += deltaContent
                
                if (options.enableThinking) {
                  // 检测思维链开始
                  if (!thinkingStarted && fullContent.includes('<thinking>')) {
                    isInThinking = true
                    thinkingStarted = true
                    
                    // 发送思维链开始后的内容，但不包含 <thinking> 标签本身
                    const thinkingIndex = fullContent.indexOf('<thinking>')
                    const afterThinkingTag = fullContent.slice(thinkingIndex + 10)
                    
                    if (afterThinkingTag) {
                      yield {
                        type: 'thinking',
                        content: afterThinkingTag
                      }
                    }
                    continue
                  }
                  
                  // 在思维链中，流式发送思维链内容
                  if (isInThinking && !fullContent.includes('</thinking>')) {
                    yield {
                      type: 'thinking',
                      content: deltaContent
                    }
                    continue
                  }
                  
                  // 检测思维链结束
                  if (isInThinking && fullContent.includes('</thinking>')) {
                    isInThinking = false
                    afterThinkingStarted = true
                    
                    // 计算当前增量中思维链部分
                    const currentThinkingPart = deltaContent.split('</thinking>')[0]
                    if (currentThinkingPart) {
                      yield {
                        type: 'thinking',
                        content: currentThinkingPart
                      }
                    }
                    
                    // 发送思维链后的内容
                    const afterThinking = deltaContent.split('</thinking>')[1] || ''
                    if (afterThinking.trim()) {
                      yield {
                        type: 'content',
                        content: afterThinking
                      }
                    }
                    continue
                  }
                  
                  // 思维链结束后的正常内容
                  if (afterThinkingStarted || !fullContent.includes('<thinking>')) {
                    yield {
                      type: 'content',
                      content: deltaContent
                    }
                  }
                } else {
                  // 没有启用思维链，直接发送内容
                  yield {
                    type: 'content',
                    content: deltaContent
                  }
                }
              }
              
              if (parsed.output?.finish_reason) {
                yield {
                  type: 'done',
                  content: '',
                  usage: parsed.usage
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  // 通用流式 API 调用
  private static async *callGenericStream(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): AsyncGenerator<ModelStreamChunk, void, unknown> {
    // 通用流式实现，回退到非流式调用
    const result = await this.callGeneric(model, prompt, options)
    
    // 处理思维链
    let content = result.content
    let thinkingContent = ''
    
    if (options.enableThinking && content.includes('<thinking>') && content.includes('</thinking>')) {
      const thinkingStartIndex = content.indexOf('<thinking>') + 10
      const thinkingEndIndex = content.indexOf('</thinking>')
      thinkingContent = content.slice(thinkingStartIndex, thinkingEndIndex)
      
      // 发送思维链内容
      if (thinkingContent.trim()) {
        yield {
          type: 'thinking',
          content: thinkingContent
        }
        
        // 添加延迟模拟思考时间
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // 获取思维链后的内容
      content = content.slice(thinkingEndIndex + 12).trim()
    }
    
    // 模拟流式输出，将内容分块发送
    const chunkSize = 20 // 每次发送20个字符，更自然
    
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize)
      yield {
        type: 'content',
        content: chunk
      }
      
      // 添加小延迟模拟真实流式体验
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  // 火山引擎 API 调用
  private static async callVolcEngine(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): Promise<Omit<ModelResponse, 'responseTime' | 'modelName'>> {
    const messages = []
    
    // 构建系统提示词
    let systemPrompt = options.systemPrompt || ''
    
    // 针对深度思考模型的特殊处理
    if (model.name.includes('deepseek-r1') || model.name.includes('thinking')) {
      if (options.enableThinking) {
        systemPrompt += '\n\n请按照以下格式回复：\n<thinking>\n[在这里写出你的思考过程，包括分析、推理、判断等]\n</thinking>\n\n[最终答案]'
      }
    }
    
    if (systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() })
    }
    
    messages.push({ role: 'user', content: prompt })

    // 构建请求体 - 使用火山引擎格式
    const requestBody: any = {
      model: model.name,
      messages,
      stream: options.stream || false,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 10240
    }

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      
      let errorMessage = '火山引擎API调用失败'
      try {
        const error = JSON.parse(errorText)
        errorMessage = error.error?.message || error.message || error.code || errorMessage
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    // 处理深度思考模型的响应
    let content = ''
    let cotContent = ''
    
    if (data.choices && data.choices[0]) {
      content = data.choices[0].message?.content || ''
      
      // 如果是深度思考模型，提取思维链内容
      // 火山引擎的 deepseek-r1 可能使用不同的字段名
      if (model.name.includes('deepseek-r1')) {

        
        if (data.choices[0].message?.reasoning_content) {
          cotContent = data.choices[0].message.reasoning_content
          // 如果content为空但有reasoning_content，使用reasoning_content作为主要内容
          if (!content && cotContent) {
            content = cotContent
            cotContent = '' // 避免重复
          }
        } else if (data.choices[0].message?.reasoning) {
          cotContent = data.choices[0].message.reasoning
          // 如果content为空但有reasoning，使用reasoning作为主要内容
          if (!content && cotContent) {
            content = cotContent
            cotContent = '' // 避免重复
          }
        }
      }
    }
    
    // 处理思维链内容（备用方案）
    if (options.enableThinking && content.includes('<thinking>') && content.includes('</thinking>')) {
      const thinkingStartIndex = content.indexOf('<thinking>') + 10
      const thinkingEndIndex = content.indexOf('</thinking>')
      cotContent = content.slice(thinkingStartIndex, thinkingEndIndex)
      content = content.slice(thinkingEndIndex + 12).trim()
    }
    
    return {
      content,
      cot: cotContent,
      usage: data.usage
    }
  }

  // 火山引擎流式 API 调用
  private static async *callVolcEngineStream(
    model: any, 
    prompt: string, 
    options: ModelCallOptions
  ): AsyncGenerator<ModelStreamChunk, void, unknown> {
    const messages = []
    
    let systemPrompt = options.systemPrompt || ''
    // 注意：deepseek-r1 模型有原生的 reasoning 字段支持，不需要额外的系统提示词
    if (model.name.includes('deepseek-r1') && options.enableThinking) {
      // deepseek-r1 使用原生的 reasoning 字段，不需要特殊的系统提示词
    } else if (options.enableThinking) {
      systemPrompt += '\n\n请按照以下格式回复：\n<thinking>\n[在这里写出你的思考过程]\n</thinking>\n\n[最终答案]'
    }
    
    if (systemPrompt.trim()) {
      messages.push({ role: 'system', content: systemPrompt.trim() })
    }
    
    messages.push({ role: 'user', content: prompt })

    const requestBody: any = {
      model: model.name,
      messages,
      stream: true,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 10240
    }

    // deepseek-r1 模型原生支持 reasoning 字段，无需额外参数

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`火山引擎API调用失败: HTTP ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullContent = ''
    let isInThinking = false
    let thinkingStarted = false
    let afterThinkingStarted = false

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              

              
              // 处理深度思考模型的特殊响应格式
              let content = ''
              
              // 处理思维链内容 - deepseek-r1 专用
              // 火山引擎的 deepseek-r1 使用 reasoning_content 字段，而不是 reasoning 字段
              if (parsed.choices?.[0]?.delta?.reasoning_content) {
                const reasoningContent = parsed.choices[0].delta.reasoning_content
                yield {
                  type: 'thinking',
                  content: reasoningContent
                }
              } else if (parsed.choices?.[0]?.delta?.reasoning) {
                // 备用：标准的 reasoning 字段
                const reasoningContent = parsed.choices[0].delta.reasoning
                yield {
                  type: 'thinking',
                  content: reasoningContent
                }
              }
              
              // 处理正常内容（content字段）
              if (parsed.choices?.[0]?.delta?.content) {
                content = parsed.choices[0].delta.content
              }
              
              // 处理正常内容
              if (content) {
                fullContent += content
                
                // 对于 deepseek-r1，直接发送 content，因为 reasoning 已经单独处理了
                if (model.name.includes('deepseek-r1')) {
                  yield {
                    type: 'content',
                    content: content
                  }
                } else if (options.enableThinking) {
                  // 其他模型的思维链处理逻辑（使用 <thinking> 标签）
                  if (!thinkingStarted && fullContent.includes('<thinking>')) {
                    isInThinking = true
                    thinkingStarted = true
                    const thinkingIndex = fullContent.indexOf('<thinking>')
                    const afterThinkingTag = fullContent.slice(thinkingIndex + 10)
                    if (afterThinkingTag) {
                      yield {
                        type: 'thinking',
                        content: afterThinkingTag
                      }
                    }
                    continue
                  }
                  
                  if (isInThinking && !fullContent.includes('</thinking>')) {
                    yield {
                      type: 'thinking',
                      content: content
                    }
                    continue
                  }
                  
                  if (isInThinking && fullContent.includes('</thinking>')) {
                    isInThinking = false
                    afterThinkingStarted = true
                    const currentThinkingPart = content.split('</thinking>')[0]
                    if (currentThinkingPart) {
                      yield {
                        type: 'thinking',
                        content: currentThinkingPart
                      }
                    }
                    const afterThinking = content.split('</thinking>')[1] || ''
                    if (afterThinking.trim()) {
                      yield {
                        type: 'content',
                        content: afterThinking
                      }
                    }
                    continue
                  }
                  
                  if (afterThinkingStarted || !fullContent.includes('<thinking>')) {
                    yield {
                      type: 'content',
                      content: content
                    }
                  }
                } else {
                  // 没有启用思维链，直接发送内容
                  yield {
                    type: 'content',
                    content: content
                  }
                }
              }
              
              if (parsed.choices?.[0]?.finish_reason) {
                yield {
                  type: 'done',
                  content: '',
                  usage: parsed.usage
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }
} 