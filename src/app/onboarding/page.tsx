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

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  {
    panel: "intro",
    getMessage: () =>
      `Здравствуйте! Я ваш **AI-наставник**.\n\n**Карта воспитательной среды** — это инструмент самодиагностики для советника директора. Вы оцените 12 аспектов своей работы, найдёте сильные стороны и выберете фокус развития на 2 месяца.\n\nПрохождение займёт около **20–30 минут**.\n\nДля начала — расскажите о себе:`,
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
        exp === "new"
          ? "Отлично, добро пожаловать! Карта поможет вам сразу выстроить системный подход к воспитательной работе."
          : exp === "junior"
          ? "Хороший момент для анализа — уже есть опыт, можно увидеть реальную картину."
          : "С вашим опытом карта поможет систематизировать то, что уже работает, и найти точки роста.";
      return `${intro}\n\nВот все **12 аспектов** воспитательной среды — мы пройдём каждый из них вместе. Это всё, что важно для советника: от работы с учениками и педагогами до профессионального развития.`;
    },
    buttons: [{ label: "Понятно, продолжаем →", value: "ok" }],
  },
  {
    panel: "stage2",
    getMessage: () =>
      `После оценки всех аспектов вы перейдёте к **углублённому анализу** — выберете наиболее значимые и опишете по ним ключевые моменты:\n\n📈 Что уже достигнуто\n🔧 Какие ресурсы есть\n⚡ Что создаёт трудности\n🎯 Как понять, что стало лучше`,
    buttons: [{ label: "Понятно →", value: "ok" }],
  },
  {
    panel: "stage3",
    getMessage: () =>
      `И финальный шаг — **фокус развития на 2 месяца**. Вы выберете 1–2 аспекта, сформулируете конкретный желаемый результат и первые шаги на ближайшую неделю.\n\nКарта превращается в **план действий**.`,
    buttons: [{ label: "Отлично, я готов(а)!", value: "ok" }],
  },
  {
    panel: "ready",
    getMessage: () =>
      `Всё готово! Я буду рядом на каждом шаге — задавать вопросы, помогать формулировать мысли и фиксировать ключевые идеи в заметках.\n\nНачинаем? 🚀`,
    buttons: [{ label: "Перейти к карте →", value: "start" }],
  },
];

// ─── Right panel components ───────────────────────────────────────────────────

function PanelIntro() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-12">
      <div
        className="w-full max-w-md rounded-3xl p-10 text-center flex flex-col items-center gap-5"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "1px solid #4F46E540",
        }}
      >
        <div className="text-5xl animate-pulse" style={{ color: "#4F46E5" }}>✦</div>
        <div>
          <div className="text-2xl font-bold text-white mb-2">Карта воспитательной среды</div>
          <div className="text-sm" style={{ color: "#94a3b8" }}>12 аспектов · 3 этапа · 20–30 минут</div>
        </div>
        <div className="flex gap-3">
          {["Оценка", "Анализ", "Фокус"].map((label, i) => (
            <div
              key={i}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{ background: ["#22c55e40", "#4F46E540", "#f59e0b40"][i], border: `1px solid ${["#22c55e60", "#4F46E560", "#f59e0b60"][i]}` }}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelAspects() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= ASPECTS.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full p-6 overflow-auto">
      <div className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--muted)" }}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#4F46E5" }}>1</span>
        Этап 1 — Оценка аспектов
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ASPECTS.map((asp, i) => (
          <div
            key={asp.code}
            className="rounded-xl p-3 transition-all duration-300"
            style={{
              background: i < visibleCount ? asp.color + "15" : "var(--surface-2)",
              border: `1px solid ${i < visibleCount ? asp.color + "50" : "var(--border)"}`,
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <div className="w-3 h-3 rounded-full mb-1.5" style={{ background: asp.color }} />
            <div className="text-xs font-medium leading-tight" style={{ color: "var(--foreground)" }}>
              {asp.shortTitle}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelStage2() {
  const preview = ASPECTS.slice(0, 3);
  const fields = [
    { label: "Результаты", icon: "📈", color: "#22c55e" },
    { label: "Ресурсы", icon: "🔧", color: "#4F46E5" },
    { label: "Вызовы", icon: "⚡", color: "#ef4444" },
    { label: "Индикаторы", icon: "🎯", color: "#f59e0b" },
  ];

  return (
    <div className="flex flex-col h-full p-6 overflow-auto">
      <div className="text-xs font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--muted)" }}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#4F46E5" }}>2</span>
        Этап 2 — Углублённый анализ
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {fields.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: f.color + "15", border: `1px solid ${f.color}30`, color: f.color }}
          >
            <span>{f.icon}</span>
            {f.label}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {preview.map((asp) => (
          <div
            key={asp.code}
            className="p-3 rounded-xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="text-xs font-semibold mb-2" style={{ color: asp.color }}>{asp.shortTitle}</div>
            <div className="flex gap-1.5 flex-wrap">
              {fields.map((f) => (
                <div
                  key={f.label}
                  className="px-2 py-0.5 rounded-md text-xs"
                  style={{ background: f.color + "10", color: f.color, border: `1px solid ${f.color}20` }}
                >
                  {f.icon} {f.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelStage3() {
  const focusAspects = [ASPECTS[0], ASPECTS[2]];

  return (
    <div className="flex flex-col h-full p-6 overflow-auto">
      <div className="text-xs font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--muted)" }}>
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#4F46E5" }}>3</span>
        Этап 3 — Фокус развития
      </div>
      <div className="p-4 rounded-2xl mb-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Фокус на 2 месяца</div>
        <div className="flex gap-2 flex-wrap mb-3">
          {focusAspects.map((asp) => (
            <div
              key={asp.code}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: asp.color + "20", color: asp.color, border: `1px solid ${asp.color}40` }}
            >
              {asp.shortTitle}
            </div>
          ))}
        </div>
        <div className="text-xs rounded-lg p-2.5 mb-2" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
          🎯 Желаемый результат через 2 месяца...
        </div>
        <div className="text-xs rounded-lg p-2.5" style={{ background: "#4F46E510", color: "#4F46E5", border: "1px solid #4F46E530" }}>
          📋 Первые шаги на этой неделе...
        </div>
      </div>
      <div
        className="p-4 rounded-2xl text-center"
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: "1px solid #4F46E540",
        }}
      >
        <div className="text-xs text-white opacity-80">Карта превращается в</div>
        <div className="text-sm font-bold text-white mt-1">план действий</div>
      </div>
    </div>
  );
}

function PanelReady() {
  const stages = [
    { num: 1, label: "Оценка 12 аспектов", color: "#22c55e" },
    { num: 2, label: "Углублённый анализ", color: "#4F46E5" },
    { num: 3, label: "Фокус развития", color: "#f59e0b" },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full p-10 gap-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-3">
          {stages.map((s, i) => (
            <div key={s.num} className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: s.color }}
              >
                {s.num}
              </div>
              <div className="flex-1 h-px" style={{ background: s.color + "30" }} />
              <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div
          className="mt-6 p-4 rounded-2xl text-center"
          style={{ background: "#4F46E510", border: "1px solid #4F46E530" }}
        >
          <div className="text-sm font-semibold" style={{ color: "#4F46E5" }}>
            ✦ AI-наставник рядом на каждом шаге
          </div>
        </div>
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

  // Animate message appearance when step or phase resets
  useEffect(() => {
    setPhase("typing");
    const t1 = setTimeout(() => setPhase("message"), 1300);
    const t2 = setTimeout(() => setPhase("buttons"), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stepIndex]);

  const markDone = useCallback(async () => {
    setFinishing(true);
    await fetch("/api/onboarding", { method: "POST" });
    router.push("/map");
  }, [router]);

  const handleButton = useCallback(async (value: string) => {
    if (stepIndex === 0) {
      setExperience(value as Experience);
    }
    if (stepIndex === STEPS.length - 1 || value === "start") {
      await markDone();
      return;
    }
    setPanelKey((k) => k + 1);
    setStepIndex((i) => i + 1);
  }, [stepIndex, markDone]);

  const handleSkip = useCallback(async () => {
    await markDone();
  }, [markDone]);

  const message = step.getMessage(experience);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "#4F46E5" }}
          >
            КВС
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Карта воспитательной среды
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={handleSkip}
            disabled={finishing}
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            Пропустить инструктаж →
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — AI chat */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{ width: 420, background: "var(--surface)", borderRight: "1px solid var(--border)" }}
        >
          {/* AI header */}
          <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#4F46E520", color: "#4F46E5" }}
            >
              ✦
            </div>
            <div>
              <div className="font-semibold" style={{ color: "var(--foreground)", fontSize: 14 }}>AI-наставник</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                {phase === "typing" ? "Печатает..." : "Знакомство"}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Typing indicator */}
            {phase === "typing" && (
              <div className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: "#4F46E520", color: "#4F46E5", fontSize: 12 }}
                >
                  ✦
                </div>
                <div className="px-3 py-2.5 rounded-xl flex items-center gap-1.5" style={{ background: "var(--surface-2)", fontSize: 16 }}>
                  <span className="animate-pulse" style={{ color: "#4F46E5" }}>●</span>
                  <span className="animate-pulse" style={{ color: "#4F46E5", animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ color: "#4F46E5", animationDelay: "0.4s" }}>●</span>
                </div>
              </div>
            )}

            {/* Message */}
            {(phase === "message" || phase === "buttons") && (
              <div className="flex items-start gap-2" style={{ animation: "fadeIn 0.3s ease" }}>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#4F46E520", color: "#4F46E5", fontSize: 12 }}
                >
                  ✦
                </div>
                <div
                  className="px-3 py-2.5 ai-message-bubble leading-relaxed"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--foreground)",
                    fontSize: 14,
                    borderRadius: "4px 14px 14px 14px",
                    maxWidth: "85%",
                  }}
                >
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

            {/* Buttons */}
            {phase === "buttons" && (
              <div className="flex flex-col gap-2 pl-8" style={{ animation: "fadeIn 0.3s ease" }}>
                {step.buttons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleButton(btn.value)}
                    disabled={finishing}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all hover:opacity-80 disabled:opacity-50"
                    style={{
                      background: "#4F46E515",
                      color: "#4F46E5",
                      border: "1px solid #4F46E540",
                      cursor: "pointer",
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress dots */}
          <div className="px-4 py-3 flex items-center justify-center gap-1.5 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === stepIndex ? 20 : 6,
                  height: 6,
                  background: i <= stepIndex ? "#4F46E5" : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Right — visual panel */}
        <div key={`${panelKey}-${step.panel}`} className="flex-1 overflow-hidden" style={{ animation: "fadeIn 0.4s ease" }}>
          <RightPanel panel={step.panel} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
