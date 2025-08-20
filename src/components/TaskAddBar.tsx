'use client'

import React, { useState, useRef, useEffect } from 'react';
import { parseTaskFromInput } from '@/lib/taskParser';
import { CreateTaskInput } from '@/types';
import { Priority } from '@/types';
import { CalendarIcon, TagIcon, FlagIcon } from '@heroicons/react/24/outline';
import { tagService } from '@/lib/tagService';
import { TaskQualityScorer } from '@/lib/task-quality-scorer';
import { StudentTaskGuide } from '@/lib/student-task-guide';
import SmartTaskAdvisor from './SmartTaskAdvisor';
import TaskGuidancePanel from './TaskGuidancePanel';
import SmartTaskSuggestions from './SmartTaskSuggestions';
import TaskTemplates from './TaskTemplates';
import { useModelProvider } from '@/contexts/ModelProviderContext';

interface TaskAddBarProps {
  onTaskSubmit: (task: CreateTaskInput) => void;
  onTasksSubmit?: (tasks: CreateTaskInput[]) => void;
  onOpenAdvanced: (initialValue: string) => void;
  onToggleAIAssistant?: () => void;
  onOpenAIChat?: (initialInput: string) => void;
  isMobile?: boolean;
}

const TaskAddBar: React.FC<TaskAddBarProps> = ({ 
  onTaskSubmit, 
  onTasksSubmit, 
  onOpenAdvanced, 
  onToggleAIAssistant,
  onOpenAIChat,
  isMobile = false
}) => {
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [parsedTask, setParsedTask] = useState<CreateTaskInput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [qualityDetails, setQualityDetails] = useState<any>(null);
  const [showQualityHint, setShowQualityHint] = useState(false);
  const [showGuidancePanel, setShowGuidancePanel] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showTaskTemplates, setShowTaskTemplates] = useState(false);
  const [guidanceResult, setGuidanceResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { selectedModel } = useModelProvider();

  // 实时评估任务质量和智能指导
  useEffect(() => {
    if (inputValue.trim().length > 3) {
      // 原有的质量评分
      const scoreResult = TaskQualityScorer.scoreTask(inputValue);
      setQualityScore(scoreResult.totalScore);
      setQualityDetails(scoreResult);
      setShowQualityHint(scoreResult.totalScore < 30);

      // 新的学生任务指导
      const guidanceResult = StudentTaskGuide.analyzeStudentTask(inputValue);
      setGuidanceResult(guidanceResult);
      
      // 显示指导面板（当分数较低或有明显问题时）
      setShowGuidancePanel(guidanceResult.score < 70 || guidanceResult.issues.length > 0);
      
      // 显示智能建议（当输入长度适中时）
      setShowSmartSuggestions(inputValue.trim().length > 2 && inputValue.trim().length < 50);
    } else {
      setQualityScore(null);
      setQualityDetails(null);
      setShowQualityHint(false);
      setShowGuidancePanel(false);
      setShowSmartSuggestions(inputValue.trim().length > 1);
      setGuidanceResult(null);
    }
  }, [inputValue]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (inputValue.trim()) {
      const parsed = parseTaskFromInput(inputValue);
      setParsedTask(parsed);
    } else {
      setParsedTask(null);
    }
  }, [inputValue]);

  const handleSubmit = async () => {
    if (!parsedTask || !parsedTask.title || isProcessing) {
      return;
    }

    // 如果质量分数低于30分，弹出AI助手
    if (qualityScore !== null && qualityScore < 30 && onOpenAIChat) {
      onOpenAIChat(inputValue);
      setInputValue('');
      setParsedTask(null);
      setIsActive(false);
      return;
    }

    setIsProcessing(true);
    
    try {
      // 转换标签名为标签ID
      let finalTask = { ...parsedTask };
      
      if (parsedTask.tagIds && parsedTask.tagIds.length > 0) {
        // 将标签名转换为标签ID（如果标签不存在会自动创建）
        const tagIds = await tagService.getOrCreateTagIds(parsedTask.tagIds);
        finalTask.tagIds = tagIds;
      }

      await onTaskSubmit(finalTask);
      setInputValue('');
      setParsedTask(null);
      setIsActive(false);
    } catch (error) {
      console.error('Failed to process task:', error);
      // 这里可以添加用户提示，比如使用 toast 通知
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (inputValue.trim()) {
          handleSubmit();
        } else {
          setIsActive(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperRef, inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsActive(false);
    }
  };

  const handleAdvancedAdd = () => {
    onOpenAdvanced(inputValue);
    setInputValue('');
    setIsActive(false);
  };

  const handleAIAssistant = () => {
    if (onToggleAIAssistant) {
      onToggleAIAssistant();
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSmartSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleGuidancePanelClose = () => {
    setShowGuidancePanel(false);
  };

  const handleApplySuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowGuidancePanel(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 重置所有状态的函数
  const resetAllStates = () => {
    setInputValue('');
    setParsedTask(null);
    setQualityScore(null);
    setQualityDetails(null);
    setShowQualityHint(false);
    setShowGuidancePanel(false);
    setShowSmartSuggestions(false);
    setShowTaskTemplates(false);
    setGuidanceResult(null);
  };

  if (!isActive) {
    return (
      <div className="mb-4 lg:mb-6">
        <button
          onClick={() => {
            resetAllStates();
            setIsActive(true);
          }}
          className="w-full flex items-center card-modern p-3 lg:p-4 rounded-xl lg:rounded-2xl text-left group hover:shadow-tech transition-all duration-300"
        >
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg lg:rounded-xl flex items-center justify-center shadow-modern group-hover:shadow-tech transition-all duration-300 mr-3 lg:mr-4">
            <svg
              className="w-4 h-4 lg:w-5 lg:h-5 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v12m6-6H6"
              />
            </svg>
          </div>
          <span className="text-sm lg:text-base text-gray-600 group-hover:text-gray-800 transition-colors">
            {isMobile ? '添加任务...' : '添加任务，例如：明天下午3点开会 #工作 !重要'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative mb-4 lg:mb-6 card-modern p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 border-primary-500/30 shadow-tech">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isMobile ? "输入任务..." : "输入任务后按 Enter 保存"}
        className="w-full focus:outline-none text-sm lg:text-base bg-transparent text-gray-800 placeholder:text-gray-400"
        disabled={isProcessing}
      />
      {/* 增强的质量评分提示 */}
      {showQualityHint && qualityScore !== null && guidanceResult && (
        <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center text-blue-700">
              <span className="mr-2">🎯</span>
              <span className="font-medium">任务评分: {guidanceResult.score}/100</span>
            </div>
            <button
              onClick={() => setShowGuidancePanel(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              查看详细建议 →
            </button>
          </div>
          
          {guidanceResult.issues && guidanceResult.issues.length > 0 && (
            <div className="text-xs text-blue-600 mb-2">
              <span className="font-medium">发现问题: </span>
              {guidanceResult.issues[0]}
            </div>
          )}
          
          {guidanceResult.quickFixes && guidanceResult.quickFixes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {guidanceResult.quickFixes.slice(0, 2).map((fix: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleApplySuggestion(fix.split('：')[1] || fix)}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full hover:bg-blue-600 transition-colors"
                >
                  {fix.split('：')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {parsedTask && (
        <div className="flex items-center flex-wrap gap-1 lg:gap-2 mt-2 lg:mt-3 text-xs">
          {parsedTask.dueDate && (
            <span className="flex items-center bg-primary-50 text-primary-700 px-2 lg:px-3 py-1 rounded-full border border-primary-200">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {new Date(parsedTask.dueDate).toLocaleDateString()}
            </span>
          )}
          {parsedTask.priority && (
            <span className="flex items-center bg-red-50 text-red-600 px-2 lg:px-3 py-1 rounded-full border border-red-200">
              <FlagIcon className="w-3 h-3 mr-1" />
              {parsedTask.priority}
            </span>
          )}
          {parsedTask.tagIds?.map(tag => (
            <span key={tag} className="flex items-center bg-gray-50 text-gray-700 px-2 lg:px-3 py-1 rounded-full border border-gray-200">
              <TagIcon className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              // 如果没有输入内容，显示任务模板
              if (!inputValue.trim()) {
                setShowTaskTemplates(true)
              } else {
                // 如果有输入内容，切换指导面板显示状态
                setShowGuidancePanel(!showGuidancePanel)
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1 transition-colors"
            disabled={isProcessing}
          >
            <span>💡</span>
            <span className={isMobile ? 'hidden' : ''}>智能建议</span>
          </button>
          <button
            onClick={handleAIAssistant}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1 transition-colors"
            disabled={isProcessing}
          >
            <span>🤖</span>
            <span className={isMobile ? 'hidden' : ''}>AI 助手</span>
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!parsedTask || !parsedTask.title || isProcessing}
          className="btn-modern px-4 lg:px-6 py-2 text-sm font-medium flex items-center"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isMobile ? '处理中' : '处理中...'}
            </>
          ) : (
            '保存'
          )}
        </button>
      </div>

      {/* 智能任务建议 */}
      <SmartTaskSuggestions
        inputValue={inputValue}
        onSuggestionSelect={handleSuggestionSelect}
        isVisible={showSmartSuggestions && !showGuidancePanel}
        isMobile={isMobile}
      />

      {/* 学生任务指导面板 */}
      <TaskGuidancePanel
        inputValue={inputValue}
        isVisible={showGuidancePanel}
        onClose={handleGuidancePanelClose}
        onApplySuggestion={handleApplySuggestion}
        isMobile={isMobile}
      />

      {/* 任务模板 */}
      <TaskTemplates
        isVisible={showTaskTemplates}
        onClose={() => {
          setShowTaskTemplates(false);
          // 如果没有输入内容，关闭整个任务添加器并重置所有状态
          if (!inputValue.trim()) {
            resetAllStates();
            setIsActive(false);
          }
        }}
        onSelectTemplate={(template) => {
          setInputValue(template);
          setShowTaskTemplates(false);
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }}
        isMobile={isMobile}
      />
    </div>
  );
}

export default TaskAddBar;
