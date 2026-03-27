"use client";

import { ReactNode } from "react";
import { HighlightProvider } from "@/contexts/HighlightContext";
import { AiEventProvider } from "@/contexts/AiEventContext";
import AiSidebar from "@/components/AiSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";

interface NoteItem { type: "heading" | "bullet" | "quote"; text: string; }

interface AppShellProps {
  sessionId: string;
  stage: number;
  aspectCode?: string;
  autoTrigger: string;
  sessionContext?: string;
  header: ReactNode;
  children: ReactNode;
  onScoreSuggested?: (score: number) => void;
  onNotesUpdated?: (notes: NoteItem[]) => void;
  onChatButton?: () => void;
}

export default function AppShell({
  sessionId,
  stage,
  aspectCode,
  autoTrigger,
  sessionContext,
  header,
  children,
  onScoreSuggested,
  onNotesUpdated,
  onChatButton,
}: AppShellProps) {
  return (
    <AiEventProvider>
      <HighlightProvider>
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
          {/* Top header */}
          <div className="flex-shrink-0 flex items-center" style={{ borderBottom: "1px solid var(--border)", minHeight: header ? undefined : 0 }}>
            <div className="flex-1">{header}</div>
            <div className="px-3 py-2 flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              <UserMenu />
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
              onScoreSuggested={onScoreSuggested}
              onNotesUpdated={onNotesUpdated}
              onChatButton={onChatButton}
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
