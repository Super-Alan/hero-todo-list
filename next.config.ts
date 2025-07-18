import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 添加浏览器兼容性支持
  experimental: {
    // 启用更稳定的 React 渲染
    optimizePackageImports: ['@heroicons/react', 'lucide-react'],
  },
  // 添加 webpack 配置以处理兼容性问题
  webpack: (config, { dev, isServer }) => {
    // 添加 polyfills 支持
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  // 添加编译器选项
  compiler: {
    // 移除 console.log 在生产环境中
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
