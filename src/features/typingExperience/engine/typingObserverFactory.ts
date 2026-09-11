import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";

export type PauseType = "pause" | "afk";

export interface PauseSegment {
  startElapsedMs: number;
  endElapsedMs: number | null;
  durationMs: number | null;
  type: PauseType;
}

interface PauseObserverCallbacks {
  onPauseStart?: (elapsedMs: number) => void;
  onAfkStart?: (elapsedMs: number) => void;
  onResume?: (segment: PauseSegment) => void;
}

export function createTypingPauseObserver(
  getElapsedMs: () => number,
  callbacks: PauseObserverCallbacks = {},
) {
  let pauseTimerID: number | null = null;
  let afkTimerID: number | null = null;
  let currentSegment: PauseSegment | null = null;
  let segments: PauseSegment[] = [];
  let active: boolean = false;

  const clearTimers = () => {
    if (pauseTimerID) clearTimeout(pauseTimerID);
    if (afkTimerID) clearTimeout(afkTimerID);
    pauseTimerID = afkTimerID = null;
  };

  const armTimers = () => {
    clearTimers();
    pauseTimerID = window.setTimeout(() => {
      currentSegment = {
        startElapsedMs: getElapsedMs(),
        endElapsedMs: null,
        durationMs: null,
        type: "pause",
      };
      callbacks.onPauseStart?.(currentSegment.startElapsedMs);

      afkTimerID = window.setTimeout(() => {
        if (!currentSegment) return;
        currentSegment.type = "afk";
        callbacks.onAfkStart?.(currentSegment.startElapsedMs);
      }, PERFORMANCE_THRESHOLDS.AFK_THRESHOLD_MS - PERFORMANCE_THRESHOLDS.PAUSE_THRESHOLD_MS);
    }, PERFORMANCE_THRESHOLDS.PAUSE_THRESHOLD_MS);
  };

  const start = () => {
    active = true;
    segments = [];
    currentSegment = null;
    armTimers();
  };

  const recordActivity = () => {
    if (!active) return;
    if (currentSegment) {
      const now = getElapsedMs();
      currentSegment.endElapsedMs = now;
      currentSegment.durationMs = now - currentSegment.startElapsedMs;
      segments.push(currentSegment);
      callbacks.onResume?.(currentSegment);
      currentSegment = null;
    }
    armTimers();
  };

  const stop = () => {
    active = false;
    clearTimers();
    if (currentSegment) {
      const now = getElapsedMs();
      currentSegment.endElapsedMs = now;
      currentSegment.durationMs = now - currentSegment.startElapsedMs;
      segments.push(currentSegment);
      callbacks.onResume?.(currentSegment);
      currentSegment = null;
    }
    return segments;
  };

  return { start, recordActivity, stop };
}
