import {
  type TimeLineSnapshot,
  type TypingSession,
  type Mistake,
  type MistakeType,
  type EndReason,
  type TypingConfiguration,
  type TypingSessionHeader,
  type KeyStroke,
  type TypingSessionSummary,
  type KeyAction,
} from "../context/TypingContext";
import {
  DEFAULT_TYPING_SESSION,
  PERFORMANCE_THRESHOLDS,
} from "../typingDefaults";
import type { PauseSegment } from "./typingObserverFactory";

interface ProgressSnapshot {
  totalChars: number;
  correctChars: number;
  incorrectChars: number;
}
export function evaluateText(
  expectedTextSlice: string,
  typedTextSlice: string,
): ProgressSnapshot {
  const fallbackResponse: ProgressSnapshot = {
    totalChars: 0,
    correctChars: 0,
    incorrectChars: 0,
  };

  if (!expectedTextSlice || !typedTextSlice) {
    return fallbackResponse;
  }

  let correctChars = 0;
  let incorrectChars = 0;
  const totalChars = typedTextSlice.length;

  for (let i = 0; i < totalChars; i++) {
    const typedChar = typedTextSlice[i];
    const expectedChar = expectedTextSlice[i];

    if (expectedChar === undefined) {
      incorrectChars += totalChars - i;
      break;
    }

    if (typedChar === expectedChar) {
      correctChars++;
    } else {
      incorrectChars++;
    }
  }
  return {
    totalChars,
    correctChars,
    incorrectChars,
  };
}

export interface MistakeStreakState {
  lastTypedChar: string | null;
  lastStrokeCorrect: boolean;
  lastIncorrectChar: string | null;
  consecutiveErrorCount: number;
}

export const initialStreakState = (): MistakeStreakState => ({
  lastTypedChar: null,
  lastStrokeCorrect: true,
  lastIncorrectChar: null,
  consecutiveErrorCount: 0,
});

export interface ClassifyResult {
  type: MistakeType | null;
  shouldBlock: boolean;
  nextState: MistakeStreakState;
}

export function classifyKeystroke(
  key: string,
  expectedChar: string | null,
  state: MistakeStreakState,
): ClassifyResult {
  const isCorrect = key === expectedChar;

  if (isCorrect) {
    return {
      type: null,
      shouldBlock: false,
      nextState: {
        lastTypedChar: key,
        lastStrokeCorrect: true,
        lastIncorrectChar: null,
        consecutiveErrorCount: 0,
      },
    };
  }

  if (/\s/.test(key) && expectedChar && !/\s/.test(expectedChar)) {
    return {
      type: "miss",
      shouldBlock: false,
      nextState: {
        ...state,
        lastIncorrectChar: null,
        consecutiveErrorCount: 0,
      },
    };
  }

  if (key === state.lastIncorrectChar) {
    const count = state.consecutiveErrorCount + 1;
    const isSpam = count > PERFORMANCE_THRESHOLDS.SPAM_THRESHOLD;
    return {
      type: isSpam ? "spam" : "repeated",
      shouldBlock: isSpam,
      nextState: { ...state, consecutiveErrorCount: count },
    };
  }

  if (key === state.lastTypedChar && state.lastStrokeCorrect) {
    return {
      type: "doubleTap",
      shouldBlock: false,
      nextState: { ...state, lastIncorrectChar: key, consecutiveErrorCount: 1 },
    };
  }

  return {
    type: "incorrect",
    shouldBlock: false,
    nextState: { ...state, lastIncorrectChar: key, consecutiveErrorCount: 1 },
  };
}

export function createTypingSessionRecorder(
  sessionConfig: TypingConfiguration | null,
) {
  let timeLine: TimeLineSnapshot[] = [];
  let mistakeEvent: Mistake[] = [];
  let keyEvent: KeyStroke[] = [];

  let startTime: number | null = null;
  let startWallTime: number | null = null;
  let lastTickTime: number | null = null;
  let typingSessionID: string | null = null;
  let recording = false;

  let streakState = initialStreakState();
  const summary: TypingSessionSummary = {
    net: {
      totalChars: 0,
      correctChars: 0,
      incorrectChars: 0,
    },
    gross: {
      totalKeyPresses: 0,
      totalBackspaces: 0,
    },
  };

  let sessionHeader: TypingSessionHeader = { ...DEFAULT_TYPING_SESSION.header };
  if (sessionConfig) sessionHeader.configuration = sessionConfig;
  let session: TypingSession = {
    header: sessionHeader,
    body: { ...DEFAULT_TYPING_SESSION.body },
  };

  const start = () => {
    if (startTime !== null || startWallTime !== null || recording) {
      console.warn("recorder starting for second time");
    }
    startTime = performance.now();
    lastTickTime = startTime;
    startWallTime = Date.now();
    recording = true;
    streakState = initialStreakState();

    timeLine.length = 0;
    mistakeEvent.length = 0;
    keyEvent.length = 0;
    typingSessionID = crypto.randomUUID();
  };

  const tick = (expectedTextSlice: string, typedTextSlice: string) => {
    if (
      startTime === null ||
      lastTickTime === null ||
      typingSessionID === null ||
      !recording
    ) {
      throw Error("typing session recording is never started");
    }

    const now = performance.now();
    const totalElapsedTimeMs = now - startTime;
    const deltaTimeMs = now - lastTickTime;
    lastTickTime = now;
    const { totalChars, correctChars } = evaluateText(
      expectedTextSlice,
      typedTextSlice,
    );

    const timeLineSnapshot: TimeLineSnapshot = {
      timeStamp: Date.now(),
      elapsedTimeMs: Math.round(totalElapsedTimeMs),
      deltaTimeMs,
      correctChars,
      totalChars,
    };
    timeLine.push(timeLineSnapshot);

    return timeLineSnapshot;
  };

  const capture = (
    key: string,
    expectedChar: string | null,
    cursorIndex: number,
  ): boolean => {
    if (startTime === null || typingSessionID === null || !recording) {
      return false;
    }

    const now = Date.now();
    const elapsedMs = now - (startWallTime ?? now);
    const action: KeyAction = key === "Backspace" ? "delete" : "insert";

    if (action === "delete") {
      summary.gross.totalBackspaces++;
      keyEvent.push({
        timestamp: now,
        elapsedMs,
        key,
        cursorIndex,
        action,
        correct: null,
      });
      if (cursorIndex > 0) {
        streakState.lastStrokeCorrect
          ? summary.net.correctChars--
          : summary.net.incorrectChars--;
        summary.net.totalChars--;
      }
      streakState = initialStreakState();
      return false;
    }

    const { type, shouldBlock, nextState } = classifyKeystroke(
      key,
      expectedChar,
      streakState,
    );
    streakState = nextState;

    const isCorrect = type === null;
    if (!isCorrect) {
      mistakeEvent.push({
        elapsedMs,
        index: cursorIndex,
        type,
        typedCharacter: key,
        expectedCharacter: expectedChar ?? "",
      });
    }

    isCorrect ? summary.net.correctChars++ : summary.net.incorrectChars++;
    summary.gross.totalKeyPresses++;
    summary.net.totalChars++;

    keyEvent.push({
      timestamp: now,
      elapsedMs,
      key,
      cursorIndex,
      action,
      correct: type === null,
    });
    return shouldBlock;
  };

  const stop = (
    reason: EndReason,
    text: string,
    typed: string,
    pauseEvent: PauseSegment[],
  ): TypingSession => {
    if (
      startTime === null ||
      lastTickTime === null ||
      typingSessionID === null ||
      !recording
    ) {
      throw Error("typing session recording is never started");
    }
    recording = false;
    const endWallTime = Date.now();
    sessionHeader = {
      ...sessionHeader,
      id: typingSessionID,
      startTimestamp: startWallTime,
      endTimestamp: endWallTime,
      reason,
    };
    session = {
      header: sessionHeader,
      body: {
        typed,
        text,
        summary,
        timeLine,

        pauseEvent,
        mistakeEvent,
        keyEvent,
      },
    };
    return session;
  };
  return {
    get recording() {
      return recording;
    },
    get typingSessionID() {
      return typingSessionID;
    },
    start,
    tick,
    capture,
    stop,
  };
}
