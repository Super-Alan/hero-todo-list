'use client'

import React, { useEffect, useCallback } from 'react'
import { CreateTaskInput, Priority } from '@/types';
import { parseTaskFromInput } from '@/lib/taskParser';

interface FastModeInputProps {
  input: string;
  parsedTask: CreateTaskInput | null;
  isCustomizing: boolean;
  onInputChange: (value: string) => void;
  onTaskParsed: (task: CreateTaskInput) => void;
  onCustomizeToggle: () => void;
  onConfirm: () => void;
  onAIBreakdown: () => void;
}

function getPriorityStyle(priority: Priority): string {
  switch (priority) {
    case Priority.HIGH:
      return 'bg-red-100 text-red-700';
    case Priority.MEDIUM:
      return 'bg-yellow-100 text-yellow-700';
    case Priority.LOW:
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getPriorityText(priority: Priority): string {
  switch (priority) {
    case Priority.HIGH:
      return '高';
    case Priority.MEDIUM:
      return '中';
    case Priority.LOW:
      return '低';
    default:
      return '无';
  }
}

export default function FastModeInput({
  input,
  parsedTask,
  isCustomizing,
  onInputChange,
  onTaskParsed,
  onCustomizeToggle,
  onConfirm,
  onAIBreakdown
}: FastModeInputProps) {

  useEffect(() => {
    if (input.trim()) {
      const parsed = parseTaskFromInput(input);
      onTaskParsed(parsed);
    } else {
      onTaskParsed({ title: '' }); // Clear parsed task if input is empty
    }
  }, [input, onTaskParsed]);

  const handleCustomTaskChange = useCallback((field: keyof CreateTaskInput, value: any) => {
    if (!parsedTask) return;

    const updatedTask: CreateTaskInput = {
        ...parsedTask,
        [field]: value,
    };
    onTaskParsed(updatedTask);
  }, [parsedTask, onTaskParsed]);

  if (!parsedTask || !parsedTask.title) {
    return (
        <div className="p-4 space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="例如：明天完成报告 #工作 !重要"
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
        </div>
    );
  }

  const { title, dueDate, priority, tagIds } = parsedTask;

  return (
    <div className="p-4 space-y-4">
      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="例如：明天完成报告 #工作 !重要"
        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      />

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            🧠 智能解析结果
          </h3>
          <button
            onClick={onCustomizeToggle}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isCustomizing ? '收起设置' : '自定义设置'}
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">📝</span>
            <span className="font-medium">{title}</span>
          </div>
          
          {dueDate && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">📅</span>
              <span>{new Date(dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {priority && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">⭐</span>
              <span className={`px-2 py-1 rounded text-xs ${getPriorityStyle(priority)}`}>
                {getPriorityText(priority)}
              </span>
            </div>
          )}
          
          {(tagIds && tagIds.length > 0) && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">🏷️</span>
              <div className="flex flex-wrap gap-1">
                {tagIds.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isCustomizing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-900">⚙️ 任务设置</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">任务标题</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => handleCustomTaskChange('title', e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">截止日期</label>
              <input 
                type="date" 
                value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleCustomTaskChange('dueDate', e.target.value ? new Date(e.target.value) : undefined)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">优先级</label>
              <select 
                value={priority || ''}
                onChange={(e) => handleCustomTaskChange('priority', e.target.value as Priority || undefined)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">无</option>
                <option value={Priority.LOW}>低</option>
                <option value={Priority.MEDIUM}>中</option>
                <option value={Priority.HIGH}>高</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">标签 (逗号分隔)</label>
              <input 
                type="text" 
                value={(tagIds || []).join(', ')}
                onChange={(e) => handleCustomTaskChange('tagIds', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onAIBreakdown}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
        >
          🤖 使用 AI 深度分解
        </button>
        <button
          onClick={onConfirm}
          disabled={!title}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          确认添加
        </button>
      </div>
    </div>
  );
}
