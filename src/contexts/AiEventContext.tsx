"use client";

import { createContext, useContext, useRef, useCallback, ReactNode } from "react";

type EventHandler = (text: string) => void;

interface AiEventContextType {
  sendEvent: (text: string) => void;
  registerHandler: (fn: EventHandler) => () => void;
}

const AiEventContext = createContext<AiEventContextType>({
  sendEvent: () => {},
  registerHandler: () => () => {},
});

export function AiEventProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<EventHandler | null>(null);

  const sendEvent = useCallback((text: string) => {
    handlerRef.current?.(text);
  }, []);

  const registerHandler = useCallback((fn: EventHandler) => {
    handlerRef.current = fn;
    return () => { handlerRef.current = null; };
  }, []);

  return (
    <AiEventContext.Provider value={{ sendEvent, registerHandler }}>
      {children}
    </AiEventContext.Provider>
  );
}

export function useAiEvent() {
  return useContext(AiEventContext);
}
