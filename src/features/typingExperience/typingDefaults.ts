import { type TypingConfiguration } from "./context/TypingContext";

export const PERFORMANCE_THRESHOLDS = {
  REMAINING_BUFFER_THRESHOLD: 40,
  INIT_RENDER_TEXT_LENGTH: 60,
  CPM_TO_WPM_DIVISOR: 5,
  LOOP_TICK_INTERVAL_MS: 1000,
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
