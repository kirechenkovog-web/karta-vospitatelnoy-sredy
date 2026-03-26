import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = session.user.id;

  // Find the most recent in-progress session first
  const inProgress = await prisma.assessmentSession.findFirst({
    where: { userId, status: "in_progress" },
    orderBy: { updatedAt: "desc" },
    include: { scores: true, deepDives: true, focusPlan: true },
  });

  if (inProgress) {
    return NextResponse.json({ session: inProgress });
  }

  // Fall back to the most recent completed session — never lose data
  const completed = await prisma.assessmentSession.findFirst({
    where: { userId, status: "completed" },
    orderBy: { updatedAt: "desc" },
    include: { scores: true, deepDives: true, focusPlan: true },
  });

  if (completed) {
    return NextResponse.json({ session: completed });
  }

  // No session at all — create a fresh one
  const newSession = await prisma.assessmentSession.create({
    data: { userId },
    include: { scores: true, deepDives: true, focusPlan: true },
  });

  return NextResponse.json({ session: newSession });
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId обязателен" }, { status: 400 });
  }

  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: { scores: true, deepDives: true, focusPlan: true, user: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PATCH(req: NextRequest) {
  const { sessionId, currentStage, status } = await req.json();

  const session = await prisma.assessmentSession.update({
    where: { id: sessionId },
    data: {
      ...(currentStage !== undefined && { currentStage }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(session);
}
