"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--muted)",
        borderRadius: 10,
        width: 34,
        height: 34,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        flexShrink: 0,
        transition: "opacity 0.15s",
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
