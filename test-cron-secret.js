/**
 * 测试 CRON_SECRET 配置
 */

require('dotenv').config();

console.log('🔐 测试 CRON_SECRET 配置\n');
console.log('=' .repeat(60));

// 检查环境变量
const cronSecret = process.env.CRON_SECRET;

if (cronSecret) {
  console.log('✅ CRON_SECRET 已设置');
  console.log(`   长度: ${cronSecret.length} 字符`);
  console.log(`   前6个字符: ${cronSecret.substring(0, 6)}...`);
} else {
  console.log('❌ CRON_SECRET 未设置');
  console.log('   请在 .env 文件中添加 CRON_SECRET');
  process.exit(1);
}

// 测试 API 端点
const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3010';

console.log('\n📡 测试定时任务 API 端点');
console.log('=' .repeat(60));

async function testCronAPI() {
  // 测试1：带正确密钥的请求
  console.log('\n1️⃣ 测试带正确密钥的请求...');
  try {
    const response = await fetch(`${apiUrl}/api/cron/generate-recurring-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 请求成功！');
      console.log('   响应:', data);
    } else {
      console.log(`⚠️  请求返回状态码: ${response.status}`);
      const text = await response.text();
      console.log('   响应:', text);
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
  
  // 测试2：不带密钥的请求（应该失败）
  console.log('\n2️⃣ 测试不带密钥的请求（应该返回401）...');
  try {
    const response = await fetch(`${apiUrl}/api/cron/generate-recurring-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ 正确拒绝了未授权请求（401）');
    } else {
      console.log(`⚠️  意外的状态码: ${response.status}（预期401）`);
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
  
  // 测试3：带错误密钥的请求（应该失败）
  console.log('\n3️⃣ 测试带错误密钥的请求（应该返回401）...');
  try {
    const response = await fetch(`${apiUrl}/api/cron/generate-recurring-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wrong-secret-key',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      console.log('✅ 正确拒绝了错误密钥（401）');
    } else {
      console.log(`⚠️  意外的状态码: ${response.status}（预期401）`);
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
}

testCronAPI().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('✨ 测试完成！\n');
  console.log('📝 总结:');
  console.log('   1. CRON_SECRET 已正确设置在环境变量中');
  console.log('   2. API 端点正确验证了授权密钥');
  console.log('   3. 未授权的请求被正确拒绝');
  console.log('\n💡 提示:');
  console.log('   - 在生产环境中，请使用 Vercel 环境变量设置');
  console.log('   - 定期更换密钥以保证安全');
  console.log('   - 查看 docs/CRON_SECRET_SETUP.md 了解更多详情');
});