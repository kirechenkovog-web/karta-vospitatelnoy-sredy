"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiChatProps {
  sessionId: string;
  stage: number;
  aspectCode?: string;
  initialMessage?: string;
}

export default function AiChat({ sessionId, stage, aspectCode, initialMessage }: AiChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (open && !initialized.current && initialMessage) {
      initialized.current = true;
      setMessages([{ role: "assistant", content: initialMessage }]);
    }
  }, [open, initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          stage,
          aspectCode,
          message: text,
          history: newMessages.slice(-8),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || data.error }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Ошибка соединения. Попробуйте ещё раз." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div
          className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            width: 360,
            height: 480,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                style={{ background: "#4F46E520" }}
              >
                🤖
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  AI-наставник
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  Помогает думать, не решает за вас
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-lg leading-none hover:opacity-70 transition-opacity"
              style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center text-sm pt-8" style={{ color: "var(--muted)" }}>
                Задайте вопрос или попросите помочь с формулировкой
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="px-3 py-2 rounded-xl text-sm leading-relaxed max-w-[85%]"
                  style={{
                    background: msg.role === "user" ? "#4F46E5" : "var(--surface-2)",
                    color: msg.role === "user" ? "#fff" : "var(--foreground)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ background: "var(--surface-2)", color: "var(--muted)" }}
                >
                  Думаю...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 p-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Напишите сообщение..."
              className="flex-1 px-3 py-2 rounded-xl text-sm"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40 text-white"
              style={{ background: "#4F46E5" }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-white"
        style={{ background: open ? "#1d4ed8" : "#4F46E5" }}
        title="AI-наставник"
      >
        {open ? "×" : "✦"}
      </button>
    </div>
  );
}
