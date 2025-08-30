// 微信公众号相关类型定义

// 微信用户基本信息
export interface WechatUserInfo {
  openid: string
  unionid?: string
  nickname?: string
  avatar?: string
  subscribe?: number // 是否关注公众号，1表示关注
  subscribe_time?: number // 关注时间戳
  language?: string
  country?: string
  province?: string
  city?: string
}

// 微信消息类型
export interface WechatMessage {
  ToUserName: string // 开发者微信号
  FromUserName: string // 发送方帐号（一个OpenID）
  CreateTime: number // 消息创建时间（整型）
  MsgType: string // 消息类型
  Content?: string // 文本消息内容
  MsgId?: string // 消息id，64位整型
  PicUrl?: string // 图片链接
  MediaId?: string // 媒体文件id
  Format?: string // 语音格式，如amr，speex等
  Recognition?: string // 语音识别结果
}

// 微信回复消息格式
export interface WechatReply {
  ToUserName: string // 接收方微信号
  FromUserName: string // 开发者微信号
  CreateTime: number // 消息创建时间
  MsgType: string // 消息类型
  Content?: string // 回复的消息内容
}

// 微信API响应类型
export interface WechatApiResponse {
  errcode: number
  errmsg: string
  [key: string]: any
}

// 访问令牌响应
export interface AccessTokenResponse extends WechatApiResponse {
  access_token: string
  expires_in: number
}

// 用户信息响应
export interface UserInfoResponse extends WechatApiResponse {
  openid: string
  nickname: string
  sex: number
  language: string
  city: string
  province: string
  country: string
  headimgurl: string
  subscribe_time: number
  unionid?: string
  remark: string
  groupid: number
}

// 微信绑定状态
export enum WechatBindStatus {
  UNBOUND = 'unbound', // 未绑定
  PENDING = 'pending', // 绑定中
  BOUND = 'bound',     // 已绑定
  EXPIRED = 'expired'  // 绑定过期
}

// 微信指令类型
export interface WechatCommand {
  command: string
  params?: string[]
  description: string
}

// 微信任务创建请求
export interface WechatTaskRequest {
  openid: string
  message: string
  msgId?: string
}

// 微信任务创建响应
export interface WechatTaskResponse {
  success: boolean
  message: string
  taskId?: string
  taskTitle?: string
  error?: string
}

// 微信配置接口
export interface WechatConfig {
  appId: string
  appSecret: string
  token: string
  encodingAESKey?: string
  apiUrl: string
}