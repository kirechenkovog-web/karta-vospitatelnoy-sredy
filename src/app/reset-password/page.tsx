"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
    } finally {
      // Always show success to not leak which emails are registered
      setStatus("done");
    }
  }

  if (status === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: "#3b82f620" }}>✉️</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Письмо отправлено</h1>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
            Если этот email зарегистрирован в системе, новый пароль придёт в течение нескольких минут.
          </p>
          <Link href="/login">
            <button className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: "#3b82f6" }}>
              Вернуться ко входу
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#3b82f620", color: "#3b82f6", fontSize: 24 }}>✦</div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Восстановление пароля</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Новый пароль придёт на ваш email</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.ru"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ background: "#3b82f6" }}
          >
            {status === "loading" ? "Отправляем..." : "Получить новый пароль"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          <Link href="/login" style={{ color: "#3b82f6" }}>← Вернуться ко входу</Link>
        </p>
      </div>
    </div>
  );
}
