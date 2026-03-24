"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Пожалуйста, введите имя и email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("sessionId", data.session.id);
      localStorage.setItem("userName", data.user.name);
      router.push("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка соединения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <header
        className="px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#3b82f6" }}
          >
            КВС
          </div>
          <span className="font-semibold" style={{ color: "var(--foreground)" }}>
            Карта воспитательной среды
          </span>
        </div>
        <div
          className="text-xs px-3 py-1 rounded-full"
          style={{
            background: "var(--surface)",
            color: "var(--muted)",
            border: "1px solid var(--border)",
          }}
        >
          Навигаторы детства
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {!showLogin ? (
          <div className="max-w-3xl w-full text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
              style={{
                background: "var(--surface)",
                color: "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Инструмент самодиагностики
            </div>

            <h1
              className="text-5xl font-bold mb-6 leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              Карта воспитательной{" "}
              <span style={{ color: "#3b82f6" }}>среды</span>
            </h1>

            <p
              className="text-lg mb-12"
              style={{ color: "var(--muted)", maxWidth: 540, margin: "0 auto 48px" }}
            >
              Цифровой инструмент для советника директора по воспитанию. Помогает увидеть
              картину воспитательной среды целиком и выбрать фокус развития.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-12 text-left">
              {[
                {
                  num: "01",
                  title: "Оцените 12 аспектов",
                  desc: "Поставьте балл от 0 до 10 по каждому аспекту воспитательной среды вашей школы",
                },
                {
                  num: "02",
                  title: "Углубите анализ",
                  desc: "Опишите результаты, ресурсы, вызовы и индикаторы для значимых аспектов",
                },
                {
                  num: "03",
                  title: "Выберите фокус",
                  desc: "Определите 1–2 аспекта для развития на ближайшие 2 месяца",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="p-5 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="text-xs font-mono mb-3" style={{ color: "#3b82f6" }}>
                    {step.num}
                  </div>
                  <div
                    className="font-semibold mb-2 text-sm"
                    style={{ color: "var(--foreground)" }}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setShowLogin(true)}
                className="px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:opacity-90 active:scale-95 text-white"
                style={{ background: "#3b82f6" }}
              >
                Начать оценку
              </button>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Около 30–45 минут · Прогресс сохраняется автоматически
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <button
              onClick={() => setShowLogin(false)}
              className="flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-70"
              style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
            >
              ← Назад
            </button>

            <div
              className="p-8 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                Начать работу
              </h2>
              <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
                Введите своё имя и email. Если вы уже начинали заполнять карту — мы
                восстановим прогресс.
              </p>

              <form onSubmit={handleStart} className="flex flex-col gap-4">
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "var(--muted)" }}
                  >
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Например: Анна Петрова"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "var(--muted)" }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.ru"
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                {error && (
                  <p className="text-sm" style={{ color: "#ef4444" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2 text-white"
                  style={{ background: "#3b82f6" }}
                >
                  {loading ? "Загрузка..." : "Продолжить →"}
                </button>
              </form>

              <p className="text-xs text-center mt-4" style={{ color: "var(--muted)" }}>
                На этапе MVP вход без пароля
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
