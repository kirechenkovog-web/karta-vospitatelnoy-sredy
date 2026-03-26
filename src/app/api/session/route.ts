import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const forceNew = body.forceNew === true;

  if (!forceNew) {
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
  }

  // No session at all (or forceNew) — create a fresh one
  const newSession = await prisma.assessmentSession.create({
    data: { userId },
    include: { scores: true, deepDives: true, focusPlan: true },
  });

  return NextResponse.json({ session: newSession });
}

export async function GET(req: NextRequest) {
  const auth2 = await auth();
  if (!auth2?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const list = req.nextUrl.searchParams.get("list");

  // Return all sessions for current user
  if (list === "true") {
    const sessions = await prisma.assessmentSession.findMany({
      where: { userId: auth2.user.id },
      orderBy: { createdAt: "desc" },
      include: { scores: true },
    });
    return NextResponse.json(sessions);
  }

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
