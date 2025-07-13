# Hero ToDo - 优雅的任务管理工具

## 项目概述

Hero ToDo 是一款基于 Next.js 14 构建的现代化任务管理应用，旨在打造优雅、强大且直观的任务管理体验。本项目仿照市面上顶级 To-Do List 产品（如 Todoist, Things 3, TickTick）的设计哲学，融入了当前主流产品的最佳实践。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **认证**: NextAuth.js
- **图标**: Lucide React
- **动画**: Framer Motion
- **拖拽**: @dnd-kit
- **日期处理**: date-fns

## 设计哲学

**"无摩擦捕捉，有序化组织"** - 让记录和规划任务的过程如行云流水，同时提供灵活强大的组织能力。

## 已实现功能

### 🎯 核心功能

1. **用户认证系统**
   - 支持 Google OAuth 和 GitHub OAuth 登录
   - 使用 NextAuth.js 进行会话管理
   - 安全的用户数据隔离

2. **基础界面框架**
   - 响应式设计，支持桌面端和移动端
   - 现代化的 UI 设计，采用 Tailwind CSS
   - 直观的导航结构

3. **任务管理基础**
   - 任务列表显示
   - 项目分组功能
   - 优先级标识
   - 任务完成状态切换

4. **数据模型设计**
   - 完整的 Prisma 数据模型
   - 支持任务、项目、标签、用户等实体
   - 灵活的关联关系设计

### 🏗️ 数据库结构

```prisma
- User (用户)
- Project (项目)
- Section (项目分组)
- Task (任务)
- Tag (标签)
- TaskTag (任务标签关联)
- Comment (评论)
- Account/Session (NextAuth 认证)
```

### 🎨 界面组件

- **Dashboard**: 主仪表板
- **Header**: 顶部导航栏
- **Sidebar**: 侧边栏导航
- **TaskList**: 任务列表
- **QuickAdd**: 快速添加任务
- **SignIn**: 登录页面

## 项目设置

### 1. 环境配置

1. 克隆项目并安装依赖：
```bash
npm install
```

2. 配置环境变量：
复制 `.env` 文件并填入正确的配置：

```env
# Database (需要配置 Supabase)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 2. 数据库设置

1. 创建 Supabase 项目并获取连接字符串
2. 运行 Prisma 迁移：
```bash
npx prisma db push
```

3. 生成 Prisma 客户端：
```bash
npx prisma generate
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 接下来的开发计划

### 🚀 即将实现的功能

1. **快速添加功能**
   - 全局快捷键 (Cmd+N / Ctrl+N)
   - 自然语言识别
   - 智能属性解析

2. **任务编辑**
   - 行内编辑
   - 详情视图
   - 拖拽排序

3. **项目管理**
   - 项目创建/编辑
   - 分组管理
   - 子任务支持

4. **标签系统**
   - 全局标签
   - 标签过滤
   - 标签管理

5. **高级视图**
   - 今日视图
   - 日历视图
   - 看板视图
   - 自定义过滤器

6. **智能功能**
   - 自动调度
   - 模板系统
   - 周期性任务
   - 统计分析

## 当前状态

✅ **已完成**
- 项目基础架构搭建
- 用户认证系统
- 数据库模型设计
- 基础 UI 组件
- 任务列表显示

🔄 **开发中**
- 任务 CRUD 操作
- API 路由实现
- 数据持久化

⏳ **计划中**
- 自然语言处理
- 高级视图功能
- 移动端优化
- 性能优化

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。

---

*这个项目正在积极开发中，更多功能即将上线！*
