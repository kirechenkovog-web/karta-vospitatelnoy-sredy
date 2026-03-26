"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка регистрации");
        setStatus("error");
      } else {
        setStatus("done");
      }
    } catch {
      setError("Ошибка соединения");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: "#22c55e20" }}>✓</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Готово!</h1>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
            Пароль отправлен на <strong style={{ color: "var(--foreground)" }}>{email}</strong>.
            Проверьте почту и войдите в систему.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#4F46E5" }}
          >
            Перейти ко входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#4F46E520", color: "#4F46E5", fontSize: 24 }}>✦</div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Регистрация</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Пароль придёт на указанный email</p>
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

          {(status === "error") && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ background: "#4F46E5" }}
          >
            {status === "loading" ? "Отправляем..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center" style={{ color: "var(--muted)" }}>
          Уже есть аккаунт?{" "}
          <Link href="/login" style={{ color: "#4F46E5" }}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
