import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authSession = await auth();
  if (!authSession?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { sessionId, aspectCode, score, tenOfTenText, currentStateText } =
    await req.json();

  if (!sessionId || !aspectCode) {
    return NextResponse.json({ error: "sessionId и aspectCode обязательны" }, { status: 400 });
  }

  const dbSession = await prisma.assessmentSession.findFirst({
    where: { id: sessionId, userId: authSession.user.id },
  });
  if (!dbSession) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
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
