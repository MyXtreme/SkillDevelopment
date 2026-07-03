import { useCallback, useEffect, useRef, useState } from "react";
import { useTypingContext } from "../context/TypingContext";
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

  const [currentText, setCurrentText] = useState<string>(() =>
    randomTexGeneration(typingState.config.wordRange),
  );

  const sessionRecord = useRef(createTypingRecorder());
  const configRef = useRef({
    completeOn: typingState.config.completeOn,
    duration: typingState.config.duration,
    currentTextLength:
      typingState.config.wordRange > 0
        ? typingState.config.wordRange
        : currentText.length,
  });
  const typedText = useRef("");
  const typedDelta = useRef("");
  const [time, setTime] = useState(0);
  const intervalID = useRef<number | null>(null);

  const [renderNonce, setRenderNonce] = useState<number>(0);

  //====================== Handlers =========================//
  const handleRetry = () => {
    typingAction.setStatus("idle");
    action.changeLayoutMode("normal");
    setTime(0);
    typedText.current = "";
  };

  const handleNext = () => {
    typingAction.setStatus("idle");
    action.changeLayoutMode("normal");
    setTime(0);
    typedText.current = "";
    setCurrentText(() => randomTexGeneration());
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

  useEffect(() => {
    configRef.current = {
      completeOn: typingState.config.completeOn,
      duration: typingState.config.duration,
      currentTextLength: currentText.length,
    };
  }, [typingState.config, currentText.length]);

  // ======================= Input ====================== //
  const liveSyncRef = useRef({
    status: engineStatus,
    completeOn: typingState.config.completeOn,
    textLength: currentText.length,
    testFinished: testFinished,
  });

  useEffect(() => {
    liveSyncRef.current = {
      status: engineStatus,
      completeOn: typingState.config.completeOn,
      textLength: currentText.length,
      testFinished: testFinished,
    };
  }, [
    engineStatus,
    typingState.config.completeOn,
    currentText.length,
    testFinished,
  ]);
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
          typedText.current = typedText.current.slice(0, -1);
          typedDelta.current = typedDelta.current.slice(0, -1);
        } else {
          const charToAppend = key === " " || key === "Spacebar" ? " " : key;
          typedText.current += charToAppend;
          typedDelta.current += charToAppend;
        }
      }

      if (engineStatus === "running") {
        if (key === "Backspace") {
          typedText.current = typedText.current.slice(0, -1);
          typedDelta.current = typedDelta.current.slice(0, -1);
        } else if (key.length === 1 || key === " ") {
          const charToAppend = key === " " || key === "Spacebar" ? " " : key;
          typedText.current += charToAppend;
          typedDelta.current += charToAppend;
        }
        if (key.length > 1) {
          //TODO before there all shortcuts should be handled
          return;
        }
        setRenderNonce((prev) => prev + 1);

        if (
          typingState.config.completeOn === "textEnd" &&
          typedText.current.length >= currentText.length
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
      currentText.length,
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
      setTime((prev) => prev + 1);

      const caretIndex = typedText.current.length;
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
    const { completeOn, duration, currentTextLength } = configRef.current;
    if (completeOn === "timeEnd" && time >= duration) {
      setTestFinished(true);
    }
    if (
      completeOn === "textEnd" &&
      typedText.current.length >= currentTextLength
    ) {
      setTestFinished(true);
    }
  }, [time, typedText.current.length]);

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
    if (engineStatus !== "running") return;

    const { completeOn } = configRef.current;
    if (completeOn !== "timeEnd") return;

    const totalLength = currentText.length;
    const typedLength = typedText.current.length;
    const charactersRemaining = totalLength - typedLength;

    if (
      charactersRemaining <= PERFORMANCE_THRESHOLDS.REMAINING_BUFFER_THRESHOLD
    ) {
      const extraText = randomTexGeneration();
      setCurrentText((prev) => prev + extraText);
    }
  }, [typedText.current.length, currentText, engineStatus]);

  const ui = {
    typedText: typedText.current,
    currentText: currentText,
    time: time,
  };

  return {
    ui,
    handleRetry,
    handleNext,
    handleClickDuration,
    handleClickWordRange,
  };
}
