import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Имя и email обязательны" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { name, email },
  });

  const session = await prisma.assessmentSession.findFirst({
    where: { userId: user.id, status: "in_progress" },
    orderBy: { updatedAt: "desc" },
    include: {
      scores: true,
      deepDives: true,
      focusPlan: true,
    },
  });

  if (session) {
    return NextResponse.json({ user, session });
  }

  const newSession = await prisma.assessmentSession.create({
    data: { userId: user.id },
    include: {
      scores: true,
      deepDives: true,
      focusPlan: true,
    },
  });

  return NextResponse.json({ user, session: newSession });
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId обязателен" }, { status: 400 });
  }

  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      scores: true,
      deepDives: true,
      focusPlan: true,
      user: true,
    },
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
