import { useState, useContext, createContext, type ReactNode } from "react";
import { DEFAULT_TYPING_CONFIG } from "../typingDefaults";

export type TypingActivity = "measure" | "practice" | "compete" | "explore";
export type TypingStatus = "idle" | "running" | "finished";

export type CompletionType = "timeEnd" | "textEnd";
export type TypingConfiguration = {
  duration: number;
  wordRange: number;
  completeOn: CompletionType;
  difficulty: {
    punctuation: boolean;
    numbers: boolean;
    uppercase: boolean;
  };
};

export type EndReason = CompletionType | "exit" | "force-exit";
export interface Metrics {
  //TODO: Implement other metrics like consistency, burst
  wpm: number;
  accuracy: number;
  raw: number;
}
export interface TimeLineSnapshot {
  timeStamp: number;
  elapsedTimeMs: number;
  charsTyped: number;
  metrics: Metrics;
}
export type MistakeType = "incorrect" | "miss" | "spam" | "double-tap";
export interface Mistake {
  index: number;
  type: MistakeType;
  typedCharacter: string;
  expectedCharacter: string;
}
export type TypingSession = {
  totalTimeMs: number;
  reason: EndReason;
  timeLine: TimeLineSnapshot[];
  event: { mistakeLog: Mistake[] };
};

type TypingState = {
  activity: TypingActivity;
  status: TypingStatus;
  config: TypingConfiguration;
  session: TypingSession;
};

type TypingAction = {
  setActivity: (activity: TypingActivity) => void;
  setStatus: (status: TypingStatus) => void;
  setConfig: (config: TypingConfiguration) => void;
  setSession: (session: TypingSession) => void;
};

interface TypingContextType {
  typingState: TypingState;
  typingAction: TypingAction;
}

const TypingContext = createContext<TypingContextType | null>(null);

export function TypingProvider({ children }: { children: ReactNode }) {
  const [typingState, setTypingState] = useState<TypingState>({
    activity: "measure",
    status: "idle",
    config: {
      duration: 30,
      wordRange: 25,
      completeOn: "timeEnd",
      difficulty: { punctuation: false, numbers: false, uppercase: false },
    },
    session: {
      timeLine: [
        {
          timeStamp: 0,
          elapsedTimeMs: 0,
          charsTyped: 0,
          metrics: {
            wpm: 0,
            raw: 0,
            accuracy: 0,
          },
        },
      ],
      reason: "exit",
      totalTimeMs: 0,
      event: { mistakeLog: [] },
    },
  });

  const setActivity = (newActivity: TypingActivity) => {
    setTypingState((prev) => ({ ...prev, activity: newActivity }));
  };

  const setStatus = (newStatus: TypingStatus) => {
    setTypingState((prev) => ({ ...prev, status: newStatus }));
  };

  const setConfig = (newConfig: TypingConfiguration) => {
    setTypingState((prev) => ({ ...prev, config: newConfig }));
  };

  const setSession = (newSession: TypingSession) => {
    setTypingState((prev) => ({ ...prev, session: newSession }));
  };

  const typingAction = {
    setActivity,
    setStatus,
    setConfig,
    setSession,
  };

  return (
    <TypingContext value={{ typingState, typingAction }}>
      {children}
    </TypingContext>
  );
}

export function useTypingContext() {
  const context = useContext(TypingContext);
  if (!context) {
    throw new Error("useTypingContext must be used within a TypingProvider");
  }
  return context;
}
