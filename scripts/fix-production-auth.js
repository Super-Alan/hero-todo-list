require('dotenv').config();

console.log('=== 生产环境认证修复指南 ===\n');

const productionDomain = 'https://www.beyondlimit.me';

console.log('你的生产环境域名:', productionDomain);
console.log('\n=== 需要配置的内容 ===\n');

console.log('1. Vercel 环境变量设置:');
console.log('   在 Vercel Dashboard > 项目设置 > Environment Variables 中添加:');
console.log(`   NEXTAUTH_URL = ${productionDomain}`);
console.log('   NEXTAUTH_SECRET = 84d35c7f2b5a3a5c3d8f5e4a7b3d9c5f6e7a8b9c0d1e2f3a4b5c6d7e8f9a');
console.log('   GITHUB_ID = Ov23li88AYNqDkt9IjmO');
console.log('   GITHUB_SECRET = d3113008a5f279ea4b2c2757b93ab492bd3f080d');
console.log('   DATABASE_URL = postgresql://postgres.bniigvmwzpfvnbmzeeqk:FJkCoxd3NTmaMVJG@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require');

console.log('\n2. GitHub OAuth App 设置:');
console.log('   访问: https://github.com/settings/developers');
console.log('   找到 Client ID: Ov23li88AYNqDkt9IjmO 的应用');
console.log('   更新以下设置:');
console.log('\n   Authorization callback URL:');
console.log('   - http://localhost:3010/api/auth/callback/github (开发环境)');
console.log(`   - ${productionDomain}/api/auth/callback/github (生产环境)`);
console.log('\n   Homepage URL:');
console.log(`   - ${productionDomain}`);

console.log('\n3. 检查清单:');
console.log('   ✅ 环境变量已设置');
console.log('   ✅ GitHub OAuth App 回调URL包含生产环境域名');
console.log('   ✅ 数据库连接正常');
console.log('   ✅ 重新部署应用');

console.log('\n4. 测试步骤:');
console.log('   1. 推送代码到 GitHub');
console.log('   2. 等待 Vercel 自动部署');
console.log('   3. 访问生产环境网站');
console.log('   4. 尝试 GitHub 登录');
console.log('   5. 检查浏览器控制台是否有错误'); 