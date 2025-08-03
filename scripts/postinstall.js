const { execSync } = require('child_process');

console.log('Running postinstall script...');

try {
  // 生成 Prisma 客户端
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully!');
} catch (error) {
  console.error('Error generating Prisma client:', error.message);
  process.exit(1);
} 