import { useState, useContext, createContext, type ReactNode } from "react";
import {
  DEFAULT_TYPING_CONFIG,
  DEFAULT_TYPING_SESSION,
} from "../typingDefaults";
import type { PauseSegment } from "../engine/typingObserverFactory";

export type TypingActivity = "measure" | "practice" | "compete" | "explore";
export type TypingStatus = "idle" | "running" | "finished";
export type TypingEngagement = "active" | "passive";

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
export type MistakeType =
  | "incorrect"
  | "miss"
  | "repeated"
  | "spam"
  | "doubleTap"
  | "transposed";
export interface Mistake {
  elapsedMs: number;
  index: number;
  type: MistakeType;
  typedCharacter: string;
  expectedCharacter: string;
}

export type KeyAction = "shortcut" | "delete" | "insert";

export interface KeyStroke {
  timestamp: number;
  elapsedMs: number;
  key: string;
  cursorIndex: number;
  action: KeyAction;
  correct: boolean | null;
}

export interface TypingSessionSummary {
  net: {
    totalChars: number;
    correctChars: number;
    incorrectChars: number;
  };
  gross: {
    totalKeyPresses: number;
    totalBackspaces: number;
  };
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
  typed: string | null;

  timeLine: TimeLineSnapshot[];
  pauseEvent: PauseSegment[];
  mistakeEvent: Mistake[];
  keyEvent: KeyStroke[];

  summary: TypingSessionSummary;
}

export type TypingSession = {
  header: TypingSessionHeader;
  body: TypingSessionBody;
};

type TypingState = {
  activity: TypingActivity;
  status: TypingStatus;
  engagement: TypingEngagement;
  config: TypingConfiguration;
  session: TypingSession;
};

type TypingAction = {
  setActivity: (activity: TypingActivity) => void;
  setStatus: (status: TypingStatus) => void;
  setEngagement: (engagement: TypingEngagement) => void;
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
    engagement: "passive",
    config: DEFAULT_TYPING_CONFIG,
    session: DEFAULT_TYPING_SESSION,
  });

  const setActivity = (newActivity: TypingActivity) => {
    setTypingState((prev) => ({ ...prev, activity: newActivity }));
  };

  const setStatus = (newStatus: TypingStatus) => {
    setTypingState((prev) => ({ ...prev, status: newStatus }));
  };

  const setEngagement = (newEngagement: TypingEngagement) => {
    setTypingState((prev) => ({ ...prev, engagement: newEngagement }));
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
    setEngagement,
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
