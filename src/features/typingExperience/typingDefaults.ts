import {
  type TypingConfiguration,
  type TypingSession,
} from "./context/TypingContext";

export const PERFORMANCE_THRESHOLDS = {
  REMAINING_BUFFER_THRESHOLD: 40,
  INIT_RENDER_TEXT_LENGTH: 60,
  CPM_TO_WPM_DIVISOR: 5,
  LOOP_TICK_INTERVAL_MS: 1000,
  SPAM_THRESHOLD: 5,
  PAUSE_THRESHOLD_MS: 400,
  AFK_THRESHOLD_MS: 2000,
};

export const MEASURE_CONFIG_OPTIONS = {
  DURATION_OPTIONS: [15, 30, 60],
  WORD_RANGE_OPTIONS: [25, 50, 100],
};

export const DEFAULT_TYPING_CONFIG: TypingConfiguration = {
  duration: 30,
  wordRange: 25,
  completeOn: "timeEnd",
  difficulty: {
    punctuation: false,
    numbers: false,
    uppercase: false,
  },
};

export const DEFAULT_TYPING_SESSION: TypingSession = {
  header: {
    id: null,
    startTimestamp: null,
    endTimestamp: null,
    configuration: DEFAULT_TYPING_CONFIG,
    reason: "force-exit",
  },
  body: {
    text: null,
    typed: null,
    pauseEvent: [],
    timeLine: [],
    mistakeEvent: [],
    keyEvent: [],

    summary: {
      net: {
        totalChars: 0,
        correctChars: 0,
        incorrectChars: 0,
      },
      gross: {
        totalBackspaces: 0,
        totalKeyPresses: 0,
      },
    },
  },
};
