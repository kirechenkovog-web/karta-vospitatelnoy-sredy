"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ASPECTS, getAspect } from "@/data/aspects";
import AppShell from "@/components/AppShell";
import StageNav from "@/components/StageNav";
import { useHighlightedElement } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";

interface NoteItem { type: "heading" | "bullet" | "quote"; text: string; }

interface AspectScore {
  aspectCode: string;
  score: number | null;
  tenOfTenText: string | null;
  currentStateText: string | null;
  status: string;
}

interface Session {
  id: string;
  currentStage: number;
  scores: AspectScore[];
  deepDives: { aspectCode: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Score circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score, color }: { score: number; color: string }) {
  const r = 21;
  const circ = 2 * Math.PI * r;
  const filled = (score / 10) * circ;
  return (
    <svg width="58" height="58" viewBox="0 0 58 58" style={{ flexShrink: 0 }}>
      <circle cx="29" cy="29" r={r} fill="none" stroke={color + "25"} strokeWidth="4" />
      <circle
        cx="29" cy="29" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 29 29)"
      />
      <text x="29" y="25" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>{score}</text>
      <text x="29" y="37" textAnchor="middle" fontSize="9" fill={color + "99"}>из 10</text>
    </svg>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function AspectCard({ aspect, score, isCompleted, onClick }: {
  aspect: typeof ASPECTS[0];
  score: AspectScore | undefined;
  isCompleted: boolean;
  onClick: () => void;
}) {
  const { isHighlighted, onInteract } = useHighlightedElement(`aspect-card-${aspect.code}`);

  return (
    <div
      id={`aspect-card-${aspect.code}`}
      onClick={() => { onInteract(); onClick(); }}
      className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.97] ${isHighlighted ? "ai-highlighted" : ""}`}
      style={{
        background: "white",
        border: `2px solid ${isCompleted ? aspect.color + "80" : "var(--border)"}`,
        boxShadow: isCompleted ? `0 4px 16px ${aspect.color}25` : "var(--card-shadow)",
        height: 170,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: isCompleted ? aspect.color : "transparent" }} />

      <div className="flex items-start justify-between px-3 pt-2" style={{ minHeight: 60 }}>
        <div
          className="font-semibold leading-snug pr-2 pt-1"
          style={{ color: isCompleted ? aspect.color : "var(--foreground)", fontSize: 15, maxWidth: "62%" }}
        >
          {aspect.shortTitle}
        </div>
        {isCompleted && score?.score != null && (
          <ScoreCircle score={score.score} color={getScoreColor(score.score)} />
        )}
      </div>

      <div className="flex-1 px-2 pb-2" style={{ overflow: "hidden" }}>
        <img
          src={`/illustrations/${aspect.code}.png`}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }}
        />
      </div>
    </div>
  );
}

// ─── Notes display ────────────────────────────────────────────────────────────

function NotesList({ notes }: { notes: NoteItem[] }) {
  if (!notes.length) return null;
  return (
    <div className="mt-4 space-y-1.5">
      {notes.map((note, i) => {
        if (note.type === "heading") {
          return (
            <div key={i} className="text-xs font-semibold pt-2 first:pt-0" style={{ color: "var(--foreground)" }}>
              {note.text}
            </div>
          );
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
  );
}

// ─── Inline Aspect View ───────────────────────────────────────────────────────

function InlineAspectView({
  code,
  sessionId,
  initialScore,
  suggestedScore,
  aiNotes,
  onClose,
  onSaved,
}: {
  code: string;
  sessionId: string;
  initialScore: AspectScore | undefined;
  suggestedScore: number | null;
  aiNotes: NoteItem[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const aspect = getAspect(code)!;
  const { sendEvent } = useAiEvent();
  const { isHighlighted: scoreSelectorH, onInteract: onScoreInteract } = useHighlightedElement("score-selector");
  const { isHighlighted: saveH, onInteract: onSaveInteract } = useHighlightedElement("save-button");

  const savedNotes = useMemo(() => parseSavedNotes(initialScore?.tenOfTenText), [initialScore?.tenOfTenText]);
  const allNotes = [...savedNotes, ...aiNotes];

  const [score, setScore] = useState<number | null>(initialScore?.score ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Apply AI-suggested score (always — user can click to override)
  useEffect(() => {
    if (suggestedScore !== null) {
      setScore(suggestedScore);
    }
  }, [suggestedScore]);

  async function handleSave() {
    if (score === null) return;
    setSaving(true);
    onSaveInteract();
    try {
      await fetch("/api/aspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          aspectCode: code,
          score,
          tenOfTenText: allNotes.length > 0 ? JSON.stringify(allNotes) : null,
          currentStateText: null,
        }),
      });
      setSaved(true);
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-6">
      {/* Back */}
      <button
        onClick={onClose}
        className="text-xs mb-5 flex items-center gap-1 transition-opacity hover:opacity-70"
        style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
      >
        ← Назад к карте
      </button>

      {/* Header */}
      <div className="mb-5">
        <div
          className="inline-block text-xs px-3 py-1 rounded-full mb-2 font-medium"
          style={{ background: aspect.color + "20", color: aspect.color }}
        >
          {aspect.shortTitle}
        </div>
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>{aspect.title}</h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{aspect.description}</p>
      </div>

      {/* Score */}
      <div
        id="score-selector"
        className={`p-5 rounded-2xl mb-4 transition-all ${scoreSelectorH ? "ai-highlighted" : ""}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
      >
        <div className="text-sm font-medium mb-3 flex items-center justify-between" style={{ color: "var(--foreground)" }}>
          <span>Ваша оценка</span>
          {suggestedScore !== null && score === suggestedScore && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#4F46E515", color: "#4F46E5" }}>
              предложено ИИ
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap" onClick={onScoreInteract}>
          {Array.from({ length: 11 }, (_, i) => i).map((n) => {
            const c = getScoreColor(n || 1);
            return (
              <button
                key={n}
                onClick={() => {
                  setScore(n);
                  onScoreInteract();
                  sendEvent(`[СОБЫТИЕ: Пользователь выставил оценку ${n}/10 по аспекту «${aspect.title}»]`);
                }}
                className="w-10 h-10 rounded-xl text-sm font-semibold transition-all hover:scale-110 active:scale-95"
                style={{
                  background: score === n ? c : "var(--surface-2)",
                  color: score === n ? "#fff" : "var(--muted)",
                  border: score === n ? `2px solid ${c}` : "1px solid var(--border)",
                }}
              >
                {n}
              </button>
            );
          })}
        </div>
        {score !== null && (
          <div className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            {score <= 3 && "Требует значительного внимания"}
            {score >= 4 && score <= 6 && "Есть база, но есть потенциал для роста"}
            {score >= 7 && score <= 8 && "Хорошее состояние"}
            {score >= 9 && "Отличный результат — ресурс для других аспектов"}
          </div>
        )}
      </div>

      {/* AI Notes */}
      {allNotes.length > 0 && (
        <div
          className="p-4 rounded-2xl mb-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <div className="text-xs font-semibold mb-1" style={{ color: "#4F46E5" }}>
            ✦ Заметки из разговора
          </div>
          <NotesList notes={allNotes} />
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          id="save-button"
          onClick={handleSave}
          disabled={score === null || saving}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 text-white ${saveH ? "ai-highlighted" : ""}`}
          style={{ background: aspect.color }}
        >
          {saving ? "Сохраняю..." : saved ? "✓ Сохранено" : "Сохранить и вернуться к карте"}
        </button>
      </div>
    </div>
  );
}

// ─── Map grid ─────────────────────────────────────────────────────────────────

function MapGrid({
  session,
  onOpenAspect,
}: {
  session: Session;
  onOpenAspect: (code: string) => void;
}) {
  const scores = session.scores ?? [];
  const completedCount = scores.filter((s) => s.status === "completed").length;
  const allCompleted = completedCount === 12;
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
          <StageNav currentStage={1} canGoStage2={allCompleted} canGoStage3={canGoStage3} />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm" style={{ color: "var(--muted)" }}>{completedCount}/12 оценено</div>
        </div>
      </header>

      <main className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--foreground)" }}>Этап 1 — Оценка карты</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Нажмите на аспект, чтобы начать оценку вместе с наставником.</p>
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

        <div className="mb-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 12) * 100}%`, background: "#4F46E5" }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {ASPECTS.map((aspect) => {
            const score = getScore(aspect.code);
            const isCompleted = score?.status === "completed";
            return (
              <AspectCard
                key={aspect.code}
                aspect={aspect}
                score={score}
                isCompleted={isCompleted}
                onClick={() => onOpenAspect(aspect.code)}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAspect, setOpenAspect] = useState<string | null>(null);
  const [hasOpenedAspect, setHasOpenedAspect] = useState(false);
  const [suggestedScores, setSuggestedScores] = useState<Record<string, number>>({});
  const [aiNotes, setAiNotes] = useState<Record<string, NoteItem[]>>({});

  const openAspectRef = useRef<string | null>(null);
  openAspectRef.current = openAspect;

  useEffect(() => {
    Promise.all([
      fetch("/api/onboarding").then((r) => r.json()),
      fetch("/api/session", { method: "POST" }).then((r) => r.json()),
    ])
      .then(([onb, sessionData]) => {
        if (!onb.onboardingDone) { router.push("/onboarding"); return; }
        if (sessionData.error) { router.push("/login"); return; }
        return fetch(`/api/session?sessionId=${sessionData.session.id}`)
          .then((r) => r.json())
          .then((full) => {
            if (full.error) { router.push("/login"); return; }
            setSession(full);
          });
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const refreshSession = useCallback(async () => {
    if (!session) return;
    const res = await fetch(`/api/session?sessionId=${session.id}`);
    const data = await res.json();
    if (!data.error) setSession(data);
  }, [session]);

  const handleScoreSuggested = useCallback((score: number) => {
    const code = openAspectRef.current;
    if (code) setSuggestedScores((prev) => ({ ...prev, [code]: score }));
  }, []);

  const handleNotesUpdated = useCallback((newNotes: NoteItem[]) => {
    const code = openAspectRef.current;
    if (!code || !newNotes.length) return;
    setAiNotes((prev) => ({
      ...prev,
      [code]: [...(prev[code] ?? []), ...newNotes],
    }));
  }, []);

  const handleOpenAspect = useCallback((code: string) => {
    setOpenAspect(code);
    setHasOpenedAspect(true);
  }, []);

  const handleCloseAspect = useCallback(() => {
    setOpenAspect(null);
  }, []);

  const sessionContext = useMemo(() => {
    if (!session) return undefined;
    const completed = (session.scores ?? []).filter((s) => s.status === "completed");
    if (!completed.length) return undefined;
    const lines = completed.map((s) => {
      const asp = ASPECTS.find((a) => a.code === s.aspectCode);
      return `${asp?.shortTitle ?? s.aspectCode}: ${s.score}/10`;
    });
    return `Оценено ${completed.length}/12 аспектов. ${lines.join(", ")}.`;
  }, [session]);

  const autoTrigger = openAspect
    ? `Пользователь открыл аспект «${getAspect(openAspect)?.title}». Начни работу с этим аспектом.`
    : hasOpenedAspect
      ? ""
      : "Пользователь открыл главную карту — этап 1. Начни работу.";

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-sm" style={{ color: "var(--muted)" }}>Загрузка...</div>
      </div>
    );
  }

  const initialScore = openAspect
    ? session.scores?.find((s) => s.aspectCode === openAspect)
    : undefined;

  return (
    <AppShell
      sessionId={session.id}
      stage={1}
      aspectCode={openAspect ?? undefined}
      autoTrigger={autoTrigger}
      sessionContext={sessionContext}
      onScoreSuggested={handleScoreSuggested}
      onNotesUpdated={handleNotesUpdated}
      header={<div />}
    >
      {openAspect ? (
        <InlineAspectView
          code={openAspect}
          sessionId={session.id}
          initialScore={initialScore}
          suggestedScore={suggestedScores[openAspect] ?? null}
          aiNotes={aiNotes[openAspect] ?? []}
          onClose={handleCloseAspect}
          onSaved={async () => {
            await refreshSession();
            setAiNotes((prev) => {
              const next = { ...prev };
              delete next[openAspect];
              return next;
            });
            setOpenAspect(null);
          }}
        />
      ) : (
        <MapGrid session={session} onOpenAspect={handleOpenAspect} />
      )}
    </AppShell>
  );
}
