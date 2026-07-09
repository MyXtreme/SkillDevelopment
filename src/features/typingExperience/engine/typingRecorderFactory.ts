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

interface ProgressSnapshot {
  totalChars: number;
  correctChars: number;
  incorrectChars: number;
}
export function evaluateText(
  expectedTextSlice: string,
  typedTextSlice: string,
  timeMs: number,
): ProgressSnapshot {
  const fallbackResponse: ProgressSnapshot = {
    totalChars: 0,
    correctChars: 0,
    incorrectChars: 0,
  };

  if (!expectedTextSlice || !typedTextSlice || timeMs <= 0) {
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

  const timeMin = timeMs / 60000;
  const wordNum = correctChars / PERFORMANCE_THRESHOLDS.CPM_TO_WPM_DIVISOR;

  const wpm = Math.max(0, Math.round(wordNum / timeMin));

  const acc =
    totalChars > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((correctChars / totalChars) * 100)),
        )
      : 0;
  return {
    totalChars,
    correctChars,
    incorrectChars,
  };
}

export function keystrokeMistakeAnalyzer() {
  let lastIncorrectChar: string | null = null;
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
  let lastKeyTime: number | null = null;
  let typingSessionID: string | null = null;
  let recording = false;

  let lastTypedChar: string | null = null;
  let lastStrokeCorrect = true;
  let lastIncorrectChar: string | null = null;
  let consecutiveErrorCount = 0;

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
    lastKeyTime = Date.now();
    recording = true;

    timeLine.length = 0;
    mistakeEvent.length = 0;
    keyEvent.length = 0;
    typingSessionID = crypto.randomUUID();

    lastTypedChar = null;
    lastStrokeCorrect = true;
    lastIncorrectChar = null;
    consecutiveErrorCount = 0;
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
      deltaTimeMs,
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
    const prevKeyTimeStamp = lastKeyTime ?? startWallTime ?? now;
    const elapsedMs = now - (startWallTime ?? now);
    lastKeyTime = now;

    const action: KeyAction = key === "Backspace" ? "delete" : "insert";

    if (action === "delete") {
      summary.gross.totalBackspaces++;
      if (cursorIndex > 0) {
        lastStrokeCorrect
          ? summary.net.correctChars--
          : summary.net.incorrectChars--;
        summary.net.totalChars--;
      }
      keyEvent.push({
        timestamp: now,
        elapsedMs,
        key,
        cursorIndex,
        action,
        correct: null,
      });
      lastTypedChar = null;
      lastStrokeCorrect = true;
      lastIncorrectChar = null;
      consecutiveErrorCount = 0;
      return false;
    }

    const isCorrect = key === expectedChar;
    let shouldBlock = false;

    if (isCorrect) {
      summary.net.correctChars++;
      lastTypedChar = key;
      lastIncorrectChar = null;
      lastStrokeCorrect = true;
      consecutiveErrorCount = 0;
    } else {
      summary.net.incorrectChars++;
      let type: MistakeType = "incorrect";

      if (/\s/.test(key) && expectedChar && !/\s/.test(expectedChar)) {
        type = "miss";
        lastIncorrectChar = null;
        consecutiveErrorCount = 0;
      } else if (key === lastIncorrectChar) {
        consecutiveErrorCount++;
        if (consecutiveErrorCount > PERFORMANCE_THRESHOLDS.SPAM_THRESHOLD) {
          type = "spam";
          shouldBlock = true;
        } else {
          type = "repeated";
        }
      } else if (key === lastTypedChar && lastStrokeCorrect) {
        type = "doubleTap";
        lastIncorrectChar = key;
        consecutiveErrorCount = 1;
      } else {
        type = "incorrect";
        lastIncorrectChar = key;
        consecutiveErrorCount = 1;
      }
      summary.gross.totalKeyPresses++;
      summary.net.totalChars++;
      mistakeEvent.push({
        elapsedMs,
        index: cursorIndex,
        type,
        typedCharacter: key,
        expectedCharacter: expectedChar ?? "",
      });
    }

    keyEvent.push({
      timestamp: now,
      elapsedMs,
      key,
      cursorIndex,
      action,
      correct: isCorrect,
    });
    return shouldBlock;
  };

  const stop = (
    reason: EndReason,
    text: string,
    typed: string,
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
