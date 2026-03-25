import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generatePassword, sendPasswordEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email обязателен" }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Пользователь с таким email уже зарегистрирован" }, { status: 409 });
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({ data: { email: normalizedEmail, passwordHash } });

  await sendPasswordEmail(normalizedEmail, password, false);

  return NextResponse.json({ ok: true });
}
