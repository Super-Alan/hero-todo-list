# Hero ToDo List - Capacitor Android 应用

这是 Hero ToDo List 的 Capacitor Android 包装器，将 Next.js Web 应用打包为原生 Android 应用。

## 🚀 快速开始

### 前置条件

1. **Android Studio** - 安装最新版本的 Android Studio
2. **Java Development Kit (JDK)** - 版本 11 或更高
3. **Android SDK** - API Level 24 或更高 (Android 7.0)
4. **Node.js** - 版本 18 或更高

### 环境配置

1. 确保 Android Studio 和 SDK 已正确安装
2. 设置环境变量：
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### 开发流程

#### 1. 开发模式（推荐）
使用远程服务器模式，应用直接加载 Vercel 部署的内容：

```bash
# 同步配置并在 Android Studio 中打开
npm run cap:open:android
```

在 Android Studio 中：
- 点击绿色播放按钮运行应用
- 应用将直接从 https://www.beyondlimit.me/ 加载内容
- 无需本地构建，实时获取最新功能

#### 2. 本地开发模式
如果需要使用本地开发服务器：

```bash
# 修改 capacitor.config.ts 中的服务器地址为本地
# server.url: 'http://localhost:3010'

# 启动本地开发服务器
npm run dev

# 在另一个终端中运行
npm run android:dev
```

#### 3. 生产构建
创建可发布的 APK：

```bash
# 构建并生成 APK
npm run android:build
```

## 📱 可用脚本

| 脚本 | 描述 |
|------|------|
| `npm run cap:sync` | 同步 Web 资源和插件到原生项目 |
| `npm run cap:open:android` | 在 Android Studio 中打开项目 |
| `npm run cap:run:android` | 构建并运行 Android 应用 |
| `npm run cap:build:android` | 构建 Android APK |
| `npm run android:dev` | 开发模式：实时重载 |
| `npm run android:build` | 生产构建：完整 APK |

## 🔧 配置说明

### Capacitor 配置 (capacitor.config.ts)

```typescript
const config: CapacitorConfig = {
  appId: 'com.herotodo.app',           // Android 包名
  appName: 'Hero ToDo List',           // 应用名称
  webDir: 'dist',                      // Web 资源目录
  server: {
    url: 'https://www.beyondlimit.me', // 远程服务器地址
    cleartext: false,                   // 强制 HTTPS
    androidScheme: 'https'              // Android URL Scheme
  },
  plugins: {
    StatusBar: { style: 'DARK' },       // 状态栏样式
    App: {                              // 应用配置
      launchAutoHide: true,
      splashBackgroundColor: '#ffffff',
      splashShowDuration: 3000
    },
    Network: { requestTimeout: 30000 }  // 网络超时
  }
}
```

### 已集成的插件

- **@capacitor/status-bar** - 状态栏控制
- **@capacitor/app** - 应用生命周期管理
- **@capacitor/network** - 网络状态监听
- **@capacitor/device** - 设备信息获取
- **@capacitor/preferences** - 本地数据存储

## 📦 应用特性

### 原生功能

- ✅ 状态栏主题适配
- ✅ 应用生命周期管理（前台/后台切换）
- ✅ 网络状态监听
- ✅ 设备信息获取
- ✅ 本地数据持久化
- ✅ Android 返回按钮处理

### 移动端优化

- ✅ 响应式设计适配
- ✅ 触摸友好的交互
- ✅ PWA 离线支持
- ✅ 移动端 Viewport 优化
- ✅ 应用图标和启动画面

## 🔧 开发调试

### Android Studio 调试

1. 在 Android Studio 中打开项目：`npm run cap:open:android`
2. 选择设备或模拟器
3. 点击调试按钮（虫子图标）
4. 使用 Chrome DevTools 调试 Web 内容：
   - 在 Chrome 中访问 `chrome://inspect`
   - 选择你的设备和应用进行调试

### 日志查看

```bash
# 查看 Android 系统日志
adb logcat

# 过滤应用日志
adb logcat | grep "HeroToDo"

# 查看 Capacitor 日志
adb logcat | grep "Capacitor"
```

## 📱 设备测试

### 模拟器测试
1. 在 Android Studio 中创建虚拟设备
2. 选择 API 24+ 的 Android 版本
3. 运行应用进行测试

### 真机测试
1. 启用开发者选项和 USB 调试
2. 连接设备到电脑
3. 在 Android Studio 中选择真机设备
4. 运行应用

## 🚀 发布准备

### 生成签名 APK

1. 在 Android Studio 中：
   - Build → Generate Signed Bundle/APK
   - 选择 APK
   - 创建或选择签名密钥
   - 选择 release 构建类型

2. 使用命令行：
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### 应用优化

- [ ] 启用代码压缩和混淆
- [ ] 优化 APK 大小
- [ ] 配置 ProGuard 规则
- [ ] 添加应用图标和启动画面
- [ ] 设置适当的权限

## 🔒 权限说明

应用请求的 Android 权限：

- `INTERNET` - 网络访问（必需）
- `ACCESS_NETWORK_STATE` - 网络状态检测
- `WAKE_LOCK` - 保持应用活跃状态

## 📋 故障排除

### 常见问题

1. **构建失败**
   - 检查 Android SDK 和构建工具版本
   - 清理项目：`cd android && ./gradlew clean`

2. **网络请求失败**
   - 检查网络安全配置
   - 确认服务器 SSL 证书有效

3. **插件不工作**
   - 运行 `npm run cap:sync` 重新同步
   - 检查插件版本兼容性

### 获取帮助

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 开发文档](https://developer.android.com/docs)
- [GitHub Issues](https://github.com/ionic-team/capacitor/issues)

## 📄 许可证

与主项目使用相同的许可证。