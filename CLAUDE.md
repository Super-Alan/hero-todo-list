# Hero ToDo List - Android 客户端开发接口文档

## 项目概览

Hero ToDo List 是一个基于 Next.js 的全栈任务管理应用，支持用户认证、任务管理、标签系统、周期性任务、微信集成等功能。

- **项目名称**: Hero ToDo List
- **版本**: 0.1.0
- **前端框架**: Next.js 15.3.5 + React 18
- **数据库**: PostgreSQL + Prisma ORM
- **认证系统**: NextAuth.js
- **部署平台**: Vercel
- **开发端口**: 3010

## API 基础信息

### Base URL
- **开发环境**: `http://localhost:3010`
- **生产环境**: https://www.beyondlimit.me/

### 认证机制

使用 NextAuth.js 进行身份验证，支持多种认证方式：

1. **邮箱密码登录**: Credentials Provider
2. **Google OAuth**: Google Provider
3. **GitHub OAuth**: GitHub Provider

#### 认证流程
- Session 策略: JWT
- Cookie 名称: `next-auth.session-token` (开发) / `__Secure-next-auth.session-token` (生产)
- Session 有效期: 默认 30 天

#### 请求头认证
所有需要认证的 API 请求需要包含 session cookie 或在请求头中携带认证信息。

## 核心 API 接口

### 1. 认证接口

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "Password123",  // 至少8位，包含大小写字母和数字
  "name": "用户名"
}

Response (201):
{
  "message": "注册成功！您现在可以登录了",
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "name": "用户名"
  }
}

Error (400/409/500):
{
  "error": "错误信息"
}
```

#### 用户登录
使用 NextAuth.js 的标准登录流程，可通过以下端点：
```
GET/POST /api/auth/signin
POST /api/auth/callback/credentials  // 邮箱密码登录
GET /api/auth/callback/google        // Google OAuth
GET /api/auth/callback/github        // GitHub OAuth
```

### 2. 任务管理接口

#### 获取任务列表
```
GET /api/tasks?view={view}&tagId={tagId}&search={search}&priority={priority}&status={status}

Query Parameters:
- view: today|upcoming|overdue|completed|important|recent|nodate|thisweek
- tagId: 标签ID过滤
- search: 搜索关键词（支持标题、描述、标签搜索）
- priority: LOW|MEDIUM|HIGH|URGENT
- status: completed|pending

Response (200):
[
  {
    "id": "cuid",
    "title": "任务标题",
    "description": "任务描述",
    "isCompleted": false,
    "priority": "MEDIUM",
    "status": "TODO",
    "dueDate": "2024-01-01T00:00:00.000Z",
    "dueTime": "2024-01-01T09:00:00.000Z",
    "reminderAt": null,
    "completedAt": null,
    "sortOrder": 0,
    "userId": "cuid",
    "parentTaskId": null,
    "isRecurring": false,
    "recurringRule": null,
    "originalTaskId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "tags": [
      {
        "id": "cuid",
        "name": "工作",
        "color": "#3b82f6"
      }
    ],
    "subTasks": [],
    "parentTask": null,
    "user": {
      "id": "cuid",
      "name": "用户名",
      "email": "user@example.com",
      "image": null
    }
  }
]
```

#### 创建任务
```
POST /api/tasks
Content-Type: application/json

Body:
{
  "title": "任务标题",           // 必填
  "description": "任务描述",    // 可选
  "dueDate": "2024-01-01",     // 可选，日期字符串
  "dueTime": "2024-01-01T09:00:00.000Z", // 可选，时间字符串
  "priority": "MEDIUM",        // 可选，默认 MEDIUM
  "parentTaskId": "cuid",      // 可选，父任务ID
  "tagIds": ["tag1", "tag2"],  // 可选，标签ID数组
  "isRecurring": false,        // 可选，是否周期性任务
  "recurringRule": null        // 可选，周期规则JSON字符串
}

Response (201): 返回创建的任务对象（格式同获取任务列表）
```

#### 获取单个任务
```
GET /api/tasks/{id}

Response (200): 返回任务对象（格式同获取任务列表）
```

#### 更新任务
```
PUT /api/tasks/{id}
Content-Type: application/json

Body: （所有字段都是可选的）
{
  "title": "更新的标题",
  "description": "更新的描述",
  "dueDate": "2024-01-02",
  "dueTime": "2024-01-02T10:00:00.000Z",
  "priority": "HIGH",
  "isCompleted": true,
  "status": "COMPLETED",
  "parentTaskId": "cuid",
  "tagIds": ["tag1", "tag3"],
  "sortOrder": 1
}

Response (200): 返回更新后的任务对象
```

#### 删除任务
```
DELETE /api/tasks/{id}

Response (200):
{
  "message": "任务删除成功"
}
```

### 3. 任务搜索接口

```
GET /api/tasks/search?q={query}&limit={limit}

Query Parameters:
- q: 搜索关键词
- limit: 结果数量限制（可选）

Response (200): 返回匹配的任务数组
```

### 4. 任务统计接口

```
GET /api/tasks/stats

Response (200):
{
  "total": 50,
  "completed": 20,
  "pending": 30,
  "overdue": 5,
  "today": 8,
  "thisWeek": 15,
  "thisMonth": 35
}
```

### 5. 周期性任务接口

#### 生成周期性任务
```
POST /api/tasks/recurring/generate

Response (200):
{
  "message": "周期性任务生成成功",
  "generated": 3
}
```

#### 清理过期周期性任务
```
POST /api/tasks/recurring/cleanup

Response (200):
{
  "message": "清理完成",
  "deleted": 5
}
```

## 数据模型

### User (用户)
```typescript
interface User {
  id: string;
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  password?: string;
  role: 'USER' | 'ADMIN';
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  weekStartsOn: number; // 0 = Sunday, 1 = Monday
  createdAt: Date;
  updatedAt: Date;
}
```

### Task (任务)
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: Date;
  dueTime?: Date;
  reminderAt?: Date;
  completedAt?: Date;
  sortOrder: number;
  userId: string;
  parentTaskId?: string;
  isRecurring: boolean;
  recurringRule?: string; // JSON格式
  originalTaskId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // 关联字段
  subTasks?: Task[];
  tags?: Tag[];
  parentTask?: Task;
  user?: User;
}
```

### Tag (标签)
```typescript
interface Tag {
  id: string;
  name: string;
  color: string; // 十六进制颜色代码
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 辅助类型
```typescript
// 任务创建输入
interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  dueTime?: Date;
  timeDescription?: string;
  priority?: Priority;
  parentTaskId?: string;
  tagIds?: string[];
  isRecurring?: boolean;
  recurringRule?: string;
}

// 任务更新输入
interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  isCompleted?: boolean;
  status?: TaskStatus;
  sortOrder?: number;
}

// 任务统计
interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}
```

## 错误处理

### 标准错误响应格式
```json
{
  "error": "错误描述信息"
}
```

### 常见状态码
- **200**: 请求成功
- **201**: 资源创建成功
- **400**: 请求参数错误
- **401**: 未授权/未登录
- **403**: 权限不足
- **404**: 资源不存在
- **409**: 资源冲突（如邮箱已注册）
- **500**: 服务器内部错误

## 技术栈详情

### 前端技术
- **Next.js**: 15.3.5 (React 全栈框架)
- **React**: 18.3.1
- **TypeScript**: 5.8.3
- **Tailwind CSS**: 3.4.17 (样式框架)
- **Framer Motion**: 12.23.12 (动画库)
- **Lucide React**: 0.468.0 (图标库)
- **@dnd-kit**: 拖拽功能
- **React Markdown**: Markdown 渲染

### 后端技术
- **Prisma**: 6.2.0 (ORM)
- **PostgreSQL**: 数据库
- **NextAuth.js**: 4.24.11 (认证)
- **bcryptjs**: 密码加密
- **Zod**: 数据验证

### 开发工具
- **ESLint**: 代码检查
- **PostCSS**: CSS 处理
- **Autoprefixer**: CSS 前缀

## 环境变量配置

Android 客户端需要配置的关键环境变量：

```env
# API 基础URL
API_BASE_URL=http://localhost:3010

# OAuth 配置（如果使用）
GOOGLE_CLIENT_ID=your-google-client-id
GITHUB_CLIENT_ID=your-github-client-id

# 微信配置（如果使用）
WECHAT_APP_ID=your-wechat-app-id
```

## 特殊功能

### 1. 微信集成
- 支持微信公众号消息解析创建任务
- WechatUser 模型管理微信用户绑定
- WechatMessage 记录消息处理状态

### 2. 智能任务解析
- 支持自然语言任务创建
- AI 模型提供商配置 (ModelProvider)
- 支持时间描述解析

### 3. 周期性任务
- 支持复杂的重复规则
- 自动生成和清理机制
- 智能策略生成

## 开发建议

### Android 客户端开发要点

1. **认证处理**
   - 实现 JWT Token 存储和管理
   - 支持多种登录方式 (邮箱、Google、GitHub)
   - 实现自动登录和 Token 刷新

2. **离线支持**
   - 本地数据库缓存任务数据
   - 离线创建任务，联网后同步
   - 冲突解决策略

3. **用户体验**
   - 拖拽排序功能
   - 智能提醒和通知
   - 深色模式支持

4. **数据同步**
   - 实时数据更新机制
   - 增量同步策略
   - WebSocket 考虑用于实时更新

5. **搜索和过滤**
   - 本地搜索优化
   - 高级过滤选项
   - 标签管理界面

### 关键接口优先级
1. 用户认证 (注册/登录)
2. 任务 CRUD 操作
3. 任务列表获取和过滤
4. 标签管理
5. 任务统计
6. 周期性任务处理

这个文档提供了开发 Android 客户端所需的所有接口信息和数据模型，可以作为开发参考文档使用。