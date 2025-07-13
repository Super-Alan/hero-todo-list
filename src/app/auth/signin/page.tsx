'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Github, Mail } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()

  useEffect(() => {
    // 检查是否已经登录
    getSession().then(session => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  const handleGitHubSignIn = () => {
    signIn('github', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Hero ToDo</h1>
          <p className="text-gray-600">登录您的账户开始管理任务</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border">
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-red-500" />
              <span>使用 Google 登录</span>
            </button>

            <button
              onClick={handleGitHubSignIn}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Github className="h-5 w-5 text-gray-700" />
              <span>使用 GitHub 登录</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              登录即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 