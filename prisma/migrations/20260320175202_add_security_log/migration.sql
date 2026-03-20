-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "clientIp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_logs_clientIp_idx" ON "security_logs"("clientIp");

-- CreateIndex
CREATE INDEX "security_logs_email_idx" ON "security_logs"("email");

-- CreateIndex
CREATE INDEX "security_logs_reason_idx" ON "security_logs"("reason");

-- CreateIndex
CREATE INDEX "security_logs_createdAt_idx" ON "security_logs"("createdAt");
