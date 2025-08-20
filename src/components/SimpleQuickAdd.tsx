'use client'

import React, { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  CalendarIcon,
  FlagIcon,
  TagIcon,
  SparklesIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Priority } from '@/types'
import { CreateTaskInputWithRecurring, RecurringTaskInput } from '@/types/recurring'
import SimpleRecurringCreator from './SimpleRecurringCreator'
import TaskTemplates from './TaskTemplates'
import Portal from './Portal'

interface SimpleQuickAddProps {
  isVisible: boolean
  onClose: () => void
  onTaskCreated: (task: CreateTaskInputWithRecurring) => void
  initialTemplate?: string
  isMobile?: boolean
}

const SimpleQuickAdd: React.FC<SimpleQuickAddProps> = ({
  isVisible,
  onClose,
  onTaskCreated,
  initialTemplate = '',
  isMobile = false
}) => {
  const [formData, setFormData] = useState<CreateTaskInputWithRecurring>({
    title: initialTemplate,
    description: '',
    priority: 'MEDIUM',
    tagIds: [],
    isRecurring: false
  })
  
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [tags, setTags] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [recurringData, setRecurringData] = useState<RecurringTaskInput>({
    isRecurring: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'basic' | 'advanced' | 'review'>('basic')

  // 初始化表单数据
  useEffect(() => {
    if (initialTemplate) {
      setFormData(prev => ({ ...prev, title: initialTemplate }))
    }
  }, [initialTemplate])

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      tagIds: [],
      isRecurring: false
    })
    setDueDate('')
    setDueTime('')
    setTags('')
    setRecurringData({ isRecurring: false })
    setCurrentStep('basic')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({ ...prev, title: template }))
    setShowTemplates(false)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // 处理日期时间
      let finalDueDate: Date | undefined
      let finalDueTime: Date | undefined
      
      if (dueDate) {
        finalDueDate = new Date(dueDate)
        if (dueTime) {
          const [hours, minutes] = dueTime.split(':').map(Number)
          finalDueTime = new Date(dueDate)
          finalDueTime.setHours(hours, minutes)
        }
      }

      // 处理标签
      const tagNames = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // 构建最终任务数据
      const taskData: CreateTaskInputWithRecurring = {
        ...formData,
        dueDate: finalDueDate,
        dueTime: finalDueTime,
        tagIds: tagNames,
        isRecurring: recurringData.isRecurring,
        recurringRule: recurringData.recurringRule
      }

      await onTaskCreated(taskData)
      handleClose()
    } catch (error) {
      console.error('创建任务失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const priorityOptions = [
    { value: 'LOW', label: '低', color: 'text-green-600 bg-green-50 border-green-200' },
    { value: 'MEDIUM', label: '中', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    { value: 'HIGH', label: '高', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { value: 'URGENT', label: '紧急', color: 'text-red-600 bg-red-50 border-red-200' }
  ]

  if (!isVisible) return null

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
        <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
          isMobile ? 'w-full max-w-md max-h-[90vh]' : 'w-full max-w-2xl max-h-[90vh]'
        }`}>
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">创建任务</h2>
                <p className="text-sm text-gray-600">
                  {currentStep === 'basic' && '基本信息'}
                  {currentStep === 'advanced' && '高级设置'}
                  {currentStep === 'review' && '确认创建'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* 进度指示器 */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {['basic', 'advanced', 'review'].map((step, index) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center space-x-2 ${
                    currentStep === step ? 'text-blue-600' : 
                    ['basic', 'advanced', 'review'].indexOf(currentStep) > index ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep === step ? 'bg-blue-600 text-white' :
                      ['basic', 'advanced', 'review'].indexOf(currentStep) > index ? 'bg-green-600 text-white' : 'bg-gray-200'
                    }`}>
                      {['basic', 'advanced', 'review'].indexOf(currentStep) > index ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {step === 'basic' && '基本'}
                      {step === 'advanced' && '高级'}
                      {step === 'review' && '确认'}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`flex-1 h-0.5 ${
                      ['basic', 'advanced', 'review'].indexOf(currentStep) > index ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="p-6 space-y-6">
              
              {/* 基本信息步骤 */}
              {currentStep === 'basic' && (
                <div className="space-y-4">
                  {/* 任务标题 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">任务标题 *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="输入任务标题..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowTemplates(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="选择模板"
                      >
                        <SparklesIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* 任务描述 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="添加任务描述..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* 优先级 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
                    <div className="grid grid-cols-4 gap-2">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority: option.value as Priority }))}
                          className={`p-2 text-sm font-medium rounded-lg border transition-colors ${
                            formData.priority === option.value
                              ? option.color
                              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 高级设置步骤 */}
              {currentStep === 'advanced' && (
                <div className="space-y-6">
                  {/* 日期和时间 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        截止日期
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        截止时间
                      </label>
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TagIcon className="w-4 h-4 inline mr-1" />
                      标签
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="输入标签，用逗号分隔..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">例如：工作, 学习, 重要</p>
                  </div>

                  {/* 周期性任务 */}
                  <SimpleRecurringCreator
                    value={recurringData}
                    onChange={setRecurringData}
                    baseDate={dueDate ? new Date(dueDate) : new Date()}
                  />
                </div>
              )}

              {/* 确认步骤 */}
              {currentStep === 'review' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">任务预览</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">标题：</span>{formData.title}</div>
                      {formData.description && (
                        <div><span className="font-medium">描述：</span>{formData.description}</div>
                      )}
                      <div><span className="font-medium">优先级：</span>
                        {priorityOptions.find(p => p.value === formData.priority)?.label}
                      </div>
                      {dueDate && (
                        <div><span className="font-medium">截止：</span>
                          {new Date(dueDate).toLocaleDateString('zh-CN')}
                          {dueTime && ` ${dueTime}`}
                        </div>
                      )}
                      {tags && (
                        <div><span className="font-medium">标签：</span>{tags}</div>
                      )}
                      {recurringData.isRecurring && (
                        <div><span className="font-medium">周期性：</span>是</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex space-x-3">
              {currentStep !== 'basic' && (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 'advanced') setCurrentStep('basic')
                    if (currentStep === 'review') setCurrentStep('advanced')
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  上一步
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
            
            <div className="flex space-x-3">
              {currentStep === 'basic' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('advanced')}
                  disabled={!formData.title.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  下一步
                </button>
              )}
              {currentStep === 'advanced' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('review')}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  预览
                </button>
              )}
              {currentStep === 'review' && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.title.trim()}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>创建中...</span>
                    </>
                  ) : (
                    <span>创建任务</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 模板选择器 */}
      <TaskTemplates
        isVisible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
        isMobile={isMobile}
      />
    </Portal>
  )
}

export default SimpleQuickAdd