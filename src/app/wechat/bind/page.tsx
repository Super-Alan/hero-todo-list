'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function WechatBindPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bindToken = searchParams.get('token')

  const [bindStatus, setBindStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      // 未登录，重定向到登录页面，并保留绑定令牌
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/wechat/bind?token=${bindToken}`)}`)
      return
    }

    if (status === 'authenticated' && session?.user && bindToken) {
      handleBind()
    } else if (!bindToken) {
      setBindStatus('invalid')
      setMessage('绑定令牌无效或已过期')
    }
  }, [status, session, bindToken])

  const handleBind = async () => {
    try {
      const response = await fetch('/api/wechat/bind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bindToken })
      })

      const data = await response.json()

      if (data.success) {
        setBindStatus('success')
        setMessage(data.message)
        
        // 3秒后重定向到首页
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        setBindStatus('error')
        setMessage(data.error || '绑定失败，请重试')
      }
    } catch (error) {
      console.error('绑定请求失败:', error)
      setBindStatus('error')
      setMessage('网络错误，请重试')
    }
  }

  const handleRetry = () => {
    if (bindToken) {
      setBindStatus('loading')
      handleBind()
    }
  }

  const renderStatus = () => {
    switch (bindStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <ClockIcon className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              正在绑定微信账号...
            </h2>
            <p className="text-gray-600">
              请稍等片刻
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              绑定成功！
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                🎉 现在你可以：
              </h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 直接在微信中发送消息创建任务</li>
                <li>• 使用 /help 查看所有可用指令</li>
                <li>• 通过 /stats 查看任务统计</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              3秒后将自动跳转到首页...
            </p>
          </div>
        )

      case 'error':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              绑定失败
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                重新尝试
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        )

      case 'invalid':
        return (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              链接无效
            </h2>
            <p className="text-gray-600 mb-4">
              {message}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                💡 解决方法：
              </h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>1. 在微信公众号中发送 /bind 获取新的绑定链接</li>
                <li>2. 确保在30分钟内完成绑定</li>
                <li>3. 检查链接是否完整</li>
              </ul>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              返回首页
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-4">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">
              微信账号绑定
            </h1>
            <p className="text-gray-600 mt-2">
              绑定微信后即可通过微信创建任务
            </p>
          </div>

          {renderStatus()}
        </div>
      </div>
    </div>
  )
}