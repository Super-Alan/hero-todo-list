# Hero ToDo 简化迁移计划

## 📋 总体目标
将复杂的项目-分组-任务三层架构简化为扁平化的任务-标签二层架构，提升用户体验和系统可维护性。

## 🎯 迁移原则
1. **数据完整性**：所有现有任务数据必须保留
2. **用户体验**：迁移过程对用户透明
3. **功能等效**：用标签系统替代项目分组功能
4. **渐进式**：分阶段实施，每步都可回滚

## 📊 第一阶段：数据迁移准备

### 1.1 数据依赖关系分析
```sql
-- 当前数据结构
User (defaultProjectId → Project)
Project (userId → User)
Section (projectId → Project)
Task (projectId → Project?, sectionId → Section?)
Tag (userId → User)
TaskTag (taskId → Task, tagId → Tag)
```

### 1.2 数据迁移脚本设计
```typescript
// 迁移策略：
// 1. 项目名称 → 标签 (color: 项目颜色)
// 2. 分组名称 → 标签 (color: 默认颜色)
// 3. 任务保留所有数据，添加对应标签
// 4. 移除项目和分组关联
```

### 1.3 备份策略
- 完整数据库备份
- 分表备份关键数据
- 迁移前数据验证

## 🚀 第二阶段：数据迁移执行

### 2.1 创建迁移标签
```sql
-- 为每个项目创建对应标签
INSERT INTO tags (name, color, userId)
SELECT DISTINCT 
  CONCAT('📁 ', p.name) as name,
  p.color,
  p.userId
FROM projects p
WHERE p.isArchived = false;

-- 为每个分组创建对应标签
INSERT INTO tags (name, color, userId)
SELECT DISTINCT 
  CONCAT('📋 ', s.name) as name,
  '#6b7280' as color,
  p.userId
FROM sections s
JOIN projects p ON s.projectId = p.id
WHERE p.isArchived = false;
```

### 2.2 迁移任务关联
```sql
-- 为任务添加项目标签
INSERT INTO task_tags (taskId, tagId)
SELECT t.id, tag.id
FROM tasks t
JOIN projects p ON t.projectId = p.id
JOIN tags tag ON tag.name = CONCAT('📁 ', p.name) AND tag.userId = p.userId
WHERE t.projectId IS NOT NULL;

-- 为任务添加分组标签
INSERT INTO task_tags (taskId, tagId)
SELECT t.id, tag.id
FROM tasks t
JOIN sections s ON t.sectionId = s.id
JOIN projects p ON s.projectId = p.id
JOIN tags tag ON tag.name = CONCAT('📋 ', s.name) AND tag.userId = p.userId
WHERE t.sectionId IS NOT NULL;
```

### 2.3 数据验证
- 验证所有任务都有对应标签
- 验证标签数量正确
- 验证用户数据完整性

## 🔧 第三阶段：数据库结构更新

### 3.1 移除字段
```sql
-- 移除 Task 表的项目和分组字段
ALTER TABLE tasks DROP COLUMN projectId;
ALTER TABLE tasks DROP COLUMN sectionId;

-- 移除 User 表的默认项目字段
ALTER TABLE users DROP COLUMN defaultProjectId;
```

### 3.2 删除表
```sql
-- 删除分组表
DROP TABLE sections;

-- 删除项目表
DROP TABLE projects;
```

### 3.3 更新 Prisma Schema
```prisma
// 移除 Project 和 Section 模型
// 移除 Task 中的 projectId 和 sectionId 字段
// 移除 User 中的 defaultProjectId 字段
```

## 🎨 第四阶段：前端功能重构

### 4.1 移除项目相关组件
- 删除项目管理界面
- 删除项目选择器
- 删除分组创建界面
- 删除项目视图

### 4.2 移除项目相关 API
- `/api/projects/*` - 删除所有项目API
- `/api/sections/*` - 删除所有分组API
- 清理任务API中的项目参数

### 4.3 简化任务创建流程
```typescript
// 原来：选择项目 → 选择分组 → 创建任务
// 现在：直接创建任务 → 添加标签
```

## 📱 第五阶段：UI/UX 重构

### 5.1 侧边栏简化
```
新的侧边栏结构：
├── 📋 今天 (12)
├── ⭐ 重要 (5)
├── 📝 所有任务 (28)
├── ✅ 已完成 (15)
└── 🏷️ 标签
    ├── 📁 工作 (8)
    ├── 📁 生活 (12)
    ├── 📋 会议 (3)
    └── 🔴 紧急 (2)
```

### 5.2 任务列表优化
- 统一任务列表视图
- 增强标签过滤功能
- 优化任务排序和分组

### 5.3 快速添加增强
- 更智能的标签推荐
- 一键添加常用标签
- 自然语言解析优化

## 🚀 第六阶段：增强功能开发

### 6.1 智能视图系统
```typescript
// 智能视图定义
interface SmartView {
  id: string
  name: string
  icon: string
  filter: TaskFilter
  sortBy: SortOption
}

// 预定义视图
const SMART_VIEWS = [
  { id: 'today', name: '今天', filter: { dueDate: 'today' } },
  { id: 'important', name: '重要', filter: { priority: ['HIGH', 'URGENT'] } },
  { id: 'recent', name: '最近', filter: { createdAt: 'last7days' } }
]
```

### 6.2 增强搜索功能
- 支持标签搜索：`tag:工作`
- 支持日期搜索：`due:today`
- 支持优先级搜索：`priority:high`
- 支持组合搜索：`tag:工作 due:today`

### 6.3 标签管理增强
- 标签使用统计
- 标签合并功能
- 标签重命名历史
- 智能标签推荐

## 📊 第七阶段：性能优化

### 7.1 数据库优化
- 添加标签搜索索引
- 优化任务查询性能
- 减少不必要的关联查询

### 7.2 前端性能优化
- 虚拟滚动优化
- 标签过滤优化
- 搜索防抖优化

## 🧪 第八阶段：测试和验证

### 8.1 数据完整性测试
- 验证迁移前后任务数量一致
- 验证标签关联正确性
- 验证用户数据完整性

### 8.2 功能测试
- 任务创建流程测试
- 标签过滤功能测试
- 搜索功能测试
- 智能视图测试

### 8.3 用户体验测试
- 界面简洁性评估
- 操作效率测试
- 学习曲线评估

## 📋 迁移检查清单

### 数据迁移
- [ ] 创建数据库备份
- [ ] 执行数据迁移脚本
- [ ] 验证数据完整性
- [ ] 更新数据库结构
- [ ] 更新 Prisma Schema

### 功能移除
- [ ] 删除项目 API 端点
- [ ] 删除分组 API 端点
- [ ] 移除项目相关组件
- [ ] 清理项目相关逻辑

### 功能增强
- [ ] 实现智能视图
- [ ] 增强标签系统
- [ ] 优化搜索功能
- [ ] 重构用户界面

### 质量保证
- [ ] 单元测试更新
- [ ] 集成测试验证
- [ ] 性能测试
- [ ] 用户体验测试

## 📅 时间计划

- **第1-2阶段**：数据迁移准备和执行 (2天)
- **第3阶段**：数据库结构更新 (1天)
- **第4阶段**：前端功能重构 (3天)
- **第5阶段**：UI/UX 重构 (2天)
- **第6阶段**：增强功能开发 (3天)
- **第7-8阶段**：优化和测试 (2天)

**总计：约 13 天**

## 🎯 预期效果

### 用户体验提升
- 学习成本降低 70%
- 任务创建速度提升 50%
- 界面复杂度降低 60%

### 技术效益
- 代码行数减少 30%
- API 端点减少 40%
- 数据库查询简化 50%
- 维护成本降低 35%

### 产品定位
- 更符合"无摩擦捕捉"理念
- 专注于任务管理核心功能
- 提升市场竞争力 