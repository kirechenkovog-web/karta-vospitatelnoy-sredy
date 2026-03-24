"use client";

import { ReactNode } from "react";
import { HighlightProvider } from "@/contexts/HighlightContext";
import { AiEventProvider } from "@/contexts/AiEventContext";
import AiSidebar from "@/components/AiSidebar";

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
          <div className="flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            {header}
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
