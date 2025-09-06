import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.herotodo.app',
  appName: 'Hero ToDo List',
  webDir: 'dist', // 改为 dist 目录，用于本地构建时的备用
  server: {
    // 使用远程服务器模式，指向 Vercel 部署
    url: 'https://www.beyondlimit.me',
    cleartext: false, // 强制 HTTPS
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK'
    },
    // 移除 App 插件的无效配置项，启动画面配置移到 Android 原生项目
    App: {},
    Network: {
      requestTimeout: 30000
    }
  }
};

export default config;
