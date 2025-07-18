// 浏览器兼容性 polyfills
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// 确保在客户端环境中运行
if (typeof window !== 'undefined') {
  // 添加全局错误处理
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // 如果是 React 相关的错误，尝试恢复
    if (event.error && event.error.message && event.error.message.includes('Cannot read properties of null')) {
      console.log('Attempting to recover from React error...');
      
      // 延迟重试，给 React 一些时间来恢复
      setTimeout(() => {
        try {
          // 尝试重新渲染
          if (window.location && window.location.reload) {
            console.log('Reloading page to recover from error...');
            window.location.reload();
          }
        } catch (e) {
          console.error('Failed to recover from error:', e);
        }
      }, 1000);
    }
  });

  // 处理未捕获的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });

  // 添加浏览器兼容性检查
  function checkBrowserCompatibility() {
    const issues = [];
    
    // 检查必要的 API
    if (!window.Promise) issues.push('Promise API');
    if (!window.fetch) issues.push('Fetch API');
    if (!window.localStorage) issues.push('LocalStorage API');
    
    if (issues.length > 0) {
      console.warn('Browser compatibility issues detected:', issues);
      alert('您的浏览器可能不完全支持此应用。建议使用最新版本的 Chrome、Firefox、Safari 或 Edge。');
    }
  }
  
  // 在 DOM 加载完成后检查兼容性
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkBrowserCompatibility);
  } else {
    checkBrowserCompatibility();
  }
}

export {}; 