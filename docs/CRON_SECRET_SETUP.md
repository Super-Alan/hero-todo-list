# CRON_SECRET 配置指南

## 什么是 CRON_SECRET？

CRON_SECRET 是用于保护定时任务 API 端点的授权密钥。它确保只有授权的服务（如 Vercel Cron、GitHub Actions 等）才能触发你的定时任务，防止未授权访问。

## 获取/生成 CRON_SECRET

### 方法 1：使用命令行生成（推荐）

```bash
# macOS/Linux
openssl rand -base64 32

# 或者使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 或者使用 UUID
node -e "console.log(require('crypto').randomUUID())"
```

### 方法 2：使用在线工具

访问以下网站生成安全的随机密钥：
- https://generate-secret.vercel.app/32
- https://passwordsgenerator.net/
- https://www.uuidgenerator.net/

### 方法 3：手动创建

创建一个包含字母、数字和特殊字符的长字符串（至少 32 个字符）：
```
示例：my-super-secret-key-2024-hero-todo-cron-tasks
```

## 配置 CRON_SECRET

### 1. 本地开发环境

在项目根目录的 `.env.local` 文件中添加：

```env
CRON_SECRET="你生成的密钥"
```

例如：
```env
CRON_SECRET="k7Jh3Nm9Pq2Rs5Vw8Xz1Bc4Df6Gh9Jk2"
```

### 2. 生产环境（Vercel）

#### 通过 Vercel 控制台设置：

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加新的环境变量：
   - Name: `CRON_SECRET`
   - Value: `你生成的密钥`
   - Environment: 选择 Production（也可以同时选择 Preview 和 Development）
5. 点击 Save

#### 通过 Vercel CLI 设置：

```bash
# 安装 Vercel CLI（如果还没安装）
npm i -g vercel

# 设置环境变量
vercel env add CRON_SECRET production
# 然后输入你的密钥值
```

### 3. 其他部署平台

#### Railway
```bash
railway variables set CRON_SECRET="你的密钥"
```

#### Heroku
```bash
heroku config:set CRON_SECRET="你的密钥"
```

#### Docker
在 `docker-compose.yml` 中：
```yaml
environment:
  - CRON_SECRET=${CRON_SECRET}
```

## 使用 CRON_SECRET

### 1. Vercel Cron Jobs

在 `vercel.json` 中配置定时任务：

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-recurring-tasks",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Vercel 会自动在请求头中添加授权信息。

### 2. 手动调用 API

使用 curl：
```bash
curl -X POST https://your-domain.com/api/cron/generate-recurring-tasks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

使用 JavaScript：
```javascript
fetch('https://your-domain.com/api/cron/generate-recurring-tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  }
})
```

### 3. GitHub Actions

在 `.github/workflows/recurring-tasks.yml` 中：

```yaml
name: Generate Recurring Tasks

on:
  schedule:
    - cron: '0 1 * * *'  # 每日凌晨1点（UTC）
  workflow_dispatch:  # 允许手动触发

jobs:
  generate-tasks:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger recurring task generation
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/cron/generate-recurring-tasks \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

在 GitHub 仓库设置中添加 Secrets：
1. 进入 Settings → Secrets and variables → Actions
2. 添加 `CRON_SECRET` 和 `API_URL`

## 安全建议

### ✅ 应该做的：

1. **使用强密钥**：至少 32 个字符的随机字符串
2. **定期轮换**：每 3-6 个月更换一次密钥
3. **环境隔离**：生产环境和开发环境使用不同的密钥
4. **访问日志**：记录所有定时任务的执行情况
5. **HTTPS**：确保 API 端点使用 HTTPS

### ❌ 不应该做的：

1. **不要硬编码**：永远不要在代码中硬编码密钥
2. **不要提交到 Git**：确保 `.env.local` 在 `.gitignore` 中
3. **不要使用简单密钥**：避免使用 "secret"、"password123" 等
4. **不要公开分享**：不要在公共渠道分享密钥
5. **不要忽视警告**：如果发现未授权访问，立即更换密钥

## 测试验证

### 1. 测试密钥是否设置成功

```bash
# 本地测试
node -e "console.log('CRON_SECRET is set:', !!process.env.CRON_SECRET)"
```

### 2. 测试 API 端点

带密钥的请求（应该成功）：
```bash
curl -X POST http://localhost:3010/api/cron/generate-recurring-tasks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

不带密钥的请求（应该失败）：
```bash
curl -X POST http://localhost:3010/api/cron/generate-recurring-tasks
# 应返回 401 Unauthorized
```

### 3. 查看日志

检查服务器日志确认定时任务是否正常执行：
- Vercel: Functions 日志
- 本地: 控制台输出

## 故障排查

### 问题 1：401 未授权错误

**原因**：密钥不匹配或未设置

**解决方案**：
1. 确认环境变量已设置：`echo $CRON_SECRET`
2. 检查请求头格式：`Authorization: Bearer YOUR_SECRET`
3. 确认没有额外的空格或换行符

### 问题 2：环境变量未生效

**原因**：部署后未重启服务

**解决方案**：
- Vercel：重新部署项目
- 本地：重启开发服务器

### 问题 3：定时任务未执行

**原因**：Cron 表达式错误或时区问题

**解决方案**：
1. 验证 Cron 表达式：使用 [crontab.guru](https://crontab.guru/)
2. 注意时区：Vercel Cron 使用 UTC 时间

## 相关文件

- `/src/app/api/cron/generate-recurring-tasks/route.ts` - 定时任务 API 端点
- `/vercel.json` - Vercel Cron 配置
- `/.env.example` - 环境变量示例
- `/RECURRING_TASKS_IMPLEMENTATION.md` - 周期性任务完整文档

## 总结

CRON_SECRET 是保护定时任务 API 的重要安全措施。通过正确配置和使用，可以确保只有授权的服务才能触发你的定时任务，保护你的应用免受未授权访问。

记住：**安全第一，永远不要在公共代码中暴露密钥！**