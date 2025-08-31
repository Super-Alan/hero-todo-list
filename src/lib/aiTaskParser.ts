import { CreateTaskInput } from '@/types';

/**
 * AI-powered task parser that replaces NLP regex-based parsing
 * Uses the selected AI model to intelligently parse user input
 */

export interface AIParseResult {
  task: CreateTaskInput;
  confidence: number;
  source: 'ai' | 'fallback';
}

export interface AIParseOptions {
  modelId?: string;
  timeout?: number;
  enableFallback?: boolean;
}

/**
 * Parse user input using AI model immediately (no debouncing)
 * @param input - User's natural language input
 * @param options - Parse options including model selection
 * @returns Parsed task data with confidence score
 */
export async function parseTaskWithAI(
  input: string, 
  options: AIParseOptions = {}
): Promise<AIParseResult> {
  const {
    modelId,
    timeout = 5000,
    enableFallback = true
  } = options;

  if (!input.trim()) {
    return {
      task: { title: '', tagIds: [] },
      confidence: 0,
      source: 'fallback'
    };
  }

  try {
    // Call the AI parsing API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('/api/ai/parse-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: input.trim(),
        modelId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI parsing failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return {
        task: result.data,
        confidence: 0.9, // High confidence for successful AI parsing
        source: 'ai'
      };
    } else {
      throw new Error('Invalid AI response format');
    }

  } catch (error) {
    console.warn('AI task parsing failed:', error);
    
    if (enableFallback) {
      return {
        task: generateFallbackTask(input),
        confidence: 0.3, // Low confidence for fallback
        source: 'fallback'
      };
    } else {
      throw error;
    }
  }
}

/**
 * Generate a basic fallback task when AI parsing fails
 * @param input - Original user input
 * @returns Basic task structure
 */
function generateFallbackTask(input: string): CreateTaskInput {
  return {
    title: input.trim(),
    description: undefined,
    dueDate: undefined,
    dueTime: undefined,
    timeDescription: undefined,
    priority: undefined,
    tagIds: []
  };
}

/**
 * Validate and sanitize parsed task data
 * @param task - Parsed task data
 * @returns Sanitized task data
 */
export function validateParsedTask(task: CreateTaskInput): CreateTaskInput {
  return {
    title: (task.title || '').trim(),
    description: task.description?.trim() || undefined,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    dueTime: task.dueTime ? new Date(task.dueTime) : undefined,
    timeDescription: task.timeDescription?.trim() || undefined,
    priority: task.priority || undefined,
    tagIds: Array.isArray(task.tagIds) ? task.tagIds.filter(Boolean) : []
  };
}

/**
 * Debounced AI parsing for real-time input
 * @param input - User input
 * @param options - Parse options
 * @param delay - Debounce delay in milliseconds
 * @returns Promise that resolves to parse result
 */
export function debouncedParseTask(
  input: string, 
  options: AIParseOptions = {},
  delay: number = 500
): Promise<AIParseResult> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(async () => {
      try {
        const result = await parseTaskWithAI(input, options);
        resolve(result);
      } catch (error) {
        resolve({
          task: generateFallbackTask(input),
          confidence: 0.1,
          source: 'fallback'
        });
      }
    }, delay);

    // Store timeout ID for potential cancellation
    (debouncedParseTask as any).lastTimeoutId = timeoutId;
  });
}

/**
 * Cancel any pending debounced parse operation
 */
export function cancelDebouncedParse(): void {
  const timeoutId = (debouncedParseTask as any).lastTimeoutId;
  if (timeoutId) {
    clearTimeout(timeoutId);
    delete (debouncedParseTask as any).lastTimeoutId;
  }
}

/**
 * Batch parse multiple tasks (for advanced scenarios)
 * @param inputs - Array of user inputs
 * @param options - Parse options
 * @returns Array of parse results
 */
export async function batchParseTask(
  inputs: string[],
  options: AIParseOptions = {}
): Promise<AIParseResult[]> {
  const promises = inputs.map(input => parseTaskWithAI(input, options));
  return Promise.allSettled(promises).then(results => 
    results.map((result, index) => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            task: generateFallbackTask(inputs[index]),
            confidence: 0.1,
            source: 'fallback' as const
          }
    )
  );
}

/**
 * Get parsing confidence level description
 * @param confidence - Confidence score (0-1)
 * @returns Human-readable confidence level
 */
export function getConfidenceLevel(confidence: number): string {
  if (confidence >= 0.8) return '高';
  if (confidence >= 0.6) return '中';
  if (confidence >= 0.4) return '低';
  return '极低';
}

/**
 * Check if task parsing result is reliable enough
 * @param result - Parse result
 * @param minConfidence - Minimum acceptable confidence (default: 0.5)
 * @returns Whether the result is reliable
 */
export function isParseResultReliable(
  result: AIParseResult, 
  minConfidence: number = 0.5
): boolean {
  return result.confidence >= minConfidence && 
         result.source === 'ai' && 
         result.task.title.trim().length > 0;
}