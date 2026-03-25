import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generatePassword, sendPasswordEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email обязателен" }, { status: 400 });

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  // Always respond OK to not leak which emails are registered
  if (!user) return NextResponse.json({ ok: true });

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await sendPasswordEmail(normalizedEmail, password, true);

  return NextResponse.json({ ok: true });
}
