import { api } from './api'
import { TagWithDetails } from '@/types'

class TagService {
  private tagsCache: TagWithDetails[] = []
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  // 获取所有标签（带缓存）
  async getAllTags(): Promise<TagWithDetails[]> {
    const now = Date.now()
    
    // 如果缓存未过期，直接返回缓存
    if (this.tagsCache.length > 0 && now < this.cacheExpiry) {
      return this.tagsCache
    }

    try {
      // 从API获取标签列表
      const tags = await api.getTags({ includeStats: true })
      this.tagsCache = tags
      this.cacheExpiry = now + this.CACHE_DURATION
      return tags
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      return []
    }
  }

  // 根据标签名获取标签ID
  async getTagIdByName(tagName: string): Promise<string | null> {
    const tags = await this.getAllTags()
    const tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
    return tag?.id || null
  }

  // 根据标签名数组获取标签ID数组
  async getTagIdsByNames(tagNames: string[]): Promise<string[]> {
    const tags = await this.getAllTags()
    const tagIds: string[] = []
    
    for (const tagName of tagNames) {
      const tag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
      if (tag) {
        tagIds.push(tag.id)
      }
    }
    
    return tagIds
  }

  // 创建新标签
  async createTag(tagName: string, color?: string): Promise<TagWithDetails | null> {
    try {
      const newTag = await api.createTag({ name: tagName, color })
      
      // 更新缓存
      this.tagsCache.push(newTag)
      
      return newTag
    } catch (error) {
      console.error('Failed to create tag:', error)
      return null
    }
  }

  // 根据标签名获取或创建标签ID
  async getOrCreateTagId(tagName: string): Promise<string | null> {
    // 先尝试获取现有标签
    let tagId = await this.getTagIdByName(tagName)
    
    // 如果标签不存在，尝试创建新标签
    if (!tagId) {
      const newTag = await this.createTag(tagName)
      tagId = newTag?.id || null
    }
    
    return tagId
  }

  // 根据标签名数组获取或创建标签ID数组
  async getOrCreateTagIds(tagNames: string[]): Promise<string[]> {
    const tagIds: string[] = []
    
    for (const tagName of tagNames) {
      const tagId = await this.getOrCreateTagId(tagName)
      if (tagId) {
        tagIds.push(tagId)
      }
    }
    
    return tagIds
  }

  // 清除缓存
  clearCache(): void {
    this.tagsCache = []
    this.cacheExpiry = 0
  }

  // 刷新缓存
  async refreshCache(): Promise<void> {
    this.clearCache()
    await this.getAllTags()
  }
}

export const tagService = new TagService() 