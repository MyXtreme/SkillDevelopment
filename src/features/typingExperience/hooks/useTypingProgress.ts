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

interface UseTestProgressInput {
  completeOn: CompletionType;
  duration: number;
  elapsedSeconds: number;
  typedLength: number;
  text: string;
}

function countWords(text: string): number {
  const trimmer = text.trim();
  return trimmer ? trimmer.split(/\s+/).length : 0;
}
export function useTestProgress({
  completeOn,
  duration,
  elapsedSeconds,
  typedLength,
  text,
}: UseTestProgressInput): TestProgress {
  if (completeOn === "timeEnd") {
    const safeDuration = Math.max(0, duration);
    const clampElapsedSeconds = clamp(elapsedSeconds, 0, safeDuration);
    return {
      completeOn,
      count: {
        unit: "seconds",
        passed: clampElapsedSeconds,
        total: safeDuration,
        remaining: safeDuration - clampElapsedSeconds,
      },
    };
  }

  const totalWords = countWords(text);
  const typedWords = countWords(text.slice(0, typedLength));
  const safeTyped = clamp(typedWords, 0, totalWords);
  return {
    completeOn,
    count: {
      unit: "words",
      passed: safeTyped,
      total: totalWords,
      remaining: totalWords - safeTyped,
    },
  };
}
