import { NextRequest } from 'next/server'
import { ModelService } from '@/lib/model-service'

export async function POST(request: NextRequest) {
  try {
    const { input, modelId, systemPrompt } = await request.json()

    if (!input || !modelId) {
      return new Response(
        JSON.stringify({ error: 'Input and model ID are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const encoder = new TextEncoder()
          
          // Call the streaming model service
          const streamGenerator = ModelService.callModelStream(modelId, input, {
            stream: true,
            systemPrompt: systemPrompt || `你是一个专业的任务管理助手。请帮助用户分析和分解任务，提供具体可执行的建议。

请以友好、专业的语气回复用户，并在适当时候提供具体的任务分解建议。

如果用户描述了一个复杂的目标或项目，请帮助他们将其分解为具体的、可执行的任务步骤。`,
            temperature: 0.7,
            maxTokens: 2000,
            enableThinking: true
          })

          for await (const chunk of streamGenerator) {
            const data = JSON.stringify(chunk)
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            
            if (chunk.type === 'done') {
              break
            }
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          const errorChunk = {
            type: 'error',
            content: error instanceof Error ? error.message : 'Unknown error occurred'
          }
          const encoder = new TextEncoder()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Chat stream API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
