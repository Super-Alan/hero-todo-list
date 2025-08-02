// 加载环境变量
require('dotenv').config()

const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function testAuth() {
  console.log('🔍 测试用户认证...\n')
  
  try {
    // 获取第一个用户
    const user = await prisma.user.findFirst({
      include: {
        accounts: true,
        sessions: true
      }
    })
    
    if (!user) {
      console.log('❌ 没有找到用户')
      return
    }
    
    console.log('📋 用户信息:')
    console.log(`  - ID: ${user.id}`)
    console.log(`  - 邮箱: ${user.email}`)
    console.log(`  - 姓名: ${user.name}`)
    console.log(`  - 账户数量: ${user.accounts.length}`)
    console.log(`  - 会话数量: ${user.sessions.length}`)
    
    // 检查账户
    if (user.accounts.length > 0) {
      console.log('\n📋 账户信息:')
      user.accounts.forEach(account => {
        console.log(`  - 提供商: ${account.provider}`)
        console.log(`  - 账户ID: ${account.providerAccountId}`)
      })
    }
    
    // 检查会话
    if (user.sessions.length > 0) {
      console.log('\n📋 会话信息:')
      user.sessions.forEach(session => {
        console.log(`  - 会话ID: ${session.id}`)
        console.log(`  - 过期时间: ${session.expires}`)
        console.log(`  - 是否过期: ${new Date() > session.expires}`)
      })
    }
    
    // 测试任务访问
    console.log('\n🔍 测试任务访问...')
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      take: 3
    })
    
    console.log(`找到 ${tasks.length} 个任务`)
    tasks.forEach(task => {
      console.log(`  - ${task.title} (${task.id})`)
    })
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth() 