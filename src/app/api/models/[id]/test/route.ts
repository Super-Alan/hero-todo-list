import { NextRequest, NextResponse } from 'next/server'
import { ModelService } from '../../../../../lib/model-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const { id } = resolvedParams
  try {
    // 使用统一的模型服务进行测试
    const testResult = await ModelService.testModel(id)

    return NextResponse.json({
      success: true,
      message: '模型测试成功',
      testResult: {
        status: 'success',
        responseTime: `${testResult.responseTime}ms`,
        apiVersion: 'v1',
        modelInfo: {
          name: testResult.modelName,
          version: 'latest',
          capabilities: ['text-generation', 'conversation']
        },
        testPrompt: '请简单介绍一下您的功能',
        response: testResult.content
      }
    })
  } catch (error) {
    console.error('模型测试失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '模型测试失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
} 