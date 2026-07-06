import { useState, useContext, createContext, type ReactNode } from "react";
import {
  DEFAULT_TYPING_CONFIG,
  DEFAULT_TYPING_SESSION,
} from "../typingDefaults";

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
  deltaTimeMs: number;
  correctChars: number;
  totalChars: number;
}
export type MistakeType = "incorrect" | "miss" | "spam" | "double-tap";
export interface Mistake {
  index: number;
  type: MistakeType;
  typedCharacter: string;
  expectedCharacter: string;
}

export type KeyAction = "shortcut" | "delete" | "insert";

export interface KeyStroke {
  prevKeyTimeStamp: number | null;
  timestamp: number;
  key: string;
  cursorIndex: number;
  action: KeyAction;
}

export interface TypingSessionHeader {
  id: string | null;
  startTimestamp: number | null;
  endTimestamp: number | null;
  configuration: TypingConfiguration;
  reason: EndReason;
}
export interface TypingSessionBody {
  text: string | null;
  timeLine: TimeLineSnapshot[];
  event: {
    mistakeEvent: Mistake[];
    keyEvent: KeyStroke[];
  };
}

export type TypingSession = {
  header: TypingSessionHeader;
  body: TypingSessionBody;
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
    config: DEFAULT_TYPING_CONFIG,
    session: DEFAULT_TYPING_SESSION,
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
