/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // 添加安全头配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? [
                  // 开发环境：更宽松的CSP
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://github.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' https://fonts.gstatic.com",
                  "img-src 'self' data: https: blob:",
                  "connect-src 'self' https://api.github.com https://accounts.google.com https://oauth2.googleapis.com ws://localhost:* wss://localhost:*",
                  "frame-src 'self' https://accounts.google.com https://github.com",
                  "object-src 'none'",
                  "base-uri 'self'",
                  "form-action 'self'"
                ].join('; ')
              : [
                  // 生产环境：更严格的CSP
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://github.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' https://fonts.gstatic.com",
                  "img-src 'self' data: https: blob:",
                  "connect-src 'self' https://api.github.com https://accounts.google.com https://oauth2.googleapis.com",
                  "frame-src 'self' https://accounts.google.com https://github.com",
                  "object-src 'none'",
                  "base-uri 'self'",
                  "form-action 'self'"
                ].join('; ')
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig; 