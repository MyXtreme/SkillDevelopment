import {
  useTypingContext,
  type TypingConfiguration,
} from "../context/TypingContext";

interface ConfigAction {
  setDuration: (duration: number) => void;
  setWordRange: (wordRange: number) => void;
  setDifficulty: (difficulty: TypingConfiguration["difficulty"]) => void;
}

export function useTypingConfig() {
  const { typingState, typingAction } = useTypingContext();

  const setDuration = (duration: number) => {
    typingAction.setConfig({
      ...typingState.config,
      duration,
      completeOn: "timeEnd",
    });
  };

  const setWordRange = (wordRange: number) => {
    typingAction.setConfig({
      ...typingState.config,
      wordRange,
      completeOn: "textEnd",
    });
  };

  const setDifficulty = (difficulty: TypingConfiguration["difficulty"]) => {
    typingAction.setConfig({ ...typingState.config, difficulty });
  };

  const configAction: ConfigAction = {
    setDuration,
    setWordRange,
    setDifficulty,
  };

  return {
    config: typingState.config,
    configAction,
  };
}
