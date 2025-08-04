'use client'

import React, { useState, useRef, useEffect } from 'react';
import { parseTaskFromInput } from '@/lib/taskParser';
import { CreateTaskInput } from '@/types';
import { Priority } from '@/types';
import { CalendarIcon, TagIcon, FlagIcon } from '@heroicons/react/24/outline';
import { tagService } from '@/lib/tagService';
import { TaskQualityScorer } from '@/lib/task-quality-scorer';
import SmartTaskAdvisor from './SmartTaskAdvisor';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { selectedModel } = useModelProvider();

  // 实时评估任务质量
  useEffect(() => {
    if (inputValue.trim().length > 3) {
      const scoreResult = TaskQualityScorer.scoreTask(inputValue);
      setQualityScore(scoreResult.totalScore);
      setQualityDetails(scoreResult);
      setShowQualityHint(scoreResult.totalScore < 60);
    } else {
      setQualityScore(null);
      setQualityDetails(null);
      setShowQualityHint(false);
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

    // 如果质量分数低于60分，弹出AI助手
    if (qualityScore !== null && qualityScore < 60 && onOpenAIChat) {
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

  if (!isActive) {
    return (
      <div className="mb-4 lg:mb-6">
        <button
          onClick={() => setIsActive(true)}
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
    <div ref={wrapperRef} className="mb-4 lg:mb-6 card-modern p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 border-primary-500/30 shadow-tech">
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
      {/* 质量评分提示 */}
      {showQualityHint && qualityScore !== null && qualityDetails && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center text-sm text-amber-700 mb-1">
            <span className="mr-2">💡</span>
            <span>任务质量评分: {qualityScore}/100 - 按回车获取AI优化建议</span>
          </div>
          {qualityDetails.suggestions && qualityDetails.suggestions.length > 0 && (
            <div className="text-xs text-amber-600 ml-6">
              <span>建议改进: </span>
              {qualityDetails.suggestions.slice(0, 2).join('；')}
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
      <div className="flex justify-end items-center mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-gray-100">
        <button
          onClick={handleAIAssistant}
          className="text-xs text-primary-600 hover:text-primary-700 mr-3 lg:mr-4 font-medium flex items-center space-x-1 transition-colors"
          disabled={isProcessing}
        >
          <span>🤖</span>
          <span className={isMobile ? 'hidden' : ''}>AI 助手</span>
        </button>
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
    </div>
  );
}

export default TaskAddBar;
