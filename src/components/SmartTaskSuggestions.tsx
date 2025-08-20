'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  SparklesIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon,
  PencilSquareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Portal from './Portal'

interface SmartSuggestion {
  id: string
  text: string
  type: 'template' | 'completion' | 'improvement'
  icon: React.ReactNode
  category?: string
  score?: number
}

interface SmartTaskSuggestionsProps {
  inputValue: string
  onSuggestionSelect: (suggestion: string) => void
  isVisible: boolean
  isMobile?: boolean
}

const SmartTaskSuggestions: React.FC<SmartTaskSuggestionsProps> = ({
  inputValue,
  onSuggestionSelect,
  isVisible,
  isMobile = false
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 任务模板库
  const taskTemplates = [
    // 学习类模板
    {
      pattern: /^(学习|复习|背|记忆|掌握)/,
      templates: [
        '今天晚上8-9点学习《{subject}》第{chapter}章，完成课后练习题',
        '本周内复习{subject}，每天1小时，完成{quantity}道练习题',
        '明天上午背诵{content}，达到能够默写的程度',
        '这周末复习{subject}考试重点，整理错题笔记'
      ]
    },
    // 阅读类模板
    {
      pattern: /^(阅读|读书|看书|读)/,
      templates: [
        '今晚阅读《{book}》第{page}页-第{page}页，写200字读后感',
        '本周读完《{book}》，每章做笔记总结核心观点',
        '每天晚上读{book}30分钟，记录生词和金句',
        '阅读{subject}相关资料，整理思维导图'
      ]
    },
    // 练习类模板
    {
      pattern: /^(练习|做题|刷题|训练)/,
      templates: [
        '每天晚上做{quantity}道{subject}题，错题整理到错题本',
        '本周完成{subject}练习册第{chapter}章全部习题',
        '明天练习{skill}，每次练习30分钟，重点关注{focus}',
        '周末进行{subject}模拟考试，限时{time}小时'
      ]
    },
    // 项目作业类模板
    {
      pattern: /^(完成|做|写|制作|设计)/,
      templates: [
        '{time}前完成{assignment}，包含{requirement1}和{requirement2}',
        '本周完成{project}，分为调研、设计、实施三个阶段',
        '明天提交{document}，不少于{words}字，包含{sections}部分',
        '设计{item}，要求{requirement}，{time}前完成'
      ]
    },
    // 考试准备类模板
    {
      pattern: /^(准备|备考|考试|复习.*考)/,
      templates: [
        '为{exam_date}的{subject}考试准备：复习第{chapters}章，做{quantity}套真题',
        '制定{exam}复习计划：每天2小时，重点复习{focus_areas}',
        '考试前一周每天模拟练习，保持做题手感和时间控制',
        '整理{subject}考试重点，制作知识清单和公式表'
      ]
    }
  ]

  // 智能补全建议
  const generateSmartSuggestions = (input: string): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = []
    const lowerInput = input.toLowerCase().trim()

    if (lowerInput.length < 2) {
      return []
    }

    // 1. 模板建议
    for (const template of taskTemplates) {
      if (template.pattern.test(lowerInput)) {
        template.templates.forEach((tmpl, index) => {
          // 简化模板，移除占位符
          const simplifiedTemplate = tmpl
            .replace(/\{[^}]+\}/g, '___')
            .replace(/___+/g, '___')
          
          suggestions.push({
            id: `template-${index}`,
            text: simplifiedTemplate,
            type: 'template',
            icon: <SparklesIcon className="w-4 h-4" />,
            category: '任务模板'
          })
        })
        break
      }
    }

    // 2. 时间补全建议
    if (!lowerInput.match(/\d+[点时分]|今天|明天|本周|下周/)) {
      const timeCompletions = [
        '今天下午',
        '明天上午',
        '本周内',
        '下周前',
        '今晚8点'
      ]
      
      timeCompletions.forEach((time, index) => {
        suggestions.push({
          id: `time-${index}`,
          text: `${time}${input}`,
          type: 'completion',
          icon: <ClockIcon className="w-4 h-4" />,
          category: '添加时间'
        })
      })
    }

    // 3. 量化补全建议
    if (!lowerInput.match(/\d+[页章节题道遍次]/) && 
        (lowerInput.includes('阅读') || lowerInput.includes('做题') || lowerInput.includes('练习'))) {
      const quantityCompletions = [
        lowerInput.includes('阅读') ? '20页' : '10道题',
        lowerInput.includes('阅读') ? '3章' : '5套练习',
        lowerInput.includes('阅读') ? '1小时' : '30分钟'
      ]
      
      quantityCompletions.forEach((quantity, index) => {
        suggestions.push({
          id: `quantity-${index}`,
          text: `${input}，完成${quantity}`,
          type: 'completion',
          icon: <CheckCircleIcon className="w-4 h-4" />,
          category: '添加数量'
        })
      })
    }

    // 4. 方法补全建议
    if (lowerInput.includes('学习') && !lowerInput.includes('方法') && !lowerInput.includes('通过')) {
      const methodCompletions = [
        '通过阅读+笔记+练习的方式',
        '结合理论学习和实践练习',
        '采用番茄工作法，每25分钟一个周期'
      ]
      
      methodCompletions.forEach((method, index) => {
        suggestions.push({
          id: `method-${index}`,
          text: `${input}，${method}`,
          type: 'completion',
          icon: <AcademicCapIcon className="w-4 h-4" />,
          category: '添加方法'
        })
      })
    }

    // 5. 具体化建议
    const vagueKeywords = ['学好', '搞懂', '弄会', '了解', '掌握']
    if (vagueKeywords.some(keyword => lowerInput.includes(keyword))) {
      const specificCompletions = [
        input.replace(/学好|搞懂|弄会|了解|掌握/, '深入理解') + '的核心概念，能够解释给别人听',
        input.replace(/学好|搞懂|弄会|了解|掌握/, '熟练运用') + '，达到能够独立完成相关任务的水平',
        input.replace(/学好|搞懂|弄会|了解|掌握/, '系统学习') + '，建立完整的知识框架'
      ]
      
      specificCompletions.forEach((completion, index) => {
        suggestions.push({
          id: `specific-${index}`,
          text: completion,
          type: 'improvement',
          icon: <PencilSquareIcon className="w-4 h-4" />,
          category: '具体化表达'
        })
      })
    }

    return suggestions.slice(0, isMobile ? 4 : 6)
  }

  useEffect(() => {
    if (inputValue.trim()) {
      const newSuggestions = generateSmartSuggestions(inputValue)
      setSuggestions(newSuggestions)
      setSelectedIndex(0)
    } else {
      setSuggestions([])
    }
  }, [inputValue, isMobile])

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    onSuggestionSelect(suggestion.text)
  }

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
    }
  }

  if (!isVisible || !suggestions.length) {
    return null
  }

  return (
    <Portal>
      <div 
        ref={containerRef}
        className={`
          ${isMobile ? 'fixed inset-x-2 bottom-20' : 'absolute top-full left-0 right-0 mt-1'} 
          bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-64 overflow-y-auto
          animate-in slide-in-from-top-1 duration-150
        `}
        onKeyDown={handleKeyNavigation}
        tabIndex={0}
      >
      <div className="p-2">
        <div className="flex items-center space-x-2 mb-2 px-2">
          <SparklesIcon className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium text-gray-600">智能建议</span>
        </div>
        
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full text-left px-3 py-2 rounded-md transition-colors
                ${index === selectedIndex 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50 border border-transparent'
                }
              `}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5 text-gray-400">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 leading-relaxed">
                    {suggestion.text}
                  </div>
                  {suggestion.category && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.category}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            ↑↓ 选择 • Enter 应用 • 点击直接使用
          </p>
        </div>
      </div>
      </div>
    </Portal>
  )
}

export default SmartTaskSuggestions