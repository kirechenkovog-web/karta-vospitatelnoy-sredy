-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "currentStage" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AspectScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "aspectCode" TEXT NOT NULL,
    "score" INTEGER,
    "tenOfTenText" TEXT,
    "currentStateText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AspectScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AspectDeepDive" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "aspectCode" TEXT NOT NULL,
    "resultsText" TEXT,
    "resourcesText" TEXT,
    "challengesText" TEXT,
    "indicatorsText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AspectDeepDive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusPlan" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "focusAspects" TEXT NOT NULL,
    "targetResult" TEXT,
    "crossResourcesText" TEXT,
    "firstStepsText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FocusPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "aspectCode" TEXT,
    "role" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AspectScore_sessionId_aspectCode_key" ON "AspectScore"("sessionId", "aspectCode");

-- CreateIndex
CREATE UNIQUE INDEX "AspectDeepDive_sessionId_aspectCode_key" ON "AspectDeepDive"("sessionId", "aspectCode");

-- CreateIndex
CREATE UNIQUE INDEX "FocusPlan_sessionId_key" ON "FocusPlan"("sessionId");

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspectScore" ADD CONSTRAINT "AspectScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AspectDeepDive" ADD CONSTRAINT "AspectDeepDive_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusPlan" ADD CONSTRAINT "FocusPlan_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
