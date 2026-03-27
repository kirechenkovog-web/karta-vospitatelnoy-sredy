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
  return (
    <div className="flex h-full overflow-hidden">
      <img src="/onboarding/Stsge1.png" alt="Этап 1 — Оценка карты" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }} />
    </div>
  );
}

// ─── Right panel: Stage 2 (grid + edit window) ────────────────────────────────

function PanelStage2() {
  return (
    <div className="flex h-full overflow-hidden">
      <img src="/onboarding/Stage2.png" alt="Этап 2 — Углублённый анализ" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }} />
    </div>
  );
}

// ─── Right panel: Stage 3 (focus + strategy) ─────────────────────────────────

function PanelStage3() {
  return (
    <div className="flex h-full overflow-hidden">
      <img src="/onboarding/Stage3.png" alt="Этап 3 — Фокус и стратегия" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left" }} />
    </div>
  );
}

// ─── Right panel: Ready (result preview) ─────────────────────────────────────

function PanelReady() {
  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-3">
      {/* Hero */}
      <div
        className="rounded-2xl px-5 py-4 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", border: "1px solid #4F46E540" }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-4 h-4 rounded flex items-center justify-center text-xs" style={{ background: "#4F46E5", color: "#fff" }}>✦</div>
          <span className="text-sm font-bold" style={{ color: "#e2e8f0" }}>Карта воспитательной среды</span>
        </div>
        <div className="text-xs font-medium" style={{ color: "#94a3b8" }}>Советник директора</div>
        <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>27 марта 2026</div>
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
    <div className="h-full flex flex-col items-center justify-center px-10 gap-8">
      {/* Title block */}
      <div className="text-center">
        <div className="text-3xl font-bold mb-2 leading-snug" style={{ color: "var(--foreground)" }}>
          Карта воспитательной среды
        </div>
        <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Инструмент самодиагностики для советника директора по воспитанию
        </div>
      </div>

      {/* Stages — 3 in a row */}
      <div className="w-full flex gap-3">
        {[
          { num: "1", t: "Оценка", sub: "12 аспектов работы", c: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" },
          { num: "2", t: "Анализ", sub: "Углублённый разбор", c: "#4F46E5", bg: "#eef2ff", border: "#c7d2fe" },
          { num: "3", t: "Фокус", sub: "План на 2 месяца", c: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
        ].map((s) => (
          <div
            key={s.t}
            className="flex-1 rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
              style={{ background: s.c }}
            >
              {s.num}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: "#111827" }}>{s.t}</div>
              <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Time */}
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--muted)" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        ~20–30 минут
      </div>
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
