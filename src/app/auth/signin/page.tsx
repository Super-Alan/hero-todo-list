'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Github, Mail, Eye, EyeOff, Lock, Loader2, User } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    // 检查是否已经登录
    getSession().then(session => {
      if (session) {
        router.push('/')
      }
    })

    // 显示注册成功消息
    if (searchParams.get('message') === 'registered') {
      setError('')
      // 可以添加成功提示
    }
  }, [router, searchParams])

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' })
  }

  const handleGitHubSignIn = () => {
    signIn('github', { callbackUrl: '/' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      setError('请输入邮箱和密码')
      return
    }

    try {
      setLoading(true)
      setError('')

      const result = await signIn('credentials', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push('/')
      }
    } catch (err) {
      setError('登录过程中发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Hero ToDo
          </h1>
          <p className="text-gray-600">登录您的账户开始管理任务</p>
          {searchParams.get('message') === 'registered' && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm text-green-700">注册成功！请使用您的邮箱和密码登录</p>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-white/50">
          {!showEmailLogin ? (
            <div className="space-y-6">
              {/* OAuth 登录按钮 */}
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Mail className="h-5 w-5 text-red-500" />
                  <span>使用 Google 登录</span>
                </button>

                <button
                  onClick={handleGitHubSignIn}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Github className="h-5 w-5 text-gray-700" />
                  <span>使用 GitHub 登录</span>
                </button>
              </div>

              {/* 分隔线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>

              {/* 邮箱登录按钮 */}
              <button
                onClick={() => setShowEmailLogin(true)}
                className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <User className="h-5 w-5" />
                <span>使用邮箱登录</span>
              </button>

              {/* 注册链接 */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  还没有账户？{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    立即注册
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">邮箱登录</h2>
                <button
                  onClick={() => setShowEmailLogin(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  返回
                </button>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-6">
                {/* 邮箱字段 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入邮箱地址"
                      required
                    />
                  </div>
                </div>

                {/* 密码字段 */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入密码"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 错误消息 */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span>{loading ? '登录中...' : '登录'}</span>
                </button>
              </form>

              {/* 注册链接 */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  还没有账户？{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    立即注册
                  </Link>
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              登录即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 