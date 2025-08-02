'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { TaskWithDetails, TagWithDetails } from '@/types'
import { api } from '@/lib/api'

interface TaskStats {
  today: number
  upcoming: number
  all: number
  important: number
  completed: number
  recent: number
  overdue: number
  nodate: number
  thisweek: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface TaskDataState {
  tasks: TaskWithDetails[]
  tags: TagWithDetails[]
  taskStats: TaskStats
  loading: boolean
  error: string | null
  cache: Record<string, CacheEntry<any>>
}

type TaskDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: TaskWithDetails[] }
  | { type: 'SET_TAGS'; payload: TagWithDetails[] }
  | { type: 'SET_TASK_STATS'; payload: TaskStats }
  | { type: 'UPDATE_TASK'; payload: TaskWithDetails }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_TASK'; payload: TaskWithDetails }
  | { type: 'SET_CACHE'; payload: { key: string; data: any; ttl?: number } }
  | { type: 'CLEAR_CACHE'; payload?: string }

const initialState: TaskDataState = {
  tasks: [],
  tags: [],
  taskStats: {
    today: 0,
    upcoming: 0,
    all: 0,
    important: 0,
    completed: 0,
    recent: 0,
    overdue: 0,
    nodate: 0,
    thisweek: 0
  },
  loading: false,
  error: null,
  cache: {}
}

function taskDataReducer(state: TaskDataState, action: TaskDataAction): TaskDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_TASKS':
      return { ...state, tasks: action.payload }
    case 'SET_TAGS':
      return { ...state, tags: action.payload }
    case 'SET_TASK_STATS':
      return { ...state, taskStats: action.payload }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        )
      }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      }
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      }
    case 'SET_CACHE':
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: {
            data: action.payload.data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (action.payload.ttl || 5 * 60 * 1000) // 默认5分钟
          }
        }
      }
    case 'CLEAR_CACHE':
      if (action.payload) {
        const { [action.payload]: removed, ...rest } = state.cache
        return { ...state, cache: rest }
      }
      return { ...state, cache: {} }
    default:
      return state
  }
}

interface TaskDataContextType {
  state: TaskDataState
  fetchTasks: (params?: any) => Promise<TaskWithDetails[]>
  fetchTags: (params?: any) => Promise<TagWithDetails[]>
  fetchTaskStats: () => Promise<TaskStats>
  updateTask: (id: string, updates: any) => Promise<TaskWithDetails>
  deleteTask: (id: string) => Promise<void>
  createTask: (task: any) => Promise<TaskWithDetails>
  refreshAll: () => Promise<void>
  getCachedData: <T>(key: string) => T | null
  setCachedData: <T>(key: string, data: T, ttl?: number) => void
}

const TaskDataContext = createContext<TaskDataContextType | undefined>(undefined)

export function TaskDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [state, dispatch] = useReducer(taskDataReducer, initialState)

  // 缓存管理
  const getCachedData = useCallback(<T,>(key: string): T | null => {
    const entry = state.cache[key]
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      dispatch({ type: 'CLEAR_CACHE', payload: key })
      return null
    }
    
    return entry.data
  }, []) // 移除 state.cache 依赖，直接访问 state

  const setCachedData = useCallback(<T,>(key: string, data: T, ttl?: number) => {
    dispatch({ type: 'SET_CACHE', payload: { key, data, ttl } })
  }, [])

  // 获取任务数据（带缓存）
  const fetchTasks = useCallback(async (params?: any): Promise<TaskWithDetails[]> => {
    const cacheKey = `tasks:${JSON.stringify(params || {})}`
    const cached = getCachedData<TaskWithDetails[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      const data = await api.getTasks(params)
      
      setCachedData(cacheKey, data, 2 * 60 * 1000) // 2分钟缓存
      dispatch({ type: 'SET_TASKS', payload: data })
      
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务失败'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [getCachedData, setCachedData])

  // 获取标签数据（带缓存）
  const fetchTags = useCallback(async (params?: any): Promise<TagWithDetails[]> => {
    const cacheKey = `tags:${JSON.stringify(params || {})}`
    const cached = getCachedData<TagWithDetails[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const data = await api.getTags(params)
      
      setCachedData(cacheKey, data, 5 * 60 * 1000) // 5分钟缓存
      dispatch({ type: 'SET_TAGS', payload: data })
      
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取标签失败'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }, [getCachedData, setCachedData])

  // 获取任务统计（优化版本）
  const fetchTaskStats = useCallback(async (): Promise<TaskStats> => {
    const cacheKey = 'taskStats'
    const cached = getCachedData<TaskStats>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // 使用新的统计 API 端点
      const stats = await api.getTaskStats()
      
      setCachedData(cacheKey, stats, 1 * 60 * 1000) // 1分钟缓存
      dispatch({ type: 'SET_TASK_STATS', payload: stats })
      
      return stats
    } catch (error) {
      console.error('获取任务统计失败:', error)
      // 返回默认的统计数据而不是依赖 state.taskStats
      return {
        today: 0,
        upcoming: 0,
        all: 0,
        important: 0,
        completed: 0,
        recent: 0,
        overdue: 0,
        nodate: 0,
        thisweek: 0
      }
    }
  }, [getCachedData, setCachedData])

  // 更新任务
  const updateTask = useCallback(async (id: string, updates: any): Promise<TaskWithDetails> => {
    try {
      const updatedTask = await api.updateTask(id, updates)
      
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
      
      // 清除相关缓存
      dispatch({ type: 'CLEAR_CACHE', payload: 'taskStats' })
      // 清除所有任务相关缓存
      dispatch({ type: 'CLEAR_CACHE' })
      
      return updatedTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新任务失败'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }, [])

  // 删除任务
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      await api.deleteTask(id)
      
      dispatch({ type: 'DELETE_TASK', payload: id })
      
      // 清除相关缓存
      dispatch({ type: 'CLEAR_CACHE', payload: 'taskStats' })
      // 清除所有任务相关缓存
      dispatch({ type: 'CLEAR_CACHE' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务失败'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }, [])

  // 创建任务
  const createTask = useCallback(async (task: any): Promise<TaskWithDetails> => {
    try {
      const newTask = await api.createTask(task)
      
      dispatch({ type: 'ADD_TASK', payload: newTask })
      
      // 清除相关缓存
      dispatch({ type: 'CLEAR_CACHE', payload: 'taskStats' })
      // 清除所有任务相关缓存
      dispatch({ type: 'CLEAR_CACHE' })
      
      return newTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务失败'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }, [])

  // 刷新所有数据
  const refreshAll = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // 清除所有缓存
      dispatch({ type: 'CLEAR_CACHE' })
      
      // 直接调用 API，避免循环依赖
      const [tagsData, statsData] = await Promise.all([
        api.getTags({ includeStats: true }),
        api.getTaskStats()
      ])
      
      // 设置缓存和数据
      setCachedData(`tags:${JSON.stringify({ includeStats: true })}`, tagsData, 5 * 60 * 1000)
      setCachedData('taskStats', statsData, 1 * 60 * 1000)
      
      dispatch({ type: 'SET_TAGS', payload: tagsData })
      dispatch({ type: 'SET_TASK_STATS', payload: statsData })
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [setCachedData])

  // 初始化数据 - 只在用户已认证时执行
  useEffect(() => {
    const initializeData = async () => {
      // 只有在用户已登录时才初始化数据
      if (status !== 'authenticated' || !session) {
        return
      }

      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // 直接调用 API，避免循环依赖
        const [tagsData, statsData] = await Promise.all([
          api.getTags({ includeStats: true }),
          api.getTaskStats()
        ])
        
        // 设置缓存和数据
        setCachedData(`tags:${JSON.stringify({ includeStats: true })}`, tagsData, 5 * 60 * 1000)
        setCachedData('taskStats', statsData, 1 * 60 * 1000)
        
        dispatch({ type: 'SET_TAGS', payload: tagsData })
        dispatch({ type: 'SET_TASK_STATS', payload: statsData })
      } catch (error) {
        console.error('初始化数据失败:', error)
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    
    if (status === 'authenticated') {
      initializeData()
    }
  }, [setCachedData, session, status]) // 依赖 session 和 status

  const value: TaskDataContextType = {
    state,
    fetchTasks,
    fetchTags,
    fetchTaskStats,
    updateTask,
    deleteTask,
    createTask,
    refreshAll,
    getCachedData,
    setCachedData
  }

  return (
    <TaskDataContext.Provider value={value}>
      {children}
    </TaskDataContext.Provider>
  )
}

export function useTaskData() {
  const context = useContext(TaskDataContext)
  if (context === undefined) {
    throw new Error('useTaskData must be used within a TaskDataProvider')
  }
  return context
} 