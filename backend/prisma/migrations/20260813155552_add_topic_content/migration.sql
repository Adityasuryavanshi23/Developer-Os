-- CreateTable
CREATE TABLE "topic_content" (
    "id" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "explanationEn" TEXT NOT NULL,
    "explanationHi" TEXT NOT NULL,
    "explanationHl" TEXT NOT NULL,
    "codeExample" TEXT,
    "interviewQs" JSONB NOT NULL,
    "resources" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topic_content_topicName_key" ON "topic_content"("topicName");
