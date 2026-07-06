import {
  type TimeLineSnapshot,
  type TypingSession,
  type Mistake,
  type MistakeType,
  type EndReason,
  type TypingConfiguration,
  type TypingSessionHeader,
  type KeyStroke,
} from "../context/TypingContext";
import { DEFAULT_TYPING_SESSION } from "../typingDefaults";

interface ProgressSnapshot {
  detectedMistakes: Mistake[];
  totalChars: number;
  correctChars: number;
}
export function evaluateText(
  expectedTextSlice: string,
  typedTextSlice: string,
  indexOnText: number,
): ProgressSnapshot {
  if (expectedTextSlice.length === 0 || typedTextSlice.length === 0) {
    return {
      detectedMistakes: [],
      totalChars: 0,
      correctChars: 0,
    };
  }
  let correctChars = 0;
  const totalChars = typedTextSlice.length;
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

  return { detectedMistakes: mistakes, totalChars, correctChars };
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

  let sessionHeader: TypingSessionHeader = DEFAULT_TYPING_SESSION.header;

  if (sessionConfig) sessionHeader.configuration = sessionConfig;
  let session: TypingSession = {
    header: sessionHeader,
    body: {
      text: "",
      timeLine,
      event: {
        mistakeEvent,
        keyEvent,
      },
    },
  };
  const start = () => {
    startTime = performance.now();
    lastTickTime = startTime;
    startWallTime = Date.now();
    recording = true;

    timeLine.length = 0;
    mistakeEvent.length = 0;
    keyEvent.length = 0;
    typingSessionID = crypto.randomUUID();
  };

  const tick = (
    expectedTextSlice: string,
    typedTextSlice: string,
    caretIndex: number,
  ) => {
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
    const { detectedMistakes, totalChars, correctChars } = evaluateText(
      expectedTextSlice,
      typedTextSlice,
      caretIndex,
    );

    const timeLineSnapshot: TimeLineSnapshot = {
      timeStamp: Date.now(),
      elapsedTimeMs: Math.round(totalElapsedTimeMs),
      deltaTimeMs,
      correctChars,
      totalChars,
    };
    timeLine.push(timeLineSnapshot);
    if (detectedMistakes.length > 0) {
      const existingIndices = new Set(mistakeEvent.map((m) => m.index));
      const uniqueNewMistakes = detectedMistakes.filter(
        (newMistake) => !existingIndices.has(newMistake.index),
      );
      mistakeEvent.push(...uniqueNewMistakes);
    }
  };

  const record = ({
    prevKeyTimeStamp,
    timestamp,
    key,
    cursorIndex,
    action,
  }: KeyStroke) => {
    keyEvent.push({
      prevKeyTimeStamp,
      timestamp,
      key,
      cursorIndex,
      action,
    });
  };

  const stop = (reason: EndReason, text: string): TypingSession => {
    if (
      startTime === null ||
      lastTickTime === null ||
      typingSessionID === null ||
      !recording
    )
      throw Error("typing session recording is never started");
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
        text,
        timeLine,
        event: {
          mistakeEvent,
          keyEvent,
        },
      },
    };
    return session;
  };
  return { recording, start, tick, record, stop };
}
