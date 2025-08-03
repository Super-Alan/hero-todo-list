const fs = require('fs');
const path = require('path');

console.log('=== 构建配置测试 ===\n');

// 检查package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('✅ package.json 存在');
  
  // 检查Next.js依赖
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  if (dependencies.next) {
    console.log(`✅ Next.js 在 dependencies 中: ${dependencies.next}`);
  } else if (devDependencies.next) {
    console.log(`✅ Next.js 在 devDependencies 中: ${devDependencies.next}`);
  } else {
    console.log('❌ Next.js 未找到');
  }
  
  // 检查构建脚本
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log(`✅ 构建脚本: ${packageJson.scripts.build}`);
  } else {
    console.log('❌ 构建脚本未找到');
  }
} else {
  console.log('❌ package.json 不存在');
}

// 检查next.config.js
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  console.log('✅ next.config.js 存在');
} else {
  console.log('❌ next.config.js 不存在');
}

// 检查项目结构
const srcPath = path.join(process.cwd(), 'src');
const appPath = path.join(process.cwd(), 'src/app');
if (fs.existsSync(srcPath)) {
  console.log('✅ src 目录存在');
  if (fs.existsSync(appPath)) {
    console.log('✅ src/app 目录存在');
  } else {
    console.log('❌ src/app 目录不存在');
  }
} else {
  console.log('❌ src 目录不存在');
}

console.log('\n=== 建议 ===');
console.log('1. 确保 Vercel 项目设置中的 Root Directory 为空或指向项目根目录');
console.log('2. 在 Vercel Dashboard 中重新部署项目');
console.log('3. 如果问题持续，尝试在 Vercel Dashboard 中重新导入项目'); 