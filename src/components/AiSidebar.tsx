"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { useChatLogic } from "@/hooks/useChatLogic";
import type { NoteItem } from "@/types";

interface AiSidebarProps {
  sessionId: string;
  stage: number;
  aspectCode?: string;
  autoTrigger: string;
  sessionContext?: string;
  onScoreSuggested?: (score: number) => void;
  onNotesUpdated?: (notes: NoteItem[]) => void;
  onChatButton?: () => void;
}

const MIN_WIDTH = 44;
const DEFAULT_WIDTH = 510;
const MAX_WIDTH = 700;

export default function AiSidebar(props: AiSidebarProps) {
  const { onChatButton } = props;
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, loading, handleSend, handleScoreSelect } = useChatLogic(props);

  // Drag-to-resize
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(DEFAULT_WIDTH);

  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      setWidth(Math.min(MAX_WIDTH, Math.max(220, dragStartWidth.current + delta)));
    }
    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const actualWidth = collapsed ? MIN_WIDTH : width;

  return (
    <div
      className="flex-shrink-0 flex flex-col h-full relative"
      style={{ width: actualWidth, background: "var(--surface)", borderRight: "1px solid var(--border)", transition: collapsed ? "width 0.2s" : "none" }}
    >
      {/* Drag handle */}
      {!collapsed && (
        <div
          onMouseDown={onMouseDown}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-blue-500 transition-colors"
          style={{ opacity: 0.3 }}
        />
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-5 w-6 h-6 rounded-full flex items-center justify-center z-20 hover:opacity-90"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}
        title={collapsed ? "Развернуть" : "Свернуть"}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {collapsed ? (
        <div className="flex flex-col items-center pt-14 gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#4F46E520", color: "#4F46E5" }}>✦</div>
          {loading && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4F46E5" }} />}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#4F46E520", color: "#4F46E5" }}>✦</div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate" style={{ color: "var(--foreground)", fontSize: 14 }}>AI-наставник</div>
              <div className="truncate" style={{ color: "var(--muted)", fontSize: 12 }}>{loading ? "Думает..." : "Готов помочь"}</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {messages.length === 0 && !loading && (
              <div className="text-center pt-8 leading-relaxed px-4" style={{ color: "var(--muted)", fontSize: 13 }}>
                Наставник готовится...
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.isEvent) {
                return (
                  <div key={i} className="flex justify-center">
                    <div className="px-3 py-1 rounded-full" style={{ background: "var(--surface-2)", color: "var(--muted)", fontSize: 11, border: "1px solid var(--border)" }}>
                      {msg.content.replace(/^\[СОБЫТИЕ:\s*/i, "").replace(/\]$/, "")}
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mr-2 mt-0.5" style={{ background: "#4F46E520", color: "#4F46E5", fontSize: 12 }}>✦</div>
                  )}
                  <div
                    className="px-3 py-2.5 leading-relaxed ai-message-bubble"
                    style={{
                      background: msg.role === "user" ? "#4F46E5" : "var(--surface-2)",
                      color: msg.role === "user" ? "#fff" : "var(--foreground)",
                      maxWidth: "85%",
                      fontSize: 14,
                      borderRadius: msg.role === "assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                    }}
                  >
                    {msg.role === "assistant" && msg.content ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: "0 0 6px 0" }}>{children}</p>,
                          ol: ({ children }) => <ol style={{ margin: "4px 0 6px 0", paddingLeft: 18 }}>{children}</ol>,
                          ul: ({ children }) => <ul style={{ margin: "4px 0 6px 0", paddingLeft: 18 }}>{children}</ul>,
                          li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                          strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : msg.role === "user" ? (
                      msg.content
                    ) : null}

                    {msg.role === "assistant" && msg.scoreRequest && !loading && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Array.from({ length: 10 }, (_, j) => j + 1).map((n) => {
                          const c = n >= 8 ? "#22c55e" : n >= 5 ? "#eab308" : "#ef4444";
                          return (
                            <button
                              key={n}
                              onClick={() => handleScoreSelect(n)}
                              className="w-8 h-8 rounded-xl text-sm font-bold transition-all hover:scale-110 active:scale-95 text-white"
                              style={{ background: c, border: "none", cursor: "pointer" }}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {msg.role === "assistant" && msg.buttonLabel && (
                      <button
                        onClick={() => onChatButton?.()}
                        className="mt-2 w-full py-2 px-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 text-white"
                        style={{ background: "#22c55e", border: "none", cursor: "pointer", display: "block" }}
                      >
                        ✓ {msg.buttonLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mr-2" style={{ background: "#4F46E520", color: "#4F46E5", fontSize: 12 }}>✦</div>
                <div className="px-3 py-2 rounded-xl flex items-center gap-1.5" style={{ background: "var(--surface-2)", fontSize: 16 }}>
                  <span className="animate-pulse" style={{ color: "#4F46E5" }}>●</span>
                  <span className="animate-pulse" style={{ color: "#4F46E5", animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ color: "#4F46E5", animationDelay: "0.4s" }}>●</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Напишите вопрос..."
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-xl"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: 14, minWidth: 0 }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40 text-white flex-shrink-0"
                style={{ background: "#4F46E5", border: "none", cursor: "pointer", fontSize: 16 }}
              >
                ↑
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
