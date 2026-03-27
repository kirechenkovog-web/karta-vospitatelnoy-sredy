"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ASPECTS } from "@/data/aspects";
import AppShell from "@/components/AppShell";
import StageNav from "@/components/StageNav";
import { useHighlightedElement } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";

interface AspectScore { aspectCode: string; score: number | null; }
interface DeepDive {
  aspectCode: string;
  resultsText: string | null;
  resourcesText: string | null;
  challengesText: string | null;
  indicatorsText: string | null;
}
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

function getScoreColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#eab308";
  return "#ef4444";
}

const DEEP_FIELDS = [
  { key: "resultsText", label: "Результаты", color: "#22c55e" },
  { key: "resourcesText", label: "Ресурсы", color: "#4F46E5" },
  { key: "challengesText", label: "Вызовы", color: "#ef4444" },
  { key: "indicatorsText", label: "Индикаторы", color: "#f59e0b" },
] as const;

function Stage3Content({ session, userName }: { session: Session; userName: string }) {
  const router = useRouter();
  const [focusAspects, setFocusAspects] = useState<string[]>(
    session.focusPlan ? JSON.parse(session.focusPlan.focusAspects) || [] : []
  );
  const [targetResult, setTargetResult] = useState(session.focusPlan?.targetResult ?? "");
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
        sendEvent(`[СОБЫТИЕ: Пользователь убрал аспект «${asp?.title}» из фокуса]`);
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= 2) return prev;
      sendEvent(`[СОБЫТИЕ: Пользователь выбрал аспект «${asp?.title}» как фокусный]`);
      return [...prev, code];
    });
    onFocusInteract();
  }

  function getScore(code: string) { return session.scores.find((s) => s.aspectCode === code); }
  function getDeepDive(code: string) { return session.deepDives.find((dd) => dd.aspectCode === code); }
  const deepDiveCodes = session.deepDives.map((dd) => dd.aspectCode);

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
          crossResourcesText: null,
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

      {/* ── Шаг 1: выбор фокуса ─────────────────────────────────────── */}
      <div
        id="focus-selector"
        className={`p-5 rounded-2xl mb-4 transition-all ${focusH ? "ai-highlighted" : ""}`}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Шаг 1 — Выберите фокусные аспекты
          </div>
          <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
            {focusAspects.length}/2 выбрано
          </div>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Рекомендуем выбирать из углублённых на этапе 2</p>

        <div className="grid grid-cols-3 gap-2">
          {ASPECTS.map((asp) => {
            const sc = getScore(asp.code);
            const scoreNum = sc?.score ?? null;
            const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : "var(--muted)";
            const isDived = deepDiveCodes.includes(asp.code);
            const isFocus = focusAspects.includes(asp.code);
            const isDisabled = !isFocus && focusAspects.length >= 2;
            return (
              <button
                key={asp.code}
                onClick={() => !isDisabled && toggleFocus(asp.code)}
                disabled={isDisabled}
                className="p-2.5 rounded-xl text-left transition-all"
                style={{
                  background: isFocus ? "#4F46E510" : isDived ? "var(--surface-2)" : "transparent",
                  border: isFocus ? "2px solid #4F46E5" : `1px solid ${isDived ? "#4F46E530" : "var(--border)"}`,
                  opacity: isDisabled ? 0.35 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate" style={{ color: isFocus ? "#4F46E5" : "var(--foreground)" }}>
                    {asp.shortTitle}
                  </span>
                  <span className="text-xs font-bold ml-1 flex-shrink-0" style={{ color: scoreColor }}>
                    {scoreNum ?? "—"}
                  </span>
                </div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--muted)", fontSize: 10 }}>
                  {isFocus ? <span style={{ color: "#4F46E5" }}>✓ выбран</span>
                    : isDived ? <span style={{ color: "#4F46E580" }}>углублён</span>
                    : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Контекст из этапа 2 для выбранных аспектов */}
        {focusAspects.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {focusAspects.map((code) => {
              const asp = ASPECTS.find((a) => a.code === code);
              const dd = getDeepDive(code);
              if (!asp) return null;
              const filledFields = DEEP_FIELDS.filter((f) => dd?.[f.key]?.trim());
              return (
                <div key={code} className="rounded-xl p-3"
                  style={{ background: "#4F46E508", border: "1px solid #4F46E520" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#4F46E5" }}>
                    {asp.shortTitle} — данные из этапа 2
                  </div>
                  {filledFields.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {filledFields.map((f) => (
                        <div key={f.key} className="rounded-lg px-2 py-1 flex items-start gap-1.5"
                          style={{ background: f.color + "12", border: `1px solid ${f.color}25` }}>
                          <div className="w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: f.color }} />
                          <span className="text-xs" style={{ color: "var(--foreground)" }}>
                            {(dd?.[f.key] ?? "").length > 70
                              ? (dd?.[f.key] ?? "").slice(0, 70) + "…"
                              : dd?.[f.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Этап 2 не заполнен по этому аспекту</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Шаг 2: стратегическая карточка ──────────────────────────── */}
      <div className="flex flex-col gap-3 mb-5">
        {/* Желаемый результат */}
        <div
          id="target-result-field"
          className={`rounded-2xl overflow-hidden transition-all ${targetH ? "ai-highlighted" : ""}`}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
          onClick={onTargetInteract}
        >
          <div className="px-5 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#4F46E515" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="7" stroke="#4F46E5" strokeWidth="1.5"/>
                <circle cx="8" cy="8" r="3.5" stroke="#4F46E5" strokeWidth="1.5"/>
                <circle cx="8" cy="8" r="1" fill="#4F46E5"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Желаемый результат</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Конкретно и измеримо — что изменится за 2 месяца?</div>
            </div>
            <span className="text-xs" style={{ color: "#ef4444" }}>обязательно</span>
          </div>
          <div className="px-5 py-3">
            <textarea
              value={targetResult}
              onChange={(e) => setTargetResult(e.target.value)}
              onBlur={(e) => { if (e.target.value.trim()) sendEvent(`[СОБЫТИЕ: Пользователь сформулировал желаемый результат: «${e.target.value.trim()}»]`); }}
              placeholder="Например: К маю провести 3 встречи с партнёрами и оформить одно соглашение"
              rows={2}
              className="w-full text-sm resize-none leading-relaxed"
              style={{ background: "transparent", border: "none", color: "var(--foreground)", outline: "none" }}
            />
          </div>
        </div>

        {/* Первые шаги */}
        <div
          id="first-steps-field"
          className={`rounded-2xl overflow-hidden transition-all ${firstStepsH ? "ai-highlighted" : ""}`}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
          onClick={onFirstStepsInteract}
        >
          <div className="px-5 pt-4 pb-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#22c55e15" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="#22c55e" strokeWidth="1.5"/>
                <path d="M5 5h6M5 8h6M5 11h4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Первые шаги на этой неделе</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Конкретные действия, которые можно начать прямо сейчас</div>
            </div>
            <span className="text-xs" style={{ color: "#ef4444" }}>обязательно</span>
          </div>
          <div className="px-5 py-3">
            <textarea
              value={firstSteps}
              onChange={(e) => setFirstSteps(e.target.value)}
              onBlur={(e) => { if (e.target.value.trim()) sendEvent(`[СОБЫТИЕ: Пользователь описал первые шаги на неделю: «${e.target.value.trim()}»]`); }}
              placeholder="1. Составить список... 2. Написать письмо..."
              rows={3}
              className="w-full text-sm resize-none leading-relaxed"
              style={{ background: "transparent", border: "none", color: "var(--foreground)", outline: "none" }}
            />
          </div>
        </div>
      </div>

      {/* ── Кнопки ───────────────────────────────────────────────────── */}
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
                return `${asp?.title ?? s.aspectCode}: ${s.score}/10`;
              });
            const divedTitles = (full.deepDives ?? []).map((dd: { aspectCode: string }) => {
              const asp = ASPECTS.find((a) => a.code === dd.aspectCode);
              return asp?.title ?? dd.aspectCode;
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
