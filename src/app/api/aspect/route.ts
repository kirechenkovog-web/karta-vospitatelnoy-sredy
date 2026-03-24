import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { sessionId, aspectCode, score, tenOfTenText, currentStateText } =
    await req.json();

  if (!sessionId || !aspectCode) {
    return NextResponse.json({ error: "sessionId и aspectCode обязательны" }, { status: 400 });
  }

  const status = score !== undefined && score !== null ? "completed" : "in_progress";

  const aspectScore = await prisma.aspectScore.upsert({
    where: { sessionId_aspectCode: { sessionId, aspectCode } },
    update: {
      ...(score !== undefined && { score }),
      ...(tenOfTenText !== undefined && { tenOfTenText }),
      ...(currentStateText !== undefined && { currentStateText }),
      status,
    },
    create: {
      sessionId,
      aspectCode,
      score,
      tenOfTenText,
      currentStateText,
      status,
    },
  });

  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(aspectScore);
}
