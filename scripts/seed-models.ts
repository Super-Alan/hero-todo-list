import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedModels() {
  console.log('Seeding model providers...')

  // 首先创建或获取测试用户
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User'
    }
  })

  console.log(`Using test user: ${testUser.email}`)

  // Create default model providers
  const models = [
    {
      name: 'DeepSeek R1',
      description: '强大的推理模型，适合复杂任务分解',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: 'your-deepseek-api-key-here',
      isActive: true
    },
    {
      name: 'OpenAI GPT-4',
      description: 'OpenAI GPT-4 模型',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'your-openai-api-key-here',
      isActive: false
    },
    {
      name: 'Claude 3',
      description: 'Anthropic Claude 3 模型',
      endpoint: 'https://api.anthropic.com/v1/messages',
      apiKey: 'your-anthropic-api-key-here',
      isActive: false
    }
  ]

  for (const model of models) {
    try {
      // 使用复合唯一约束查询
      const existing = await prisma.modelProvider.findFirst({
        where: { 
          name: model.name,
          userId: testUser.id
        }
      })

      if (!existing) {
        await prisma.modelProvider.create({
          data: {
            ...model,
            userId: testUser.id
          }
        })
        console.log(`✓ Created model provider: ${model.name}`)
      } else {
        console.log(`- Model provider already exists: ${model.name}`)
      }
    } catch (error) {
      console.error(`✗ Failed to create model provider ${model.name}:`, error)
    }
  }

  console.log('Model providers seeding completed!')
}

seedModels()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
