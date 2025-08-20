'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { parseTaskFromInput } from '@/lib/taskParser';
import { CreateTaskInput } from '@/types';
import { Priority } from '@/types';
import { CreateTaskInputWithRecurring } from '@/types/recurring';
import { RecurringTaskUtils } from '@/lib/recurringTasks';
import { CalendarIcon, TagIcon, FlagIcon } from '@heroicons/react/24/outline';
import { tagService } from '@/lib/tagService';
import { TaskQualityScorer } from '@/lib/task-quality-scorer';
import { StudentTaskGuide } from '@/lib/student-task-guide';
import SmartTaskAdvisor from './SmartTaskAdvisor';
import TaskGuidancePanel from './TaskGuidancePanel';
import SmartTaskSuggestions from './SmartTaskSuggestions';
import TaskTemplates from './TaskTemplates';
import SimpleQuickAdd from './SimpleQuickAdd';
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
  const [templateSelected, setTemplateSelected] = useState(false);
  const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);
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
      // 如果正在显示模板选择器或高级创建器，不处理外部点击
      if (showTaskTemplates || showAdvancedCreate) {
        return;
      }
      
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
  }, [wrapperRef, inputValue, showTaskTemplates, showAdvancedCreate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsActive(false);
    } else if (e.key === 'Tab' && !inputValue.trim()) {
      // 当输入框为空时，Tab键可以打开模板选择
      e.preventDefault();
      setShowTaskTemplates(true);
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
  const resetAllStates = useCallback((preserveAdvancedCreate = false) => {
    setInputValue('');
    setParsedTask(null);
    setQualityScore(null);
    setQualityDetails(null);
    setShowQualityHint(false);
    setShowGuidancePanel(false);
    setShowSmartSuggestions(false);
    setShowTaskTemplates(false);
    setGuidanceResult(null);
    setTemplateSelected(false);
    if (!preserveAdvancedCreate) {
      setShowAdvancedCreate(false);
    }
  }, []);

  // 优化的模板选择处理函数
  const handleTemplateSelect = useCallback((template: string) => {
    // 使用 React 18 的批处理更新，确保状态原子性
    React.startTransition(() => {
      setInputValue(template);
      setTemplateSelected(true);
      
      // 激活TaskAddBar
      if (!isActive) {
        setIsActive(true);
      }
      
      // 在状态更新完成后关闭模板选择器
      setShowTaskTemplates(false);
    });
    
    // 延迟聚焦确保所有状态更新完成
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(template.length, template.length);
      }
    }, 100); // 减少延迟时间
    
    // 3秒后清除模板选择状态
    setTimeout(() => {
      setTemplateSelected(false);
    }, 3000);
  }, [isActive]);

  // 处理高级任务创建
  const handleAdvancedTaskCreate = async (taskData: CreateTaskInputWithRecurring) => {
    try {
      // 处理标签名称转换为ID
      let finalTagIds: string[] = [];
      if (taskData.tagIds && taskData.tagIds.length > 0) {
        finalTagIds = await tagService.getOrCreateTagIds(taskData.tagIds);
      }

      // 构建基础任务数据
      const baseTaskData: CreateTaskInput = {
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        priority: taskData.priority,
        parentTaskId: taskData.parentTaskId,
        tagIds: finalTagIds
      };

      if (taskData.isRecurring && taskData.recurringRule) {
        // 创建周期性任务
        const recurringTaskData = {
          ...baseTaskData,
          isRecurring: true,
          recurringRule: RecurringTaskUtils.ruleToJson(taskData.recurringRule)
        };

        // 使用原有的onTaskSubmit，但需要扩展类型
        await onTaskSubmit(recurringTaskData as any);
      } else {
        // 创建普通任务
        await onTaskSubmit(baseTaskData);
      }

      // 重置状态
      resetAllStates(false);
      setIsActive(false);
    } catch (error) {
      console.error('创建高级任务失败:', error);
    }
  };

  // 非激活状态的渲染
  const renderInactiveState = () => (
    <div className="mb-4 lg:mb-6">
      <div className="space-y-3">
        <button
          onClick={() => {
            resetAllStates(false);
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
        
        {/* 智能建议快捷按钮 */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setShowTaskTemplates(true)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <span>💡</span>
            <span>智能建议</span>
            <span className="text-xs text-gray-500">选择模板快速创建</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 主要内容 */}
      {!isActive ? renderInactiveState() : (
        <div ref={wrapperRef} className="relative mb-4 lg:mb-6 card-modern p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 border-primary-500/30 shadow-tech">
      {/* 模板选择成功提示 */}
      {templateSelected && (
        <div className="mb-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg animate-in fade-in duration-200">
          <div className="flex items-center text-sm text-green-700">
            <span className="mr-2">✅</span>
            <span className="font-medium">模板已应用！你可以继续编辑任务内容</span>
          </div>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={templateSelected ? "继续编辑任务..." : (isMobile ? "输入任务..." : "输入任务后按 Enter 保存，Tab 键选择模板")}
        className={`w-full focus:outline-none text-sm lg:text-base bg-transparent text-gray-800 placeholder:text-gray-400 ${templateSelected ? 'border-l-4 border-l-green-500 pl-2' : ''}`}
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
          <button
            onClick={() => setShowAdvancedCreate(true)}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1 transition-colors"
            disabled={isProcessing}
          >
            <span>⚙️</span>
            <span className={isMobile ? 'hidden' : ''}>高级编辑</span>
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
        </div>
      )}

      {/* 任务模板 - 移到最外层，不受isActive状态影响 */}
      <TaskTemplates
        isVisible={showTaskTemplates}
        onClose={() => {
          setShowTaskTemplates(false);
          // 只有在真正没有输入内容且没有模板被选择时且没有打开高级创建器时才重置状态
          // 使用延迟检查避免状态更新竞态条件
          setTimeout(() => {
            if (!inputValue.trim() && !templateSelected && !showAdvancedCreate) {
              resetAllStates(false); // Don't preserve advanced create
              setIsActive(false);
            }
          }, 50);
        }}
        onSelectTemplate={handleTemplateSelect}
        onAdvancedEdit={(template) => {
          // 使用 React 18 的 startTransition 确保状态更新的原子性
          React.startTransition(() => {
            setInputValue(template);
            setShowTaskTemplates(false);
            setShowAdvancedCreate(true);
          });
        }}
        isMobile={isMobile}
      />

      {/* 高级任务创建 - 移到最外层，不受isActive状态影响 */}
      <SimpleQuickAdd
        isVisible={showAdvancedCreate}
        onClose={() => setShowAdvancedCreate(false)}
        onTaskCreated={handleAdvancedTaskCreate}
        initialTemplate={inputValue}
        isMobile={isMobile}
      />
    </>
  );
}

export default TaskAddBar;
