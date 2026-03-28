"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ASPECTS } from "@/data/aspects";
import AppShell from "@/components/AppShell";
import StageNav from "@/components/StageNav";
import { useHighlightedElement } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";
import { FieldIcon, DEEP_FIELDS as FIELD_DEFS, type FieldKey } from "@/components/FieldIcons";
import type { NoteItem, AspectScore, DeepDive } from "@/types";
import { getScoreColor, parseSavedNotes } from "@/lib/utils";

interface Session {
  id: string;
  scores: AspectScore[];
  deepDives: DeepDive[];
}

const FIELDS = [
  { key: "resultsText" as FieldKey, id: "results-field", label: "Результаты", desc: "Что уже достигнуто", color: "#22c55e" },
  { key: "resourcesText" as FieldKey, id: "resources-field", label: "Ресурсы", desc: "Что есть в наличии: люди, связи, время", color: "#4F46E5" },
  { key: "challengesText" as FieldKey, id: "challenges-field", label: "Вызовы", desc: "Что создаёт трудности, что мешает", color: "#ef4444" },
  { key: "indicatorsText" as FieldKey, id: "indicators-field", label: "Индикаторы достижения цели", desc: "Как поймёте, что стало лучше?", color: "#f59e0b" },
];

// ─── Placeholders per aspect × field ─────────────────────────────────────────

const FIELD_EXAMPLES: Record<string, Record<string, string>> = {
  social_partners: {
    resultsText: "Например:5 партнёров, с которыми регулярно проводим совместные мероприятия",
    resourcesText: "Например:муниципальный координатор с широкой сетью контактов",
    challengesText: "Например:большинство партнёров не понимают, чем могут помочь школе",
    indicatorsText: "Например:не менее 3 совместных мероприятий в следующем семестре",
  },
  school_active: {
    resultsText: "Например:действующий совет активистов из 15 учеников 7–11 классов",
    resourcesText: "Например:отдельный кабинет и бюджет на нужды совета",
    challengesText: "Например:большинство активистов — одни и те же, новые не приходят",
    indicatorsText: "Например:активисты самостоятельно организовали хотя бы 2 мероприятия",
  },
  teachers: {
    resultsText: "Например:12 педагогов ведут внеурочную деятельность",
    resourcesText: "Например:завуч поддерживает инициативы, есть методист по воспитанию",
    challengesText: "Например:педагоги воспринимают воспитательную работу как дополнительную нагрузку",
    indicatorsText: "Например:каждый классный руководитель провёл хотя бы 1 открытое мероприятие",
  },
  students_involvement: {
    resultsText: "Например:70% учеников участвуют хотя бы в одном кружке или мероприятии",
    resourcesText: "Например:разнообразие кружков — спорт, творчество, волонтёрство",
    challengesText: "Например:старшеклассники практически не вовлечены — считают занятия «детскими»",
    indicatorsText: "Например:доля вовлечённых 10–11 классников выросла с 30% до 50%",
  },
  competitions: {
    resultsText: "Например:8 призовых мест в муниципальных и региональных конкурсах за год",
    resourcesText: "Например:педагоги, готовые быть наставниками конкурсантов",
    challengesText: "Например:дети не знают о конкурсах — информация теряется",
    indicatorsText: "Например:каждый класс подал хотя бы одну заявку на конкурс",
  },
  federal_events: {
    resultsText: "Например:все федеральные мероприятия календаря отражены в плане школы",
    resourcesText: "Например:завуч координирует план, есть шаблоны отчётности",
    challengesText: "Например:сжатые сроки — узнаём о мероприятии за 3 дня",
    indicatorsText: "Например:план на следующий семестр готов до его начала",
  },
  parents: {
    resultsText: "Например:родительский комитет активно участвует в организации мероприятий",
    resourcesText: "Например:группа в мессенджере, куратор из числа родителей",
    challengesText: "Например:приходит одна и та же группа из 5–7 родителей, остальные пассивны",
    indicatorsText: "Например:на следующем родительском собрании явка выше 60%",
  },
  spaces: {
    resultsText: "Например:оформлен стенд достижений, работает зона отдыха в холле",
    resourcesText: "Например:небольшой бюджет на оформление, инициативные педагоги",
    challengesText: "Например:пространства устарели, ученики не чувствуют их «своими»",
    indicatorsText: "Например:ученики сами предложили и реализовали оформление одного пространства",
  },
  initiatives_center: {
    resultsText: "Например:центр запущен, проведено 3 проектных сессии с учениками",
    resourcesText: "Например:куратор центра, методические материалы по социальному проектированию",
    challengesText: "Например:дети не понимают, чем центр отличается от обычного кружка",
    indicatorsText: "Например:не менее 5 ученических инициатив доведено до реализации",
  },
  collectives: {
    resultsText: "Например:работает 6 творческих коллективов, суммарно 80 участников",
    resourcesText: "Например:педагоги-руководители коллективов, площадки для репетиций",
    challengesText: "Например:коллективы существуют сами по себе, не связаны с общей жизнью школы",
    indicatorsText: "Например:каждый коллектив выступил на общешкольном мероприятии",
  },
  grants: {
    resultsText: "Например:получен 1 грант на 150 000 ₽ на развитие волонтёрства",
    resourcesText: "Например:педагог с опытом написания заявок, связи с фондами",
    challengesText: "Например:не хватает времени на подготовку заявок",
    indicatorsText: "Например:подана хотя бы 1 заявка на грант в следующем полугодии",
  },
  professional_dev: {
    resultsText: "Например:5 педагогов прошли курсы по воспитательной работе в этом году",
    resourcesText: "Например:бюджет на обучение, доступ к платформе Сферум",
    challengesText: "Например:педагоги не видят связи между курсами и своей реальной работой",
    indicatorsText: "Например:каждый педагог-воспитатель применил 1 новый метод на практике",
  },
};

// ─── Field block ─────────────────────────────────────────────────────────────

function FieldBlock({
  field,
  value,
  onChange,
  onBlur,
  aspectCode,
}: {
  field: typeof FIELDS[0];
  value: string;
  onChange: (v: string) => void;
  onBlur?: (v: string) => void;
  aspectCode: string;
}) {
  const { isHighlighted, onInteract } = useHighlightedElement(field.id);
  const [newItem, setNewItem] = useState("");

  const items = value ? value.split("\n").filter((s) => s.trim()) : [];

  function addItem() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    const next = [...items, trimmed].join("\n");
    onChange(next);
    onBlur?.(next);
    setNewItem("");
    onInteract();
  }

  function removeItem(idx: number) {
    const next = items.filter((_, i) => i !== idx).join("\n");
    onChange(next);
  }

  return (
    <div
      id={field.id}
      className={`transition-all ${isHighlighted ? "ai-highlighted rounded-xl" : ""}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <FieldIcon fieldKey={field.key} color={field.color} size={14} />
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{field.label}</span>
      </div>
      <div className="text-xs mb-2" style={{ color: "var(--muted)" }}>{field.desc}</div>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
              style={{ background: field.color + "10", border: `1px solid ${field.color}30` }}
            >
              <span className="text-sm leading-snug" style={{ color: "var(--foreground)" }}>{item}</span>
              <button
                onClick={() => removeItem(i)}
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs hover:opacity-70"
                style={{ background: field.color + "25", color: field.color, border: "none", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="flex gap-2 items-end">
        <textarea
          value={newItem}
          rows={1}
          onChange={(e) => {
            setNewItem(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addItem(); } }}
          placeholder={items.length === 0 ? (FIELD_EXAMPLES[aspectCode]?.[field.key] ?? `Добавить ${field.label.toLowerCase()}...`) : `Добавить ещё...`}
          className="flex-1 px-3 py-2 rounded-xl text-sm resize-none overflow-hidden leading-relaxed"
          style={{ background: "var(--surface-2)", border: `1px solid ${field.color}40`, color: "var(--foreground)", outline: "none", minHeight: "38px" }}
          onFocus={(e) => { e.target.style.borderColor = field.color; }}
          onBlur={(e) => { e.target.style.borderColor = `${field.color}40`; }}
        />
        <button
          onClick={addItem}
          disabled={!newItem.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-light disabled:opacity-40 flex-shrink-0"
          style={{ background: field.color, border: "none", cursor: "pointer" }}
        >
          +
        </button>
      </div>
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
  }

  const selectedAspect = selectedCode ? ASPECTS.find((a) => a.code === selectedCode) : null;
  const selectedScore = selectedCode ? getScore(selectedCode) : null;
  const aiNotes = selectedCode ? parseSavedNotes(getScore(selectedCode)?.tenOfTenText) : [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
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

      <div className="flex flex-col px-6 py-4 gap-4">
        <div>
          <h1 className="text-xl font-bold mb-0.5" style={{ color: "var(--foreground)" }}>Этап 2 — Углублённый анализ</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Нажмите на аспект, чтобы заполнить данные.</p>
        </div>

        {/* Aspect grid — same style as stage 3 */}
        <div className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Выберите аспект для анализа</div>
            <div className="flex items-center gap-3">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-1">
                  <FieldIcon fieldKey={f.key} color={f.color} size={11} />
                  <span style={{ color: f.color, fontSize: 11, fontWeight: 500 }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ASPECTS.map((asp) => {
              const sc = getScore(asp.code);
              const dived = isDeepDived(asp.code);
              const isSelected = selectedCode === asp.code;
              const scoreNum = sc?.score ?? null;
              const scoreColor = scoreNum !== null ? getScoreColor(scoreNum) : "var(--muted)";

              const filledFields = FIELDS.filter((f) => draftData[asp.code]?.[f.key]?.trim());

              return (
                <button
                  key={asp.code}
                  onClick={() => handleSelectAspect(asp.code)}
                  className="p-3 rounded-xl text-left transition-all relative overflow-hidden"
                  style={{
                    background: isSelected ? "#4F46E508" : "var(--surface)",
                    border: isSelected ? "2px solid #4F46E5" : "1px solid var(--border)",
                    cursor: "pointer",
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
                      <div className="text-sm font-semibold truncate" style={{ color: isSelected ? "#4F46E5" : "var(--foreground)" }}>
                        {asp.shortTitle}
                      </div>
                      {(isSelected || dived) && (
                        <div className="text-xs" style={{ color: isSelected ? "#4F46E5" : "#22c55e" }}>
                          {isSelected ? "✓ открыт" : "✓ заполнен"}
                        </div>
                      )}
                    </div>
                  </div>
                  {dived && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {FIELDS.flatMap((f) => {
                        const items = (draftData[asp.code]?.[f.key] ?? "").split("\n").filter((s) => s.trim());
                        return items.slice(0, 3).map((item, i) => (
                          <div key={`${f.key}-${i}`} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: f.color + "12", border: `1px solid ${f.color}30` }}>
                            <FieldIcon fieldKey={f.key} color={f.color} size={9} />
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
                  aspectCode={selectedAspect.code}
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
    const sidFromUrl = new URLSearchParams(window.location.search).get("sid");

    const loadById = (sid: string) =>
      fetch(`/api/session?sessionId=${sid}`)
        .then((r) => r.json())
        .then((full) => {
          if (full.error) { router.push("/login"); return; }
          const completed = full.scores?.filter((s: AspectScore) => s.status === "completed") ?? [];
          const lines = completed.map((s: AspectScore) => {
            const asp = ASPECTS.find((a) => a.code === s.aspectCode);
            return `${asp?.title ?? s.aspectCode}: ${s.score}/10`;
          });
          if (lines.length > 0) {
            setSessionContext(`Оценены аспекты: ${lines.join(", ")}.`);
          }
          setSession(full);
        });

    if (sidFromUrl) {
      loadById(sidFromUrl);
      return;
    }

    fetch("/api/session", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/login"); return; }
        const session = data.session ?? data;
        loadById(session.id);
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
