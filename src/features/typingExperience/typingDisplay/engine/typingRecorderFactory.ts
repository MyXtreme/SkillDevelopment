import { computeRadarPoints } from "recharts/types/polar/Radar";
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
  type TypingCounters,
} from "../../context/TypingContext";
import {
  DEFAULT_TYPING_SESSION,
  PERFORMANCE_THRESHOLDS,
} from "../../typingDefaults";
import type { PauseSegment } from "./typingObserverFactory";

interface ProgressSnapshot {
  totalChars: number;
  correctChars: number;
  incorrectChars: number;
}

//No more need locally, could be used outside file for scanning and checking of text
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

export const createSummary = (): TypingSessionSummary => ({
  net: {
    totalChars: 0,
    correctChars: 0,
    incorrectChars: 0,
  },
  gross: {
    totalKeyPresses: 0,
    totalBackspaces: 0,
  },
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

const creatCounters = (): TypingCounters => ({
  typedChars: 0,
  errorChars: 0,
  backspaces: 0,
  otherKeys: 0,
  textChars: 0,
  correctChars: 0,
});

export function createTypingSessionRecorder(
  sessionConfig: TypingConfiguration | null,
) {
  let timeLine: TimeLineSnapshot[] = [];
  let mistakeEvent: Mistake[] = [];
  let keyEvent: KeyStroke[] = [];
  let typedCorrectness: boolean[] = [];

  let startTime: number | null = null;
  let startWallTime: number | null = null;
  let lastTickTime: number | null = null;
  let typingSessionID: string | null = null;
  let recording = false;

  let streakState = initialStreakState();
  let summary = createSummary();
  let counters = creatCounters();

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
    counters = creatCounters();

    timeLine = [];
    mistakeEvent = [];
    keyEvent = [];
    typedCorrectness = [];
    typingSessionID = crypto.randomUUID();
  };

  const getElapsedMs = () =>
    startTime === null ? 0 : performance.now() - startTime;

  const tick = () => {
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
    const timeLineSnapshot: TimeLineSnapshot = {
      timeStamp: Date.now(),
      elapsedTimeMs: Math.round(totalElapsedTimeMs),
      deltaTimeMs,
      ...counters,
    };
    timeLine.push(timeLineSnapshot);

    return timeLineSnapshot;
  };

  const countOtherKey = () => {
    if (recording) counters.otherKeys++;
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
    const elapsedMs = Math.round(getElapsedMs());
    const action: KeyAction = key === "Backspace" ? "delete" : "insert";

    if (action === "delete") {
      counters.backspaces++;
      keyEvent.push({
        timestamp: now,
        elapsedMs,
        key,
        cursorIndex,
        action,
        correct: null,
      });

      const wasCorrect = typedCorrectness.pop();
      if (wasCorrect !== undefined) {
        counters.typedChars--;
        if (wasCorrect) counters.correctChars--;
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
    counters.typedChars++;
    if (!isCorrect) {
      counters.errorChars++;
      mistakeEvent.push({
        elapsedMs,
        index: cursorIndex,
        type,
        typedCharacter: key,
        expectedCharacter: expectedChar ?? "",
      });
    }

    if (shouldBlock) return true;

    typedCorrectness.push(isCorrect);
    counters.textChars++;
    if (isCorrect) counters.correctChars++;

    keyEvent.push({
      timestamp: now,
      elapsedMs,
      key,
      cursorIndex,
      action,
      correct: isCorrect,
    });
    return false;
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

    const summary: TypingSessionSummary = {
      net: {
        totalChars: counters.textChars,
        correctChars: counters.correctChars,
        incorrectChars: counters.textChars - counters.correctChars,
      },
      gross: {
        totalKeyPresses: counters.typedChars,
        totalBackspaces: counters.backspaces,
      },
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
    getElapsedMs,
    tick,
    countOtherKey,
    capture,
    stop,
  };
}
