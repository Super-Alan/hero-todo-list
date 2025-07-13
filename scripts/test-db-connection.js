// 加载环境变量
require('dotenv').config()

const { PrismaClient } = require('../src/generated/prisma')
const path = require('path')
const fs = require('fs')

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...\n')
  
  // 检查 .env 文件是否存在
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    console.log('✅ 找到 .env 文件')
    
    // 读取并显示 .env 文件中的非敏感信息
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
    console.log(`📋 .env 文件包含 ${lines.length} 个配置项`)
    
    // 检查是否包含 DATABASE_URL
    const hasDatabaseUrl = lines.some(line => line.trim().startsWith('DATABASE_URL='))
    if (hasDatabaseUrl) {
      console.log('✅ .env 文件中找到 DATABASE_URL 配置')
    } else {
      console.log('❌ .env 文件中未找到 DATABASE_URL 配置')
    }
  } else {
    console.log('❌ 未找到 .env 文件，请在项目根目录创建 .env 文件')
  }
  
  // 检查环境变量
  if (!process.env.DATABASE_URL) {
    console.error('❌ 错误：未找到 DATABASE_URL 环境变量')
    console.log('请确保 .env 文件中配置了 DATABASE_URL')
    process.exit(1)
  }
  
  console.log('✅ 找到 DATABASE_URL 环境变量')
  
  // 隐藏密码部分显示连接字符串
  const dbUrl = process.env.DATABASE_URL
  const hiddenUrl = dbUrl.replace(/:([^:@]+)@/, ':****@')
  console.log(`📋 连接字符串: ${hiddenUrl}\n`)
  
  const prisma = new PrismaClient()
  
  try {
    console.log('🔗 尝试连接数据库...')
    
    // 测试连接
    await prisma.$connect()
    console.log('✅ 数据库连接成功！')
    
    // 测试查询
    console.log('🔍 测试数据库查询...')
    const result = await prisma.$queryRaw`SELECT version(), current_database(), current_user`
    console.log('✅ 数据库查询成功！')
    console.log('📊 数据库信息:')
    console.log(result)
    
    // 检查表是否存在
    console.log('\n🔍 检查表结构...')
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `
      
      if (tables.length === 0) {
        console.log('⚠️  数据库中没有表，需要运行: npx prisma db push')
      } else {
        console.log(`✅ 找到 ${tables.length} 个表:`)
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`)
        })
      }
    } catch (error) {
      console.log('⚠️  无法检查表结构（这是正常的，如果是第一次设置）')
    }
    
    console.log('\n🎉 数据库连接测试完成！')
    
  } catch (error) {
    console.error('❌ 数据库连接失败:')
    console.error(error.message)
    
    // 提供诊断建议
    console.log('\n🔧 诊断建议:')
    
    if (error.code === 'P1001') {
      console.log('• 无法连接到数据库服务器')
      console.log('• 检查 Supabase 项目是否正常运行')
      console.log('• 检查网络连接')
      console.log('• 验证数据库 URL 是否正确')
    } else if (error.code === 'P1000') {
      console.log('• 认证失败，检查数据库密码')
    } else if (error.code === 'P1003') {
      console.log('• 数据库不存在，检查数据库名称')
    } else {
      console.log('• 检查数据库连接字符串格式')
      console.log('• 确认 Supabase 项目状态')
    }
    
    console.log('\n📚 查看 DATABASE_SETUP.md 获取详细解决方案')
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabaseConnection() 