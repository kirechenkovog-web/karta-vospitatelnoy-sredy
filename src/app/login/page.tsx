"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Неверный email или пароль");
      } else {
        router.push("/map");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#3b82f620", color: "#3b82f6", fontSize: 24 }}>✦</div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>Вход в систему</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Карта воспитательной среды</p>
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
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Из письма на email"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ background: "#3b82f6" }}
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-center">
          <Link href="/reset-password" className="text-sm" style={{ color: "#3b82f6" }}>
            Забыли пароль?
          </Link>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Нет аккаунта?{" "}
            <Link href="/register" style={{ color: "#3b82f6" }}>
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
