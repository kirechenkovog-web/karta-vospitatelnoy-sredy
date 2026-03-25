"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const email = session?.user?.email ?? "";
  const initial = email[0]?.toUpperCase() ?? "?";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={email}
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "#3b82f620",
          border: "1px solid #3b82f640",
          color: "#3b82f6",
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
            minWidth: 180,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <div
            className="px-3 py-2 text-xs truncate"
            style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}
          >
            {email}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left px-3 py-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--foreground)", background: "none", border: "none", cursor: "pointer" }}
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
