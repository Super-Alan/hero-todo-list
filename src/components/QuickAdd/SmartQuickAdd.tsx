'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { QuickAddMode, QuickAddState, ModeDetectionResult, AIAnalysisResult, Message, ParsedTask, GeneratedTask } from '@/types/quickAdd'
import { CreateTaskInput, Priority } from '@/types';
import { ModeDetector } from '@/utils/modeDetector'
import ModeSelector from './ModeSelector'
import FastModeInput from './FastMode/FastModeInput'
import AIModeChat from './AIMode/AIModeChat'
import TaskConfirmation from './Shared/TaskConfirmation'

interface SmartQuickAddProps {
  isOpen: boolean
  onClose: () => void
  onTasksAdded: (tasks: CreateTaskInput[]) => void
  initialInput?: string
}

const initialState: QuickAddState = {
  isOpen: false,
  input: '',
  mode: 'auto',

  fastMode: {
    parsedTask: null,
    isCustomizing: false,
    showSuggestions: false,
  },
  aiMode: {
    conversation: [],
    isAnalyzing: false,
    analysisResult: null,
    editingTaskId: null,
    selectedPhases: [],
  },
  selectedTasks: [],
  isConfirming: false,
  confirmationSettings: {
    targetView: 'inbox',
    defaultTags: [],
    enableReminders: false,
  }
};

const SmartQuickAdd: React.FC<SmartQuickAddProps> = ({ 
  isOpen,
  onClose,
  onTasksAdded,
  initialInput
}) => {
  const [state, setState] = useState<QuickAddState>(initialState);

  const [detectionResult, setDetectionResult] = useState<ModeDetectionResult | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (initialInput) {
        setState(prev => ({ ...prev, input: initialInput }));
      }
    } else {
      setState(initialState);
    }
  }, [isOpen, initialInput]);

  const handleInputChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, input: value }));
    setDetectionResult(undefined);
  }, []);

  const handleModeChange = useCallback((mode: QuickAddMode) => {
    setState(prev => ({ ...prev, mode }))
  }, []);

  const handleClose = () => {
    setState(initialState);
    onClose();
  };

  const handleTaskParsed = useCallback((task: CreateTaskInput) => {
    setState(prev => ({
      ...prev,
      fastMode: { ...prev.fastMode, parsedTask: task }
    }))
  }, [])

  const handleCustomizeToggle = useCallback(() => {
    setState(prev => ({
      ...prev,
      fastMode: { ...prev.fastMode, isCustomizing: !prev.fastMode.isCustomizing }
    }))
  }, [])

  const getCurrentTasks = useCallback((): (ParsedTask | GeneratedTask)[] => {
    if (state.mode === 'fast' && state.fastMode.parsedTask) {
      const task = state.fastMode.parsedTask;
      // This is a kludge to make CreateTaskInput look like ParsedTask for confirmation
      const parsedTask: ParsedTask = {
        ...task,
        dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate,
        tags: task.tagIds || [],
        priority: task.priority ? task.priority.toLowerCase() as ('high' | 'medium' | 'low') : 'medium',
      };
      return [parsedTask];
    }
    
    if (state.mode === 'ai' && state.aiMode.analysisResult) {
      return state.aiMode.analysisResult.phases
        .filter(phase => state.aiMode.selectedPhases.length === 0 || state.aiMode.selectedPhases.includes(phase.id))
        .flatMap(phase => phase.tasks);
    }
    
    return []
  }, [state.mode, state.fastMode.parsedTask, state.aiMode.analysisResult, state.aiMode.selectedPhases]);

  const handleConfirm = useCallback(() => {
    const tasksToConfirm = getCurrentTasks();
    setState(prev => ({ ...prev, isConfirming: true, selectedTasks: tasksToConfirm }));
  }, [getCurrentTasks]);

  const handleAIBreakdown = useCallback(() => {
    const tasks = getCurrentTasks();
    const newConversation: Message[] = tasks.map(task => ({
      id: `task-${task.title}`,
      type: 'user',
      content: task.title,
      timestamp: new Date(),
    }));

    setState(prev => ({
      ...prev,
      mode: 'ai',
      input: tasks.map(t => t.title).join(', '),
      aiMode: {
        ...prev.aiMode,
        conversation: [...prev.aiMode.conversation, ...newConversation],
      }
    }));
  }, [getCurrentTasks]);

  const handleAnalysisStart = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      aiMode: { ...prev.aiMode, isAnalyzing: true } 
    }))
  }, [])

  const handleAnalysisComplete = useCallback((result: AIAnalysisResult | null) => {
    setState(prev => ({
      ...prev,
      aiMode: {
        ...prev.aiMode,
        isAnalyzing: false,
        analysisResult: result,
      }
    }))
  }, [])

  const handlePhaseToggle = useCallback((phaseId: string) => {
    setState(prev => {
      const { selectedPhases } = prev.aiMode;
      const newSelectedPhases = selectedPhases.includes(phaseId)
        ? selectedPhases.filter(id => id !== phaseId)
        : [...selectedPhases, phaseId];
      return {
        ...prev,
        aiMode: { ...prev.aiMode, selectedPhases: newSelectedPhases }
      };
    });
  }, []);

  const handleTasksConfirmed = (tasks: (ParsedTask | GeneratedTask)[]) => {
    const finalTasks: CreateTaskInput[] = tasks.map(task => {
      let priority: Priority | undefined;
      if (task.priority) {
        const p = task.priority.toUpperCase();
        if (p === 'HIGH') priority = Priority.HIGH;
        else if (p === 'MEDIUM') priority = Priority.MEDIUM;
        else if (p === 'LOW') priority = Priority.LOW;
      }
      return {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        priority: priority,
        tagIds: 'tags' in task ? task.tags : [],
      }
    });
    setState(prev => ({ ...prev, isConfirming: false }));
    onTasksAdded(finalTasks);
    handleClose();
  }

  const renderModeContent = () => {
    if (state.isConfirming) {
      return (
        <TaskConfirmation
          tasks={state.selectedTasks as (ParsedTask | GeneratedTask)[]}
          onConfirm={handleTasksConfirmed}
          onBack={() => setState(prev => ({ ...prev, isConfirming: false }))}
          settings={state.confirmationSettings}
          onSettingsChange={(settings) => setState(prev => ({...prev, confirmationSettings: settings}))}
        />
      )
    }

    switch (state.mode) {
      case 'fast':
        return (
          <FastModeInput
            input={state.input}
            parsedTask={state.fastMode.parsedTask}
            isCustomizing={state.fastMode.isCustomizing}
            onInputChange={handleInputChange}
            onTaskParsed={handleTaskParsed}
            onCustomizeToggle={handleCustomizeToggle}
            onConfirm={handleConfirm}
            onAIBreakdown={handleAIBreakdown}
          />
        )
      
      case 'ai':
        return (
          <AIModeChat
            input={state.input}
            conversation={state.aiMode.conversation}
            isAnalyzing={state.aiMode.isAnalyzing}
            analysisResult={state.aiMode.analysisResult}
            selectedPhases={state.aiMode.selectedPhases}
            onInputChange={handleInputChange}
            onConversationUpdate={(conversation: Message[]) =>
              setState(prev => ({ 
                ...prev, 
                aiMode: { ...prev.aiMode, conversation }
              }))
            }
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
            onPhaseToggle={handlePhaseToggle}
            onConfirm={handleConfirm}
          />
        )
      
      default:
        return (
          <div className="p-6 text-center">
             <input
                ref={inputRef}
                type="text"
                value={state.input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="例如：买菜做饭 或 我想学会 React 开发"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
          </div>
        )
    }
  }

  useEffect(() => {
    if (state.input.trim() && state.mode === 'auto') {
      const result = ModeDetector.detectMode(state.input)
      setDetectionResult(result)
    } else {
      setDetectionResult(undefined)
    }
  }, [state.input, state.mode])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto overflow-hidden">
      <div className="p-4">
        <ModeSelector 
          currentMode={state.mode}
          onModeChange={handleModeChange}
          detectionResult={detectionResult}
          showRecommendation={state.mode === 'auto'}
        />

        {/* 主要内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {renderModeContent()}
        </div>
      </div>
    </div>
  )
}

export default SmartQuickAdd;
