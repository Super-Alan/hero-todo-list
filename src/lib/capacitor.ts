// Capacitor 插件配置和初始化
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';

export class CapacitorManager {
  private static instance: CapacitorManager;

  private constructor() {}

  public static getInstance(): CapacitorManager {
    if (!CapacitorManager.instance) {
      CapacitorManager.instance = new CapacitorManager();
    }
    return CapacitorManager.instance;
  }

  /**
   * 初始化 Capacitor 插件
   */
  public async initialize(): Promise<void> {
    // 只在原生平台运行
    if (!Capacitor.isNativePlatform()) {
      console.log('Running in web browser - Capacitor plugins disabled');
      return;
    }

    try {
      await this.setupStatusBar();
      await this.setupApp();
      await this.setupNetwork();
      await this.logDeviceInfo();
      console.log('Capacitor plugins initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Capacitor plugins:', error);
    }
  }

  /**
   * 配置状态栏
   */
  private async setupStatusBar(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#0ea5e9' });
      await StatusBar.show();
    }
  }

  /**
   * 配置应用生命周期
   */
  private async setupApp(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      // 监听应用状态变化
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
        
        if (isActive) {
          // 应用回到前台时，可以执行数据同步等操作
          this.handleAppResume();
        } else {
          // 应用进入后台时的处理
          this.handleAppPause();
        }
      });

      // 监听后退按钮（Android）
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          // 如果不能后退，可以选择最小化应用或显示退出确认
          App.exitApp();
        }
      });
    }
  }

  /**
   * 设置网络监听
   */
  private async setupNetwork(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      // 监听网络状态变化
      Network.addListener('networkStatusChange', status => {
        console.log('Network status changed', status);
        
        if (status.connected) {
          // 网络连接恢复，可以执行同步操作
          this.handleNetworkReconnect();
        } else {
          // 网络断开，提示用户
          this.handleNetworkDisconnect();
        }
      });

      // 获取当前网络状态
      const status = await Network.getStatus();
      console.log('Current network status:', status);
    }
  }

  /**
   * 记录设备信息
   */
  private async logDeviceInfo(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const info = await Device.getInfo();
      console.log('Device info:', {
        platform: info.platform,
        model: info.model,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual
      });
    }
  }

  /**
   * 应用恢复前台时的处理
   */
  private handleAppResume(): void {
    // 可以在这里触发数据刷新
    console.log('App resumed - triggering data refresh');
    
    // 如果有全局状态管理，可以触发刷新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-resumed'));
    }
  }

  /**
   * 应用进入后台时的处理
   */
  private handleAppPause(): void {
    console.log('App paused - saving state');
    
    // 可以在这里保存应用状态
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-paused'));
    }
  }

  /**
   * 网络重连时的处理
   */
  private handleNetworkReconnect(): void {
    console.log('Network reconnected - syncing data');
    
    // 触发数据同步
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('network-reconnected'));
    }
  }

  /**
   * 网络断开时的处理
   */
  private handleNetworkDisconnect(): void {
    console.log('Network disconnected - switching to offline mode');
    
    // 切换到离线模式
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('network-disconnected'));
    }
  }

  /**
   * 获取网络状态
   */
  public async getNetworkStatus() {
    if (Capacitor.isNativePlatform()) {
      return await Network.getStatus();
    }
    
    // Web 平台的网络检测
    return {
      connected: navigator.onLine,
      connectionType: 'unknown'
    };
  }

  /**
   * 获取设备信息
   */
  public async getDeviceInfo() {
    if (Capacitor.isNativePlatform()) {
      return await Device.getInfo();
    }
    
    // Web 平台返回基本信息
    return {
      platform: 'web',
      model: 'unknown',
      operatingSystem: navigator.platform,
      osVersion: navigator.userAgent,
      manufacturer: 'unknown',
      isVirtual: false
    };
  }

  /**
   * 设置状态栏样式
   */
  public async setStatusBarStyle(style: 'light' | 'dark') {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({ 
        style: style === 'light' ? Style.Light : Style.Dark 
      });
    }
  }
}

// 导出单例实例
export const capacitorManager = CapacitorManager.getInstance();

// 默认导出初始化函数，方便在应用启动时调用
export default function initializeCapacitor() {
  return capacitorManager.initialize();
}