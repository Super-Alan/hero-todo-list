import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { Role } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: '请输入邮箱地址'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: '请输入密码'
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('邮箱和密码不能为空')
        }

        // 查找用户
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true,
            role: true
          }
        })

        if (!user || !user.password) {
          throw new Error('邮箱或密码错误')
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(credentials.password, user.password)
        
        if (!isValidPassword) {
          throw new Error('邮箱或密码错误')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 10000, // 10 秒超时
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      httpOptions: {
        timeout: 10000, // 10 秒超时
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
        },
      }
    },
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.sub = user.id
        token.role = user.role
      }
      
      // 每次JWT刷新时都重新获取用户角色（确保角色变更能及时生效）
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true }
        })
        token.role = dbUser?.role || Role.USER
      }
      
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // 生产环境优化
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
} 