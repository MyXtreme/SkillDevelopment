import { useState, useContext, createContext, type ReactNode } from "react";

export type TypingActivity = "measure" | "practice" | "compete" | "explore";
export type TypingStatus = "idle" | "running" | "finished";
export type TypingConfiguration = {
  duration: number;
  content: "random" | "story" | "quote";
  difficulty: {
    punctuation: boolean;
    numbers: boolean;
    uppercase: boolean;
  };
};
export type TypingSession = {
  id: number;
  summary: {
    wpm: number;
    accuracy: number;
    raw: number;
    consistency: number;
  };
  timeline: {
    wpm: number[];
    raw: number[];
    mistakes: number[];
  };
  analysis: {
    weakWords: string[];
    weakKeys: string[];
    burstMoments: number[];
  };
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
      content: "random",
      difficulty: { punctuation: false, numbers: false, uppercase: false },
    },
    session: {
      id: 0,
      summary: {
        wpm: 0,
        accuracy: 0,
        raw: 0,
        consistency: 0,
      },
      timeline: {
        wpm: [],
        raw: [],
        mistakes: [],
      },
      analysis: {
        weakWords: [],
        weakKeys: [],
        burstMoments: [],
      },
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
