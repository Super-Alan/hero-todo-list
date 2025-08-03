require('dotenv').config();
const { GitHubProvider } = require('next-auth/providers/github');

// 测试GitHub OAuth配置
async function testGitHubAuth() {
  console.log('测试GitHub OAuth配置...');
  
  const clientId = process.env.GITHUB_ID;
  const clientSecret = process.env.GITHUB_SECRET;
  
  console.log('Client ID:', clientId);
  console.log('Client Secret:', clientSecret ? '***' + clientSecret.slice(-4) : '未设置');
  
  if (!clientId || !clientSecret) {
    console.error('❌ GitHub OAuth配置不完整');
    return;
  }
  
  console.log('✅ GitHub OAuth配置看起来正确');
  
  // 测试GitHub API连接
  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'HeroToDo-App'
      }
    });
    
    if (response.ok) {
      console.log('✅ GitHub API连接正常');
    } else {
      console.log('⚠️ GitHub API连接有问题:', response.status);
    }
  } catch (error) {
    console.error('❌ GitHub API连接失败:', error.message);
  }
}

testGitHubAuth(); 