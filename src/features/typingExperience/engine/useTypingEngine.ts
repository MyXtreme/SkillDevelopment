import { useCallback, useEffect, useRef, useState } from "react";
import { useTypingContext, type EndReason } from "../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";
import { createTypingSessionRecorder } from "./typingRecorderFactory";
import { useAppContext } from "../../../context/appContext";
import useInputManager from "../../../hooks/useInputManager";
import { createTypingPauseObserver } from "./typingObserverFactory";

interface EngineProps {
  currentText: string;
  onBufferLow: () => void;
}

export function useTypingEngine({ currentText, onBufferLow }: EngineProps) {
  const { action } = useAppContext();
  const { typingState, typingAction } = useTypingContext();
  const { status: engineStatus, config } = typingState;

  const [typedText, setTypedText] = useState("");
  const [time, setTime] = useState(0);

  const typedDeltaRef = useRef("");
  const intervalIDRef = useRef<number | null>(null);
  const endTimeoutIDRef = useRef<number | null>(null);
  const isTerminatingRef = useRef(false);
  const sessionRecorderRef = useRef(createTypingSessionRecorder(config));
  const pauseObserverRef = useRef(
    createTypingPauseObserver(() => sessionRecorderRef.current.getElapsedMs(), {
      onAfkStart: () => {
        typingAction.setEngagement("passive");
      },
      onResume: () => {
        typingAction.setEngagement("active");
      },
    }),
  );

  const latest = useRef({
    engineStatus: typingState.status,
    config: typingState.config,
    typedText,
    currentText,
    time,
  });
  useEffect(() => {
    latest.current = {
      engineStatus: typingState.status,
      config: typingState.config,
      typedText,
      currentText,
      time,
    };
  }, [typingState.status, typingState.config, typedText, currentText, time]);

  useEffect(() => {
    if (engineStatus === "idle") {
      setTime(0);
      setTypedText("");
      typedDeltaRef.current = "";
    }
  }, [engineStatus]);

  useEffect(() => {
    if (engineStatus === "idle") {
      setTime(0);
      setTypedText("");
      typedDeltaRef.current = "";
    }
  }, [engineStatus, config.difficulty, config.completeOn, config.wordRange]);

  const clearRunTimers = () => {
    if (intervalIDRef.current !== null) clearInterval(intervalIDRef.current);
    if (endTimeoutIDRef.current !== null) clearTimeout(endTimeoutIDRef.current);
    intervalIDRef.current = null;
    endTimeoutIDRef.current = null;
  };

  const terminateEngineRun = useCallback(
    (reason: EndReason) => {
      if (isTerminatingRef.current) return;
      if (!sessionRecorderRef.current.recording) return;

      isTerminatingRef.current = true;
      clearRunTimers();

      if (intervalIDRef.current) clearInterval(intervalIDRef.current);
      intervalIDRef.current = null;

      const { typedText: curTyped, currentText: curOrig } = latest.current;
      const caretIndex = curTyped.length;
      if (typedDeltaRef.current.length > 0) {
        const deltaStart = Math.max(
          0,
          caretIndex - typedDeltaRef.current.length,
        );
        sessionRecorderRef.current.tick(
          curOrig.slice(deltaStart, caretIndex),
          typedDeltaRef.current,
        );
        typedDeltaRef.current = "";
      }

      if (reason === "timeEnd") setTime(latest.current.config.duration);

      const pauseEvent = pauseObserverRef.current.stop();
      const finalSession = sessionRecorderRef.current.stop(
        reason,
        latest.current.currentText,
        latest.current.typedText,
        pauseEvent,
      );
      typingAction.setSession(finalSession);
      typingAction.setStatus("finished");
      action.changeLayoutMode("normal");
    },
    [typingAction, action],
  );

  const terminateRef = useRef(terminateEngineRun);
  useEffect(() => {
    terminateRef.current = terminateEngineRun;
  }, [terminateEngineRun]);

  const handleIncomingInput = useCallback(
    (e: any) => {
      const { key, ctrlKey, altKey, metaKey } = e;
      const {
        engineStatus: currentStatus,
        config: currentConfig,
        currentText: activeText,
        typedText: activeTyped,
      } = latest.current;

      if (ctrlKey || altKey || metaKey || key === "Escape" || key === "Tab")
        return;
      if (currentStatus === "finished") return;

      const recorder = sessionRecorderRef.current;
      if (
        currentConfig.completeOn === "timeEnd" &&
        recorder.recording &&
        recorder.getElapsedMs() >= currentConfig.duration * 1000
      ) {
        terminateEngineRun("timeEnd");
        return;
      }

      const cursorIndex = activeTyped.length;
      const shouldBreak = recorder.capture(
        key,
        activeText[cursorIndex],
        cursorIndex,
      );
      pauseObserverRef.current.recordActivity();
      if (shouldBreak) {
        return;
      }
      if (currentStatus === "idle" || currentStatus === "running") {
        let nextLength = activeTyped.length;

        if (key === "Backspace") {
          e.preventDefault();
          if (currentStatus === "idle") return;

          nextLength = Math.max(0, activeTyped.length - 1);

          if (cursorIndex <= 0) return;
          setTypedText((prev) => prev.slice(0, -1));
          typedDeltaRef.current = typedDeltaRef.current.slice(0, -1);
        } else if (key.length === 1 || key === " ") {
          e.preventDefault();
          nextLength = activeTyped.length + 1;

          if (currentStatus === "idle") {
            recorder.start();
            recorder.capture(key, activeText[cursorIndex], cursorIndex);
            pauseObserverRef.current.start();
            pauseObserverRef.current.recordActivity();
            isTerminatingRef.current = false;
            typingAction.setStatus("running");
            action.changeLayoutMode("focused");
          }

          const charToAppend = key === " " ? " " : key;
          setTypedText((prev) => prev + charToAppend);
          typedDeltaRef.current += charToAppend;

          if (
            currentConfig.completeOn === "textEnd" &&
            nextLength >= activeText.length
          ) {
            terminateEngineRun("textEnd");
          }
        }

        if (currentConfig.completeOn === "timeEnd") {
          const remainingChars = activeText.length - nextLength;
          if (
            remainingChars <= PERFORMANCE_THRESHOLDS.REMAINING_BUFFER_THRESHOLD
          ) {
            onBufferLow();
          }
        }
      }
    },
    [typingAction, action, terminateEngineRun],
  );

  useInputManager({ onInputReceive: handleIncomingInput });

  useEffect(() => {
    if (engineStatus !== "running") return;

    const { config: runConfig } = latest.current;

    if (runConfig.completeOn === "timeEnd") {
      const remainingMs = Math.max(
        0,
        runConfig.duration * 1000 - sessionRecorderRef.current.getElapsedMs(),
      );
      endTimeoutIDRef.current = window.setTimeout(
        () => terminateRef.current("timeEnd"),
        remainingMs,
      );
    }

    intervalIDRef.current = window.setInterval(() => {
      const recorder = sessionRecorderRef.current;

      if (!recorder.recording) return;

      setTime(Math.floor(recorder.getElapsedMs() / 1000));
      const { typedText: curTyped, currentText: curOrig } = latest.current;
      const deltaLength = typedDeltaRef.current.length;
      const caretIndex = curTyped.length;
      const deltaStart = Math.max(0, caretIndex - deltaLength);

      recorder.tick(
        curOrig.slice(deltaStart, caretIndex),
        typedDeltaRef.current,
      );
      typedDeltaRef.current = "";
    }, PERFORMANCE_THRESHOLDS.LOOP_TICK_INTERVAL_MS);

    return clearRunTimers;
  }, [engineStatus]);

  return { typedText, time };
}
