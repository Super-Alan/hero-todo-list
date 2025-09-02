#!/usr/bin/env node

/**
 * 定时任务策略设置脚本
 * 帮助用户根据部署环境选择最佳的定时任务策略
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 HeroToDoList 定时任务策略设置向导\n')

// 检测当前环境
function detectEnvironment() {
  const isVercel = fs.existsSync('vercel.json')
  const hasDockerfile = fs.existsSync('Dockerfile')
  const hasK8sConfig = fs.existsSync('k8s') || fs.existsSync('kubernetes')
  const hasServerConfig = fs.existsSync('server.js') || fs.existsSync('ecosystem.config.js')
  
  return {
    isVercel,
    hasDockerfile,
    hasK8sConfig,
    hasServerConfig,
    nodeEnv: process.env.NODE_ENV || 'development'
  }
}

// 推荐策略
function recommendStrategy(env) {
  if (env.nodeEnv === 'development') {
    return {
      strategy: 'user-triggered',
      reason: '开发环境推荐用户触发策略，无需配置，立即可用'
    }
  }
  
  if (env.isVercel && !env.hasServerConfig) {
    return {
      strategy: 'vercel-cron-or-github',
      reason: 'Vercel部署推荐使用GitHub Actions替代Vercel Cron，避免平台依赖'
    }
  }
  
  if (env.hasK8sConfig) {
    return {
      strategy: 'kubernetes-cronjob',
      reason: 'Kubernetes环境推荐使用CronJob资源'
    }
  }
  
  if (env.hasDockerfile || env.hasServerConfig) {
    return {
      strategy: 'node-timer-or-cron',
      reason: '自托管服务器推荐使用系统Cron + Node.js Timer组合'
    }
  }
  
  return {
    strategy: 'github-actions',
    reason: '通用推荐：GitHub Actions，免费且可靠'
  }
}

// 生成配置文件
function generateConfigs(strategy) {
  console.log(`📝 生成 ${strategy} 策略的配置文件...\n`)
  
  switch (strategy) {
    case 'github-actions':
      generateGitHubActionsConfig()
      break
    case 'kubernetes-cronjob':
      generateKubernetesConfig()
      break
    case 'docker-cron':
      generateDockerCronConfig()
      break
    case 'systemd-timer':
      generateSystemdConfig()
      break
    default:
      console.log('✅ 该策略无需额外配置文件')
  }
}

function generateGitHubActionsConfig() {
  const workflowDir = '.github/workflows'
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true })
  }
  
  const workflowPath = path.join(workflowDir, 'recurring-tasks.yml')
  if (fs.existsSync(workflowPath)) {
    console.log('✅ GitHub Actions工作流已存在')
    return
  }
  
  const workflowContent = `# GitHub Actions 定时任务配置
name: Generate Recurring Tasks

on:
  schedule:
    - cron: '0 1 * * *'  # 每天凌晨1点(UTC)
  workflow_dispatch:     # 支持手动触发

jobs:
  generate-tasks:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Tasks
        run: |
          curl -X POST "\${{ secrets.APP_URL }}/api/cron/generate-recurring-tasks" \\
            -H "Authorization: Bearer \${{ secrets.CRON_SECRET }}" \\
            --fail-with-body --max-time 300
`
  
  fs.writeFileSync(workflowPath, workflowContent)
  console.log('✅ 已生成 GitHub Actions 工作流配置')
  console.log('📋 请设置以下 GitHub Secrets:')
  console.log('   - APP_URL: 应用完整URL')
  console.log('   - CRON_SECRET: 定时任务密钥\n')
}

function generateKubernetesConfig() {
  const k8sContent = `# Kubernetes CronJob 配置
apiVersion: batch/v1
kind: CronJob
metadata:
  name: recurring-tasks-generator
spec:
  schedule: "0 1 * * *"  # 每天凌晨1点
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: task-generator
            image: curlimages/curl:latest
            command:
            - /bin/sh
            - -c
            args:
            - |
              curl -X POST "\${APP_URL}/api/cron/generate-recurring-tasks" \\
                -H "Authorization: Bearer \${CRON_SECRET}" \\
                --fail-with-body --max-time 300
            env:
            - name: APP_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: app-url
            - name: CRON_SECRET
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: cron-secret
          restartPolicy: OnFailure
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  app-url: "https://your-app.com"
  cron-secret: "your-secret-key"
`
  
  fs.writeFileSync('k8s-cronjob.yaml', k8sContent)
  console.log('✅ 已生成 Kubernetes CronJob 配置')
  console.log('📋 使用方法: kubectl apply -f k8s-cronjob.yaml\n')
}

function generateDockerCronConfig() {
  const cronContent = `# 添加到容器的 crontab
0 1 * * * curl -X POST "\${APP_URL}/api/cron/generate-recurring-tasks" -H "Authorization: Bearer \${CRON_SECRET}" >> /var/log/cron.log 2>&1
`
  
  const dockerfileAddition = `
# 在 Dockerfile 中添加以下内容:
RUN apt-get update && apt-get install -y cron curl
COPY crontab /etc/cron.d/recurring-tasks
RUN chmod 0644 /etc/cron.d/recurring-tasks
RUN crontab /etc/cron.d/recurring-tasks
CMD ["sh", "-c", "cron && npm start"]
`
  
  fs.writeFileSync('crontab', cronContent.trim())
  fs.writeFileSync('docker-cron-setup.txt', dockerfileAddition.trim())
  console.log('✅ 已生成 Docker + Cron 配置')
  console.log('📋 查看 docker-cron-setup.txt 了解集成方法\n')
}

function generateSystemdConfig() {
  const serviceContent = `[Unit]
Description=Recurring Tasks Generator
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X POST "\${APP_URL}/api/cron/generate-recurring-tasks" -H "Authorization: Bearer \${CRON_SECRET}"
User=www-data
`

  const timerContent = `[Unit]
Description=Run Recurring Tasks Generator daily
Requires=recurring-tasks.service

[Timer]
OnCalendar=*-*-* 01:00:00
Persistent=true

[Install]
WantedBy=timers.target
`
  
  fs.writeFileSync('recurring-tasks.service', serviceContent)
  fs.writeFileSync('recurring-tasks.timer', timerContent)
  console.log('✅ 已生成 systemd 服务配置')
  console.log('📋 安装方法:')
  console.log('   sudo cp recurring-tasks.* /etc/systemd/system/')
  console.log('   sudo systemctl daemon-reload')
  console.log('   sudo systemctl enable --now recurring-tasks.timer\n')
}

// 主函数
function main() {
  const env = detectEnvironment()
  console.log('🔍 环境检测结果:')
  console.log(`   Node环境: ${env.nodeEnv}`)
  console.log(`   Vercel部署: ${env.isVercel ? '是' : '否'}`)
  console.log(`   Docker化: ${env.hasDockerfile ? '是' : '否'}`)
  console.log(`   K8s配置: ${env.hasK8sConfig ? '是' : '否'}`)
  console.log(`   服务器配置: ${env.hasServerConfig ? '是' : '否'}\n`)
  
  const recommendation = recommendStrategy(env)
  console.log('💡 推荐策略:', recommendation.strategy)
  console.log('📋 推荐理由:', recommendation.reason)
  console.log('')
  
  console.log('📚 所有可用策略:')
  console.log('   1. user-triggered    - 用户触发（开发/无服务器）')
  console.log('   2. github-actions    - GitHub Actions（推荐）')
  console.log('   3. node-timer        - Node.js定时器（自托管）')
  console.log('   4. kubernetes-cronjob - Kubernetes CronJob')
  console.log('   5. docker-cron       - Docker + 系统Cron')
  console.log('   6. systemd-timer     - systemd定时器')
  console.log('   7. vercel-cron       - Vercel Cron（不推荐）')
  console.log('')
  
  // 如果是交互模式，可以询问用户选择
  const selectedStrategy = process.argv[2] || recommendation.strategy
  
  console.log(`🎯 选择策略: ${selectedStrategy}`)
  
  // 生成对应的配置
  generateConfigs(selectedStrategy)
  
  // 输出后续步骤
  console.log('🎉 设置完成！')
  console.log('')
  console.log('📋 后续步骤:')
  console.log('   1. 根据生成的配置文件完成设置')
  console.log('   2. 设置必要的环境变量/密钥')
  console.log('   3. 测试定时任务是否正常工作')
  console.log('   4. 监控系统运行状态')
  console.log('')
  console.log('📖 详细文档: docs/scheduling-alternatives.md')
  console.log('🔧 管理接口: /api/admin/scheduling')
}

if (require.main === module) {
  main()
}