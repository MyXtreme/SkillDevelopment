import type {
  KeyAction,
  Mistake,
  MistakeType,
  TypingSession,
} from "../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";

export interface SpeedPoint {
  t: number;
  wpm: number;
  raw: number;
}

export type CharStatus = "correct" | "incorrect" | "idleChar";
export interface CharState {
  index: number;
  expected: string;
  typed: string | null;
  status: CharStatus;
}

export interface ReplayFrame {
  elapsedMs: number;
  cursorIndex: number;
  key: string;
  action: KeyAction;
}

export function analyzeSpeedSeries(session: TypingSession): SpeedPoint[] {
  const { timeLine } = session.body;
  const points: SpeedPoint[] = new Array(timeLine.length);

  for (let i = 0; i < timeLine.length; i++) {
    points[i] = {
      t: timeLine[i].elapsedTimeMs / 1000,
      wpm: timeLine[i].correctChars * 12,
      raw: timeLine[i].totalChars * 12,
    };
  }
  return points;
}

//TODO: Real analyzing functions for character state and replay. Or corresponding chart function.
export function analyzeCharacterState(session: TypingSession) {
  const { text } = session.body;
  const { keyEvent, mistakeEvent } = session.body;
  if (!text) return [];

  const mistakeByIndex = new Map<number, Mistake>();
  for (const m of mistakeEvent) mistakeByIndex.set(m.index, m);
}

export function analyzeReplay(session: TypingSession) {
  return;
}

export interface DerivedTypingMetrics {
  speed: {
    wpm: number;
    raw: number;
    cpm: number;
    burst: number;
    averageWpm: number;
    peakWpm: number;
  };
  accuracy: {
    accuracy: number;
    realAccuracy: number;
    errors: {
      total: number;
      corrected: number;
      uncorrected: number;
      byType: Partial<Record<MistakeType, number>>;
    };
  };
  consistency: {
    score: number;
    variance: number;
  };
  engagement: {
    pauseTime: number;
    pauseCount: number;
    afkTime: number;
    averagePause: number;
  };
  progress: {
    completed: boolean;
    completedCharacters: number;
    totalCharacters: number;
    completion: number;
    duration: number;
  };
}

export const createEmptyMetrics = (): DerivedTypingMetrics => ({
  speed: {
    wpm: 0,
    raw: 0,
    cpm: 0,
    burst: 0,
    averageWpm: 0,
    peakWpm: 0,
  },
  accuracy: {
    accuracy: 0,
    realAccuracy: 0,
    errors: {
      total: 0,
      corrected: 0,
      uncorrected: 0,
      byType: {},
    },
  },
  consistency: {
    score: 0,
    variance: 0,
  },
  engagement: {
    pauseTime: 0,
    pauseCount: 0,
    afkTime: 0,
    averagePause: 0,
  },
  progress: {
    completed: false,
    completedCharacters: 0,
    totalCharacters: 0,
    completion: 0,
    duration: 0,
  },
});

export function analyzeMetrics(session: TypingSession): DerivedTypingMetrics {
  const { header, body } = session;
  const { timeLine, mistakeEvent, pauseEvent, summary, text } = body;

  const start = header.startTimestamp || 0;
  const end = header.endTimestamp || 0;
  const durationMs =
    end > start ? end - start : timeLine.at(-1)?.elapsedTimeMs || 1;
  const durationMin = durationMs / 60000;
  const DIVISOR = PERFORMANCE_THRESHOLDS.CPM_TO_WPM_DIVISOR;

  const cpm = summary.net.correctChars / durationMin;
  const wpm = cpm / DIVISOR;
  const rawWpm = summary.net.totalChars / DIVISOR / durationMin;

  let sumWpm = 0,
    sumWpmSq = 0,
    peakWpm = 0,
    burst = wpm;
  for (const tick of timeLine) {
    const tickMin = tick.deltaTimeMs / 60000;
    const tickWpm = tickMin > 0 ? tick.correctChars / DIVISOR / tickMin : 0;
    const tickBurst = tickMin > 0 ? tick.totalChars / DIVISOR / tickMin : 0;
    sumWpm += tickWpm;
    sumWpmSq += tickWpm * tickWpm;
    if (tickWpm > peakWpm) peakWpm = tickWpm;
    if (tickBurst > burst) burst = tickBurst;
  }

  const n = timeLine.length;
  const avgWpm = n > 0 ? sumWpm / n : wpm;
  const variance = n > 1 ? Math.max(0, sumWpmSq / n - avgWpm * avgWpm) : 0;
  const consistencyScore =
    avgWpm > 0 ? Math.max(0, 100 * (1 - Math.sqrt(variance) / avgWpm)) : 100;

  const totalErrors = mistakeEvent.length;
  const uncorrectedErrs = summary.net.incorrectChars;
  const correctedErrs = Math.max(totalErrors - uncorrectedErrs, 0);
  const errorsByType: Partial<Record<MistakeType, number>> = {};
  mistakeEvent.forEach((m) => {
    errorsByType[m.type] = (errorsByType[m.type] || 0) + 1;
  });

  const accuracy =
    summary.net.totalChars > 0
      ? (summary.net.correctChars / summary.net.totalChars) * 100
      : 100;
  const realAccuracy =
    summary.gross.totalKeyPresses > 0
      ? ((summary.gross.totalKeyPresses -
          totalErrors -
          summary.gross.totalBackspaces) /
          summary.gross.totalKeyPresses) *
        100
      : 100;

  let pauseTime = 0,
    pauseCount = 0,
    afkTime = 0;
  pauseEvent.forEach((pauseSegment) => {
    const duration = pauseSegment.durationMs ?? 0;
    if (pauseSegment.type === "afk") afkTime += duration;
    else pauseTime += duration;
    pauseCount++;
  });
  const averagePause = pauseCount > 0 ? (pauseTime + afkTime) / pauseCount : 0;

  const completed = header.reason !== "force-exit";
  const completedCharacters = summary.net.totalChars;
  const totalCharacters = text?.length || completedCharacters || 1;
  const completion = Math.min(
    (completedCharacters / totalCharacters) * 100,
    100,
  );

  const format = (x: number) => Math.round(x);
  return {
    speed: {
      wpm: format(wpm),
      raw: format(rawWpm),
      cpm: format(cpm),
      burst: format(burst),
      averageWpm: format(avgWpm),
      peakWpm: format(peakWpm),
    },
    accuracy: {
      accuracy: format(accuracy),
      realAccuracy: format(realAccuracy),
      errors: {
        total: totalErrors,
        corrected: correctedErrs,
        uncorrected: uncorrectedErrs,
        byType: errorsByType,
      },
    },
    consistency: {
      score: format(consistencyScore),
      variance: format(variance),
    },
    engagement: {
      pauseTime,
      pauseCount,
      afkTime,
      averagePause: format(averagePause),
    },
    progress: {
      completed,
      completedCharacters,
      totalCharacters,
      completion: format(completion),
      duration: durationMs,
    },
  };
}
