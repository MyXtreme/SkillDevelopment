import { useMemo } from "react";
import type { CompletionType } from "../context/TypingContext";
import { clamp } from "../../../shared/utils";

export type ProgressUnit = "seconds" | "words";

export interface ProgressCount {
  unit: ProgressUnit;
  passed: number;
  total: number;
  remaining: number; // remaining = total - passed
}

export interface TestProgress {
  completeOn: CompletionType;
  count: ProgressCount;
}

interface ProgressInput {
  completeOn: CompletionType;
  duration: number;
  elapsedSeconds: number;
  typedLength: number;
  text: string;
  wordEnds: readonly number[];
}

interface ProgressMeasure {
  unit: ProgressUnit;
  passed: number;
  total: number;
}

export function findWordEnds(text: string): number[] {
  const ends: number[] = [];
  let inSpace = false;
  for (let i = 0; i < text.length; i++) {
    let char = text[i];
    let isCurrentSpace =
      char === " " || char === "\t" || char === "\n" || char === "\r";

    if (inSpace && !isCurrentSpace) {
      ends.push(i);
    }
    inSpace = isCurrentSpace;
  }
  return ends;
}

export function countAtMost(sorted: readonly number[], value: number) {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    sorted[mid] <= value ? (low = mid + 1) : (high = mid);
  }
  return low;
}

const MEASURE_BY_COMPLETION: Record<
  CompletionType,
  (input: ProgressInput) => ProgressMeasure
> = {
  timeEnd: ({ duration, elapsedSeconds }) => ({
    unit: "seconds",
    passed: elapsedSeconds,
    total: duration,
  }),
  textEnd: ({ typedLength, wordEnds }) => ({
    unit: "words",
    passed: countAtMost(wordEnds, typedLength),
    total: wordEnds.length,
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

  const { unit, passed, total } = MEASURE_BY_COMPLETION[completeOn]({
    completeOn,
    duration,
    elapsedSeconds,
    typedLength,
    text,
    wordEnds,
  });
  return useMemo(() => {
    const safeTotal = Math.max(total, 0);
    const safePassed = clamp(passed, 0, safeTotal);
    return {
      completeOn,
      count: {
        unit,
        total: safeTotal,
        passed: safePassed,
        remaining: safeTotal - safePassed,
      },
    };
  }, [completeOn, unit, passed, total]);
}
