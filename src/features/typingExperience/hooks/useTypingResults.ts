import { useEffect, useMemo, useState } from "react";
import {
  useTypingContext,
  type MistakeType,
  type TypingSession,
} from "../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";

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
      byType: Record<MistakeType, number>;
    };
  };
  consistency: {
    score: number;
    variance: number;
  };
  engagement: {
    activeTime: number;
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

export function calculatedDerivedMetrics(
  session: TypingSession,
): DerivedTypingMetrics {
  const { header, body } = session;
  const { history, summary, text } = body;

  const { timeLine, event } = history;
  //const { mistakeEvent, keyEvent } = event;

  const finalSnapshot = timeLine.at(-1);
  const start = header.startTimestamp || 0;
  const end = header.endTimestamp || 0;
  const durationMs =
    end > start ? end - start : finalSnapshot?.elapsedTimeMs || 1;
  const durationMin = durationMs / 60000;

  const cpm = summary.net.correctChars / durationMin;
  const wpm = cpm / PERFORMANCE_THRESHOLDS.CPM_TO_WPM_DIVISOR;
  const rawWpm =
    summary.net.totalChars /
    PERFORMANCE_THRESHOLDS.CPM_TO_WPM_DIVISOR /
    durationMin;

  const { cummulativeWpm, peakWpm } = history.liveMetrics.reduce(
    (acc, cur) => {
      acc.cummulativeWpm += cur.wpm;
      acc.peakWpm = Math.max(acc.peakWpm, cur.wpm);
      return acc;
    },
    { cummulativeWpm: 0, peakWpm: wpm },
  );

  const wpmsLength = history.liveMetrics.length;
  const avgWpm = wpmsLength > 0 ? cummulativeWpm / wpmsLength : wpm;

  let burst = wpm;
  if (history.timeLine.length > 0) {
    const burstSpeeds = history.timeLine.map((t) =>
      t.deltaTimeMs > 0
        ? t.totalChars /
          PERFORMANCE_THRESHOLDS.CPM_TO_WPM_DIVISOR /
          (t.deltaTimeMs / 60000)
        : 0,
    );
    burst = Math.max(...burstSpeeds);
  }

  const totalErrors = history.event.mistakeEvent.length;
  const unCorrectedErrs = summary.net.incorrectChars;
  const correctedErrs = Math.max(totalErrors - unCorrectedErrs, 0);

  const accuracy =
    summary.net.totalChars > 0
      ? (summary.net.correctChars / summary.net.totalChars) * 100
      : 100;
  const exactAcc =
    summary.gross.totalKeyPresses > 0
      ? ((summary.gross.totalKeyPresses -
          totalErrors -
          summary.gross.totalBackspaces) /
          summary.gross.totalKeyPresses) *
        100
      : 100;

  const errorsByType: Record<MistakeType, number> = {
    incorrect: 0,
    miss: 0,
    repeated: 0,
    spam: 0,
    doubleTap: 0,
    transposed: 0,
  };
  event.mistakeEvent.forEach((m) => {
    if (errorsByType[m.type] !== undefined) errorsByType[m.type]++;
  });

  let wpms = history.liveMetrics.map((m) => m.wpm);
  let variance = 0;
  let consistencyScore = 100;
  if (wpmsLength > 1) {
    variance =
      wpms.reduce((sum, val) => sum + Math.pow(val - avgWpm, 2), 0) /
      wpmsLength;
    const stdDev = Math.sqrt(variance);
    const cv = avgWpm > 0 ? stdDev / avgWpm : 0;
    consistencyScore = Math.max(0, 100 * (1 - cv));
  }

  let activeTime = 0,
    pauseTime = 0,
    pauseCount = 0,
    afkTime = 0;
  event.keyEvent.forEach((ke) => {
    if (ke.prevKeyTimeStamp) {
      const gapMs = ke.timestamp - ke.prevKeyTimeStamp;
      if (gapMs >= PERFORMANCE_THRESHOLDS.AFK_THRESHOLD_MS) {
        afkTime += gapMs;
        pauseCount++;
      } else if (gapMs >= PERFORMANCE_THRESHOLDS.PAUSE_THRESHOLD_MS) {
        pauseTime += gapMs;
        pauseCount++;
      } else {
        activeTime += gapMs;
      }
    }
  });

  const averagePause = pauseCount > 0 ? (pauseTime + afkTime) / pauseCount : 0;

  const completed = header.reason !== "force-exit";
  const completedCharacters = summary.net.totalChars;
  const totalCharacters = text?.length || completedCharacters || 1;
  const completionPercent = Math.min(
    (completedCharacters / totalCharacters) * 100,
    100,
  );
  return {
    speed: {
      wpm: Number(wpm.toFixed(2)),
      raw: Number(rawWpm.toFixed(2)),
      cpm: Number(cpm.toFixed(2)),
      burst: Number(burst.toFixed(2)),
      averageWpm: Number(avgWpm.toFixed(2)),
      peakWpm: Number(peakWpm.toFixed(2)),
    },
    accuracy: {
      accuracy: Number(accuracy.toFixed(2)),
      realAccuracy: Number(exactAcc.toFixed(2)),
      errors: {
        total: totalErrors,
        corrected: correctedErrs,
        uncorrected: unCorrectedErrs,
        byType: errorsByType,
      },
    },
    consistency: {
      score: Number(consistencyScore.toFixed(2)),
      variance: Number(variance.toFixed(2)),
    },
    engagement: {
      activeTime,
      pauseTime,
      pauseCount,
      afkTime,
      averagePause: Number(averagePause.toFixed(2)),
    },
    progress: {
      completed,
      completedCharacters,
      totalCharacters,
      completion: Number(completionPercent.toFixed(2)),
      duration: durationMs,
    },
  };
}

export const emptyMetrics: DerivedTypingMetrics = {
  speed: { wpm: 0, raw: 0, cpm: 0, burst: 0, averageWpm: 0, peakWpm: 0 },
  accuracy: {
    accuracy: 0,
    realAccuracy: 0,
    errors: { total: 0, corrected: 0, uncorrected: 0, byType: {} as any },
  },
  consistency: { score: 0, variance: 0 },
  engagement: {
    activeTime: 0,
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
};

export function useTypingMetrics() {
  const { typingState } = useTypingContext();
  const [metrics, setMetrics] = useState<DerivedTypingMetrics>(emptyMetrics);
  console.log(metrics);
  const [errorMsg, setErrorMsg] = useState<string>();
  const { session, status } = typingState;

  useEffect(() => {
    if (status === "finished") {
      if (!session.header.startTimestamp || !session.header.endTimestamp) {
        setErrorMsg("typing session finished withoud valid timestamp");
        setMetrics(emptyMetrics);
        return;
      }
      const duration =
        session.header.endTimestamp - session.header.startTimestamp;
      if (duration < 500) {
        setErrorMsg("session was too short to generate meaningfull metrics.");
        setMetrics(emptyMetrics);
        return;
      }
      if (session.header.reason === "force-exit") {
        setErrorMsg("session didn't take place due to force exit");
        setMetrics(emptyMetrics);
        return;
      }
      if (session.body.summary.gross.totalKeyPresses === 0) {
        setErrorMsg("No keystrokes recorded.");
        setMetrics(emptyMetrics);
        return;
      }

      const derived = calculatedDerivedMetrics(session);
      setMetrics(derived);
    } else if (status === "idle") {
      setMetrics(emptyMetrics);
    }
  }, [session, status]);

  return metrics;
}
