import crypto from 'crypto'

/**
 * 微信签名验证工具
 */
export class WechatCrypto {
  private token: string

  constructor() {
    this.token = process.env.WECHAT_TOKEN || ''
  }

  /**
   * 验证微信服务器签名
   */
  verifySignature(signature: string, timestamp: string, nonce: string): boolean {
    if (!this.token) {
      console.error('微信Token未配置')
      return false
    }

    try {
      const tmpArr = [this.token, timestamp, nonce]
      tmpArr.sort()
      const tmpStr = tmpArr.join('')
      
      const hash = crypto.createHash('sha1').update(tmpStr).digest('hex')
      
      return hash === signature
    } catch (error) {
      console.error('验证微信签名失败:', error)
      return false
    }
  }

  /**
   * 生成随机字符串
   */
  generateRandomString(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }

  /**
   * 生成绑定Token
   */
  generateBindToken(openid: string): string {
    const timestamp = Date.now().toString()
    const random = this.generateRandomString(8)
    const data = `${openid}-${timestamp}-${random}`
    
    return crypto.createHash('md5').update(data).digest('hex')
  }

  /**
   * 验证绑定Token格式
   */
  isValidBindToken(token: string): boolean {
    // MD5 hash是32位十六进制字符串
    return /^[a-f0-9]{32}$/i.test(token)
  }
}

// 导出单例
export const wechatCrypto = new WechatCrypto()