import { TaskWithDetails, TagWithDetails, CreateTaskInput, UpdateTaskInput, CreateTagInput, UpdateTagInput } from '@/types'

class ApiClient {
  private baseUrl = '/api'

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }))
      throw new Error(error.error || '请求失败')
    }

    return response.json()
  }

  // 任务相关 API
  async getTasks(params?: {
    tagId?: string
    tagIds?: string[]
    priority?: string
    status?: string
    isCompleted?: boolean
    search?: string
    view?: string
    sortField?: string
    sortDirection?: string
  }): Promise<TaskWithDetails[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.tagId) searchParams.append('tagId', params.tagId)
    if (params?.tagIds) searchParams.append('tagIds', params.tagIds.join(','))
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.isCompleted !== undefined) searchParams.append('isCompleted', params.isCompleted.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.view) searchParams.append('view', params.view)
    if (params?.sortField) searchParams.append('sortField', params.sortField)
    if (params?.sortDirection) searchParams.append('sortDirection', params.sortDirection)
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.request<TaskWithDetails[]>(`/tasks${query}`)
  }

  async getTask(id: string): Promise<TaskWithDetails> {
    return this.request<TaskWithDetails>(`/tasks/${id}`)
  }

  async createTask(data: CreateTaskInput): Promise<TaskWithDetails> {
    return this.request<TaskWithDetails>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTask(id: string, data: UpdateTaskInput): Promise<TaskWithDetails> {
    return this.request<TaskWithDetails>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  // 获取任务统计数据
  async getTaskStats(): Promise<{
    all: number
    today: number
    upcoming: number
    thisweek: number
    important: number
    completed: number
    recent: number
    overdue: number
    nodate: number
  }> {
    return this.request('/tasks/stats')
  }

  // 搜索任务
  async searchTasks(params: {
    query: string
    limit?: number
    includeCompleted?: boolean
  }): Promise<{
    tasks: TaskWithDetails[]
    total: number
    query: string
  }> {
    const searchParams = new URLSearchParams()
    searchParams.append('q', params.query)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.includeCompleted !== undefined) searchParams.append('includeCompleted', params.includeCompleted.toString())
    
    const query = `?${searchParams.toString()}`
    return this.request(`/tasks/search${query}`)
  }

  // 标签相关 API
  async getTags(params?: {
    includeStats?: boolean
    search?: string
  }): Promise<TagWithDetails[]> {
    const searchParams = new URLSearchParams()
    
    if (params?.includeStats) searchParams.append('includeStats', 'true')
    if (params?.search) searchParams.append('search', params.search)
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return this.request<TagWithDetails[]>(`/tags${query}`)
  }

  async createTag(data: CreateTagInput): Promise<TagWithDetails> {
    return this.request<TagWithDetails>('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTag(id: string, data: UpdateTagInput): Promise<TagWithDetails> {
    return this.request<TagWithDetails>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTag(id: string): Promise<{ message: string; affectedTasks: number }> {
    return this.request<{ message: string; affectedTasks: number }>(`/tags/${id}`, {
      method: 'DELETE',
    })
  }
}

export const api = new ApiClient() 