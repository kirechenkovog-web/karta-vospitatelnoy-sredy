"use client";

import Link from "next/link";

interface StageNavProps {
  currentStage: 1 | 2 | 3;
  canGoStage2: boolean;
  canGoStage3: boolean;
}

const stages = [
  { num: 1, label: "Оценка аспектов", path: "/map" },
  { num: 2, label: "Углубление", path: "/stage2" },
  { num: 3, label: "Фокус и стратегия", path: "/stage3" },
];

export default function StageNav({ currentStage, canGoStage2, canGoStage3 }: StageNavProps) {
  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, idx) => {
        const isActive = stage.num === currentStage;
        const isDisabled =
          (stage.num === 2 && !canGoStage2) || (stage.num === 3 && !canGoStage3);

        const el = (
          <div
            key={stage.num}
            className="flex items-center gap-1"
          >
            {idx > 0 && (
              <div
                className="w-8 h-px mx-1"
                style={{ background: "var(--border)" }}
              />
            )}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              }`}
              style={{
                background: isActive ? "#4F46E520" : "transparent",
                color: isActive ? "#4F46E5" : "var(--muted)",
                border: isActive ? "1px solid #4F46E540" : "1px solid transparent",
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: isActive ? "#4F46E5" : "var(--surface-2)",
                  color: isActive ? "#fff" : "var(--muted)",
                }}
              >
                {stage.num}
              </span>
              {stage.label}
            </div>
          </div>
        );

        if (isDisabled) return el;
        return (
          <Link key={stage.num} href={stage.path} className="no-underline">
            {el}
          </Link>
        );
      })}
    </div>
  );
}
