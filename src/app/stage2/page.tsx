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
  { key: "resultsText", id: "results-field", label: "Результаты", desc: "Что уже достигнуто", color: "#22c55e" },
  { key: "resourcesText", id: "resources-field", label: "Ресурсы", desc: "Что есть в наличии", color: "#3b82f6" },
  { key: "challengesText", id: "challenges-field", label: "Вызовы", desc: "Что создаёт трудности", color: "#ef4444" },
  { key: "indicatorsText", id: "indicators-field", label: "Индикаторы", desc: "Как понять, что стало лучше", color: "#f59e0b" },
];

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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#3b82f6" }}>КВС</div>
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
        <p className="text-xs" style={{ color: "var(--muted)" }}>Выберите значимые аспекты и опишите результаты, ресурсы, вызовы и индикаторы.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ASPECTS.map((asp) => {
          const sc = getScore(asp.code);
          const dived = isDeepDived(asp.code);
          const isOpen = openCode === asp.code;

          return (
            <div key={asp.code} className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface)", border: `1px solid ${dived ? asp.color + "60" : "var(--border)"}` }}>
              <button
                onClick={() => setOpenCode(isOpen ? null : asp.code)}
                className="w-full flex items-center justify-between p-4 text-left"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: asp.color + "20", color: asp.color }}>
                    {sc?.score ?? "—"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{asp.shortTitle}</div>
                    {dived && <div className="text-xs" style={{ color: asp.color }}>✓ Углублён</div>}
                  </div>
                </div>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="pt-3 grid grid-cols-2 gap-3">
                    {FIELDS.map((field) => {
                      return (
                        <FieldBlock
                          key={field.key}
                          field={field}
                          value={getDraft(asp.code, field.key)}
                          onChange={(v) => setDraft(asp.code, field.key, v)}
                          onBlur={(v) => { if (v.trim()) sendEvent(`[СОБЫТИЕ: Пользователь заполнил поле «${field.label}» по аспекту «${asp.shortTitle}»: «${v.trim()}»]`); }}
                        />
                      );
                    })}
                  </div>
                  <button
                    onClick={() => saveDeepDive(asp.code)}
                    disabled={saving === asp.code}
                    className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 text-white"
                    style={{ background: asp.color }}
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
  field: { key: string; id: string; label: string; desc: string; color: string };
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
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: field.color }} />
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
