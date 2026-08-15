-- CreateTable
CREATE TABLE "user_topic_content" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_topic_content_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_topic_content" ADD CONSTRAINT "user_topic_content_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
