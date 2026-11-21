import { useMemo } from "react";
import type { CompletionType } from "../context/TypingContext";
import { clamp, ratio } from "../../../shared/utils";
import { findWordEnds, countWordsCompleted } from "../typingUtils/wordCounter";

export type ProgressUnit = "seconds" | "words";

export interface ProgressCount {
  unit: ProgressUnit;
  current: number;
  total: number;
  remaining: number; // remaining = total - passed
}

export interface TestProgress {
  completeOn: CompletionType;
  fraction: number;
  count: ProgressCount;
}

interface ProgressInput {
  completeOn: CompletionType;
  duration: number;
  elapsedSeconds: number;
  typedLength: number;
  textLength: number;
  wordEnds: readonly number[];
}

interface ProgressMeasure {
  unit: ProgressUnit;
  current: number;
  total: number;
  fraction: number;
}

const MEASURE_BY_COMPLETION: Record<
  CompletionType,
  (input: ProgressInput) => ProgressMeasure
> = {
  timeEnd: ({ duration, elapsedSeconds }) => ({
    unit: "seconds",
    current: elapsedSeconds,
    total: duration,
    fraction: ratio(elapsedSeconds, duration),
  }),
  textEnd: ({ typedLength, textLength, wordEnds }) => ({
    unit: "words",
    current: countWordsCompleted(wordEnds, typedLength),
    total: wordEnds.length,
    fraction: ratio(typedLength, textLength),
  }),
};

interface UseTestProgressInput {
  completeOn: CompletionType;
  duration: number;
  elapsedSeconds: number;
  typedLength: number;
  text: string;
}

const NO_WORDS: readonly number[] = [];

export function useTestProgress({
  completeOn,
  duration,
  elapsedSeconds,
  typedLength,
  text,
}: UseTestProgressInput): TestProgress {
  const wordEnds = useMemo(
    () => (completeOn === "textEnd" ? findWordEnds(text) : NO_WORDS),
    [completeOn, text],
  );

  const { unit, current, total, fraction } = MEASURE_BY_COMPLETION[completeOn]({
    completeOn,
    duration,
    elapsedSeconds,
    typedLength,
    textLength: text.length,
    wordEnds,
  });
  return useMemo(() => {
    const safeTotal = Math.max(total, 0);
    const safeCurrent = clamp(current, 0, safeTotal);
    return {
      completeOn,
      fraction,
      count: {
        unit,
        total: safeTotal,
        current: safeCurrent,
        remaining: safeTotal - safeCurrent,
      },
    };
  }, [completeOn, unit, current, total, fraction]);
}
