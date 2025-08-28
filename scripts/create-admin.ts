import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

async function createAdmin() {
  const email = 'admin@example.com'
  const password = 'admin123456'
  const name = 'System Administrator'

  try {
    // 检查管理员是否已存在
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      console.log('管理员账户已存在:', email)
      
      // 如果用户存在但不是管理员，更新为管理员
      if (existingAdmin.role !== Role.ADMIN) {
        await prisma.user.update({
          where: { email },
          data: { role: Role.ADMIN }
        })
        console.log('✅ 已将用户更新为管理员')
      } else {
        console.log('✅ 管理员账户已存在且角色正确')
      }
      return
    }

    // 创建新的管理员用户
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: Role.ADMIN
      }
    })

    console.log('✅ 管理员账户创建成功!')
    console.log('📧 邮箱:', email)
    console.log('🔑 密码:', password)
    console.log('👤 用户ID:', admin.id)
    console.log('')
    console.log('🚀 现在可以使用此账户登录管理端: /admin')

  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()