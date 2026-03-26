"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ASPECTS } from "@/data/aspects";
import AppShell from "@/components/AppShell";
import StageNav from "@/components/StageNav";
import { useHighlightedElement } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";

interface DeepDive {
  aspectCode: string;
  resultsText: string | null;
  resourcesText: string | null;
  challengesText: string | null;
  indicatorsText: string | null;
}

interface AspectScore {
  aspectCode: string;
  score: number | null;
  status: string;
}

interface Session {
  id: string;
  scores: AspectScore[];
  deepDives: DeepDive[];
}

const FIELDS = [
  { key: "resultsText", id: "results-field", label: "Результаты", desc: "Что уже достигнуто", color: "#22c55e", icon: "📈" },
  { key: "resourcesText", id: "resources-field", label: "Ресурсы", desc: "Что есть в наличии", color: "#4F46E5", icon: "🔧" },
  { key: "challengesText", id: "challenges-field", label: "Вызовы", desc: "Что создаёт трудности", color: "#ef4444", icon: "⚡" },
  { key: "indicatorsText", id: "indicators-field", label: "Индикаторы", desc: "Как понять, что стало лучше", color: "#f59e0b", icon: "🎯" },
];

function getScoreColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#eab308";
  return "#ef4444";
}

function Stage2Content({ session, userName }: { session: Session; userName: string }) {
  const router = useRouter();
  const { sendEvent } = useAiEvent();
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [localSession, setLocalSession] = useState(session);

  const deepDivesCount = localSession.deepDives?.length ?? 0;
  const canGoStage3 = deepDivesCount > 0;

  const { isHighlighted: nextStageH, onInteract: onNextStage } = useHighlightedElement("next-stage-button");

  // Initialize drafts from existing deep dives
  useEffect(() => {
    const initial: Record<string, Record<string, string>> = {};
    for (const dd of session.deepDives ?? []) {
      initial[dd.aspectCode] = {
        resultsText: dd.resultsText ?? "",
        resourcesText: dd.resourcesText ?? "",
        challengesText: dd.challengesText ?? "",
        indicatorsText: dd.indicatorsText ?? "",
      };
    }
    setDraftData(initial);
  }, [session]);

  function getScore(code: string) {
    return localSession.scores.find((s) => s.aspectCode === code);
  }

  function getDraft(code: string, field: string) {
    return draftData[code]?.[field] ?? "";
  }

  function setDraft(code: string, field: string, value: string) {
    setDraftData((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
  }

  function isDeepDived(code: string) {
    return localSession.deepDives?.some((dd) => dd.aspectCode === code);
  }

  async function saveDeepDive(code: string) {
    setSaving(code);
    const data = draftData[code] ?? {};
    await fetch("/api/deepdive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: localSession.id,
        aspectCode: code,
        resultsText: data.resultsText || null,
        resourcesText: data.resourcesText || null,
        challengesText: data.challengesText || null,
        indicatorsText: data.indicatorsText || null,
      }),
    });
    const res = await fetch(`/api/session?sessionId=${localSession.id}`);
    const updated = await res.json();
    setLocalSession(updated);
    setSaving(null);
    setOpenCode(null);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#4F46E5" }}>КВС</div>
          <StageNav currentStage={2} canGoStage2={true} canGoStage3={canGoStage3} />
        </div>
        <div className="flex items-center gap-3">
          {canGoStage3 && (
            <Link href="/stage3">
              <button
                id="next-stage-button"
                onClick={onNextStage}
                className={`px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 text-white ${nextStageH ? "ai-highlighted" : ""}`}
                style={{ background: "#22c55e" }}
              >
                К этапу 3 →
              </button>
            </Link>
          )}
          <div className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            {userName}
          </div>
        </div>
      </div>

      <div className="mb-4 mt-3">
        <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--foreground)" }}>Этап 2 — Углублённый анализ</h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <p className="text-xs" style={{ color: "var(--muted)" }}>Выберите значимые аспекты и опишите:</p>
          {FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-1 px-2 py-0.5 rounded-md"
              style={{ background: field.color + "15", border: `1px solid ${field.color}30` }}>
              <span style={{ fontSize: 13 }}>{field.icon}</span>
              <span className="text-xs font-medium" style={{ color: field.color }}>{field.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ASPECTS.map((asp) => {
          const sc = getScore(asp.code);
          const dived = isDeepDived(asp.code);
          const isOpen = openCode === asp.code;
          const scoreNum = sc?.score ?? null;
          const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : "var(--muted)";
          const filledFields = FIELDS.filter((f) => getDraft(asp.code, f.key)?.trim());

          return (
            <div key={asp.code} className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: `1px solid ${dived ? "#4F46E540" : "var(--border)"}` }}>

              {/* Header */}
              <button
                onClick={() => setOpenCode(isOpen ? null : asp.code)}
                className="w-full flex items-center justify-between px-4 pt-3 pb-2 text-left"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: scoreColor + "20", color: scoreColor }}>
                    {scoreNum ?? "—"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{asp.shortTitle}</div>
                    {dived && <div className="text-xs" style={{ color: "#4F46E5" }}>✓</div>}
                  </div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</div>
              </button>

              {/* Summary — filled fields only, as colored chips */}
              {!isOpen && filledFields.length > 0 && (
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {filledFields.map((field) => {
                    const val = getDraft(asp.code, field.key)!.trim();
                    return (
                      <div key={field.key} className="rounded-lg px-2 py-1 min-w-0 max-w-full flex items-start gap-1.5"
                        style={{ background: field.color + "15", border: `1px solid ${field.color}30` }}>
                        <span className="text-sm flex-shrink-0 leading-tight">{field.icon}</span>
                        <span className="text-xs" style={{ color: "var(--foreground)" }}>
                          {val.length > 60 ? val.slice(0, 60) + "…" : val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Edit panel */}
              {isOpen && (
                <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="pt-3 grid grid-cols-2 gap-3">
                    {FIELDS.map((field) => (
                      <FieldBlock
                        key={field.key}
                        field={field}
                        value={getDraft(asp.code, field.key)}
                        onChange={(v) => setDraft(asp.code, field.key, v)}
                        onBlur={(v) => { if (v.trim()) sendEvent(`[СОБЫТИЕ: Пользователь заполнил поле «${field.label}» по аспекту «${asp.shortTitle}»: «${v.trim()}»]`); }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => saveDeepDive(asp.code)}
                    disabled={saving === asp.code}
                    className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 text-white"
                    style={{ background: "#4F46E5" }}
                  >
                    {saving === asp.code ? "Сохраняю..." : "Сохранить"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

function FieldBlock({
  field,
  value,
  onChange,
  onBlur,
}: {
  field: { key: string; id: string; label: string; desc: string; color: string; icon: string };
  value: string;
  onChange: (v: string) => void;
  onBlur?: (v: string) => void;
}) {
  const { isHighlighted, onInteract } = useHighlightedElement(field.id);

  return (
    <div
      id={field.id}
      className={`transition-all ${isHighlighted ? "ai-highlighted rounded-xl" : ""}`}
      onClick={onInteract}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ fontSize: 14, lineHeight: 1 }}>{field.icon}</span>
        <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{field.label}</span>
      </div>
      <div className="text-xs mb-1" style={{ color: "var(--muted)" }}>{field.desc}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur?.(e.target.value)}
        placeholder="Введите текст..."
        rows={3}
        className="w-full text-xs resize-none leading-relaxed rounded-lg p-2"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)" }}
      />
    </div>
  );
}

export default function Stage2Page() {
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
            const completed = full.scores?.filter((s: AspectScore) => s.status === "completed");
            if (!completed || completed.length < 12) { router.push("/map"); return; }
            const lines = completed.map((s: AspectScore) => {
              const asp = ASPECTS.find((a) => a.code === s.aspectCode);
              return `${asp?.shortTitle ?? s.aspectCode}: ${s.score}/10`;
            });
            setSessionContext(`Все 12 аспектов оценены. ${lines.join(", ")}.`);
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
      stage={2}
      autoTrigger="Пользователь перешёл к этапу 2 — углублённый анализ. Начни работу."
      sessionContext={sessionContext}
      header={<div />}
    >
      <Stage2Content session={session} userName="" />
    </AppShell>
  );
}
