'use client'

import { useEffect } from 'react'
import { capacitorManager } from '@/lib/capacitor'

interface CapacitorInitProps {
  children: React.ReactNode
}

export default function CapacitorInit({ children }: CapacitorInitProps) {
  useEffect(() => {
    // 初始化 Capacitor
    capacitorManager.initialize().catch(error => {
      console.error('Failed to initialize Capacitor:', error)
    })

    // 监听自定义事件
    const handleAppResumed = () => {
      console.log('App resumed event received')
      // 这里可以触发数据刷新等操作
    }

    const handleAppPaused = () => {
      console.log('App paused event received')
      // 这里可以保存应用状态
    }

    const handleNetworkReconnected = () => {
      console.log('Network reconnected event received')
      // 这里可以触发数据同步
    }

    const handleNetworkDisconnected = () => {
      console.log('Network disconnected event received')
      // 这里可以显示离线提示
    }

    // 添加事件监听器
    if (typeof window !== 'undefined') {
      window.addEventListener('app-resumed', handleAppResumed)
      window.addEventListener('app-paused', handleAppPaused)
      window.addEventListener('network-reconnected', handleNetworkReconnected)
      window.addEventListener('network-disconnected', handleNetworkDisconnected)
    }

    // 清理事件监听器
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('app-resumed', handleAppResumed)
        window.removeEventListener('app-paused', handleAppPaused)
        window.removeEventListener('network-reconnected', handleNetworkReconnected)
        window.removeEventListener('network-disconnected', handleNetworkDisconnected)
      }
    }
  }, [])

  return <>{children}</>
}