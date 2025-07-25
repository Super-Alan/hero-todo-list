'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Calendar, CheckCircle, Clock, Plus, Tag, Inbox, Loader2, Settings, X, Edit2, Search, AlertTriangle, Star, History, AlertCircle, Calendar as CalendarIcon, Sparkles } from 'lucide-react'
import { useTaskData } from '@/contexts/TaskDataContext'
import { TagWithDetails } from '@/types'

interface SidebarProps {
  selectedView: 'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag'
  selectedTag: string | null
  onViewSelect: (view: 'today' | 'upcoming' | 'all' | 'important' | 'completed' | 'recent' | 'overdue' | 'nodate' | 'thisweek' | 'tag') => void
  onTagSelect: (tagId: string | null) => void
}

interface SidebarHandle {
  refreshTags: () => void
  refreshTaskStats: () => void
}

const Sidebar = forwardRef<SidebarHandle, SidebarProps>(({
  selectedView,
  selectedTag,
  onViewSelect,
  onTagSelect
}, ref) => {
  const { state, fetchTags, fetchTaskStats, createTask, updateTask, deleteTask } = useTaskData()
  const [showTagManagement, setShowTagManagement] = useState(false)
  const [showTagForm, setShowTagForm] = useState(false)
  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#6b7280')
  const [tagCreating, setTagCreating] = useState(false)
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editTagName, setEditTagName] = useState('')
  const [editTagColor, setEditTagColor] = useState('')
  const [tagUpdating, setTagUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTags, setFilteredTags] = useState<TagWithDetails[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'created'>('name')

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    refreshTags: () => fetchTags({ includeStats: true }),
    refreshTaskStats: fetchTaskStats
  }))

  // 搜索过滤和排序效果
  useEffect(() => {
    let filtered = state.tags
    
    // 搜索过滤
    if (searchQuery.trim()) {
      filtered = state.tags.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // 排序
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          const aUsage = (a as any).stats?.totalTasks || 0
          const bUsage = (b as any).stats?.totalTasks || 0
          return bUsage - aUsage // 降序
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // 最新的在前
        case 'name':
        default:
          return a.name.localeCompare(b.name) // 字母顺序
      }
    })
    
    setFilteredTags(sorted)
  }, [state.tags, searchQuery, sortBy])

  const createTag = async () => {
    if (!tagName.trim() || tagCreating) return

    try {
      setTagCreating(true)
      await fetchTags({ includeStats: true }) // 刷新标签列表
      setTagName('')
      setTagColor('#6b7280')
      setShowTagForm(false)
    } catch (err) {
      console.error('创建标签失败:', err)
    } finally {
      setTagCreating(false)
    }
  }

  const deleteTag = async (tagId: string) => {
    if (!confirm('确定要删除这个标签吗？')) return

    try {
      await fetchTags({ includeStats: true }) // 刷新标签列表
    } catch (err) {
      console.error('删除标签失败:', err)
    }
  }

  const startEditTag = (tag: TagWithDetails) => {
    setEditingTag(tag.id)
    setEditTagName(tag.name)
    setEditTagColor(tag.color)
  }

  const updateTag = async () => {
    if (!editingTag || !editTagName.trim() || tagUpdating) return

    try {
      setTagUpdating(true)
      await fetchTags({ includeStats: true }) // 刷新标签列表
      setEditingTag(null)
      setEditTagName('')
      setEditTagColor('')
    } catch (err) {
      console.error('更新标签失败:', err)
    } finally {
      setTagUpdating(false)
    }
  }

  const cancelEditTag = () => {
    setEditingTag(null)
    setEditTagName('')
    setEditTagColor('')
  }

  const handleTagFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTag()
  }

  const handleTagClick = (tagId: string) => {
    onTagSelect(tagId)
    onViewSelect('tag')
  }

  const predefinedColors = [
    // 主色调
    '#3b82f6', '#ef4444', '#f59e0b', '#10b981', 
    '#8b5cf6', '#f97316', '#06b6d4', '#84cc16',
    // 扩展色调
    '#ec4899', '#6366f1', '#8b5cf6', '#06b6d4',
    '#10b981', '#f59e0b', '#ef4444', '#64748b',
    // 柔和色调
    '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6'
  ]

  const basicViews = [
    { id: 'today', name: '今天', icon: Calendar, count: state.taskStats.today || 0 },
    { id: 'upcoming', name: '即将到来', icon: Clock, count: state.taskStats.upcoming || 0 },
    { id: 'thisweek', name: '本周', icon: CalendarIcon, count: state.taskStats.thisweek || 0 },
    { id: 'all', name: '所有任务', icon: Inbox, count: state.taskStats.all || 0 },
  ]

  const smartViews = [
    { id: 'important', name: '重要任务', icon: Star, count: state.taskStats.important || 0, color: 'text-amber-600' },
    { id: 'overdue', name: '逾期任务', icon: AlertTriangle, count: state.taskStats.overdue || 0, color: 'text-red-600' },
    { id: 'nodate', name: '无日期', icon: AlertCircle, count: state.taskStats.nodate || 0, color: 'text-gray-500' },
    { id: 'recent', name: '最近活动', icon: History, count: state.taskStats.recent || 0 },
    { id: 'completed', name: '已完成', icon: CheckCircle, count: state.taskStats.completed || 0, color: 'text-green-600' },
  ]

  return (
    <aside className="w-full h-full bg-gradient-to-b from-slate-800 via-purple-900 to-indigo-900 border-r border-white/20 flex flex-col backdrop-blur-md shadow-tech">
      {/* 应用标题 */}
      <div className="p-6 border-b border-white/20 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-tech animate-pulse-glow">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">Hero ToDo</h1>
        </div>
      </div>

      {/* 主要视图 */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* 基础视图 */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3">
            视图
          </h2>
          {basicViews.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewSelect(view.id as any)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                selectedView === view.id && !selectedTag
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-400/30 shadow-tech'
                  : 'text-gray-200 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <view.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  selectedView === view.id && !selectedTag ? 'text-primary-600' : ''
                }`} />
                <span>{view.name}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedView === view.id && !selectedTag 
                  ? 'bg-primary-500/20 text-primary-600' 
                  : 'text-gray-400'
              }`}>{view.count}</span>
            </button>
          ))}
        </div>

        {/* 智能视图 */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-3">
            智能视图
            </h2>
          {smartViews.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewSelect(view.id as any)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                selectedView === view.id && !selectedTag
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-400/30 shadow-tech'
                  : 'text-gray-200 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <view.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                  selectedView === view.id && !selectedTag ? 'text-primary-600' : view.color || ''
                }`} />
                <span>{view.name}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedView === view.id && !selectedTag 
                  ? 'bg-primary-500/20 text-primary-600'
                  : view.count > 0 && view.color 
                    ? `${view.color} bg-opacity-10` 
                    : 'text-gray-400'
              }`}>
                {view.count}
              </span>
            </button>
          ))}
        </div>

        {/* 标签 */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              标签
            </h2>
            <button 
              onClick={() => setShowTagManagement(!showTagManagement)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          
          {state.loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          
          {state.error && (
            <div className="text-sm text-red-600 px-3 py-2">
              {state.error}
            </div>
          )}
          
          {!state.loading && !state.error && (
            !showTagManagement ? (
              <div className="space-y-1">
                {state.tags.slice(0, 5).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedTag === tag.id
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-400/30 shadow-tech'
                        : 'text-gray-200 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(tag as any).stats?.totalTasks || 0}
                    </span>
                  </button>
                ))}
                {state.tags.length > 5 && (
                  <button
                    onClick={() => setShowTagManagement(true)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    查看更多 ({state.tags.length - 5})
                  </button>
                )}
                
                {/* 快速添加标签 */}
                <button
                  onClick={() => {
                    setShowTagManagement(true)
                    setShowTagForm(true)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-purple-300 hover:text-purple-200 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 rounded-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  <span>添加标签</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 标签管理头部 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">管理标签</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowSearch(!showSearch)}
                      className={`p-1 hover:text-gray-600 ${showSearch ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowTagManagement(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 搜索框 */}
                {showSearch && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="搜索标签..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* 排序选择器 */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'created')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name">按名称排序</option>
                      <option value="usage">按使用频率排序</option>
                      <option value="created">按创建时间排序</option>
                    </select>
                  </div>
                )}

                {/* 添加标签按钮 */}
                {!showTagForm && (
                  <button
                    onClick={() => setShowTagForm(true)}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-dashed border-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                    <span>添加标签</span>
                  </button>
                )}

                {/* 标签创建表单 */}
                {showTagForm && (
                  <form onSubmit={handleTagFormSubmit} className="p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        placeholder="标签名称"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={tagCreating}
                        autoFocus
                      />
                      
                      {/* 颜色选择器 */}
                      <div className="space-y-2">
                        <span className="text-xs text-gray-500">选择颜色：</span>
                        <div className="grid grid-cols-8 gap-2">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setTagColor(color)}
                              className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${
                                tagColor === color ? 'border-gray-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          type="submit"
                          disabled={!tagName.trim() || tagCreating}
                          className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {tagCreating ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              创建中...
                            </>
                          ) : (
                            '创建标签'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTagForm(false)
                            setTagName('')
                            setTagColor('#6b7280')
                          }}
                          className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800"
                          disabled={tagCreating}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* 标签列表 */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50"
                    >
                      {editingTag === tag.id ? (
                        /* 编辑模式 */
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <div className="space-y-2">
                            <span className="text-xs text-gray-500">选择颜色：</span>
                            <div className="grid grid-cols-8 gap-1">
                              {predefinedColors.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setEditTagColor(color)}
                                  className={`w-4 h-4 rounded-full border-2 hover:scale-110 transition-transform ${
                                    editTagColor === color ? 'border-gray-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={updateTag}
                              disabled={!editTagName.trim() || tagUpdating}
                              className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {tagUpdating ? '保存中...' : '保存'}
                            </button>
                            <button
                              onClick={cancelEditTag}
                              className="px-2 py-1 text-gray-600 text-xs hover:text-gray-800"
                              disabled={tagUpdating}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 显示模式 */
                        <>
                          <button
                            onClick={() => handleTagClick(tag.id)}
                            className={`flex items-center space-x-2 flex-1 text-left ${
                              selectedTag === tag.id ? 'text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm">{tag.name}</span>
                          </button>
                          <div className="flex items-center space-x-1">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                                {(tag as any).stats?.totalTasks || 0}
                              </span>
                              {(tag as any).stats?.overdueTasks > 0 && (
                                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                  逾期 {(tag as any).stats.overdueTasks}
                                </span>
                              )}
                              {(tag as any).stats?.highPriorityTasks > 0 && (
                                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                  重要 {(tag as any).stats.highPriorityTasks}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => startEditTag(tag)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteTag(tag.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
          </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {filteredTags.length === 0 && searchQuery && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      没有找到匹配的标签
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </nav>

      {/* 底部统计 */}
      <div className="p-4 border-t border-white/20 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 flex-shrink-0">
        <div className="space-y-2 text-xs text-purple-200">
          <div className="flex items-center justify-between">
            <span>总标签数</span>
            <span className="font-medium">{state.tags.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>已使用标签</span>
            <span className="font-medium">
              {state.tags.filter(tag => (tag as any).stats?.totalTasks > 0).length}
            </span>
          </div>
          {selectedTag && (
            <div className="pt-2 border-t border-white/20">
              <div className="flex items-center space-x-2">
                <Tag className="h-3 w-3 text-purple-300" />
                <span className="font-medium text-purple-200">当前标签</span>
              </div>
              <div className="mt-1 ml-5 space-y-1">
                {(() => {
                  const currentTag = state.tags.find(tag => tag.id === selectedTag)
                  const stats = (currentTag as any)?.stats
                  return stats ? (
                    <>
                      <div className="flex justify-between">
                        <span>总任务</span>
                        <span>{stats.totalTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>已完成</span>
                        <span>{stats.completedTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>待办</span>
                        <span>{stats.pendingTasks}</span>
                      </div>
                      {stats.overdueTasks > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>逾期</span>
                          <span>{stats.overdueTasks}</span>
                        </div>
                      )}
                    </>
                  ) : null
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar 