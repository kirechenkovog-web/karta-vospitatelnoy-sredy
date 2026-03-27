"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ASPECTS } from "@/data/aspects";
import ThemeToggle from "@/components/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────

type Experience = "new" | "junior" | "senior" | null;
type Panel = "intro" | "aspects" | "stage2" | "stage3" | "ready";
type Phase = "typing" | "message" | "buttons";

interface StepConfig {
  panel: Panel;
  getMessage: (exp: Experience) => string;
  buttons: { label: string; value: string }[];
}

// ─── Mock data for previews ───────────────────────────────────────────────────

const MOCK_SCORES: Record<string, number> = {
  social_partners: 7, school_active: 6, teachers: 5, students_involvement: 8,
  competitions: 9, federal_events: 4, parents: 7, spaces: 3,
  initiatives_center: 6, collectives: 5, grants: 3, professional_dev: 7,
};

const MOCK_DIVES = ["social_partners", "teachers", "students_involvement", "competitions", "parents", "professional_dev"];

const FIELDS = [
  { key: "resultsText", label: "Результаты", icon: "📈", color: "#22c55e" },
  { key: "resourcesText", label: "Ресурсы", icon: "🔧", color: "#4F46E5" },
  { key: "challengesText", label: "Вызовы", icon: "⚡", color: "#ef4444" },
  { key: "indicatorsText", label: "Индикаторы", icon: "🎯", color: "#f59e0b" },
] as const;

const MOCK_FIELD_DATA: Record<string, string[]> = {
  social_partners: ["resultsText", "resourcesText"],
  teachers: ["resultsText", "challengesText"],
  students_involvement: ["resultsText", "resourcesText", "challengesText", "indicatorsText"],
  competitions: ["resultsText"],
  parents: ["resourcesText", "indicatorsText"],
  professional_dev: ["resultsText", "indicatorsText"],
};

function getScoreColor(score: number) {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#eab308";
  return "#ef4444";
}

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  {
    panel: "intro",
    getMessage: () =>
      `Здравствуйте! Я ваш **AI-наставник**.\n\n**Карта воспитательной среды** — это инструмент самодиагностики для советника директора. Вы оцените 12 аспектов своей работы, найдёте сильные стороны и выберете фокус развития на 2 месяца.\n\nПрохождение займёт около **20–30 минут**.\n\nСколько времени вы уже работаете советником директора по воспитанию?`,
    buttons: [
      { label: "Только начинаю (менее 3 месяцев)", value: "new" },
      { label: "Менее года в роли советника", value: "junior" },
      { label: "Больше года опыта", value: "senior" },
    ],
  },
  {
    panel: "aspects",
    getMessage: (exp) => {
      const intro =
        exp === "new" ? "Отлично, добро пожаловать! Карта поможет вам сразу выстроить системный подход к воспитательной работе."
        : exp === "junior" ? "Хороший момент для анализа — уже есть опыт, можно увидеть реальную картину."
        : "С вашим опытом карта поможет систематизировать то, что уже работает, и найти точки роста.";
      return `${intro}\n\nВот все **12 аспектов** воспитательной среды. На первом этапе вы пройдёте каждый из них вместе со мной — я буду задавать вопросы и помогать сформулировать оценку.`;
    },
    buttons: [{ label: "Понятно, продолжаем →", value: "ok" }],
  },
  {
    panel: "stage2",
    getMessage: () =>
      `После оценки всех аспектов вы перейдёте к **углублённому анализу** — выберете наиболее значимые и опишете по ним четыре ключевых момента:\n\n📈 Что уже достигнуто\n🔧 Какие ресурсы есть\n⚡ Что создаёт трудности\n🎯 Как понять, что стало лучше`,
    buttons: [{ label: "Понятно →", value: "ok" }],
  },
  {
    panel: "stage3",
    getMessage: () =>
      `И финальный шаг — **фокус развития на 2 месяца**. Вы выберете 1–2 аспекта и сформулируете:\n\n🎯 Конкретный желаемый результат\n📋 Первые шаги на ближайшую неделю\n\nКарта превращается в **план действий**.`,
    buttons: [{ label: "Отлично, я готов(а)!", value: "ok" }],
  },
  {
    panel: "ready",
    getMessage: () =>
      `Всё готово! Я буду рядом на каждом шаге — задавать вопросы, помогать формулировать мысли и фиксировать ключевые идеи в заметках.\n\nНачинаем? 🚀`,
    buttons: [{ label: "Перейти к карте →", value: "start" }],
  },
];

// ─── Right panel: Stage 1 (aspect grid) ──────────────────────────────────────

function PanelAspects() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= ASPECTS.length) clearInterval(interval);
    }, 70);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-auto p-4">
      <div className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--muted)" }}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#4F46E5" }}>1</span>
        Этап 1 — Оценка аспектов
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ASPECTS.map((asp, i) => (
          <div
            key={asp.code}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "white",
              border: `2px solid ${asp.color}50`,
              height: 130,
              display: "flex",
              flexDirection: "column",
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.25s ease, transform 0.25s ease",
              boxShadow: `0 2px 8px ${asp.color}15`,
            }}
          >
            <div style={{ height: 2, background: asp.color, flexShrink: 0 }} />
            <div className="px-2.5 pt-1.5 pb-0 font-semibold leading-tight" style={{ color: asp.color, fontSize: 11 }}>
              {asp.shortTitle}
            </div>
            <div style={{ flex: 1, padding: "4px 6px 6px", overflow: "hidden" }}>
              <img
                src={`/illustrations/${asp.code}.png`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Right panel: Stage 2 (compact list + edit window) ────────────────────────

function PanelStage2() {
  const selectedCode = "students_involvement";
  const selectedAsp = ASPECTS.find((a) => a.code === selectedCode)!;

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-3">
      <div className="text-xs font-semibold flex items-center gap-2" style={{ color: "var(--muted)" }}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#4F46E5" }}>2</span>
        Этап 2 — Углублённый анализ
      </div>

      {/* Compact list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
        {ASPECTS.slice(0, 6).map((asp, idx) => {
          const score = MOCK_SCORES[asp.code];
          const scoreColor = getScoreColor(score);
          const isSelected = asp.code === selectedCode;
          const isDived = MOCK_DIVES.includes(asp.code);
          const filledCount = (MOCK_FIELD_DATA[asp.code] ?? []).length;
          return (
            <div key={asp.code} className="flex items-center gap-2 px-3 py-2"
              style={{
                borderBottom: idx < 5 ? "1px solid var(--border)" : "none",
                background: isSelected ? "#4F46E508" : "transparent",
                borderLeft: isSelected ? "3px solid #4F46E5" : "3px solid transparent",
              }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: scoreColor + "20", color: scoreColor }}>{score}</div>
              <div className="flex-1 text-xs font-medium truncate" style={{ color: isSelected ? "#4F46E5" : "var(--foreground)" }}>
                {asp.shortTitle}
              </div>
              <div className="flex gap-0.5 flex-shrink-0">
                {filledCount > 0 && [0,1,2,3].map((fi) => (
                  <div key={fi} className="w-1 h-1 rounded-full" style={{ background: fi < filledCount ? FIELDS[fi].color : "var(--border)" }} />
                ))}
                {isDived && <div className="ml-1 text-xs" style={{ color: "#22c55e" }}>✓</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit window */}
      <div className="rounded-2xl overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: selectedAsp.color + "08" }}>
          <div className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{selectedAsp.shortTitle}</div>
          <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: selectedAsp.color + "20", color: selectedAsp.color }}>
            {MOCK_SCORES[selectedCode]}/10
          </div>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="rounded-xl p-2" style={{ background: f.color + "08", border: `1px solid ${f.color}25` }}>
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
                <span className="text-xs font-semibold" style={{ color: f.color }}>{f.label}</span>
              </div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--muted)", fontSize: 10 }}>
                {(MOCK_FIELD_DATA[selectedCode] ?? []).includes(f.key) ? "Заполнено..." : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Right panel: Stage 3 (focus + strategy) ─────────────────────────────────

function PanelStage3() {
  const focusAspects = ["students_involvement", "competitions"];

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-3">
      <div className="text-xs font-semibold flex items-center gap-2" style={{ color: "var(--muted)" }}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "#4F46E5" }}>3</span>
        Этап 3 — Фокус и стратегия
      </div>

      {/* Focus selector */}
      <div className="p-3 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Шаг 1 — Фокусные аспекты</div>
          <div className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>2/2 выбрано</div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {ASPECTS.map((asp) => {
            const score = MOCK_SCORES[asp.code];
            const scoreColor = getScoreColor(score);
            const isFocus = focusAspects.includes(asp.code);
            const isDived = MOCK_DIVES.includes(asp.code);
            return (
              <div key={asp.code} className="p-2 rounded-xl"
                style={{
                  background: isFocus ? "#4F46E510" : isDived ? "var(--surface-2)" : "transparent",
                  border: isFocus ? "2px solid #4F46E5" : `1px solid ${isDived ? "#4F46E530" : "var(--border)"}`,
                  opacity: !isFocus && !isDived ? 0.5 : 1,
                }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate" style={{ color: isFocus ? "#4F46E5" : "var(--foreground)", fontSize: 10 }}>{asp.shortTitle}</span>
                  <span className="text-xs font-bold ml-1 flex-shrink-0" style={{ color: scoreColor, fontSize: 10 }}>{score}</span>
                </div>
                {isFocus && <div className="text-xs mt-0.5" style={{ color: "#4F46E5", fontSize: 9 }}>✓ выбран</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy cards */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#4F46E515" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4F46E5" strokeWidth="1.5"/><circle cx="8" cy="8" r="3.5" stroke="#4F46E5" strokeWidth="1.5"/><circle cx="8" cy="8" r="1" fill="#4F46E5"/></svg>
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Желаемый результат</div>
            <div className="text-xs" style={{ color: "var(--muted)", fontSize: 10 }}>К маю провести 3 мероприятия…</div>
          </div>
        </div>
        <div className="px-3 py-2.5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#22c55e15" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="#22c55e" strokeWidth="1.5"/><path d="M5 5h6M5 8h6M5 11h4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Первые шаги на неделе</div>
            <div className="text-xs" style={{ color: "var(--muted)", fontSize: 10 }}>1. Составить список… 2. Встреча…</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Right panel: Ready (result preview) ─────────────────────────────────────

function PanelReady() {
  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-3">
      {/* Hero */}
      <div
        className="rounded-2xl p-5 text-center flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "1px solid #4F46E540",
        }}
      >
        <div className="text-2xl mb-1">✦</div>
        <div className="text-base font-bold text-white mb-0.5">Карта заполнена</div>
        <div className="text-xs" style={{ color: "#94a3b8" }}>Так будет выглядеть ваш результат</div>
      </div>

      {/* Score mini-map */}
      <div className="rounded-2xl p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Карта оценок</div>
        <div className="grid grid-cols-3 gap-1.5">
          {ASPECTS.map((asp) => {
            const score = MOCK_SCORES[asp.code];
            const color = getScoreColor(score);
            return (
              <div key={asp.code} className="p-2 rounded-xl flex items-center gap-2 relative" style={{ background: "var(--surface-2)", border: `1px solid var(--border)` }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: color + "20", color }}>{score}</div>
                <div className="text-xs leading-tight truncate" style={{ color: "var(--foreground)", fontSize: 9 }}>{asp.shortTitle}</div>
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: "var(--border)" }}>
                  <div style={{ width: `${(score / 10) * 100}%`, height: "100%", background: color, borderRadius: 9999 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Right panel: Intro ───────────────────────────────────────────────────────

function PanelIntro() {
  return (
    <div
      className="h-full flex flex-col items-center justify-center px-16 gap-10"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)" }}
    >
      {/* Icon */}
      <div style={{ fontSize: 64, color: "#4F46E5", animation: "pulse 2s infinite" }}>✦</div>

      {/* Title block */}
      <div className="text-center">
        <div className="text-4xl font-bold text-white mb-3">Карта воспитательной среды</div>
        <div className="text-lg" style={{ color: "#94a3b8" }}>
          Инструмент самодиагностики для советника директора по воспитанию
        </div>
      </div>

      {/* Stages */}
      <div className="flex gap-4">
        {[
          { t: "Оценка", sub: "12 аспектов работы", c: "#22c55e" },
          { t: "Анализ", sub: "Углублённый разбор", c: "#4F46E5" },
          { t: "Фокус", sub: "План на 2 месяца", c: "#f59e0b" },
        ].map((s) => (
          <div
            key={s.t}
            className="flex-1 rounded-2xl px-5 py-4 flex flex-col gap-1"
            style={{ background: s.c + "18", border: `1px solid ${s.c}40` }}
          >
            <div className="text-xs font-semibold" style={{ color: s.c }}>{s.t}</div>
            <div className="text-sm text-white">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Time estimate */}
      <div className="text-sm" style={{ color: "#94a3b8" }}>~20–30 минут</div>
    </div>
  );
}

function RightPanel({ panel }: { panel: Panel }) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col" style={{ background: "var(--surface-2)", borderLeft: "1px solid var(--border)" }}>
      {panel === "intro" && <PanelIntro />}
      {panel === "aspects" && <PanelAspects />}
      {panel === "stage2" && <PanelStage2 />}
      {panel === "stage3" && <PanelStage3 />}
      {panel === "ready" && <PanelReady />}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [experience, setExperience] = useState<Experience>(null);
  const [phase, setPhase] = useState<Phase>("typing");
  const [panelKey, setPanelKey] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const step = STEPS[stepIndex];

  useEffect(() => {
    setPhase("typing");
    const t1 = setTimeout(() => setPhase("message"), 1300);
    const t2 = setTimeout(() => setPhase("buttons"), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stepIndex]);

  const markDone = useCallback(async () => {
    setFinishing(true);
    await fetch("/api/onboarding", { method: "POST" });
    sessionStorage.setItem("onboardingShown", "1");
    router.push("/map");
  }, [router]);

  const handleButton = useCallback(async (value: string) => {
    if (stepIndex === 0) setExperience(value as Experience);
    if (stepIndex === STEPS.length - 1 || value === "start") {
      await markDone();
      return;
    }
    setPanelKey((k) => k + 1);
    setStepIndex((i) => i + 1);
  }, [stepIndex, markDone]);

  const message = step.getMessage(experience);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#4F46E5" }}>КВС</div>
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Карта воспитательной среды</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={markDone}
            disabled={finishing}
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            Пропустить →
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — AI chat */}
        <div className="flex-shrink-0 flex flex-col" style={{ width: 420, background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
          <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#4F46E520", color: "#4F46E5" }}>✦</div>
            <div>
              <div className="font-semibold" style={{ color: "var(--foreground)", fontSize: 14 }}>AI-наставник</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{phase === "typing" ? "Печатает..." : "Знакомство"}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {phase === "typing" && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#4F46E520", color: "#4F46E5", fontSize: 12 }}>✦</div>
                <div className="px-3 py-2.5 rounded-xl flex items-center gap-1.5" style={{ background: "var(--surface-2)", fontSize: 16 }}>
                  <span className="animate-pulse" style={{ color: "#4F46E5" }}>●</span>
                  <span className="animate-pulse" style={{ color: "#4F46E5", animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ color: "#4F46E5", animationDelay: "0.4s" }}>●</span>
                </div>
              </div>
            )}

            {(phase === "message" || phase === "buttons") && (
              <div className="flex items-start gap-2" style={{ animation: "fadeIn 0.3s ease" }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#4F46E520", color: "#4F46E5", fontSize: 12 }}>✦</div>
                <div className="px-3 py-2.5 ai-message-bubble leading-relaxed"
                  style={{ background: "var(--surface-2)", color: "var(--foreground)", fontSize: 14, borderRadius: "4px 14px 14px 14px", maxWidth: "85%" }}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: "0 0 6px 0" }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                    }}
                  >
                    {message}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {phase === "buttons" && (
              <div className="flex flex-col gap-2 pl-8" style={{ animation: "fadeIn 0.3s ease" }}>
                {step.buttons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleButton(btn.value)}
                    disabled={finishing}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "#4F46E515", color: "#4F46E5", border: "1px solid #4F46E540", cursor: "pointer" }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="px-4 py-3 flex items-center justify-center gap-1.5 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            {STEPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all duration-300"
                style={{ width: i === stepIndex ? 20 : 6, height: 6, background: i <= stepIndex ? "#4F46E5" : "var(--border)" }} />
            ))}
          </div>
        </div>

        {/* Right — visual panel */}
        <div key={`${panelKey}-${step.panel}`} className="flex-1 overflow-hidden" style={{ animation: "fadeIn 0.4s ease" }}>
          <RightPanel panel={step.panel} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
