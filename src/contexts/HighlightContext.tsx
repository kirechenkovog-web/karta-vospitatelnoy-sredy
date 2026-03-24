"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

interface HighlightContextType {
  highlightedId: string | null;
  setHighlight: (id: string | null) => void;
  clearHighlight: (id: string) => void;
}

const HighlightContext = createContext<HighlightContextType>({
  highlightedId: null,
  setHighlight: () => {},
  clearHighlight: () => {},
});

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setHighlight = useCallback((id: string | null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHighlightedId(id);
    if (id) {
      timerRef.current = setTimeout(() => setHighlightedId(null), 8000);
    }
  }, []);

  const clearHighlight = useCallback((id: string) => {
    setHighlightedId((prev) => (prev === id ? null : prev));
  }, []);

  return (
    <HighlightContext.Provider value={{ highlightedId, setHighlight, clearHighlight }}>
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlight() {
  return useContext(HighlightContext);
}

export function useHighlightedElement(id: string) {
  const { highlightedId, clearHighlight } = useContext(HighlightContext);
  const isHighlighted = highlightedId === id;

  const onInteract = useCallback(() => {
    clearHighlight(id);
  }, [id, clearHighlight]);

  return { isHighlighted, onInteract };
}
