import { useState, useEffect, useCallback, useRef } from "react";
import { useTypingContext } from "../context/TypingContext";
import { randomTexGeneration } from "../utils/textGenerationUtils";

export function useEngineText() {
  const { typingState, typingAction } = useTypingContext();
  const { status, config, session } = typingState;
  const sessionText = session.body.text;

  const [currentText, setCurrentText] = useState<string>(() => {
    return (
      sessionText ||
      randomTexGeneration(
        config.difficulty.numbers,
        config.difficulty.punctuation,
        config.difficulty.uppercase,
        config.completeOn === "textEnd" ? config.wordRange : null,
      )
    );
  });

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (status !== "idle") return;

    let targetText = "";

    if (sessionText) {
      targetText = sessionText;
    } else {
      targetText = randomTexGeneration(
        config.difficulty.numbers,
        config.difficulty.punctuation,
        config.difficulty.uppercase,
        config.completeOn === "textEnd" ? config.wordRange : null,
      );
    }

    setCurrentText(targetText);

    if (sessionText !== targetText) {
      typingAction.setSession({
        ...session,
        body: { ...session.body, text: targetText },
      });
    }
  }, [status, config.difficulty, config.completeOn, config.wordRange]);

  const appendBuffer = useCallback(() => {
    const extraText = randomTexGeneration(
      configRef.current.difficulty.numbers,
      configRef.current.difficulty.punctuation,
      configRef.current.difficulty.uppercase,
    );
    setCurrentText((prev) => {
      const updatedText = prev + extraText;
      typingAction.setSession({
        ...typingState.session,
        body: {
          ...typingState.session.body,
          text: updatedText,
        },
      });
      return updatedText;
    });
  }, [typingAction, typingState.session]);

  return { currentText, appendBuffer };
}
