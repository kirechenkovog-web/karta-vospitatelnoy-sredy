"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ASPECTS, getAspect } from "@/data/aspects";
import AppShell from "@/components/AppShell";
import { useHighlight, useHighlightedElement } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";

interface AspectScore {
  aspectCode: string;
  score: number | null;
  tenOfTenText: string | null;
  currentStateText: string | null;
  status: string;
}

function AspectContent({
  code,
  sessionId,
  initialScore,
}: {
  code: string;
  sessionId: string;
  initialScore: AspectScore | undefined;
}) {
  const aspect = getAspect(code)!;
  const allCodes = ASPECTS.map((a) => a.code);
  const currentIndex = allCodes.indexOf(code);
  const prevCode = currentIndex > 0 ? allCodes[currentIndex - 1] : null;
  const nextCode = currentIndex < allCodes.length - 1 ? allCodes[currentIndex + 1] : null;

  const [score, setScore] = useState<number | null>(initialScore?.score ?? null);
  const [tenOfTen, setTenOfTen] = useState(initialScore?.tenOfTenText ?? "");
  const [currentState, setCurrentState] = useState(initialScore?.currentStateText ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const { sendEvent } = useAiEvent();
  const { setHighlight } = useHighlight();
  const { isHighlighted: scoreSelectorH, onInteract: onScoreInteract } = useHighlightedElement("score-selector");
  const { isHighlighted: tenOfTenH, onInteract: onTenInteract } = useHighlightedElement("ten-of-ten-field");
  const { isHighlighted: currentStateH, onInteract: onCurrentStateInteract } = useHighlightedElement("current-state-field");
  const { isHighlighted: saveH, onInteract: onSaveInteract } = useHighlightedElement("save-button");
  const { isHighlighted: nextStageH, onInteract: onNextStageInteract } = useHighlightedElement("next-stage-button");

  // Highlight score-selector on mount (AI doesn't always send the command reliably)
  useEffect(() => {
    const t = setTimeout(() => setHighlight("score-selector"), 800);
    return () => clearTimeout(t);
  }, [setHighlight]);

  async function save(goNext = false) {
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
          tenOfTenText: tenOfTen || null,
          currentStateText: currentState || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (goNext) {
        const sessionData = await fetch(`/api/session?sessionId=${sessionId}`).then((r) => r.json());
        const completedCount = (sessionData.scores ?? []).filter((s: { status: string }) => s.status === "completed").length;
        if (completedCount >= 12) {
          router.push("/map");
        } else if (nextCode) {
          router.push(`/map/${nextCode}`);
        } else {
          router.push("/map");
        }
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Nav */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/map">
          <button className="text-xs transition-opacity hover:opacity-70 flex items-center gap-1"
            style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
            ← Карта
          </button>
        </Link>
        <div className="flex items-center gap-2">
          {prevCode && (
            <Link href={`/map/${prevCode}`}>
              <button className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                ←
              </button>
            </Link>
          )}
          <span className="text-xs" style={{ color: "var(--muted)" }}>{currentIndex + 1}/{allCodes.length}</span>
          {nextCode && (
            <Link href={`/map/${nextCode}`}>
              <button className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                →
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="inline-block text-xs px-3 py-1 rounded-full mb-3 font-medium"
          style={{ background: aspect.color + "20", color: aspect.color }}>
          Аспект {currentIndex + 1}
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--foreground)" }}>{aspect.title}</h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{aspect.description}</p>
      </div>

      {/* Score */}
      <div
        id="score-selector"
        className={`p-5 rounded-2xl mb-4 transition-all ${scoreSelectorH ? "ai-highlighted" : ""}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>
          Ваша оценка
        </div>
        <div className="flex gap-2 flex-wrap" onClick={onScoreInteract}>
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              onClick={() => {
                setScore(n);
                onScoreInteract();
                setHighlight("ten-of-ten-field");
                sendEvent(`[СОБЫТИЕ: Пользователь выставил оценку ${n}/10 по аспекту «${aspect.title}»]`);
              }}
              className="w-10 h-10 rounded-xl text-sm font-semibold transition-all hover:scale-110 active:scale-95"
              style={{
                background: score === n ? aspect.color : "var(--surface-2)",
                color: score === n ? "#fff" : "var(--muted)",
                border: score === n ? `2px solid ${aspect.color}` : "1px solid var(--border)",
              }}
            >
              {n}
            </button>
          ))}
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

      {/* Text fields */}
      <div
        id="ten-of-ten-field"
        className={`p-5 rounded-2xl mb-3 transition-all ${tenOfTenH ? "ai-highlighted" : ""}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={onTenInteract}
      >
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
          Что для вас 10/10? <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>необязательно</span>
        </label>
        <textarea
          value={tenOfTen}
          onChange={(e) => setTenOfTen(e.target.value)}
          onBlur={(e) => {
            if (e.target.value.trim()) {
              sendEvent(`[СОБЫТИЕ: Пользователь написал, что для него 10/10: «${e.target.value.trim()}»]`);
              setHighlight("current-state-field");
            }
          }}
          placeholder="Опишите идеальную картину..."
          rows={2}
          className="w-full text-sm resize-none leading-relaxed"
          style={{ background: "transparent", border: "none", color: "var(--foreground)" }}
        />
      </div>

      <div
        id="current-state-field"
        className={`p-5 rounded-2xl mb-5 transition-all ${currentStateH ? "ai-highlighted" : ""}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={onCurrentStateInteract}
      >
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
          Что уже есть сейчас? <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>необязательно</span>
        </label>
        <textarea
          value={currentState}
          onChange={(e) => setCurrentState(e.target.value)}
          onBlur={(e) => {
            if (e.target.value.trim()) {
              sendEvent(`[СОБЫТИЕ: Пользователь описал текущее состояние по аспекту «${aspect.title}»: «${e.target.value.trim()}»]`);
              setHighlight("save-button");
            }
          }}
          placeholder="Опишите текущее состояние..."
          rows={2}
          className="w-full text-sm resize-none leading-relaxed"
          style={{ background: "transparent", border: "none", color: "var(--foreground)" }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          id="save-button"
          onClick={() => { onSaveInteract(); onNextStageInteract(); save(true); }}
          disabled={score === null || saving}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 text-white ${saveH || nextStageH ? "ai-highlighted" : ""}`}
          style={{ background: aspect.color }}
        >
          {saving ? "Сохраняю..." : saved ? "✓ Сохранено" : nextCode ? "Сохранить и следующий →" : "Сохранить и на карту"}
        </button>
      </div>
    </div>
  );
}

export default function AspectPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const aspect = getAspect(code);

  const [sessionId, setSessionId] = useState("");
  const [initialScore, setInitialScore] = useState<AspectScore | undefined>(undefined);
  const [sessionContext, setSessionContext] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/session", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/login"); return; }
        const sid = data.session.id;
        setSessionId(sid);

        return fetch(`/api/session?sessionId=${sid}`)
          .then((r) => r.json())
          .then((full) => {
            const existing = full.scores?.find((s: AspectScore) => s.aspectCode === code);
            setInitialScore(existing);

            const completed = (full.scores ?? []).filter((s: AspectScore) => s.status === "completed");
            if (completed.length > 0) {
              const lines = completed.map((s: AspectScore) => {
                const asp = ASPECTS.find((a) => a.code === s.aspectCode);
                return `${asp?.shortTitle ?? s.aspectCode}: ${s.score}/10`;
              });
              setSessionContext(`Оценено ${completed.length}/12 аспектов. ${lines.join(", ")}.`);
            }

            setLoaded(true);
          });
      })
      .catch(() => router.push("/login"));
  }, [code, router]);

  if (!aspect) return null;
  if (!loaded || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-sm" style={{ color: "var(--muted)" }}>Загрузка...</div>
      </div>
    );
  }

  return (
    <AppShell
      sessionId={sessionId}
      stage={1}
      aspectCode={code}
      autoTrigger={`Пользователь открыл аспект «${aspect.title}». Начни работу с этим аспектом.`}
      sessionContext={sessionContext}
      header={<div />}
    >
      <AspectContent code={code} sessionId={sessionId} initialScore={initialScore} />
    </AppShell>
  );
}
