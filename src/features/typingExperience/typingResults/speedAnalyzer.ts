import { clamp } from "../../../shared/utils";
import type { TypingCounters, TypingSession } from "../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";
import { countWordsCompleted, findWordEnds } from "../typingUtils/wordCounter";
import {
  DEFAULT_SPEED_METRICS_CONFIG,
  SPEED_METRICS,
  type AccuracyMode,
  type SpeedFormula,
  type SpeedMetricDef,
  type SpeedMetricId,
  type SpeedMetricsConfig,
  type SpeedUnit,
} from "./speedMetrics";

const MIN_GAP_MS = PERFORMANCE_THRESHOLDS.MIN_POINT_GAP_MS;
const CHARS_PER_WORD = PERFORMANCE_THRESHOLDS.CPM_TO_WPM_DIVISOR;

export interface SpeedSample extends TypingCounters {
  elapsedMs: number;
  words: number;
}

export type SpeedValues = Partial<Record<SpeedMetricId, number>>;
export type SpeedPoint = { t: number } & SpeedValues;
export interface SpeedAnalysis {
  series: SpeedPoint[]; // for charts
  summary: SpeedValues; // for results on tab or details
}

const ORIGIN: SpeedSample = {
  elapsedMs: 0,
  typedChars: 0,
  errorChars: 0,
  backspaces: 0,
  otherKeys: 0,
  textChars: 0,
  correctChars: 0,
  words: 0,
};

const keystrokeOf = (s: SpeedSample) =>
  s.textChars + s.backspaces + s.otherKeys;
const uncorrectedOf = (s: SpeedSample) => s.textChars - s.correctChars;

function unitsBetween(unit: SpeedUnit, from: SpeedSample, to: SpeedSample) {
  switch (unit) {
    case "standardWord":
      return (to.typedChars - from.typedChars) / CHARS_PER_WORD;
    case "realWord":
      return to.words - from.words;
    case "character":
      return to.typedChars - from.typedChars;
    case "keystroke":
      return keystrokeOf(to) - keystrokeOf(from);
  }
}

function accuracyBetween(
  mode: AccuracyMode,
  from: SpeedSample,
  to: SpeedSample,
): number {
  const typed = to.typedChars - from.typedChars;
  if (mode === "raw" || typed <= 0) return 1;

  const penalty =
    mode === "strict"
      ? to.errorChars - from.errorChars
      : uncorrectedOf(to) - uncorrectedOf(from);
  const accuracy = 1 - Math.max(penalty, 0) / typed;
  return clamp(accuracy, 0, 1);
}

export function speedBetween(
  formula: SpeedFormula,
  from: SpeedSample,
  to: SpeedSample,
): number {
  const time = (to.elapsedMs - from.elapsedMs) / 60000;
  if (time <= 0) return 0;

  const units = Math.max(0, unitsBetween(formula.unit, from, to));
  return (units / time) * accuracyBetween(formula.accuracy, from, to);
}

export function toSamples(session: TypingSession): SpeedSample[] {
  const { timeLine, text } = session.body;
  const wordEnds = text ? findWordEnds(text) : [];
  const samples: SpeedSample[] = [ORIGIN];

  for (const tick of timeLine) {
    const sample: SpeedSample = {
      elapsedMs: tick.elapsedTimeMs,
      typedChars: tick.typedChars,
      errorChars: tick.errorChars,
      backspaces: tick.backspaces,
      otherKeys: tick.otherKeys,
      textChars: tick.textChars,
      correctChars: tick.correctChars,
      words: countWordsCompleted(wordEnds, tick.textChars),
    };

    const last = samples[samples.length - 1];
    if (samples.length > 1 && sample.elapsedMs - last.elapsedMs < MIN_GAP_MS) {
      samples[samples.length - 1] = sample;
    } else {
      samples.push(sample);
    }
  }

  const { reason, configuration } = session.header;
  const final = samples[samples.length - 1];
  if (reason === "timeEnd" && samples.length > 1) {
    final.elapsedMs = Math.min(final.elapsedMs, configuration.duration * 1000);
  }
  return samples;
}

function nearestEarlierSample(
  samples: SpeedSample[],
  beforeIndex: number,
  targetMs: number,
): SpeedSample {
  const maxIndex = beforeIndex - 1;
  if (targetMs <= 0) return samples[0];

  let low = 0;
  let high = maxIndex;
  while (low < high) {
    const mid = (low + high + 1) >>> 1;
    if (samples[mid].elapsedMs <= targetMs) low = mid;
    else high = mid - 1;
  }
  const next = samples[low + 1];
  const useNext =
    low < maxIndex &&
    next.elapsedMs - targetMs < targetMs - samples[low].elapsedMs;
  return useNext ? next : samples[low];
}

export function analyzeSpeed(
  session: TypingSession,
  config: SpeedMetricsConfig = DEFAULT_SPEED_METRICS_CONFIG,
): SpeedAnalysis {
  const samples = toSamples(session);
  const rollingMs = config.rollingWindowSec * 1000;
  const burstMs = config.burstWindowSec * 1000;
  const best: SpeedValues = {};
  const series: SpeedPoint[] = [];

  for (let i = 1; i < samples.length; i++) {
    const to = samples[i];
    const point: SpeedPoint = { t: to.elapsedMs / 1000 };

    for (const id of config.visible) {
      const def: SpeedMetricDef = SPEED_METRICS[id];
      switch (def.scope) {
        case "cumulative":
          point[id] = speedBetween(def, ORIGIN, to);
          break;
        case "rolling":
          point[id] = speedBetween(
            def,
            nearestEarlierSample(samples, i, to.elapsedMs - rollingMs),
            to,
          );
          break;
        case "peak": {
          const momentary = speedBetween(
            def,
            nearestEarlierSample(samples, i, to.elapsedMs - burstMs),
            to,
          );
          best[id] = Math.max(best[id] ?? 0, momentary);
          point[id] = best[id];
          break;
        }
      }
    }
    series.push(point);
  }

  const summary: SpeedValues = {};
  const last = series[series.length - 1];
  if (last) for (const id of config.visible) summary[id] = last[id];
  return { series, summary };
}
