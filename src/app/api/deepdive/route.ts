import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { sessionId, aspectCode, resultsText, resourcesText, challengesText, indicatorsText } =
    await req.json();

  if (!sessionId || !aspectCode) {
    return NextResponse.json({ error: "sessionId и aspectCode обязательны" }, { status: 400 });
  }

  const deepDive = await prisma.aspectDeepDive.upsert({
    where: { sessionId_aspectCode: { sessionId, aspectCode } },
    update: {
      ...(resultsText !== undefined && { resultsText }),
      ...(resourcesText !== undefined && { resourcesText }),
      ...(challengesText !== undefined && { challengesText }),
      ...(indicatorsText !== undefined && { indicatorsText }),
    },
    create: {
      sessionId,
      aspectCode,
      resultsText,
      resourcesText,
      challengesText,
      indicatorsText,
    },
  });

  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(deepDive);
}
