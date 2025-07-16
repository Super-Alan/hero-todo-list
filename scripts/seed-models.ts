import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedModels() {
  // 创建或获取测试用户
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: { email: 'test@example.com', name: 'Test User' }
  })

  const models = [
    { name: 'DeepSeek R1', description: '强大推理', endpoint: 'https://api.deepseek.com/v1/chat/completions', apiKey: 'your-deepseek-api-key-here', isActive: true },
    { name: 'OpenAI GPT-4', description: 'OpenAI GPT-4', endpoint: 'https://api.openai.com/v1/chat/completions', apiKey: 'your-openai-api-key-here', isActive: false },
    { name: 'Claude 3', description: 'Anthropic Claude 3', endpoint: 'https://api.anthropic.com/v1/messages', apiKey: 'your-anthropic-api-key-here', isActive: false }
  ]

  for (const model of models) {
    const existing = await prisma.modelProvider.findFirst({
      where: { userId: testUser.id, name: model.name }
    })
    if (!existing) {
      await prisma.modelProvider.create({
        data: { ...model, userId: testUser.id }
      })
      console.log(`✓ Created: ${model.name}`)
    } else {
      console.log(`- Exists: ${model.name}`)
    }
  }
}

seedModels().finally(() => prisma.$disconnect())
