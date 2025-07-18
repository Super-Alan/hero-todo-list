'use client'

import { useState } from 'react'

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false)

  const triggerError = () => {
    setShouldError(true)
    // 故意触发一个错误
    setTimeout(() => {
      const nullObj: any = null
      nullObj.get('test') // 这会触发 "Cannot read properties of null" 错误
    }, 100)
  }

  if (shouldError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">测试错误处理</h1>
          <p className="text-gray-600 mb-4">如果错误处理正常工作，页面应该会自动刷新</p>
          <button
            onClick={() => setShouldError(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回正常状态
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">错误处理测试页面</h1>
        <p className="text-gray-600 mb-4">点击下面的按钮来测试错误处理功能</p>
        <button
          onClick={triggerError}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          触发错误
        </button>
      </div>
    </div>
  )
} 