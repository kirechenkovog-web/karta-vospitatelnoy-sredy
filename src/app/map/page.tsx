"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ASPECTS } from "@/data/aspects";
import AppShell from "@/components/AppShell";
import StageNav from "@/components/StageNav";
import { useHighlightedElement } from "@/contexts/HighlightContext";

interface AspectScore {
  aspectCode: string;
  score: number | null;
  status: string;
}

interface Session {
  id: string;
  currentStage: number;
  scores: AspectScore[];
  deepDives: { aspectCode: string }[];
}

// ─── Illustrations ────────────────────────────────────────────────────────────

function Illus({ code, active }: { code: string; active: boolean }) {
  return (
    <img
      src={`/illustrations/${code}.png`}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        opacity: active ? 1 : 0.35,
        filter: active ? "none" : "grayscale(0.7)",
        transition: "opacity 0.2s, filter 0.2s",
      }}
    />
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

function AspectCard({ aspect, score, isCompleted }: {
  aspect: typeof ASPECTS[0];
  score: AspectScore | undefined;
  isCompleted: boolean;
}) {
  const { isHighlighted, onInteract } = useHighlightedElement(`aspect-card-${aspect.code}`);

  return (
    <Link href={`/map/${aspect.code}`}>
      <div
        id={`aspect-card-${aspect.code}`}
        onClick={onInteract}
        className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.97] ${isHighlighted ? "ai-highlighted" : ""}`}
        style={{
          background: isCompleted ? aspect.color + "12" : "var(--surface)",
          border: `1px solid ${isCompleted ? aspect.color + "40" : "var(--border)"}`,
          boxShadow: isCompleted ? `0 4px 20px ${aspect.color}20` : "var(--card-shadow)",
          minHeight: 190,
          opacity: isCompleted ? 1 : 0.75,
        }}
      >
        {/* top color line */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: isCompleted ? aspect.color : "transparent" }} />

        {/* score badge */}
        {isCompleted && score?.score != null && (
          <div
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold z-10"
            style={{ background: aspect.color, color: "#fff" }}
          >
            {score.score}
          </div>
        )}

        {/* illustration */}
        <div className="px-4 pt-5 pb-1" style={{ height: 148 }}>
          <Illus code={aspect.code} active={isCompleted} />
        </div>

        {/* label */}
        <div className="px-3 pb-3 text-center">
          <div
            className="text-xs font-medium leading-tight"
            style={{ color: isCompleted ? aspect.color : "var(--muted)" }}
          >
            {aspect.shortTitle}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Map content ─────────────────────────────────────────────────────────────

function MapContent({ session, userName }: { session: Session; userName: string }) {
  const scores = session.scores ?? [];
  const completedCount = scores.filter((s) => s.status === "completed").length;
  const allCompleted = completedCount === 12;
  const canGoStage2 = allCompleted;
  const canGoStage3 = session.deepDives && session.deepDives.length > 0;

  const { isHighlighted: nextStageHighlighted, onInteract: onNextStage } = useHighlightedElement("next-stage-button");

  function getScore(code: string) {
    return scores.find((s) => s.aspectCode === code);
  }

  return (
    <>
      <header className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#4F46E5" }}>
            КВС
          </div>
          <StageNav currentStage={1} canGoStage2={canGoStage2} canGoStage3={canGoStage3} />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm" style={{ color: "var(--muted)" }}>{completedCount}/12 оценено</div>
          <div className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            {userName}
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--foreground)" }}>Этап 1 — Оценка карты</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Оцените каждый аспект по шкале 0–10. Начните с любого.</p>
          </div>
          {allCompleted && (
            <Link href="/stage2">
              <button
                id="next-stage-button"
                onClick={onNextStage}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 text-white ${nextStageHighlighted ? "ai-highlighted" : ""}`}
                style={{ background: "#22c55e" }}
              >
                К этапу 2 →
              </button>
            </Link>
          )}
        </div>

        <div className="mb-5 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 12) * 100}%`, background: "#4F46E5" }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {ASPECTS.map((aspect) => {
            const score = getScore(aspect.code);
            const isCompleted = score?.status === "completed";
            return <AspectCard key={aspect.code} aspect={aspect} score={score} isCompleted={isCompleted} />;
          })}
        </div>
      </main>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.push("/login");
        else setSession(data.session);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-sm" style={{ color: "var(--muted)" }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <AppShell
      sessionId={session.id}
      stage={1}
      autoTrigger="Пользователь открыл главную карту — этап 1. Начни работу."
      header={<div />}
    >
      <MapContent session={session} userName="" />
    </AppShell>
  );
}
