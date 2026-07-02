import {
  type TimeLineSnapshot,
  type Metrics,
  type TypingSession,
  type Mistake,
  type MistakeType,
  type EndReason,
} from "../context/TypingContext";

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
  const raw = Number((totalChars / 5 / timeMin).toFixed(1));
  const wpm = Math.max(0, Math.floor(correctChars / 5 / timeMin));
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
  let totalTime: number | null = null;

  const start = () => {
    startTime = Date.now();
    timeLine.length = 0;
    mistakeLog.length = 0;
  };

  const tick = (
    expectedTextSlice: string,
    typedTextSlice: string,
    caretIndex: number,
    tickTime: number = 1000,
  ) => {
    const { metrics, detectedMistakes } = calculateLiveMetrics(
      expectedTextSlice,
      typedTextSlice,
      tickTime,
      caretIndex,
    );
    let elapsedTimeMs: number;
    if (!startTime) {
      throw Error("typing session recording is never started");
    }
    elapsedTimeMs = Date.now() - startTime;

    const timeLineSnapshot: TimeLineSnapshot = {
      timeStamp: Date.now(),
      elapsedTimeMs,
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
    totalTime = Date.now() - startTime;
    sessionData = {
      ...sessionData,
      totalTimeMs: totalTime,
      reason,
      timeLine,
      event: { mistakeLog },
    };
    return sessionData;
  };
  return { start, tick, stop };
}
