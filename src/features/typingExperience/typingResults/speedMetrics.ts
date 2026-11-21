export type SpeedUnit =
  | "standardWord" // typed characters / 5
  | "realWord" // words actually completed in the text
  | "character" // typed characters (CPM)
  | "keystroke"; // every physical key, backspace and modifiers included (KPM)

export type AccuracyMode =
  | "raw" // not at all
  | "standard" // only mistakes still in the text (uncorrected)
  | "strict"; // every mistake ever made, even corrected ones

export type SpeedScope =
  | "cumulative" // from the start up to now
  | "rolling" // over the last `rollingWindowSec`
  | "peak"; // the best `burstWindowSec` stretch so far

export type SpeedMetricGroup = "primary" | "granular" | "momentary";

export type SpeedFormula =
  | { unit: Exclude<SpeedUnit, "keystroke">; accuracy: AccuracyMode }
  // Physical effort: accuracy does not work here, so type forbids it.
  | { unit: "keystroke"; accuracy: "raw" };

export type SpeedMetricDef = SpeedFormula & {
  scope: SpeedScope;
  group: SpeedMetricGroup;
  label: string;
};

export const SPEED_METRICS = {
  // Primary
  wpm: {
    unit: "standardWord",
    accuracy: "standard",
    scope: "cumulative",
    group: "primary",
    label: "WPM",
  },
  strictWpm: {
    unit: "standardWord",
    accuracy: "strict",
    scope: "cumulative",
    group: "primary",
    label: "Strict WPM",
  },
  realWpm: {
    unit: "realWord",
    accuracy: "standard",
    scope: "cumulative",
    group: "primary",
    label: "Real WPM",
  },
  strictRealWpm: {
    unit: "realWord",
    accuracy: "strict",
    scope: "cumulative",
    group: "primary",
    label: "Strict real WPM",
  },
  rawWpm: {
    unit: "standardWord",
    accuracy: "raw",
    scope: "cumulative",
    group: "primary",
    label: "Raw WPM",
  },
  realRawWpm: {
    unit: "realWord",
    accuracy: "raw",
    scope: "cumulative",
    group: "primary",
    label: "Real raw WPM",
  },

  // Granular
  cpm: {
    unit: "character",
    accuracy: "standard",
    scope: "cumulative",
    group: "granular",
    label: "CPM",
  },
  strictCpm: {
    unit: "character",
    accuracy: "strict",
    scope: "cumulative",
    group: "granular",
    label: "Strict CPM",
  },
  rawCpm: {
    unit: "character",
    accuracy: "raw",
    scope: "cumulative",
    group: "granular",
    label: "Raw CPM",
  },
  kpm: {
    unit: "keystroke",
    accuracy: "raw",
    scope: "cumulative",
    group: "granular",
    label: "KPM",
  },

  // Momentary
  rollingWpm: {
    unit: "standardWord",
    accuracy: "standard",
    scope: "rolling",
    group: "momentary",
    label: "Rolling WPM",
  },
  rollingRawWpm: {
    unit: "standardWord",
    accuracy: "raw",
    scope: "rolling",
    group: "momentary",
    label: "Rolling raw WPM",
  },
  burstWpm: {
    unit: "standardWord",
    accuracy: "raw",
    scope: "peak",
    group: "momentary",
    label: "Burst WPM",
  },
} as const satisfies Record<string, SpeedMetricDef>;

export type SpeedMetricId = keyof typeof SPEED_METRICS;
export const SPEED_METRIC_IDS = Object.keys(SPEED_METRICS) as SpeedMetricId[];

export interface SpeedMetricsConfig {
  /** What the UI shows, in order. The first entry is the headline number. */
  visible: SpeedMetricId[];
  rollingWindowSec: number;
  burstWindowSec: number;
}

export const DEFAULT_SPEED_METRICS_CONFIG: SpeedMetricsConfig = {
  visible: ["wpm", "rawWpm"],
  rollingWindowSec: 5,
  burstWindowSec: 3,
};
