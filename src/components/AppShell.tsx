"use client";

import { ReactNode } from "react";
import { HighlightProvider } from "@/contexts/HighlightContext";
import { AiEventProvider } from "@/contexts/AiEventContext";
import AiSidebar from "@/components/AiSidebar";
import ThemeToggle from "@/components/ThemeToggle";

interface AppShellProps {
  sessionId: string;
  stage: number;
  aspectCode?: string;
  autoTrigger: string;
  sessionContext?: string;
  header: ReactNode;
  children: ReactNode;
}

export default function AppShell({
  sessionId,
  stage,
  aspectCode,
  autoTrigger,
  sessionContext,
  header,
  children,
}: AppShellProps) {
  return (
    <AiEventProvider>
      <HighlightProvider>
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
          {/* Top header */}
          <div className="flex-shrink-0 flex items-center" style={{ borderBottom: "1px solid var(--border)", minHeight: header ? undefined : 0 }}>
            <div className="flex-1">{header}</div>
            <div className="px-3 py-2 flex-shrink-0">
              <ThemeToggle />
            </div>
          </div>

          {/* Body: sidebar + content */}
          <div className="flex-1 flex overflow-hidden">
            {/* AI Sidebar */}
            <AiSidebar
              sessionId={sessionId}
              stage={stage}
              aspectCode={aspectCode}
              autoTrigger={autoTrigger}
              sessionContext={sessionContext}
            />

            {/* Main scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </HighlightProvider>
    </AiEventProvider>
  );
}
