'use client'

import React from 'react'
import { 
  BookOpenIcon,
  AcademicCapIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import Portal from './Portal'

interface TaskTemplate {
  id: string
  title: string
  category: string
  icon: React.ReactNode
  examples: string[]
  description: string
}

interface TaskTemplatesProps {
  isVisible: boolean
  onClose: () => void
  onSelectTemplate: (template: string) => void
  isMobile?: boolean
}

const TaskTemplates: React.FC<TaskTemplatesProps> = ({
  isVisible,
  onClose,
  onSelectTemplate,
  isMobile = false
}) => {
  if (!isVisible) return null

  const templates: TaskTemplate[] = [
    {
      id: 'study',
      title: '学习任务',
      category: '学习',
      icon: <BookOpenIcon className="w-5 h-5" />,
      description: '系统化学习，建立知识体系',
      examples: [
        '今晚8-9点阅读《JavaScript高级程序设计》第3章，做笔记总结核心概念',
        '本周内完成React基础教程，每天学习1小时，完成5个练习项目',
        '明天上午复习数据结构，重点掌握二叉树和图的遍历算法',
        '下周前背完英语四级核心词汇500个，每天50个单词'
      ]
    },
    {
      id: 'exam',
      title: '考试准备',
      category: '考试',
      icon: <AcademicCapIcon className="w-5 h-5" />,
      description: '高效备考，系统复习',
      examples: [
        '为下周二的期末考试准备：复习第1-8章，完成3套历年真题',
        '制定期中考试复习计划：每天2小时，重点复习数学和英语',
        '周末进行模拟考试，严格按照考试时间练习答题速度',
        '整理错题本，每天复习20道错题，加强薄弱知识点'
      ]
    },
    {
      id: 'project',
      title: '项目作业',
      category: '作业',
      icon: <PencilSquareIcon className="w-5 h-5" />,
      description: '按时完成，保证质量',
      examples: [
        '周五前完成计算机网络作业：设计网络拓扑图，撰写2000字报告',
        '本月内完成毕业论文第二章，收集20篇相关文献，写文献综述',
        '明天提交数据库课程设计，包含需求分析、数据库设计和系统实现',
        '设计并实现一个待办事项管理系统，使用React和Node.js技术栈'
      ]
    },
    {
      id: 'skill',
      title: '技能练习',
      category: '技能',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      description: '刻意练习，持续改进',
      examples: [
        '每天晚上练习编程1小时，完成LeetCode上2道算法题',
        '本周练习英语口语，每天和外教对话30分钟，重点练习商务英语',
        '学习Photoshop基础操作，完成5个设计案例，掌握图层和滤镜使用',
        '练习演讲技巧，准备10分钟演讲稿，本周末进行模拟演讲'
      ]
    },
    {
      id: 'reading',
      title: '阅读计划',
      category: '阅读',
      icon: <BookOpenIcon className="w-5 h-5" />,
      description: '深度阅读，扩展知识',
      examples: [
        '本月读完《深入理解计算机系统》，每章做详细笔记和思维导图',
        '每天阅读技术博客30分钟，关注前端开发和人工智能领域',
        '阅读《代码整洁之道》，学习编程最佳实践，改进代码质量',
        '制定年度阅读计划，每月读2本专业书籍和1本人文社科书籍'
      ]
    },
    {
      id: 'habit',
      title: '日常习惯',
      category: '习惯',
      icon: <ClockIcon className="w-5 h-5" />,
      description: '养成好习惯，提升生活品质',
      examples: [
        '每天早上7点起床，进行30分钟晨练，培养规律作息习惯',
        '建立每日学习打卡：每天学习新知识1小时，记录学习成果',
        '养成阅读习惯：每天睡前阅读30分钟，一年读完50本书',
        '坚持写日记：每天晚上总结当天学习和工作，规划明天任务'
      ]
    }
  ]

  const handleTemplateSelect = (example: string) => {
    onSelectTemplate(example)
    onClose()
  }

  return (
    <Portal>
      <div className={`
        fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4
        animate-in fade-in duration-200
      `}>
        <div className={`
          bg-white rounded-2xl shadow-2xl overflow-hidden
          ${isMobile ? 'w-full max-w-md max-h-[80vh]' : 'w-full max-w-4xl max-h-[80vh]'}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <LightBulbIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">智能任务模板</h2>
                <p className="text-sm text-gray-600">选择模板快速创建高质量任务</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className={`p-6 grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {templates.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                  {/* Template Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.title}</h3>
                      <p className="text-xs text-gray-600">{template.description}</p>
                    </div>
                  </div>

                  {/* Template Examples */}
                  <div className="space-y-2">
                    {template.examples.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => handleTemplateSelect(example)}
                        className="w-full text-left p-3 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-all duration-200 group"
                      >
                        <div className="text-sm text-gray-700 group-hover:text-blue-700 leading-relaxed">
                          {example}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 group-hover:text-blue-500">
                            点击使用此模板
                          </span>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                💡 选择模板后，你可以根据具体情况修改内容
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default TaskTemplates