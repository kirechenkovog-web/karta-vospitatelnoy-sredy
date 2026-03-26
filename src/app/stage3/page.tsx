"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ASPECTS } from "@/data/aspects";
import AppShell from "@/components/AppShell";
import StageNav from "@/components/StageNav";
import { useHighlightedElement } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";

interface AspectScore { aspectCode: string; score: number | null; }
interface DeepDive { aspectCode: string; resourcesText: string | null; }
interface Session {
  id: string;
  scores: AspectScore[];
  deepDives: DeepDive[];
  focusPlan: {
    focusAspects: string;
    targetResult: string | null;
    crossResourcesText: string | null;
    firstStepsText: string | null;
  } | null;
}

function Stage3Content({ session, userName }: { session: Session; userName: string }) {
  const router = useRouter();
  const [focusAspects, setFocusAspects] = useState<string[]>(
    session.focusPlan ? JSON.parse(session.focusPlan.focusAspects) || [] : []
  );
  const [targetResult, setTargetResult] = useState(session.focusPlan?.targetResult ?? "");
  const [crossResources, setCrossResources] = useState(session.focusPlan?.crossResourcesText ?? "");
  const [firstSteps, setFirstSteps] = useState(session.focusPlan?.firstStepsText ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { sendEvent } = useAiEvent();
  const { isHighlighted: focusH, onInteract: onFocusInteract } = useHighlightedElement("focus-selector");
  const { isHighlighted: targetH, onInteract: onTargetInteract } = useHighlightedElement("target-result-field");
  const { isHighlighted: firstStepsH, onInteract: onFirstStepsInteract } = useHighlightedElement("first-steps-field");
  const { isHighlighted: saveH, onInteract: onSaveInteract } = useHighlightedElement("save-button");

  function toggleFocus(code: string) {
    const asp = ASPECTS.find((a) => a.code === code);
    setFocusAspects((prev) => {
      if (prev.includes(code)) {
        sendEvent(`[СОБЫТИЕ: Пользователь убрал аспект «${asp?.shortTitle}» из фокуса]`);
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= 2) return prev;
      sendEvent(`[СОБЫТИЕ: Пользователь выбрал аспект «${asp?.shortTitle}» как фокусный]`);
      return [...prev, code];
    });
    onFocusInteract();
  }

  function getScore(code: string) { return session.scores.find((s) => s.aspectCode === code); }

  async function save(andFinish = false) {
    setSaving(true);
    onSaveInteract();
    try {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          focusAspects,
          targetResult: targetResult || null,
          crossResourcesText: crossResources || null,
          firstStepsText: firstSteps || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (andFinish) router.push(`/result?sid=${session.id}`);
    } finally {
      setSaving(false);
    }
  }

  const isValid = focusAspects.length > 0 && targetResult.trim() && firstSteps.trim();
  const deepDiveCodes = session.deepDives.map((dd) => dd.aspectCode);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#4F46E5" }}>КВС</div>
          <StageNav currentStage={3} canGoStage2={true} canGoStage3={true} />
        </div>
        <div className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
          {userName}
        </div>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--foreground)" }}>Этап 3 — Фокус и стратегия</h1>
        <p className="text-xs" style={{ color: "var(--muted)" }}>Выберите 1–2 аспекта и сформулируйте конкретные шаги на 2 месяца.</p>
      </div>

      {/* Focus selector */}
      <div
        id="focus-selector"
        className={`p-5 rounded-2xl mb-4 transition-all ${focusH ? "ai-highlighted" : ""}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
      >
        <div className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
          Фокусные аспекты <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>не более 2</span>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Рекомендуем выбирать из углублённых</p>
        <div className="grid grid-cols-3 gap-2">
          {ASPECTS.map((asp) => {
            const sc = getScore(asp.code);
            const isDived = deepDiveCodes.includes(asp.code);
            const isFocus = focusAspects.includes(asp.code);
            const isDisabled = !isFocus && focusAspects.length >= 2;
            return (
              <button
                key={asp.code}
                onClick={() => !isDisabled && toggleFocus(asp.code)}
                disabled={isDisabled}
                className="p-2.5 rounded-xl text-left transition-all text-xs"
                style={{
                  background: isFocus ? asp.color + "25" : isDived ? "var(--surface-2)" : "transparent",
                  border: isFocus ? `2px solid ${asp.color}` : `1px solid ${isDived ? asp.color + "40" : "var(--border)"}`,
                  color: isFocus ? asp.color : "var(--muted)",
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-xs truncate" style={{ color: isFocus ? asp.color : "var(--foreground)" }}>{asp.shortTitle}</span>
                  <span className="text-xs ml-1 flex-shrink-0" style={{ color: asp.color }}>{sc?.score ?? "—"}</span>
                </div>
                {isFocus && <div className="text-xs font-medium">✓ выбран</div>}
                {isDived && !isFocus && <div className="text-xs" style={{ color: asp.color + "90" }}>углублён</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target result */}
      <div
        id="target-result-field"
        className={`p-5 rounded-2xl mb-3 transition-all ${targetH ? "ai-highlighted" : ""}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        onClick={onTargetInteract}
      >
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
          Желаемый результат за 2 месяца <span className="text-xs font-normal" style={{ color: "#ef4444" }}>обязательно</span>
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Конкретно и измеримо</p>
        <textarea
          value={targetResult}
          onChange={(e) => setTargetResult(e.target.value)}
          onBlur={(e) => { if (e.target.value.trim()) sendEvent(`[СОБЫТИЕ: Пользователь сформулировал желаемый результат: «${e.target.value.trim()}»]`); }}
          placeholder="Например: К маю провести 3 встречи с партнёрами и оформить одно соглашение"
          rows={2}
          className="w-full text-sm resize-none leading-relaxed"
          style={{ background: "transparent", border: "none", color: "var(--foreground)" }}
        />
      </div>

      {/* Cross resources */}
      {session.deepDives.filter(dd => !focusAspects.includes(dd.aspectCode) && dd.resourcesText).length > 0 && (
        <div className="p-4 rounded-xl mb-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <div className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>Ресурсы из других аспектов:</div>
          {session.deepDives.filter(dd => !focusAspects.includes(dd.aspectCode) && dd.resourcesText).map(dd => {
            const asp = ASPECTS.find(a => a.code === dd.aspectCode);
            return (
              <div key={dd.aspectCode} className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                <span style={{ color: asp?.color }}>{asp?.shortTitle}:</span> {dd.resourcesText}
              </div>
            );
          })}
        </div>
      )}

      <div className="p-5 rounded-2xl mb-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
          Ресурсы других аспектов <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>рекомендуется</span>
        </label>
        <textarea
          value={crossResources}
          onChange={(e) => setCrossResources(e.target.value)}
          placeholder="Как ресурсы других аспектов помогут достичь фокуса..."
          rows={2}
          className="w-full text-sm resize-none leading-relaxed"
          style={{ background: "transparent", border: "none", color: "var(--foreground)" }}
        />
      </div>

      {/* First steps */}
      <div
        id="first-steps-field"
        className={`p-5 rounded-2xl mb-5 transition-all ${firstStepsH ? "ai-highlighted" : ""}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        onClick={onFirstStepsInteract}
      >
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
          Первые шаги на этой неделе <span className="text-xs font-normal" style={{ color: "#ef4444" }}>обязательно</span>
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Конкретные действия, которые можно начать прямо сейчас</p>
        <textarea
          value={firstSteps}
          onChange={(e) => setFirstSteps(e.target.value)}
          onBlur={(e) => { if (e.target.value.trim()) sendEvent(`[СОБЫТИЕ: Пользователь описал первые шаги на неделю: «${e.target.value.trim()}»]`); }}
          placeholder="1. Составить список... 2. Написать письмо..."
          rows={3}
          className="w-full text-sm resize-none leading-relaxed"
          style={{ background: "transparent", border: "none", color: "var(--foreground)" }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          id="save-button"
          onClick={() => save(true)}
          disabled={!isValid || saving}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 text-white ${saveH ? "ai-highlighted" : ""}`}
          style={{ background: "#4F46E5" }}
        >
          {saving ? "Сохраняю..." : "Завершить и посмотреть результаты →"}
        </button>
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
          style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
        >
          {saved ? "✓ Сохранено" : "Сохранить черновик"}
        </button>
      </div>
    </div>
  );
}

export default function Stage3Page() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionContext, setSessionContext] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch("/api/session", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/login"); return; }
        return fetch(`/api/session?sessionId=${data.session.id}`)
          .then((r) => r.json())
          .then((full) => {
            if (full.error) { router.push("/login"); return; }
            if (!full.deepDives?.length) { router.push("/stage2"); return; }
            const lines = (full.scores ?? [])
              .filter((s: AspectScore) => s.score != null)
              .map((s: AspectScore) => {
                const asp = ASPECTS.find((a) => a.code === s.aspectCode);
                return `${asp?.shortTitle ?? s.aspectCode}: ${s.score}/10`;
              });
            const divedTitles = (full.deepDives ?? []).map((dd: { aspectCode: string }) => {
              const asp = ASPECTS.find((a) => a.code === dd.aspectCode);
              return asp?.shortTitle ?? dd.aspectCode;
            });
            setSessionContext(`Оценки: ${lines.join(", ")}. Углублённый анализ по: ${divedTitles.join(", ")}.`);
            setSession(full);
          });
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

  return (
    <AppShell
      sessionId={session.id}
      stage={3}
      autoTrigger="Пользователь перешёл к этапу 3 — выбор фокуса. Начни работу."
      sessionContext={sessionContext}
      header={<div />}
    >
      <Stage3Content session={session} userName="" />
    </AppShell>
  );
}
