"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ASPECTS } from "@/data/aspects";

interface AspectScore {
  aspectCode: string;
  score: number | null;
  tenOfTenText: string | null;
  currentStateText: string | null;
  status: string;
}

interface DeepDive {
  aspectCode: string;
  resultsText: string | null;
  resourcesText: string | null;
  challengesText: string | null;
  indicatorsText: string | null;
}

interface Session {
  id: string;
  createdAt: string;
  scores: AspectScore[];
  deepDives: DeepDive[];
  focusPlan: {
    focusAspects: string;
    targetResult: string | null;
    crossResourcesText: string | null;
    firstStepsText: string | null;
  } | null;
  user: { name: string; email: string };
}

export default function ResultPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Read URL param directly — avoids useSearchParams() hydration issues
    const sidFromUrl = new URLSearchParams(window.location.search).get("sid");

    const loadById = (sid: string) =>
      fetch(`/api/session?sessionId=${sid}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) { router.push("/login"); return; }
          setSession(data);
        });

    if (sidFromUrl) {
      loadById(sidFromUrl);
      return;
    }

    // Fallback: find most recent session via auth cookie
    fetch("/api/session", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/login"); return; }
        loadById(data.session.id);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-sm" style={{ color: "var(--muted)" }}>Загрузка...</div>
      </div>
    );
  }

  const scores = session.scores ?? [];
  const focusAspects: string[] = session.focusPlan
    ? JSON.parse(session.focusPlan.focusAspects)
    : [];

  function getScore(code: string) {
    return scores.find((s) => s.aspectCode === code);
  }

  const sortedScores = ASPECTS.map((a) => ({ aspect: a, score: getScore(a.code)?.score ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const strengths = sortedScores.filter((s) => s.score >= 7).slice(0, 3);
  const attentionZones = sortedScores.filter((s) => s.score <= 4).slice(0, 3);

  const focusAspectObjects = focusAspects.map((code) => ASPECTS.find((a) => a.code === code)).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <header
        className="px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#4F46E5" }}>
            КВС
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Карта воспитательной среды</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/map">
            <button className="text-xs px-3 py-1.5 rounded-lg transition-colors" style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              Вернуться к карте
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-10">
        {/* Hero */}
        <div
          className="p-8 rounded-3xl mb-8 text-center"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            border: "1px solid #4F46E540",
          }}
        >
          <div className="text-4xl mb-3">✦</div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#fff" }}>
            Карта заполнена
          </h1>
          <p style={{ color: "#94a3b8" }}>
            {session.user.name} · {new Date(session.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Score map */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-base font-semibold mb-5" style={{ color: "var(--foreground)" }}>
            Карта оценок
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {ASPECTS.map((asp) => {
              const sc = getScore(asp.code);
              const isFocus = focusAspects.includes(asp.code);

              return (
                <div
                  key={asp.code}
                  className="p-3 rounded-xl relative"
                  style={{
                    background: isFocus ? asp.color + "15" : "var(--surface-2)",
                    border: `1px solid ${isFocus ? asp.color + "60" : "var(--border)"}`,
                  }}
                >
                  {isFocus && (
                    <div
                      className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: asp.color, color: "#fff" }}
                    >
                      фокус
                    </div>
                  )}
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{ color: isFocus ? asp.color : sc?.score !== undefined ? "var(--foreground)" : "var(--muted)" }}
                  >
                    {sc?.score ?? "—"}
                  </div>
                  <div className="text-xs leading-tight" style={{ color: "var(--muted)" }}>
                    {asp.shortTitle}
                  </div>

                  {/* Mini bar */}
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${((sc?.score ?? 0) / 10) * 100}%`,
                        background: asp.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Strengths */}
          {strengths.length > 0 && (
            <div
              className="p-5 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <span style={{ color: "#22c55e" }}>▲</span> Сильные стороны
              </h3>
              {strengths.map(({ aspect, score }) => (
                <div key={aspect.code} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div
                    className="text-lg font-bold w-8 text-center"
                    style={{ color: aspect.color }}
                  >
                    {score}
                  </div>
                  <div className="text-xs" style={{ color: "var(--foreground)" }}>
                    {aspect.shortTitle}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attention zones */}
          {attentionZones.length > 0 && (
            <div
              className="p-5 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <span style={{ color: "#f59e0b" }}>!</span> Зоны внимания
              </h3>
              {attentionZones.map(({ aspect, score }) => (
                <div key={aspect.code} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div
                    className="text-lg font-bold w-8 text-center"
                    style={{ color: "#f59e0b" }}
                  >
                    {score}
                  </div>
                  <div className="text-xs" style={{ color: "var(--foreground)" }}>
                    {aspect.shortTitle}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Focus plan */}
        {session.focusPlan && focusAspectObjects.length > 0 && (
          <div
            className="p-6 rounded-2xl mb-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-base font-semibold mb-5" style={{ color: "var(--foreground)" }}>
              Фокус развития на 2 месяца
            </h2>

            <div className="flex gap-2 flex-wrap mb-5">
              {focusAspectObjects.map((asp) => asp && (
                <div
                  key={asp.code}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: asp.color + "20", color: asp.color, border: `1px solid ${asp.color}40` }}
                >
                  {asp.shortTitle}
                </div>
              ))}
            </div>

            {session.focusPlan.targetResult && (
              <div className="mb-4">
                <div className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>
                  Желаемый результат
                </div>
                <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {session.focusPlan.targetResult}
                </div>
              </div>
            )}

            {session.focusPlan.firstStepsText && (
              <div
                className="p-4 rounded-xl"
                style={{ background: "#4F46E515", border: "1px solid #4F46E530" }}
              >
                <div className="text-xs font-medium mb-2" style={{ color: "#4F46E5" }}>
                  Первые шаги на этой неделе
                </div>
                <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
                  {session.focusPlan.firstStepsText}
                </div>
              </div>
            )}
          </div>
        )}

        {/* New session */}
        <div className="text-center">
          <button
            onClick={() => {
              localStorage.removeItem("sessionId");
              router.push("/");
            }}
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            Начать новое прохождение
          </button>
        </div>
      </main>
    </div>
  );
}
