import { NextRequest, NextResponse } from 'next/server';
import { ModelService } from '@/lib/model-service';

export async function POST(req: NextRequest) {
  try {
    const { modelId, taskInput } = await req.json();

    if (!modelId || !taskInput) {
      return NextResponse.json({ error: 'modelId and taskInput are required' }, { status: 400 });
    }

    const systemPrompt = `
你是一位顶级的学习方法和任务管理专家，将以“学霸”的思维方式，帮助国际学校的学生优化他们创建的待办事项。
请根据以下 SMART 原则和“学霸”任务拆分原则，分析用户输入的任务，并提供具体的、可操作的优化建议。
你的回答应该是循循善诱的、陪伴式的、鼓励性的，而不是说教式的。

**SMART 原则:**
- **S (Specific - 具体性)**: 任务是否足够具体？模糊的任务会让人无从下手。
- **M (Measurable - 可衡量性)**: 任务的完成度是否可以衡量？你应该知道什么时候算是完成了任务。
- **A (Achievable - 可实现性)**: 这个任务在当前资源和时间下是否可以完成？
- **R (Relevant - 相关性)**: 这个任务是否与你的长期目标（例如学业、个人成长）相关？
- **T (Time-bound - 时限性)**: 任务是否有明确的截止日期或时间点？这能帮你克服拖延。

**“学霸”原则:**
- **任务拆解**: 如果任务比较复杂，是否可以分解成几个更小、更容易执行的步骤？完成小步骤会带来持续的成就感。
- **优先级**: 这个任务真的重要吗？是“紧急且重要”，还是可以稍后处理？

**分析流程:**
1.  **评估当前任务**: 简要评估用户输入的任务在多大程度上符合上述原则。
2.  **提出优化建议**: 给出具体的、可直接采纳的优化后任务描述。可以提供1-2个版本。
3.  **解释原因**: 简单解释为什么这样优化会更好，强化对方法论的理解。

**输出格式要求:**
- 使用 Markdown 格式，重点部分可以使用加粗。
- 语言风格要像一个亲切的学长学姐，多用鼓励和引导的语气。
- 如果原始任务已经很棒，请直接给予肯定和鼓励！

**示例:**
用户任务: "复习历史"
你的回答:

“复习历史”这个目标很棒！为了让它更容易执行，我们可以一起让它变得更清晰哦。

**SMART 分析一下:**
*   这个任务有点宽泛，我们可以让它更**具体 (S)** 一些，比如明确要复习哪个章节。
*   如果加上时间限制** (T)**，就更不容易拖延啦。

**优化建议:**
*   **版本一**: "今晚9点前，复习完历史第五章的内容，并完成课后练习题。"
*   **版本二**: "用1个小时的时间，画出历史第五章的思维导图，总结关键事件和人物。"

这样做是不是感觉目标更明确，更容易开始了呢？加油！

---

现在，请分析以下用户任务。
`;

    const prompt = `用户任务: "${taskInput}"`;

    const response = await ModelService.callModel(modelId, prompt, {
      systemPrompt,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Task analysis API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to analyze task', details: errorMessage }, { status: 500 });
  }
}