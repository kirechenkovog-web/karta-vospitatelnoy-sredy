import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { sessionId, focusAspects, targetResult, crossResourcesText, firstStepsText } =
    await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId обязателен" }, { status: 400 });
  }

  const focusPlan = await prisma.focusPlan.upsert({
    where: { sessionId },
    update: {
      ...(focusAspects !== undefined && { focusAspects: JSON.stringify(focusAspects) }),
      ...(targetResult !== undefined && { targetResult }),
      ...(crossResourcesText !== undefined && { crossResourcesText }),
      ...(firstStepsText !== undefined && { firstStepsText }),
    },
    create: {
      sessionId,
      focusAspects: JSON.stringify(focusAspects ?? []),
      targetResult,
      crossResourcesText,
      firstStepsText,
    },
  });

  const isComplete =
    focusAspects?.length > 0 && targetResult && firstStepsText;

  if (isComplete) {
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { status: "completed", currentStage: 3, updatedAt: new Date() },
    });
  } else {
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
  }

  return NextResponse.json(focusPlan);
}
