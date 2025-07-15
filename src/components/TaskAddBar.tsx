'use client'

import React, { useState, useRef, useEffect } from 'react';
import { parseTaskFromInput } from '@/lib/taskParser';
import { CreateTaskInput } from '@/types';
import { Priority } from '@/types';
import { CalendarIcon, TagIcon, FlagIcon } from '@heroicons/react/24/outline';

interface TaskAddBarProps {
  onTaskSubmit: (task: CreateTaskInput) => void;
  onOpenAdvanced: (initialValue: string) => void;
}

const TaskAddBar: React.FC<TaskAddBarProps> = ({ onTaskSubmit, onOpenAdvanced }) => {
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [parsedTask, setParsedTask] = useState<CreateTaskInput | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = () => {
    if (parsedTask && parsedTask.title) {
      onTaskSubmit(parsedTask);
      setInputValue('');
      setParsedTask(null);
      setIsActive(false);
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

  if (!isActive) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsActive(true)}
          className="w-full flex items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-left"
        >
          <svg
            className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0"
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
          <span className="text-gray-500">添加任务，例如：明天下午3点开会 #工作 !重要</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="mb-4 bg-white p-3 rounded-lg shadow-md border border-blue-500">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入任务后按 Enter 保存"
        className="w-full focus:outline-none text-base bg-transparent"
      />
      {parsedTask && (
        <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-gray-500">
          {parsedTask.dueDate && (
            <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
              <CalendarIcon className="w-3 h-3 mr-1" />
              {new Date(parsedTask.dueDate).toLocaleDateString()}
            </span>
          )}
          {parsedTask.priority && (
            <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full text-red-600">
              <FlagIcon className="w-3 h-3 mr-1" />
              {parsedTask.priority}
            </span>
          )}
          {parsedTask.tagIds?.map(tag => (
            <span key={tag} className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full">
              <TagIcon className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-end items-center mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={handleAdvancedAdd}
          className="text-xs text-blue-600 hover:text-blue-800 mr-4 font-medium"
        >
          🤖 AI 助手
        </button>
        <button
          onClick={handleSubmit}
          disabled={!parsedTask || !parsedTask.title}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  );
}

export default TaskAddBar;
