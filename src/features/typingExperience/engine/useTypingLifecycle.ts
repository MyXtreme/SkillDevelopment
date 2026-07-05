import { useCallback, useEffect, useRef, useState } from "react";
import {
  useTypingContext,
  type TypingConfiguration,
} from "../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";
import { randomTexGeneration } from "../utils/textGenerationUtils";
import { createTypingRecorder } from "./typingRecorderFactory";
import { useAppContext } from "../../../context/appContext";
import useInputManager from "../../../hooks/useInputManager";

export function useTypingLifecycle() {
  const { action } = useAppContext();
  const { typingState, typingAction } = useTypingContext();
  const engineStatus = typingState.status;
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const configRef = useRef<TypingConfiguration>({
    completeOn: typingState.config.completeOn,
    duration: typingState.config.duration,
    wordRange: typingState.config.wordRange,
    difficulty: {
      numbers: typingState.config.difficulty.numbers,
      punctuation: typingState.config.difficulty.punctuation,
      uppercase: typingState.config.difficulty.uppercase,
    },
  });

  const [currentText, setCurrentText] = useState<string>(() =>
    randomTexGeneration(
      configRef.current.difficulty.numbers,
      configRef.current.difficulty.punctuation,
      configRef.current.difficulty.uppercase,
      typingState.config.completeOn === "textEnd"
        ? typingState.config.wordRange
        : null,
    ),
  );

  const sessionRecord = useRef(createTypingRecorder());

  const [typedText, setTypedText] = useState("");
  const typedDelta = useRef("");
  const [time, setTime] = useState(0);
  const intervalID = useRef<number | null>(null);

  const textRef = useRef({
    typedTextLength: typedText.length,
    currentTextLength: currentText.length,
    typedDelta: typedDelta,
  });
  //====================== Handlers =========================//
  const handleRetry = () => {
    typingAction.setStatus("idle");
    action.changeLayoutMode("normal");
    setTime(0);
    setTypedText("");
  };

  const handleNext = () => {
    typingAction.setStatus("idle");
    action.changeLayoutMode("normal");
    setTime(0);
    setTypedText("");
    setCurrentText(() =>
      randomTexGeneration(
        configRef.current.difficulty.numbers,
        configRef.current.difficulty.punctuation,
        configRef.current.difficulty.uppercase,
        typingState.config.completeOn === "textEnd"
          ? typingState.config.wordRange
          : null,
      ),
    );
  };

  const handleClickDuration = (duration: number) => {
    typingAction.setConfig({
      ...typingState.config,
      duration,
      completeOn: "timeEnd",
    });
  };

  const handleClickWordRange = (wordRange: number) => {
    typingAction.setConfig({
      ...typingState.config,
      wordRange,
      completeOn: "textEnd",
    });
  };

  const handleClickDifficulty = ({
    numbers,
    punctuation,
    uppercase,
  }: TypingConfiguration["difficulty"]) => {
    console.log(numbers, punctuation, uppercase);
    typingAction.setConfig({
      ...typingState.config,
      difficulty: {
        numbers,
        punctuation,
        uppercase,
      },
    });
  };

  //update mutable ref values
  useEffect(() => {
    configRef.current = {
      completeOn: typingState.config.completeOn,
      duration: typingState.config.duration,
      wordRange: typingState.config.wordRange,
      difficulty: {
        numbers: typingState.config.difficulty.numbers,
        punctuation: typingState.config.difficulty.punctuation,
        uppercase: typingState.config.difficulty.uppercase,
      },
    };
  }, [typingState.config]);
  useEffect(() => {
    textRef.current = {
      typedTextLength: typedText.length,
      currentTextLength: currentText.length,
      typedDelta: typedDelta,
    };
  }, [typedText.length, currentText.length, typedDelta]);

  // ======================= Input ====================== //
  const handleIncomingInput = useCallback(
    (key: string, isShortcut: boolean) => {
      //if(terminate) return;
      if (engineStatus === "idle") {
        if (isShortcut) {
          if (key === "Escape") {
            //TODO: binded action for shortcut escape, e.g., open settings
            return;
          }
          if (key === "Tab") {
            //TODO: implement handler, e.g., quick retry
            return;
          }
          return;
        }
        typingAction.setStatus("running");
        setTestFinished(false);
        if (key === "Backspace") {
          setTypedText((prev) => prev.slice(0, -1));
          typedDelta.current = typedDelta.current.slice(0, -1);
        } else {
          const charToAppend = key === " " || key === "Spacebar" ? " " : key;
          setTypedText((prev) => prev + charToAppend);
          typedDelta.current += charToAppend;
        }
      }

      if (engineStatus === "running") {
        if (key === "Backspace") {
          setTypedText((prev) => prev.slice(0, -1));
          typedDelta.current = typedDelta.current.slice(0, -1);
        } else if (key.length === 1 || key === " ") {
          const charToAppend = key === " " || key === "Spacebar" ? " " : key;
          setTypedText((prev) => prev + charToAppend);
          typedDelta.current += charToAppend;
        }
        if (key.length > 1) {
          //TODO before there all shortcuts should be handled
          return;
        }

        if (
          typingState.config.completeOn === "textEnd" &&
          typedText.length >= currentText.length
        ) {
          setTestFinished(true);
        }
      }
      if (engineStatus === "finished") {
        if (key === "Enter") {
          //TODO: inplement handler, e.g., retry or next
          return;
        }
      }
    },
    [
      engineStatus,
      typingAction,
      typingState.config.completeOn,
      typedText.length,
      currentText.length,
      typedDelta.current,
    ],
  );

  useInputManager({ onInputReceive: handleIncomingInput });
  //========================== Running ==========================//
  useEffect(() => {
    if (engineStatus !== "running") return;
    sessionRecord.current.start();
    setTime(0);
    setTestFinished(false);
    action.changeLayoutMode("focused");

    intervalID.current = window.setInterval(() => {
      const { typedTextLength, typedDelta } = textRef.current;
      setTime((prev) => prev + 1);
      const caretIndex = typedTextLength;
      const deltaLength = typedDelta.current.length;
      const deltaStart = Math.max(caretIndex - deltaLength);
      const expectedTextSlice = currentText.slice(deltaStart, caretIndex);
      sessionRecord.current.tick(
        expectedTextSlice,
        typedDelta.current,
        deltaStart,
      );
      typedDelta.current = "";
    }, PERFORMANCE_THRESHOLDS.LOOP_TICK_INTERVAL_MS);

    return () => {
      if (intervalID.current) {
        clearInterval(intervalID.current);
        intervalID.current = null;
      }
    };
  }, [engineStatus]);

  useEffect(() => {
    const { completeOn, duration } = configRef.current;
    const { currentTextLength } = textRef.current;
    if (completeOn === "timeEnd" && time >= duration) {
      setTestFinished(true);
    }
    if (completeOn === "textEnd" && typedText.length >= currentTextLength) {
      setTestFinished(true);
    }
  }, [time, typedText.length]);

  useEffect(() => {
    if (!testFinished || engineStatus !== "running") return;
    const { completeOn } = configRef.current;
    if (intervalID.current) {
      clearInterval(intervalID.current);
      intervalID.current = null;
    }
    const finalSessionData = sessionRecord.current.stop(completeOn);
    typingAction.setSession(finalSessionData);
    typingAction.setStatus("finished");
    action.changeLayoutMode("normal");
  }, [testFinished, engineStatus]);

  // =================== TextRunning ================= //
  useEffect(() => {
    if (engineStatus === "running") return;
    setCurrentText(
      randomTexGeneration(
        typingState.config.difficulty.numbers,
        typingState.config.difficulty.punctuation,
        typingState.config.difficulty.uppercase,
        typingState.config.completeOn === "textEnd"
          ? typingState.config.wordRange
          : null,
      ),
    );
  }, [
    typingState.config.difficulty.numbers,
    typingState.config.difficulty.punctuation,
    typingState.config.difficulty.uppercase,
  ]);
  useEffect(() => {
    if (engineStatus !== "running") return;

    const { completeOn } = configRef.current;
    if (completeOn !== "timeEnd") return;

    const totalLength = currentText.length;
    const typedLength = typedText.length;
    const charactersRemaining = totalLength - typedLength;

    if (
      charactersRemaining <= PERFORMANCE_THRESHOLDS.REMAINING_BUFFER_THRESHOLD
    ) {
      const extraText = randomTexGeneration(
        configRef.current.difficulty.numbers,
        configRef.current.difficulty.punctuation,
        configRef.current.difficulty.uppercase,
      );
      setCurrentText((prev) => prev + extraText);
    }
  }, [typedText.length, currentText, engineStatus]);

  const ui = {
    config: configRef.current,
    typedText: typedText,
    currentText: currentText,
    time: time,
  };

  return {
    ui,
    handleRetry,
    handleNext,
    handleClickDuration,
    handleClickWordRange,
    handleClickDifficulty,
  };
}
