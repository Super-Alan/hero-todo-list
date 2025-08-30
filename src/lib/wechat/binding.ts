import { prisma } from '@/lib/prisma'
import { wechatCrypto } from './crypto'
import { WechatBindStatus } from '@/types/wechat'

/**
 * 微信用户绑定管理
 */
export class WechatBinding {

  /**
   * 创建绑定令牌
   */
  async createBindToken(openid: string, nickname?: string, avatar?: string): Promise<string> {
    const bindToken = wechatCrypto.generateBindToken(openid)
    const bindExpires = new Date(Date.now() + 30 * 60 * 1000) // 30分钟后过期

    try {
      // 更新或创建微信用户记录
      await prisma.wechatUser.upsert({
        where: { openid },
        update: {
          bindToken,
          bindExpires,
          nickname,
          avatar,
          lastActiveAt: new Date()
        },
        create: {
          openid,
          nickname,
          avatar,
          bindToken,
          bindExpires,
          isBindUser: false
        }
      })

      return bindToken
    } catch (error) {
      console.error('创建绑定令牌失败:', error)
      throw error
    }
  }

  /**
   * 验证并绑定用户
   */
  async bindUser(bindToken: string, userId: string): Promise<boolean> {
    if (!wechatCrypto.isValidBindToken(bindToken)) {
      throw new Error('无效的绑定令牌')
    }

    try {
      const wechatUser = await prisma.wechatUser.findFirst({
        where: {
          bindToken,
          bindExpires: {
            gt: new Date() // 未过期
          }
        }
      })

      if (!wechatUser) {
        throw new Error('绑定令牌无效或已过期')
      }

      // 检查该系统用户是否已经绑定了其他微信账号
      const existingBinding = await prisma.wechatUser.findFirst({
        where: {
          userId,
          isBindUser: true
        }
      })

      if (existingBinding && existingBinding.id !== wechatUser.id) {
        throw new Error('该账号已绑定其他微信用户')
      }

      // 绑定用户
      await prisma.wechatUser.update({
        where: { id: wechatUser.id },
        data: {
          userId,
          isBindUser: true,
          bindToken: null, // 清除绑定令牌
          bindExpires: null
        }
      })

      return true
    } catch (error) {
      console.error('绑定用户失败:', error)
      throw error
    }
  }

  /**
   * 解除绑定
   */
  async unbindUser(openid: string): Promise<boolean> {
    try {
      const result = await prisma.wechatUser.updateMany({
        where: {
          openid,
          isBindUser: true
        },
        data: {
          userId: null,
          isBindUser: false,
          bindToken: null,
          bindExpires: null
        }
      })

      return result.count > 0
    } catch (error) {
      console.error('解除绑定失败:', error)
      throw error
    }
  }

  /**
   * 获取微信用户信息
   */
  async getWechatUser(openid: string) {
    try {
      return await prisma.wechatUser.findUnique({
        where: { openid },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    } catch (error) {
      console.error('获取微信用户信息失败:', error)
      return null
    }
  }

  /**
   * 获取绑定状态
   */
  async getBindStatus(openid: string): Promise<WechatBindStatus> {
    try {
      const wechatUser = await this.getWechatUser(openid)
      
      if (!wechatUser) {
        return WechatBindStatus.UNBOUND
      }

      if (wechatUser.isBindUser && wechatUser.userId) {
        return WechatBindStatus.BOUND
      }

      if (wechatUser.bindToken && wechatUser.bindExpires) {
        if (wechatUser.bindExpires > new Date()) {
          return WechatBindStatus.PENDING
        } else {
          return WechatBindStatus.EXPIRED
        }
      }

      return WechatBindStatus.UNBOUND
    } catch (error) {
      console.error('获取绑定状态失败:', error)
      return WechatBindStatus.UNBOUND
    }
  }

  /**
   * 更新用户活跃时间
   */
  async updateLastActive(openid: string): Promise<void> {
    try {
      await prisma.wechatUser.update({
        where: { openid },
        data: { lastActiveAt: new Date() }
      })
    } catch (error) {
      // 忽略更新失败，不影响主要功能
      console.warn('更新用户活跃时间失败:', error)
    }
  }

  /**
   * 增加任务计数
   */
  async incrementTaskCount(openid: string): Promise<void> {
    try {
      await prisma.wechatUser.update({
        where: { openid },
        data: { 
          taskCount: {
            increment: 1
          },
          lastActiveAt: new Date()
        }
      })
    } catch (error) {
      console.warn('更新任务计数失败:', error)
    }
  }

  /**
   * 清理过期的绑定令牌
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.wechatUser.updateMany({
        where: {
          bindExpires: {
            lt: new Date()
          },
          isBindUser: false
        },
        data: {
          bindToken: null,
          bindExpires: null
        }
      })

      return result.count
    } catch (error) {
      console.error('清理过期令牌失败:', error)
      return 0
    }
  }
}

// 导出单例
export const wechatBinding = new WechatBinding()