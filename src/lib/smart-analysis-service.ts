import { ModelResponse } from './model-service';

export class SmartAnalysisService {
  /**
   * 调用后端 API 分析任务
   */
  static async analyzeTask(
    modelId: string,
    taskInput: string
  ): Promise<ModelResponse> {
    const response = await fetch('/api/analyze-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId, taskInput }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to analyze task');
    }

    return response.json();
  }
}