"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ASPECTS } from "@/data/aspects";
import AppShell from "@/components/AppShell";
import StageNav from "@/components/StageNav";
import { useHighlightedElement } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";
import { FieldIcon, DEEP_FIELDS as FIELD_DEFS, type FieldKey } from "@/components/FieldIcons";
import type { AspectScore, DeepDive, FocusPlan } from "@/types";
import { getScoreColor, parseJsonMap } from "@/lib/utils";

interface Session {
  id: string;
  scores: AspectScore[];
  deepDives: DeepDive[];
  focusPlan: FocusPlan | null;
}

function Stage3Content({ session }: { session: Session }) {
  const router = useRouter();
  const [focusAspects, setFocusAspects] = useState<string[]>(
    session.focusPlan ? JSON.parse(session.focusPlan.focusAspects) || [] : []
  );
  const [targetResults, setTargetResults] = useState<Record<string, string>>(
    parseJsonMap(session.focusPlan?.targetResult ?? null)
  );
  const [firstSteps, setFirstSteps] = useState<Record<string, string>>(
    parseJsonMap(session.focusPlan?.firstStepsText ?? null)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { sendEvent } = useAiEvent();
  const { isHighlighted: focusH, onInteract: onFocusInteract } = useHighlightedElement("focus-selector");
  const { isHighlighted: saveH, onInteract: onSaveInteract } = useHighlightedElement("save-button");

  function toggleFocus(code: string) {
    const asp = ASPECTS.find((a) => a.code === code);
    setFocusAspects((prev) => {
      if (prev.includes(code)) {
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
          targetResult: Object.keys(targetResults).length ? JSON.stringify(targetResults) : null,
          crossResourcesText: null,
          firstStepsText: Object.keys(firstSteps).length ? JSON.stringify(firstSteps) : null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (andFinish) router.push(`/result?sid=${session.id}`);
    } finally {
      setSaving(false);
    }
  }

  const isValid =
    focusAspects.length > 0 &&
    focusAspects.every((code) => targetResults[code]?.trim()) &&
    focusAspects.every((code) => firstSteps[code]?.trim());

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#4F46E5" }}>КВС</div>
          <StageNav currentStage={3} canGoStage2={true} canGoStage3={true} />
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>Рекомендуем выбирать из углублённых на этапе 2</p>
          <div className="flex items-center gap-3">
            {FIELD_DEFS.map((f) => (
              <div key={f.key} className="flex items-center gap-1">
                <FieldIcon fieldKey={f.key as FieldKey} color={f.color} size={11} />
                <span style={{ color: f.color, fontSize: 11, fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {ASPECTS.map((asp) => {
            const sc = getScore(asp.code);
            const scoreNum = sc?.score ?? null;
            const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : "var(--muted)";
            const isDived = deepDiveCodes.includes(asp.code);
            const isFocus = focusAspects.includes(asp.code);
            const isDisabled = !isFocus && focusAspects.length >= 2;
            const dd = getDeepDive(asp.code);
            const filledFields = FIELD_DEFS.filter((f) => {
              const val = dd?.[f.key as keyof DeepDive];
              return typeof val === "string" && val.trim();
            });

            return (
              <button
                key={asp.code}
                onClick={() => !isDisabled && toggleFocus(asp.code)}
                disabled={isDisabled}
                className="p-3 rounded-xl text-left transition-all relative overflow-hidden"
                style={{
                  background: isFocus ? "#4F46E508" : "var(--surface)",
                  border: isFocus ? "2px solid #4F46E5" : "1px solid var(--border)",
                  opacity: isDisabled ? 0.35 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                }}
              >
                <div className="flex items-center gap-2.5 pb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: scoreColor + "20", color: scoreColor }}
                  >
                    {scoreNum ?? "—"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: isFocus ? "#4F46E5" : "var(--foreground)" }}>
                      {asp.shortTitle}
                    </div>
                    {(isFocus || isDived) && (
                      <div className="text-xs" style={{ color: isFocus ? "#4F46E5" : "#6366f180" }}>
                        {isFocus ? "✓ выбран" : "углублён"}
                      </div>
                    )}
                  </div>
                </div>
                {isDived && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {FIELD_DEFS.flatMap((f) => {
                      const val = (dd?.[f.key as keyof DeepDive] as string) ?? "";
                      const items = val.split("\n").filter((s) => s.trim());
                      return items.slice(0, 3).map((item, i) => (
                        <div key={`${f.key}-${i}`} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: f.color + "12", border: `1px solid ${f.color}30` }}>
                          <FieldIcon fieldKey={f.key as FieldKey} color={f.color} size={9} />
                          <span style={{ color: "var(--foreground)", fontSize: 10 }}>{item.slice(0, 28)}</span>
                        </div>
                      ));
                    })}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" style={{ background: scoreColor + "30" }}>
                  {scoreNum !== null && (
                    <div style={{ width: `${(scoreNum / 10) * 100}%`, height: "100%", background: scoreColor, borderRadius: "0 0 0 8px" }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Шаг 2: per-aspect стратегические карточки ────────────────── */}
      {focusAspects.length > 0 && (
        <div className="flex flex-col gap-4 mb-5">
          {focusAspects.map((code) => {
            const asp = ASPECTS.find((a) => a.code === code);
            const dd = getDeepDive(code);
            const sc = getScore(code);
            const scoreNum = sc?.score ?? null;
            const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : "var(--muted)";
            if (!asp) return null;

            const filledFields = FIELD_DEFS.filter((f) => {
              const val = dd?.[f.key as keyof DeepDive];
              return typeof val === "string" && val.trim();
            });

            return (
              <div key={code} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
                {/* Aspect header */}
                <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: asp.color + "08" }}>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: scoreColor + "20", color: scoreColor }}
                  >
                    {scoreNum ?? "—"}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{asp.title}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>Фокусный аспект</div>
                  </div>
                </div>

                {/* Stage 2 data with icons */}
                {filledFields.length > 0 && (
                  <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)", background: "#4F46E504" }}>
                    <div className="flex flex-wrap gap-2">
                      {filledFields.map((f) => {
                        const val = dd?.[f.key as keyof DeepDive] as string | null;
                        return (
                          <div
                            key={f.key}
                            className="rounded-lg px-2.5 py-1.5 flex items-start gap-1.5"
                            style={{ background: f.color + "12", border: `1px solid ${f.color}25`, maxWidth: "100%" }}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <FieldIcon fieldKey={f.key as FieldKey} color={f.color} size={12} />
                            </div>
                            <div>
                              <div className="text-xs font-medium" style={{ color: f.color }}>{f.label}</div>
                              <div className="text-xs mt-0.5" style={{ color: "var(--foreground)" }}>
                                {(val ?? "").length > 80 ? (val ?? "").slice(0, 80) + "…" : val}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Target result */}
                <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="6.5" stroke="#4F46E5" strokeWidth="1.8"/>
                      <circle cx="8" cy="8" r="3" stroke="#4F46E5" strokeWidth="1.5"/>
                      <circle cx="8" cy="8" r="1" fill="#4F46E5"/>
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Желаемый результат</span>
                    <span className="text-xs" style={{ color: "#ef4444" }}>обязательно</span>
                  </div>
                  <textarea
                    value={targetResults[code] ?? ""}
                    onChange={(e) => setTargetResults((prev) => ({ ...prev, [code]: e.target.value }))}
                    onBlur={(e) => {
                      if (e.target.value.trim())
                        sendEvent(`[СОБЫТИЕ: Желаемый результат по «${asp.title}»: «${e.target.value.trim()}»]`);
                    }}
                    placeholder="Конкретно и измеримо — что изменится за 2 месяца?"
                    rows={2}
                    className="w-full text-sm resize-none leading-relaxed rounded-xl p-3"
                    style={{ background: "var(--surface-2)", border: "1px solid #4F46E530", color: "var(--foreground)", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "#4F46E5"; }}
                    onBlurCapture={(e) => { e.target.style.borderColor = "#4F46E530"; }}
                  />
                </div>

                {/* First steps */}
                <div className="px-5 pt-3 pb-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="2" width="12" height="12" rx="2" stroke="#22c55e" strokeWidth="1.5"/>
                      <path d="M5 5h6M5 8h6M5 11h4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Первые шаги на этой неделе</span>
                    <span className="text-xs" style={{ color: "#ef4444" }}>обязательно</span>
                  </div>
                  <textarea
                    value={firstSteps[code] ?? ""}
                    onChange={(e) => setFirstSteps((prev) => ({ ...prev, [code]: e.target.value }))}
                    onBlur={(e) => {
                      if (e.target.value.trim())
                        sendEvent(`[СОБЫТИЕ: Первые шаги по «${asp.title}»: «${e.target.value.trim()}»]`);
                    }}
                    placeholder="1. Составить список... 2. Написать письмо..."
                    rows={3}
                    className="w-full text-sm resize-none leading-relaxed rounded-xl p-3"
                    style={{ background: "var(--surface-2)", border: "1px solid #22c55e30", color: "var(--foreground)", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "#22c55e"; }}
                    onBlurCapture={(e) => { e.target.style.borderColor = "#22c55e30"; }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
      <Stage3Content session={session} />
    </AppShell>
  );
}
