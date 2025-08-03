require('dotenv').config();

console.log('=== 环境变量检查 ===\n');

const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET', 
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'DATABASE_URL'
];

console.log('必需的环境变量:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' + value.slice(-4) : value}`);
  } else {
    console.log(`❌ ${varName}: 未设置`);
  }
});

console.log('\n=== Vercel 环境变量设置指南 ===');
console.log('在 Vercel Dashboard > 项目设置 > Environment Variables 中添加:');
console.log('NEXTAUTH_URL = https://www.beyondlimit.me');
console.log('NEXTAUTH_SECRET = 84d35c7f2b5a3a5c3d8f5e4a7b3d9c5f6e7a8b9c0d1e2f3a4b5c6d7e8f9a');
console.log('GITHUB_CLIENT_ID = Ov23li88AYNqDkt9IjmO');
console.log('GITHUB_CLIENT_SECRET = d3113008a5f279ea4b2c2757b93ab492bd3f080d');
console.log('DATABASE_URL = postgresql://postgres.bniigvmwzpfvnbmzeeqk:FJkCoxd3NTmaMVJG@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require'); 