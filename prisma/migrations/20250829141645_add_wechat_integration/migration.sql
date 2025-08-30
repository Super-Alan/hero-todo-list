-- CreateEnum
CREATE TYPE "WechatMessageStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "wechat_users" (
    "id" TEXT NOT NULL,
    "openid" TEXT NOT NULL,
    "unionid" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "isBindUser" BOOLEAN NOT NULL DEFAULT false,
    "bindToken" TEXT,
    "bindExpires" TIMESTAMP(3),
    "userId" TEXT,
    "taskCount" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wechat_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wechat_messages" (
    "id" TEXT NOT NULL,
    "msgId" TEXT,
    "msgType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "WechatMessageStatus" NOT NULL DEFAULT 'PENDING',
    "response" TEXT,
    "errorMsg" TEXT,
    "taskId" TEXT,
    "wechatUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wechat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wechat_task_logs" (
    "id" TEXT NOT NULL,
    "originalMsg" TEXT NOT NULL,
    "parsedData" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "taskId" TEXT,
    "errorMsg" TEXT,
    "userId" TEXT NOT NULL,
    "wechatUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wechat_task_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wechat_users_openid_key" ON "wechat_users"("openid");

-- AddForeignKey
ALTER TABLE "wechat_users" ADD CONSTRAINT "wechat_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wechat_messages" ADD CONSTRAINT "wechat_messages_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wechat_messages" ADD CONSTRAINT "wechat_messages_wechatUserId_fkey" FOREIGN KEY ("wechatUserId") REFERENCES "wechat_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wechat_task_logs" ADD CONSTRAINT "wechat_task_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wechat_task_logs" ADD CONSTRAINT "wechat_task_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wechat_task_logs" ADD CONSTRAINT "wechat_task_logs_wechatUserId_fkey" FOREIGN KEY ("wechatUserId") REFERENCES "wechat_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
