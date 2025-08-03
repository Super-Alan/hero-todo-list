require('dotenv').config();

console.log('=== GitHub OAuth 诊断报告 ===\n');

// 检查环境变量
console.log('1. 环境变量检查:');
console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ 未设置');
console.log('   NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ 已设置' : '❌ 未设置');
console.log('   GITHUB_ID:', process.env.GITHUB_ID || '❌ 未设置');
console.log('   GITHUB_SECRET:', process.env.GITHUB_SECRET ? '✅ 已设置' : '❌ 未设置');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ 已设置' : '❌ 未设置');

console.log('\n2. 配置验证:');
const clientId = process.env.GITHUB_ID;
const clientSecret = process.env.GITHUB_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;

if (clientId && clientSecret && nextAuthUrl) {
  console.log('   ✅ 所有必需的环境变量都已设置');
} else {
  console.log('   ❌ 缺少必需的环境变量');
}

console.log('\n3. GitHub OAuth App 设置检查清单:');
console.log('   请访问: https://github.com/settings/developers');
console.log('   找到 Client ID 为:', clientId || '未知');
console.log('   确保以下设置正确:');
console.log('   - Authorization callback URL: http://localhost:3010/api/auth/callback/github');
console.log('   - Homepage URL: http://localhost:3010');
console.log('   - 应用状态: 激活');

console.log('\n4. 网络连接测试:');
async function testConnections() {
  try {
    const githubResponse = await fetch('https://api.github.com/rate_limit');
    console.log('   GitHub API: ✅ 连接正常');
  } catch (error) {
    console.log('   GitHub API: ❌ 连接失败 -', error.message);
  }
  
  try {
    const localResponse = await fetch('http://localhost:3010/api/auth/providers');
    console.log('   NextAuth API: ✅ 连接正常');
  } catch (error) {
    console.log('   NextAuth API: ❌ 连接失败 -', error.message);
    console.log('   请确保运行: npm run dev');
  }
}

testConnections();

console.log('\n5. 故障排除建议:');
console.log('   - 清除浏览器缓存和cookies');
console.log('   - 尝试无痕模式');
console.log('   - 检查防火墙设置');
console.log('   - 确保没有代理或VPN干扰');
console.log('   - 重启开发服务器: npm run dev'); 