import {
  type TimeLineSnapshot,
  type Metrics,
  type TypingSession,
  type Mistake,
  type MistakeType,
  type EndReason,
} from "../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";

interface ProgressSnapshot {
  metrics: Metrics;
  detectedMistakes: Mistake[];
}
export function calculateLiveMetrics(
  expectedTextSlice: string,
  typedTextSlice: string,
  timeMs: number,
  indexOnText: number,
): ProgressSnapshot {
  if (
    expectedTextSlice.length === 0 ||
    typedTextSlice.length === 0 ||
    timeMs === 0
  ) {
    return {
      metrics: { accuracy: 100, wpm: 0, raw: 0 },
      detectedMistakes: [],
    };
  }
  const divisor = PERFORMANCE_THRESHOLDS.CPM_TO_WPM_DIVISOR;
  let correctChars = 0;
  let totalChars = typedTextSlice.length;
  const mistakes: Mistake[] = [];

  const splittedCurrentText: string[] = expectedTextSlice.split("");
  const splittedTypedText: string[] = typedTextSlice.split("");

  splittedTypedText.forEach((character, index) => {
    const expectedChar = splittedCurrentText[index];
    const isCorrect = character === expectedChar;
    const actualIndex = indexOnText + index;

    if (isCorrect) {
      correctChars++;
    } else {
      let type: MistakeType = "incorrect";
      if (/\s/.test(character)) {
        const wasPriorCharSpace =
          index > 0 && /\s/.test(splittedTypedText[index - 1]);
        type = wasPriorCharSpace ? "spam" : "miss";
      } else if (index > 0 && character === splittedTypedText[index - 1]) {
        type = "double-tap";
      } else {
        type = "incorrect";
      }
      mistakes.push({
        index: actualIndex,
        type,
        typedCharacter: character,
        expectedCharacter: expectedChar,
      });
    }
  });

  const timeMin = timeMs / 60000;
  const raw = Number((totalChars / divisor / timeMin).toFixed(1));
  const wpm = Math.max(0, Math.floor(correctChars / divisor / timeMin));
  const accuracy = Number(((correctChars / totalChars) * 100).toFixed(1));
  console.log(wpm + ":" + raw + " " + accuracy);

  return { metrics: { raw, wpm, accuracy }, detectedMistakes: mistakes };
}

export function createTypingRecorder() {
  const timeLine: TimeLineSnapshot[] = [];
  const mistakeLog: Mistake[] = [];
  let sessionData: TypingSession = {
    totalTimeMs: 0,
    reason: "exit",
    timeLine: [],
    event: { mistakeLog: [] },
  };

  let startTime: number | null = null;
  let lastTickTime: number | null = null;

  const start = () => {
    startTime = performance.now();
    lastTickTime = startTime;
    timeLine.length = 0;
    mistakeLog.length = 0;
  };

  const tick = (
    expectedTextSlice: string,
    typedTextSlice: string,
    caretIndex: number,
  ) => {
    if (startTime === null || lastTickTime === null) {
      throw Error("typing session recording is never started");
    }

    const now = performance.now();
    const totalElapsedTimeMs = now - startTime;
    const deltaTimeMs = now - lastTickTime;
    lastTickTime = now;

    const { metrics, detectedMistakes } = calculateLiveMetrics(
      expectedTextSlice,
      typedTextSlice,
      deltaTimeMs,
      caretIndex,
    );

    const timeLineSnapshot: TimeLineSnapshot = {
      timeStamp: Date.now(),
      elapsedTimeMs: Math.round(totalElapsedTimeMs),
      charsTyped: typedTextSlice.length,
      metrics,
    };
    timeLine.push(timeLineSnapshot);
    if (detectedMistakes.length > 0) {
      const existingIndices = new Set(mistakeLog.map((m) => m.index));
      const uniqueNewMistakes = detectedMistakes.filter(
        (newMistake) => !existingIndices.has(newMistake.index),
      );
      mistakeLog.push(...uniqueNewMistakes);
    }
  };

  const stop = (reason: EndReason): TypingSession => {
    if (startTime === null)
      throw Error("typing session recording is never started");
    sessionData = {
      totalTimeMs: Math.round(performance.now() - startTime),
      reason,
      timeLine,
      event: { mistakeLog },
    };
    return sessionData;
  };
  return { start, tick, stop };
}
