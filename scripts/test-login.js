// 测试用户登录状态
console.log('🔍 测试用户登录状态...\n')

console.log('📋 请按照以下步骤操作：')
console.log('1. 打开浏览器访问: http://localhost:3010')
console.log('2. 如果看到登录页面，点击"使用 GitHub 登录"或"使用 Google 登录"')
console.log('3. 完成OAuth授权流程')
console.log('4. 登录成功后，尝试更新任务状态')
console.log('')

console.log('🔧 如果遇到问题：')
console.log('- 确保环境变量配置正确')
console.log('- 检查OAuth提供商设置')
console.log('- 清除浏览器缓存和Cookie')
console.log('- 重新启动开发服务器')
console.log('')

console.log('📊 验证步骤：')
console.log('1. 登录后访问: http://localhost:3010/api/tasks/stats')
console.log('2. 应该返回任务统计数据而不是"未授权"错误')
console.log('3. 尝试更新任务状态，应该不再出现"任务不存在"错误')
console.log('')

console.log('🎯 预期结果：')
console.log('- 用户成功登录')
console.log('- API调用返回正确数据')
console.log('- 任务管理功能正常工作') 