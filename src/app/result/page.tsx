"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ASPECTS } from "@/data/aspects";
import { FieldIcon, type FieldKey } from "@/components/FieldIcons";

interface NoteItem { type: "heading" | "bullet" | "quote"; text: string; }

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

function getScoreColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#eab308";
  return "#ef4444";
}

function parseSavedNotes(tenOfTenText: string | null | undefined): NoteItem[] {
  if (!tenOfTenText) return [];
  try {
    const parsed = JSON.parse(tenOfTenText);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const filled = (score / 10) * circ;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <circle cx="32" cy="32" r={r} fill="none" stroke={color + "25"} strokeWidth="4.5" />
      <circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4.5"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="28" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{score}</text>
      <text x="32" y="41" textAnchor="middle" fontSize="9" fill={color + "99"}>из 10</text>
    </svg>
  );
}

const DEEP_FIELDS = [
  { key: "resultsText" as const, label: "Результаты", color: "#22c55e" },
  { key: "resourcesText" as const, label: "Ресурсы", color: "#4F46E5" },
  { key: "challengesText" as const, label: "Вызовы", color: "#ef4444" },
  { key: "indicatorsText" as const, label: "Индикаторы достижения цели", color: "#f59e0b" },
];

export default function ResultPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
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

  function getDeepDive(code: string) {
    return session!.deepDives?.find((dd) => dd.aspectCode === code);
  }

  function parseJsonMap(s: string | null): Record<string, string> {
    if (!s) return {};
    try {
      const p = JSON.parse(s);
      return typeof p === "object" && !Array.isArray(p) ? p : {};
    } catch {
      return {};
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header className="px-8 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-8">

        {/* Compact hero */}
        <div
          className="px-6 py-5 rounded-2xl mb-6"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", border: "1px solid #4F46E540" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs" style={{ background: "#4F46E5", color: "#fff" }}>✦</div>
            <span className="text-base font-bold" style={{ color: "#e2e8f0" }}>Карта воспитательной среды</span>
          </div>
          <div className="text-sm font-medium" style={{ color: "#94a3b8" }}>{session.user.name}</div>
          <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>
            {new Date(session.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Score map */}
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--foreground)" }}>Карта оценок</h2>
          <div className="grid grid-cols-3 gap-2">
            {ASPECTS.map((asp) => {
              const sc = getScore(asp.code);
              const scoreNum = sc?.score ?? null;
              const isFocus = focusAspects.includes(asp.code);
              const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : "var(--muted)";

              return (
                <div
                  key={asp.code}
                  className="p-3 rounded-xl relative flex items-center gap-3"
                  style={{
                    background: isFocus ? scoreColor + "10" : "var(--surface)",
                    border: `1px solid ${isFocus ? scoreColor + "50" : "var(--border)"}`,
                    boxShadow: isFocus ? `0 2px 8px ${scoreColor}20` : "none",
                  }}
                >
                  {/* Score indicator */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: scoreColor + "20", color: scoreColor }}
                  >
                    {scoreNum ?? "—"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium leading-tight truncate" style={{ color: "var(--foreground)" }}>
                      {asp.shortTitle}
                    </div>
                    {isFocus && (
                      <div className="text-xs mt-0.5" style={{ color: scoreColor }}>фокус</div>
                    )}
                  </div>
                  {/* Mini progress bar */}
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${((scoreNum ?? 0) / 10) * 100}%`, background: scoreColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus plan — per-aspect */}
        {session.focusPlan && focusAspects.length > 0 && (() => {
          const targetMap = parseJsonMap(session.focusPlan!.targetResult);
          const stepsMap = parseJsonMap(session.focusPlan!.firstStepsText);
          return (
            <div className="mb-6">
              <h2 className="text-base font-semibold mb-3" style={{ color: "var(--foreground)" }}>Фокус развития на 2 месяца</h2>
              <div className="flex flex-col gap-3">
                {focusAspects.map((code) => {
                  const asp = ASPECTS.find((a) => a.code === code);
                  if (!asp) return null;
                  const sc = getScore(code);
                  const scoreNum = sc?.score ?? null;
                  const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : asp.color;
                  const target = targetMap[code] || session.focusPlan!.targetResult;
                  const steps = stepsMap[code] || session.focusPlan!.firstStepsText;
                  return (
                    <div key={code} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: `1px solid ${scoreColor}40` }}>
                      <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: scoreColor + "08" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: scoreColor + "20", color: scoreColor }}>
                          {scoreNum ?? "—"}
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{asp.title}</div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>Фокусный аспект</div>
                        </div>
                      </div>
                      <div className="px-5 py-4 flex flex-col gap-3">
                        {target && (
                          <div>
                            <div className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Желаемый результат</div>
                            <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{target}</div>
                          </div>
                        )}
                        {steps && (
                          <div className="p-3 rounded-xl" style={{ background: "#4F46E508", border: "1px solid #4F46E525" }}>
                            <div className="text-xs font-semibold mb-1" style={{ color: "#4F46E5" }}>Первые шаги</div>
                            <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{steps}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Per-aspect detail */}
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--foreground)" }}>Детали по аспектам</h2>
        <div className="flex flex-col gap-4 mb-8">
          {ASPECTS.map((asp) => {
            const sc = getScore(asp.code);
            const scoreNum = sc?.score ?? null;
            const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : "var(--muted)";
            const isFocus = focusAspects.includes(asp.code);
            const dd = getDeepDive(asp.code);
            const notes = parseSavedNotes(sc?.tenOfTenText);
            const hasAnyData = notes.length > 0 || dd;

            return (
              <div
                key={asp.code}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${isFocus ? scoreColor + "50" : "var(--border)"}`,
                  boxShadow: isFocus ? `0 2px 12px ${scoreColor}15` : "none",
                }}
              >
                {/* Aspect header */}
                <div className="flex items-start gap-4 p-4" style={{ borderBottom: hasAnyData ? "1px solid var(--border)" : "none" }}>
                  {/* Illustration */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: asp.color + "10" }}>
                    <img
                      src={`/illustrations/square/${asp.code}.png`}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  {/* Title + description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        {isFocus && (
                          <div className="inline-block text-xs px-2 py-0.5 rounded-full mb-1 font-medium" style={{ background: scoreColor + "20", color: scoreColor }}>
                            фокус
                          </div>
                        )}
                        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{asp.title}</h3>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{asp.description}</p>
                      </div>
                      {scoreNum !== null && <ScoreCircle score={scoreNum} color={scoreColor} />}
                    </div>
                  </div>
                </div>

                {/* Data section */}
                {hasAnyData && (
                  <div className="px-4 pb-4 pt-3 flex flex-col gap-3">
                    {/* AI notes from stage 1 */}
                    {notes.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold mb-1.5" style={{ color: "#4F46E5" }}>✦ Заметки</div>
                        <div className="space-y-1">
                          {notes.map((note, i) => {
                            if (note.type === "heading") {
                              return <div key={i} className="text-xs font-semibold pt-1" style={{ color: "var(--foreground)" }}>{note.text}</div>;
                            }
                            if (note.type === "quote") {
                              return (
                                <div key={i} className="text-xs pl-3 italic" style={{ color: "var(--muted)", borderLeft: "2px solid #4F46E560" }}>
                                  «{note.text}»
                                </div>
                              );
                            }
                            return (
                              <div key={i} className="text-xs flex gap-1.5" style={{ color: "var(--foreground)" }}>
                                <span style={{ color: "#4F46E5", flexShrink: 0 }}>•</span>
                                <span>{note.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Deep dive fields from stage 2 */}
                    {dd && (
                      <div className="grid grid-cols-2 gap-2">
                        {DEEP_FIELDS.map((f) => {
                          const val = dd[f.key];
                          if (!val) return null;
                          return (
                            <div key={f.key} className="rounded-xl p-3" style={{ background: f.color + "08", border: `1px solid ${f.color}25` }}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <FieldIcon fieldKey={f.key as FieldKey} color={f.color} size={13} />
                                <span className="text-xs font-semibold" style={{ color: f.color }}>{f.label}</span>
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{val}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* New session */}
        <div className="text-center pb-4">
          <button
            onClick={() => router.push("/map?new=1")}
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
