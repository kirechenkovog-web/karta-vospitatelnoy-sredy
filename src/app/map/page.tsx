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

// ─── SVG illustrations ─────────────────────────────────────────────────────

function Illus({ code, color, active }: { code: string; color: string; active: boolean }) {
  const s = active ? color : "#4a4a62";
  const f = active ? color + "22" : "#1d1d28";
  const sd = active ? color + "70" : "#2e2e42";

  const map: Record<string, React.ReactNode> = {

    social_partners: (
      <>
        {/* left person */}
        <circle cx="14" cy="16" r="7" fill={f} stroke={s} strokeWidth="1.6" />
        <path d="M6 35 Q14 29 22 35" fill={f} stroke={s} strokeWidth="1.6" />
        {/* right person */}
        <circle cx="66" cy="16" r="7" fill={f} stroke={s} strokeWidth="1.6" />
        <path d="M58 35 Q66 29 74 35" fill={f} stroke={s} strokeWidth="1.6" />
        {/* center node */}
        <circle cx="40" cy="28" r="8" fill={active ? color + "30" : "#232332"} stroke={s} strokeWidth="1.6" />
        <path d="M36 28 L44 28 M40 24 L40 32" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
        {/* connection dashes */}
        <line x1="22" y1="23" x2="32" y2="27" stroke={sd} strokeWidth="1.2" strokeDasharray="3,2" />
        <line x1="48" y1="27" x2="58" y2="23" stroke={sd} strokeWidth="1.2" strokeDasharray="3,2" />
        {/* 3rd person below */}
        <circle cx="40" cy="50" r="6" fill={f} stroke={s} strokeWidth="1.4" />
        <line x1="40" y1="36" x2="40" y2="44" stroke={sd} strokeWidth="1.2" strokeDasharray="3,2" />
      </>
    ),

    school_active: (
      <>
        {/* table */}
        <rect x="18" y="34" width="44" height="5" rx="2" fill={f} stroke={s} strokeWidth="1.5" />
        {/* 4 students */}
        {([14, 28, 52, 66] as number[]).map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy="18" r="6" fill={f} stroke={s} strokeWidth="1.4" />
            <path d={`M${cx - 6} 30 Q${cx} 26 ${cx + 6} 30`} fill={f} stroke={s} strokeWidth="1.4" />
          </g>
        ))}
        {/* raised hand on 1st student */}
        <line x1="14" y1="26" x2="8" y2="14" stroke={s} strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="13" r="3" fill={active ? color + "50" : "#333345"} stroke={s} strokeWidth="1.4" />
        {/* arc under table (chairs) */}
        <path d="M14 46 Q40 42 66 46" stroke={sd} strokeWidth="1.2" fill="none" />
      </>
    ),

    teachers: (
      <>
        {/* whiteboard */}
        <rect x="22" y="8" width="50" height="32" rx="3" fill={f} stroke={s} strokeWidth="1.6" />
        <line x1="28" y1="18" x2="52" y2="18" stroke={sd} strokeWidth="1.3" />
        <line x1="28" y1="24" x2="46" y2="24" stroke={sd} strokeWidth="1.3" />
        <line x1="28" y1="30" x2="55" y2="30" stroke={sd} strokeWidth="1.3" />
        {/* board stand */}
        <line x1="44" y1="40" x2="40" y2="52" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="44" y1="40" x2="48" y2="52" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
        {/* teacher figure */}
        <circle cx="12" cy="16" r="6" fill={f} stroke={s} strokeWidth="1.5" />
        <path d="M6 32 Q12 27 18 32" fill={f} stroke={s} strokeWidth="1.5" />
        {/* pointer */}
        <line x1="18" y1="24" x2="24" y2="21" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),

    students_involvement: (
      <>
        {/* megaphone body */}
        <path d="M6 21 L6 35 L18 35 L36 46 L36 10 L18 21 Z" fill={f} stroke={s} strokeWidth="1.6" />
        {/* sound arcs */}
        <path d="M40 21 Q47 28 40 35" stroke={s} strokeWidth="1.5" fill="none" />
        <path d="M44 17 Q55 28 44 39" stroke={s} strokeWidth="1.4" fill="none" />
        <path d="M49 13 Q64 28 49 43" stroke={sd} strokeWidth="1.2" fill="none" />
        {/* crowd */}
        {([8, 22, 36, 52, 66, 74] as number[]).map((cx, i) => (
          <circle key={i} cx={cx} cy={52} r={4} fill={f} stroke={s} strokeWidth="1.2" />
        ))}
      </>
    ),

    competitions: (
      <>
        {/* star */}
        <path d="M40 4 L42.5 11 L50 11 L44 15.5 L46.5 22 L40 18 L33.5 22 L36 15.5 L30 11 L37.5 11 Z"
          fill={active ? color + "55" : "#2a2a3c"} stroke={s} strokeWidth="1.4" />
        {/* trophy cup */}
        <path d="M24 24 L56 24 L53 40 Q40 50 27 40 Z" fill={f} stroke={s} strokeWidth="1.6" />
        {/* handles */}
        <path d="M24 28 Q14 32 18 40 Q22 46 27 40" fill="none" stroke={s} strokeWidth="1.5" />
        <path d="M56 28 Q66 32 62 40 Q58 46 53 40" fill="none" stroke={s} strokeWidth="1.5" />
        {/* base */}
        <rect x="32" y="50" width="16" height="4" rx="2" fill={f} stroke={s} strokeWidth="1.4" />
        <rect x="28" y="54" width="24" height="0" rx="0" />
      </>
    ),

    federal_events: (
      <>
        {/* calendar body */}
        <rect x="8" y="14" width="52" height="40" rx="3" fill={f} stroke={s} strokeWidth="1.6" />
        {/* header */}
        <rect x="8" y="14" width="52" height="13" rx="3" fill={active ? color + "28" : "#232332"} stroke={s} strokeWidth="1.6" />
        {/* rings */}
        <rect x="22" y="9" width="4" height="9" rx="2" fill={f} stroke={s} strokeWidth="1.5" />
        <rect x="42" y="9" width="4" height="9" rx="2" fill={f} stroke={s} strokeWidth="1.5" />
        {/* day grid */}
        {([0, 1, 2, 3] as number[]).map(row =>
          ([0, 1, 2, 3, 4, 5] as number[]).map(col => {
            const highlighted = (row === 1 && col === 2) || (row === 2 && col === 4);
            return (
              <rect key={`${row}-${col}`}
                x={12 + col * 8} y={31 + row * 7} width="5" height="5" rx="1"
                fill={highlighted ? (active ? color + "60" : "#2e2e44") : "transparent"}
                stroke={highlighted ? s : sd} strokeWidth={highlighted ? 1.4 : 0.8}
              />
            );
          })
        )}
        {/* flag */}
        <line x1="68" y1="10" x2="68" y2="48" stroke={s} strokeWidth="1.5" />
        <path d="M68 10 L78 16 L68 22 Z" fill={active ? color + "50" : "#2a2a3c"} stroke={s} strokeWidth="1.3" />
      </>
    ),

    parents: (
      <>
        {/* house roof */}
        <path d="M12 28 L40 10 L68 28" stroke={s} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        {/* house walls */}
        <rect x="16" y="28" width="48" height="26" fill={f} stroke={s} strokeWidth="1.6" />
        {/* door */}
        <rect x="33" y="38" width="14" height="16" rx="1.5" fill={active ? color + "20" : "#181820"} stroke={s} strokeWidth="1.3" />
        <circle cx="44" cy="46" r="1.2" fill={s} />
        {/* windows */}
        <rect x="20" y="32" width="10" height="9" rx="1" fill={active ? color + "20" : "#181820"} stroke={s} strokeWidth="1.3" />
        <rect x="50" y="32" width="10" height="9" rx="1" fill={active ? color + "20" : "#181820"} stroke={s} strokeWidth="1.3" />
        {/* adult + child left */}
        <circle cx="6" cy="20" r="5" fill={f} stroke={s} strokeWidth="1.3" />
        <path d="M2 30 Q6 26 10 30" fill={f} stroke={s} strokeWidth="1.3" />
        <circle cx="14" cy="22" r="3.5" fill={f} stroke={s} strokeWidth="1.2" />
      </>
    ),

    spaces: (
      <>
        {/* outer walls */}
        <rect x="6" y="6" width="68" height="48" rx="2" fill="none" stroke={s} strokeWidth="2" />
        {/* interior walls */}
        <line x1="6" y1="30" x2="44" y2="30" stroke={s} strokeWidth="1.5" />
        <line x1="44" y1="6" x2="44" y2="54" stroke={s} strokeWidth="1.5" />
        {/* door gaps */}
        <line x1="26" y1="30" x2="33" y2="30" stroke={active ? color : "#141420"} strokeWidth="3" />
        <line x1="44" y1="20" x2="44" y2="27" stroke={active ? color : "#141420"} strokeWidth="3" />
        {/* furniture room 1 (top-left) */}
        <rect x="11" y="11" width="20" height="13" rx="2" fill={f} stroke={sd} strokeWidth="1" />
        <circle cx="18" cy="23" r="2.5" fill={sd} />
        <circle cx="26" cy="23" r="2.5" fill={sd} />
        {/* furniture room 2 (top-right) */}
        <circle cx="58" cy="20" r="9" fill={f} stroke={sd} strokeWidth="1" />
        <circle cx="58" cy="20" r="4" fill={sd} />
        {/* furniture room 3 (bottom) */}
        <rect x="12" y="36" width="22" height="13" rx="2" fill={f} stroke={sd} strokeWidth="1" />
        <rect x="51" y="36" width="18" height="13" rx="2" fill={f} stroke={sd} strokeWidth="1" />
      </>
    ),

    initiatives_center: (
      <>
        {/* bulb glass */}
        <path d="M40 6 C26 6 19 18 19 26 C19 34 23 39 29 44 L29 48 L51 48 L51 44 C57 39 61 34 61 26 C61 18 54 6 40 6 Z"
          fill={f} stroke={s} strokeWidth="1.6" />
        {/* base rings */}
        <rect x="31" y="48" width="18" height="4" rx="1" fill={f} stroke={s} strokeWidth="1.4" />
        <rect x="33" y="52" width="14" height="4" rx="1" fill={f} stroke={s} strokeWidth="1.4" />
        {/* filament */}
        <path d="M33 30 Q37 24 40 30 Q43 36 47 30" stroke={s} strokeWidth="1.5" fill="none" />
        {/* rays */}
        <line x1="40" y1="2" x2="40" y2="0" stroke={sd} strokeWidth="1.5" />
        <line x1="53" y1="7" x2="57" y2="4" stroke={sd} strokeWidth="1.5" />
        <line x1="27" y1="7" x2="23" y2="4" stroke={sd} strokeWidth="1.5" />
        <line x1="63" y1="22" x2="68" y2="20" stroke={sd} strokeWidth="1.5" />
        <line x1="17" y1="22" x2="12" y2="20" stroke={sd} strokeWidth="1.5" />
        {/* inner glow */}
        {active && <ellipse cx="40" cy="28" rx="10" ry="8" fill={color + "18"} />}
      </>
    ),

    collectives: (
      <>
        {/* center circle */}
        <circle cx="40" cy="28" r="7" fill={active ? color + "30" : "#232332"} stroke={s} strokeWidth="1.6" />
        <path d="M37 28 L43 28 M40 25 L40 31" stroke={s} strokeWidth="1.6" strokeLinecap="round" />
        {/* 6 people around */}
        {([0, 1, 2, 3, 4, 5] as number[]).map(i => {
          const angle = (i * 60 - 90) * Math.PI / 180;
          const r = 20;
          const cx = 40 + r * Math.cos(angle);
          const cy = 28 + r * Math.sin(angle);
          return (
            <g key={i}>
              <line
                x1={40 + 8 * Math.cos(angle)} y1={28 + 8 * Math.sin(angle)}
                x2={cx - 6 * Math.cos(angle)} y2={cy - 6 * Math.sin(angle)}
                stroke={sd} strokeWidth="1" strokeDasharray="2,2"
              />
              <circle cx={cx} cy={cy} r={5.5} fill={f} stroke={s} strokeWidth="1.4" />
            </g>
          );
        })}
      </>
    ),

    grants: (
      <>
        {/* document */}
        <rect x="6" y="6" width="38" height="48" rx="3" fill={f} stroke={s} strokeWidth="1.6" />
        <path d="M6 16 L44 16" stroke={s} strokeWidth="1.3" />
        <rect x="6" y="6" width="38" height="10" rx="3" fill={active ? color + "28" : "#232332"} stroke={s} strokeWidth="1.6" />
        <line x1="12" y1="24" x2="38" y2="24" stroke={sd} strokeWidth="1.1" />
        <line x1="12" y1="30" x2="38" y2="30" stroke={sd} strokeWidth="1.1" />
        <line x1="12" y1="36" x2="30" y2="36" stroke={sd} strokeWidth="1.1" />
        {/* checkmark */}
        <path d="M14 44 L19 50 L30 38" stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* coins */}
        <circle cx="62" cy="20" r="12" fill={active ? color + "25" : "#222235"} stroke={s} strokeWidth="1.6" />
        <circle cx="62" cy="20" r="7" fill={f} stroke={sd} strokeWidth="1" />
        <line x1="62" y1="15" x2="62" y2="25" stroke={s} strokeWidth="1.5" />
        <line x1="58" y1="18" x2="66" y2="18" stroke={s} strokeWidth="1.2" />
        <line x1="58" y1="22" x2="66" y2="22" stroke={s} strokeWidth="1.2" />
        <circle cx="68" cy="36" r="9" fill={active ? color + "18" : "#1e1e2c"} stroke={sd} strokeWidth="1.2" />
        <circle cx="54" cy="42" r="7" fill={active ? color + "14" : "#1a1a28"} stroke={sd} strokeWidth="1" />
      </>
    ),

    professional_dev: (
      <>
        {/* bars */}
        <rect x="8" y="40" width="12" height="14" rx="1.5" fill={f} stroke={s} strokeWidth="1.5" />
        <rect x="24" y="30" width="12" height="24" rx="1.5" fill={f} stroke={s} strokeWidth="1.5" />
        <rect x="40" y="20" width="12" height="34" rx="1.5" fill={f} stroke={s} strokeWidth="1.5" />
        <rect x="56" y="10" width="12" height="44" rx="1.5" fill={active ? color + "30" : "#252535"} stroke={s} strokeWidth="1.5" />
        {/* trend line */}
        <path d="M14 38 L30 28 L46 18 L62 8" stroke={s} strokeWidth="1.5" strokeDasharray="3,2" fill="none" />
        {/* graduation cap */}
        <path d="M58 4 L72 9 L58 14 L44 9 Z" fill={active ? color + "40" : "#252535"} stroke={s} strokeWidth="1.4" />
        <line x1="72" y1="9" x2="72" y2="18" stroke={s} strokeWidth="1.4" />
        <circle cx="72" cy="20" r="2.5" fill={s} />
        {/* x axis */}
        <line x1="4" y1="54" x2="72" y2="54" stroke={sd} strokeWidth="1" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 80 58" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {map[code] ?? null}
    </svg>
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
        className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ${isHighlighted ? "ai-highlighted" : ""}`}
        style={{
          background: isCompleted ? aspect.color + "14" : "var(--surface)",
          border: `${isCompleted ? "2px" : "1px"} solid ${isCompleted ? aspect.color + "55" : "var(--border)"}`,
          minHeight: 190,
          opacity: isCompleted ? 1 : 0.72,
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
          <Illus code={aspect.code} color={aspect.color} active={isCompleted} />
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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#3b82f6" }}>
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
            style={{ width: `${(completedCount / 12) * 100}%`, background: "#3b82f6" }}
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
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    const name = localStorage.getItem("userName") || "";
    setUserName(name);
    if (!sessionId) { router.push("/"); return; }

    fetch(`/api/session?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.push("/");
        else setSession(data);
      })
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
      <MapContent session={session} userName={userName} />
    </AppShell>
  );
}
