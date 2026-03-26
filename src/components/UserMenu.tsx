"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SessionItem {
  id: string;
  createdAt: string;
  status: string;
  scores: { status: string }[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSessions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const email = session?.user?.email ?? "";
  const initial = email[0]?.toUpperCase() ?? "?";

  async function handleShowSessions() {
    setShowSessions(true);
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/session?list=true");
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } finally {
      setSessionsLoading(false);
    }
  }

  function handleNewSession() {
    setOpen(false);
    router.push("/map?new=1");
  }

  function handleSelectSession(id: string) {
    setOpen(false);
    setShowSessions(false);
    router.push(`/map?sessionId=${id}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); setShowSessions(false); }}
        title={email}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "#4F46E520",
          border: "1px solid #4F46E540",
          color: "#4F46E5",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 rounded-xl py-1 z-50"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            minWidth: 220,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <div
            className="px-3 py-2 text-xs truncate"
            style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
          >
            {email}
          </div>

          {!showSessions ? (
            <>
              <button
                onClick={handleNewSession}
                className="w-full text-left px-3 py-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--foreground)", background: "none", border: "none", cursor: "pointer" }}
              >
                + Новая сессия оценки
              </button>
              <button
                onClick={handleShowSessions}
                className="w-full text-left px-3 py-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--foreground)", background: "none", border: "none", cursor: "pointer" }}
              >
                Список сессий
              </button>
              <div style={{ borderTop: "1px solid var(--border)" }} />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-3 py-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowSessions(false)}
                className="w-full text-left px-3 py-2 text-xs transition-opacity hover:opacity-70 flex items-center gap-1"
                style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
              >
                ← Назад
              </button>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {sessionsLoading && (
                  <div className="px-3 py-3 text-xs" style={{ color: "var(--muted)" }}>Загрузка...</div>
                )}
                {!sessionsLoading && sessions.length === 0 && (
                  <div className="px-3 py-3 text-xs" style={{ color: "var(--muted)" }}>Нет сессий</div>
                )}
                {!sessionsLoading && sessions.map((s, i) => {
                  const completed = s.scores.filter((sc) => sc.status === "completed").length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className="w-full text-left px-3 py-2.5 transition-opacity hover:opacity-70"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        borderBottom: i < sessions.length - 1 ? "1px solid var(--border)" : undefined,
                      }}
                    >
                      <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                        Сессия {sessions.length - i}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {formatDate(s.createdAt)}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: completed === 12 ? "#22c55e" : "var(--muted)" }}>
                        Оценено {completed}/12 аспектов
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
