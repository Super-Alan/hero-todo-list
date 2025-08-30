import { WechatConfig, AccessTokenResponse, UserInfoResponse, WechatApiResponse } from '@/types/wechat'

export class WechatAPI {
  private config: WechatConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.config = {
      appId: process.env.WECHAT_APP_ID || '',
      appSecret: process.env.WECHAT_APP_SECRET || '',
      token: process.env.WECHAT_TOKEN || '',
      encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY || '',
      apiUrl: 'https://api.weixin.qq.com/cgi-bin'
    }
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    // 如果token未过期，直接返回
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const url = `${this.config.apiUrl}/token`
    const params = new URLSearchParams({
      grant_type: 'client_credential',
      appid: this.config.appId,
      secret: this.config.appSecret
    })

    try {
      const response = await fetch(`${url}?${params}`)
      const data: AccessTokenResponse = await response.json()

      if (data.errcode) {
        throw new Error(`获取访问令牌失败: ${data.errmsg}`)
      }

      this.accessToken = data.access_token
      // 提前5分钟过期，确保安全
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

      return this.accessToken
    } catch (error) {
      console.error('获取微信访问令牌失败:', error)
      throw error
    }
  }

  /**
   * 获取用户基本信息
   */
  async getUserInfo(openid: string): Promise<UserInfoResponse> {
    const accessToken = await this.getAccessToken()
    const url = `${this.config.apiUrl}/user/info`
    const params = new URLSearchParams({
      access_token: accessToken,
      openid: openid,
      lang: 'zh_CN'
    })

    try {
      const response = await fetch(`${url}?${params}`)
      const data: UserInfoResponse = await response.json()

      if (data.errcode) {
        throw new Error(`获取用户信息失败: ${data.errmsg}`)
      }

      return data
    } catch (error) {
      console.error('获取微信用户信息失败:', error)
      throw error
    }
  }

  /**
   * 发送客服消息
   */
  async sendCustomMessage(openid: string, content: string): Promise<boolean> {
    const accessToken = await this.getAccessToken()
    const url = `${this.config.apiUrl}/message/custom/send?access_token=${accessToken}`

    const messageData = {
      touser: openid,
      msgtype: 'text',
      text: {
        content: content
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      })

      const data: WechatApiResponse = await response.json()

      if (data.errcode) {
        console.error('发送客服消息失败:', data.errmsg)
        return false
      }

      return true
    } catch (error) {
      console.error('发送微信客服消息失败:', error)
      return false
    }
  }

  /**
   * 验证服务器地址的有效性
   */
  verifySignature(signature: string, timestamp: string, nonce: string): boolean {
    const crypto = require('crypto')
    
    const tmpArr = [this.config.token, timestamp, nonce]
    tmpArr.sort()
    const tmpStr = tmpArr.join('')
    
    const hash = crypto.createHash('sha1').update(tmpStr).digest('hex')
    
    return hash === signature
  }

  /**
   * 生成回复消息XML
   */
  generateReplyXML(toUser: string, fromUser: string, content: string): string {
    const timestamp = Math.floor(Date.now() / 1000)
    
    return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${timestamp}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`
  }

  /**
   * 解析微信消息XML
   */
  async parseMessage(xml: string): Promise<any> {
    const { parseString } = require('xml2js')
    
    return new Promise((resolve, reject) => {
      parseString(xml, { explicitArray: false }, (err: any, result: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(result.xml)
        }
      })
    })
  }
}

// 导出单例
export const wechatAPI = new WechatAPI()