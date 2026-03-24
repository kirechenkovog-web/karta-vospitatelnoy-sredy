"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useHighlight } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  isEvent?: boolean;
}

interface AiSidebarProps {
  sessionId: string;
  stage: number;
  aspectCode?: string;
  autoTrigger: string;
  sessionContext?: string;
}

const MIN_WIDTH = 44;
const DEFAULT_WIDTH = 340;
const MAX_WIDTH = 600;

export default function AiSidebar({
  sessionId,
  stage,
  aspectCode,
  autoTrigger,
  sessionContext,
}: AiSidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { setHighlight } = useHighlight();
  const { registerHandler } = useAiEvent();

  const loadingRef = useRef(false);
  const sessionRef = useRef(sessionId);
  const stageRef = useRef(stage);
  const aspectRef = useRef(aspectCode);
  const sessionContextRef = useRef(sessionContext);
  const messagesRef = useRef(messages);

  sessionRef.current = sessionId;
  stageRef.current = stage;
  aspectRef.current = aspectCode;
  sessionContextRef.current = sessionContext;
  messagesRef.current = messages;

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
      const newWidth = Math.min(MAX_WIDTH, Math.max(220, dragStartWidth.current + delta));
      setWidth(newWidth);
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

  async function callChat(text: string, history: Message[], isAuto: boolean) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionRef.current,
        stage: stageRef.current,
        aspectCode: aspectRef.current,
        message: text,
        history: history
          .filter((m) => !m.isEvent)
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content })),
        isAuto,
        sessionContext: sessionContextRef.current,
      }),
    });
    return res.json();
  }

  // Register event handler — called from page components via useAiEvent()
  useEffect(() => {
    const unregister = registerHandler(async (eventText: string) => {
      if (loadingRef.current) return;

      const eventMsg: Message = { role: "user", content: eventText, isEvent: true };
      const updatedHistory = [...messagesRef.current, eventMsg];
      setMessages(updatedHistory);

      loadingRef.current = true;
      setLoading(true);
      try {
        const data = await callChat(eventText, updatedHistory, false);
        const reply = data.reply || data.error || "Ошибка";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        if (data.highlightId) setHighlight(data.highlightId);
      } catch {
        // silent fail for events
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    });
    return unregister;
  }, [registerHandler, setHighlight]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-trigger on context change
  useEffect(() => {
    if (!autoTrigger) return;
    setMessages([]);
    setLoading(false);
    loadingRef.current = false;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const data = await callChat(autoTrigger, [], true);
        if (cancelled) return;
        const reply = data.reply || data.error || "Ошибка";
        setMessages([{ role: "assistant", content: reply }]);
        // Use AI highlight or fallback by stage context
        const hl = data.highlightId ||
          (stageRef.current === 1 && aspectRef.current ? "score-selector" : null) ||
          (stageRef.current === 1 && !aspectRef.current ? "aspect-card-social_partners" : null) ||
          (stageRef.current === 3 ? "focus-selector" : null);
        if (hl) setHighlight(hl);
      } catch {
        if (!cancelled) setMessages([{ role: "assistant", content: "Не удалось загрузить контекст." }]);
      } finally {
        if (!cancelled) { loadingRef.current = false; setLoading(false); }
      }
    }, 600);

    return () => { cancelled = true; clearTimeout(timer); loadingRef.current = false; setLoading(false); };
  }, [autoTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await callChat(text, newMessages, false);
      const reply = data.reply || data.error || "Ошибка";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (data.highlightId) setHighlight(data.highlightId);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Ошибка соединения." }]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#3b82f620", color: "#3b82f6" }}>✦</div>
          {loading && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#3b82f6" }} />}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#3b82f620", color: "#3b82f6" }}>✦</div>
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
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mr-2 mt-0.5" style={{ background: "#3b82f620", color: "#3b82f6", fontSize: 12 }}>✦</div>
                  )}
                  <div
                    className="px-3 py-2.5 leading-relaxed ai-message-bubble"
                    style={{
                      background: msg.role === "user" ? "#3b82f6" : "var(--surface-2)",
                      color: msg.role === "user" ? "#fff" : "var(--foreground)",
                      maxWidth: "85%",
                      fontSize: 14,
                      borderRadius: msg.role === "assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                    }}
                  >
                    {msg.role === "assistant" ? (
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
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mr-2" style={{ background: "#3b82f620", color: "#3b82f6", fontSize: 12 }}>✦</div>
                <div className="px-3 py-2 rounded-xl flex items-center gap-1.5" style={{ background: "var(--surface-2)", fontSize: 16 }}>
                  <span className="animate-pulse" style={{ color: "#3b82f6" }}>●</span>
                  <span className="animate-pulse" style={{ color: "#3b82f6", animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ color: "#3b82f6", animationDelay: "0.4s" }}>●</span>
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
                style={{ background: "#3b82f6", border: "none", cursor: "pointer", fontSize: 16 }}
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
