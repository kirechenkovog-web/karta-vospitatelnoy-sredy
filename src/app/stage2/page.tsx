"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  tenOfTenText: string | null;
}

interface Session {
  id: string;
  scores: AspectScore[];
  deepDives: DeepDive[];
}

interface NoteItem { type: "heading" | "bullet" | "quote"; text: string; }

const FIELDS = [
  { key: "resultsText", id: "results-field", label: "Результаты", desc: "Что уже достигнуто", color: "#22c55e" },
  { key: "resourcesText", id: "resources-field", label: "Ресурсы", desc: "Что есть в наличии: люди, связи, время", color: "#4F46E5" },
  { key: "challengesText", id: "challenges-field", label: "Вызовы", desc: "Что создаёт трудности, что мешает", color: "#ef4444" },
  { key: "indicatorsText", id: "indicators-field", label: "Индикаторы достижения цели", desc: "Как поймёте, что стало лучше?", color: "#f59e0b" },
];

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

// ─── Field block ─────────────────────────────────────────────────────────────

function FieldBlock({
  field,
  value,
  onChange,
  onBlur,
  aspectTitle,
}: {
  field: typeof FIELDS[0];
  value: string;
  onChange: (v: string) => void;
  onBlur?: (v: string) => void;
  aspectTitle: string;
}) {
  const { isHighlighted, onInteract } = useHighlightedElement(field.id);

  return (
    <div
      id={field.id}
      className={`transition-all ${isHighlighted ? "ai-highlighted rounded-xl" : ""}`}
      onClick={onInteract}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: field.color }} />
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{field.label}</span>
      </div>
      <div className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>{field.desc}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          if (e.target.value.trim()) {
            onBlur?.(e.target.value);
          }
        }}
        placeholder="Введите текст..."
        rows={3}
        className="w-full text-sm resize-none leading-relaxed rounded-xl p-3"
        style={{ background: "var(--surface-2)", border: `1px solid ${field.color}40`, color: "var(--foreground)", outline: "none" }}
        onFocus={(e) => { e.target.style.borderColor = field.color; }}
        onBlurCapture={(e) => { e.target.style.borderColor = `${field.color}40`; }}
      />
    </div>
  );
}

// ─── AI Notes from stage 1 ───────────────────────────────────────────────────

function AiNotesList({ notes }: { notes: NoteItem[] }) {
  if (!notes.length) return null;
  return (
    <div className="space-y-1">
      {notes.map((note, i) => {
        if (note.type === "heading") {
          return <div key={i} className="text-xs font-semibold pt-1" style={{ color: "var(--foreground)" }}>{note.text}</div>;
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

// ─── Stage 2 content ─────────────────────────────────────────────────────────

function Stage2Content({ session }: { session: Session }) {
  const { sendEvent } = useAiEvent();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [localSession, setLocalSession] = useState(session);
  const prevSelectedRef = useRef<string | null>(null);

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
    setSaving(true);
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
    setSaving(false);
  }

  async function handleSelectAspect(code: string) {
    // Autosave previous
    if (prevSelectedRef.current && prevSelectedRef.current !== code) {
      const prev = prevSelectedRef.current;
      const data = draftData[prev] ?? {};
      const hasData = Object.values(data).some((v) => v.trim());
      if (hasData) {
        await saveDeepDive(prev);
      }
    }
    prevSelectedRef.current = code;
    setSelectedCode(code);

    const asp = ASPECTS.find((a) => a.code === code);
    if (asp) sendEvent(`[СОБЫТИЕ: Пользователь открыл аспект «${asp.title}» для углублённого анализа]`);
  }

  const selectedAspect = selectedCode ? ASPECTS.find((a) => a.code === selectedCode) : null;
  const selectedScore = selectedCode ? getScore(selectedCode) : null;
  const aiNotes = selectedCode ? parseSavedNotes(getScore(selectedCode)?.tenOfTenText) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
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
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto px-6 py-4 gap-4">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--foreground)" }}>Этап 2 — Углублённый анализ</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Нажмите на аспект, чтобы заполнить данные.</p>
        </div>

        {/* Compact aspect list */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          {ASPECTS.map((asp, idx) => {
            const sc = getScore(asp.code);
            const dived = isDeepDived(asp.code);
            const isSelected = selectedCode === asp.code;
            const scoreNum = sc?.score ?? null;
            const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : "var(--muted)";
            const filledCount = FIELDS.filter((f) => getDraft(asp.code, f.key).trim()).length;

            return (
              <button
                key={asp.code}
                onClick={() => handleSelectAspect(asp.code)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{
                  background: isSelected ? "#4F46E508" : "transparent",
                  borderBottom: idx < ASPECTS.length - 1 ? "1px solid var(--border)" : "none",
                  border: "none",
                  cursor: "pointer",
                  borderLeft: isSelected ? "3px solid #4F46E5" : "3px solid transparent",
                }}
              >
                {/* Score badge */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: scoreColor + "20", color: scoreColor }}
                >
                  {scoreNum ?? "—"}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: isSelected ? "#4F46E5" : "var(--foreground)" }}>
                    {asp.title}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {filledCount > 0 && (
                    <div className="flex gap-0.5">
                      {FIELDS.map((f, fi) => (
                        <div
                          key={fi}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: getDraft(asp.code, f.key).trim() ? f.color : "var(--border)" }}
                        />
                      ))}
                    </div>
                  )}
                  {dived && (
                    <div className="text-xs w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#22c55e20", color: "#22c55e" }}>
                      ✓
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Edit window */}
        {selectedAspect && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            {/* Aspect header */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: selectedAspect.color + "08" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="inline-block text-xs px-2.5 py-0.5 rounded-full mb-1.5 font-medium"
                    style={{ background: selectedAspect.color + "20", color: selectedAspect.color }}
                  >
                    Оценка: {selectedScore?.score ?? "—"}/10
                  </div>
                  <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>{selectedAspect.title}</h2>
                </div>
                <button
                  onClick={() => saveDeepDive(selectedAspect.code)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 text-white flex-shrink-0"
                  style={{ background: "#4F46E5" }}
                >
                  {saving ? "Сохраняю..." : "Сохранить"}
                </button>
              </div>
            </div>

            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              {/* Fields */}
              {FIELDS.map((field) => (
                <FieldBlock
                  key={field.key}
                  field={field}
                  value={getDraft(selectedAspect.code, field.key)}
                  onChange={(v) => setDraft(selectedAspect.code, field.key, v)}
                  onBlur={(v) => sendEvent(`[СОБЫТИЕ: Пользователь заполнил поле «${field.label}» по аспекту «${selectedAspect.title}»: «${v.trim().slice(0, 120)}»]`)}
                  aspectTitle={selectedAspect.title}
                />
              ))}
            </div>

            {/* AI notes from stage 1 */}
            {aiNotes.length > 0 && (
              <div className="px-5 pb-5">
                <div className="rounded-xl p-4" style={{ background: "#4F46E508", border: "1px solid #4F46E520" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "#4F46E5" }}>✦ Заметки из разговора (этап 1)</div>
                  <AiNotesList notes={aiNotes} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Stage2Page() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionContext, setSessionContext] = useState<string | undefined>(undefined);
  const [aspectCode, setAspectCode] = useState<string | undefined>(undefined);

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
              return `${asp?.title ?? s.aspectCode}: ${s.score}/10`;
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
      aspectCode={aspectCode}
      autoTrigger="Пользователь перешёл к этапу 2 — углублённый анализ. Начни работу."
      sessionContext={sessionContext}
      header={<div />}
    >
      <Stage2Content session={session} />
    </AppShell>
  );
}
