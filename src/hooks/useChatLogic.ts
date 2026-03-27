"use client";

import { useState, useRef, useEffect } from "react";
import { useHighlight } from "@/contexts/HighlightContext";
import { useAiEvent } from "@/contexts/AiEventContext";
import type { NoteItem } from "@/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isEvent?: boolean;
  buttonLabel?: string;
  scoreRequest?: boolean;
}

interface ApiResponse {
  reply?: string;
  error?: string;
  highlightId?: string;
  suggestedScore?: number;
  noteItems?: NoteItem[];
  buttonLabel?: string;
  scoreRequest?: boolean;
}

interface ChatProps {
  sessionId: string;
  stage: number;
  aspectCode?: string;
  autoTrigger: string;
  sessionContext?: string;
  onScoreSuggested?: (score: number) => void;
  onNotesUpdated?: (notes: NoteItem[]) => void;
  onChatButton?: () => void;
}

export function useChatLogic({
  sessionId,
  stage,
  aspectCode,
  autoTrigger,
  sessionContext,
  onScoreSuggested,
  onNotesUpdated,
  onChatButton,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { setHighlight } = useHighlight();
  const { registerHandler } = useAiEvent();

  // Refs hold current values for use inside async callbacks (stale-closure pattern)
  const loadingRef = useRef(false);
  const propsRef = useRef({ sessionId, stage, aspectCode, sessionContext, onScoreSuggested, onNotesUpdated, onChatButton });
  propsRef.current = { sessionId, stage, aspectCode, sessionContext, onScoreSuggested, onNotesUpdated, onChatButton };

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // ─── Core fetch ──────────────────────────────────────────────────────────────

  async function callChat(text: string, history: ChatMessage[], isAuto: boolean): Promise<ApiResponse> {
    const { sessionId, stage, aspectCode, sessionContext } = propsRef.current;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        stage,
        aspectCode,
        message: text,
        history: history
          .filter((m) => !m.isEvent)
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content })),
        isAuto,
        sessionContext,
      }),
    });
    return res.json();
  }

  // ─── Process API response (side-effects: highlight, score, notes) ─────────

  function processResponse(data: ApiResponse): { reply: string; buttonLabel?: string; scoreRequest?: boolean } {
    const reply = data.error ? (data.reply || data.error) : (data.reply ?? "");
    if (data.highlightId) setHighlight(data.highlightId);
    if (data.suggestedScore != null) propsRef.current.onScoreSuggested?.(data.suggestedScore);
    if (data.noteItems?.length) propsRef.current.onNotesUpdated?.(data.noteItems);
    return { reply, buttonLabel: data.buttonLabel ?? undefined, scoreRequest: data.scoreRequest };
  }

  // ─── Register AiEvent handler (called from page via sendEvent) ────────────

  useEffect(() => {
    const unregister = registerHandler(async (eventText: string) => {
      if (loadingRef.current) return;
      const eventMsg: ChatMessage = { role: "user", content: eventText, isEvent: true };
      const history = [...messagesRef.current, eventMsg];
      setMessages(history);
      loadingRef.current = true;
      setLoading(true);
      try {
        const data = await callChat(eventText, history, false);
        const { reply, buttonLabel, scoreRequest } = processResponse(data);
        if (reply || buttonLabel) {
          setMessages((prev) => [...prev, { role: "assistant", content: reply, buttonLabel, scoreRequest }]);
          if (buttonLabel) propsRef.current.onChatButton?.();
        }
      } catch {
        // silent fail for events
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    });
    return unregister;
  }, [registerHandler]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-trigger on context change ──────────────────────────────────────

  useEffect(() => {
    if (!autoTrigger) return;
    loadingRef.current = false;
    setLoading(false);

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const data = await callChat(autoTrigger, messagesRef.current, true);
        if (cancelled) return;
        const { reply, buttonLabel, scoreRequest } = processResponse(data);
        setMessages((prev) => [...prev, { role: "assistant", content: reply, buttonLabel, scoreRequest }]);
        if (buttonLabel) propsRef.current.onChatButton?.();
        if (!data.highlightId) {
          const { stage, aspectCode } = propsRef.current;
          const fallback =
            (stage === 1 && aspectCode ? "score-selector" : null) ||
            (stage === 1 && !aspectCode ? "aspect-card-social_partners" : null) ||
            (stage === 3 ? "focus-selector" : null);
          if (fallback) setHighlight(fallback);
        }
      } catch {
        if (!cancelled) setMessages((prev) => [...prev, { role: "assistant", content: "Не удалось загрузить контекст." }]);
      } finally {
        if (!cancelled) { loadingRef.current = false; setLoading(false); }
      }
    }, 600);

    return () => { cancelled = true; clearTimeout(timer); loadingRef.current = false; setLoading(false); };
  }, [autoTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── User sends a message ─────────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim();
    if (!text || loadingRef.current) return;
    setInput("");
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await callChat(text, history, false);
      const { reply, buttonLabel, scoreRequest } = processResponse(data);
      setMessages((prev) => [...prev, { role: "assistant", content: reply, buttonLabel, scoreRequest }]);
      if (buttonLabel) propsRef.current.onChatButton?.();
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Ошибка соединения." }]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  // ─── User selects a score via buttons ────────────────────────────────────

  async function handleScoreSelect(score: number) {
    if (loadingRef.current) return;
    propsRef.current.onScoreSuggested?.(score);
    const text = String(score);
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await callChat(text, history, false);
      const { reply, buttonLabel, scoreRequest } = processResponse(data);
      setMessages((prev) => [...prev, { role: "assistant", content: reply, buttonLabel, scoreRequest }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Ошибка соединения." }]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  return { messages, input, setInput, loading, handleSend, handleScoreSelect };
}
