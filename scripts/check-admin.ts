import { prisma } from '../src/lib/prisma'

async function checkAdmin() {
  try {
    // 查找管理员邮箱的用户
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    if (!adminUser) {
      console.log('❌ 管理员用户不存在')
      return
    }

    console.log('✅ 找到管理员用户:')
    console.log('📧 邮箱:', adminUser.email)
    console.log('👤 姓名:', adminUser.name)
    console.log('🎭 角色:', adminUser.role)
    console.log('🆔 用户ID:', adminUser.id)
    console.log('📅 创建时间:', adminUser.createdAt)

    // 检查是否为管理员
    if (adminUser.role === 'ADMIN') {
      console.log('✅ 用户角色为管理员，权限正确')
    } else {
      console.log('⚠️ 用户角色不是管理员，当前角色:', adminUser.role)
      
      // 提示如何修复
      console.log('🔧 修复命令: 需要将用户角色更新为ADMIN')
    }

    // 查询所有管理员
    const allAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        email: true,
        name: true,
        role: true
      }
    })

    console.log('\n📋 所有管理员用户:')
    allAdmins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.name || '未设置姓名'})`)
    })

  } catch (error) {
    console.error('❌ 检查管理员用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()