require('dotenv').config();

async function testOAuthFlow() {
  console.log('测试OAuth流程...');
  
  const clientId = process.env.GITHUB_ID;
  const redirectUri = 'http://localhost:3010/api/auth/callback/github';
  
  // 构建授权URL
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user%20user:email&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  console.log('授权URL:', authUrl);
  console.log('\n请检查以下设置：');
  console.log('1. GitHub OAuth App 的 Authorization callback URL 应该设置为：', redirectUri);
  console.log('2. 确保应用是激活状态');
  console.log('3. 确保没有IP限制');
  
  // 测试回调URL是否可访问
  try {
    const response = await fetch('http://localhost:3010/api/auth/callback/github?error=test', {
      method: 'GET'
    });
    console.log('✅ 回调URL可访问，状态码:', response.status);
  } catch (error) {
    console.log('⚠️ 回调URL测试失败:', error.message);
    console.log('请确保开发服务器正在运行 (npm run dev)');
  }
}

testOAuthFlow(); 