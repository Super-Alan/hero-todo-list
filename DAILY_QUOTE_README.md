# 每日一句功能说明

## 功能概述

每日一句功能在用户每次打开网站时，首先呈现一条激励人心的经典名句，然后进入主页面。该功能具有以下特点：

### 设计特点
1. **居中显示**：名句在屏幕中央优雅展示
2. **科技感设计**：采用深色渐变背景，配合霓虹色彩效果
3. **动态化显示**：文字逐个字符显示，营造打字机效果
4. **显示时长**：3-5秒的显示时间，给用户足够时间阅读

### 文案来源
- **《剑来》经典文案**：包含15条精选名句
- **《哪吒2》经典文案**：包含15条激励人心的台词

### 技术实现
- 使用 `framer-motion` 实现流畅的动画效果
- 基于日期计算每日显示不同的名句
- 响应式设计，适配各种屏幕尺寸
- 使用 Tailwind CSS 实现现代化UI设计

## 组件结构

### DailyQuoteDisplay.tsx
主要组件文件，包含：
- 名句数组管理
- 动画逻辑控制
- UI渲染和样式

### 主要功能
1. **日期计算**：根据一年中的第几天选择对应名句
2. **字符动画**：使用 `useMotionValue` 和 `useTransform` 实现打字机效果
3. **背景动画**：多层渐变背景和脉冲动画效果
4. **自动隐藏**：动画完成后自动隐藏组件

## 使用方法

在主页面 `src/app/page.tsx` 中引入组件：

```tsx
import DailyQuoteDisplay from '@/components/DailyQuoteDisplay'

export default async function Home() {
  // ... 其他代码
  
  return (
    <main className="min-h-screen bg-gray-50">
      <DailyQuoteDisplay />
      <Dashboard />
    </main>
  )
}
```

## 自定义配置

### 修改显示时长
在 `DailyQuoteDisplay.tsx` 中调整以下参数：
- `baseDuration`: 最小显示时长（秒）
- `maxDuration`: 最大显示时长（秒）
- `charDuration`: 每个字符显示时长（秒）

### 添加新名句
在 `quotes` 数组中添加新的名句即可，系统会自动根据日期循环显示。

### 修改样式
组件使用 Tailwind CSS 类名，可以直接修改相应的样式类来调整外观。

## 依赖项

- `framer-motion`: 用于动画效果
- `react`: React 框架
- `tailwindcss`: 样式框架

## 浏览器兼容性

支持所有现代浏览器，包括：
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+ 