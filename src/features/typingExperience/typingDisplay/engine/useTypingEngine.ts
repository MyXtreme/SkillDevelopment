import { useCallback, useEffect, useRef, useState } from "react";
import { useTypingContext, type EndReason } from "../../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../../typingDefaults";
import { createTypingSessionRecorder } from "./typingRecorderFactory";
import { useAppContext } from "../../../../app/appContext";
import useInputManager from "../../../../hooks/inputManager/useInputManager";
import { createTypingPauseObserver } from "../typingObserverFactory";

const useSecondTicker = (
  active: boolean,
  getElapsedMs: () => number,
  onSecond: (second: number) => void,
) => {
  useEffect(() => {
    if (!active) return;
    let timeoutID: ReturnType<typeof setTimeout>;
    let lastSecond = -1;

    const update = () => {
      const elapsedMs = getElapsedMs();
      const second = Math.floor(elapsedMs / 1000);
      if (second !== lastSecond) {
        lastSecond = second;
        onSecond(second);
      }

      timeoutID = setTimeout(update, 1000 - (elapsedMs % 1000) + 1);
    };

    update();
    return () => clearTimeout(timeoutID);
  }, [active, getElapsedMs, onSecond]);
};

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
  const [recorder] = useState(() => createTypingSessionRecorder(config));
  const [pauseObserver] = useState(() =>
    createTypingPauseObserver(() => recorder.getElapsedMs(), {
      onAfkStart: () => typingAction.setEngagement("passive"),
      onResume: () => typingAction.setEngagement("active"),
    }),
  );

  const intervalIDRef = useRef<number | null>(null);
  const endTimeoutIDRef = useRef<number | null>(null);
  const isTerminatingRef = useRef(false);

  const latest = useRef({
    engineStatus: typingState.status,
    config: typingState.config,
    typedText,
    currentText,
    onBufferLow,
  });

  useEffect(() => {
    latest.current = {
      engineStatus: typingState.status,
      config: typingState.config,
      typedText,
      currentText,
      onBufferLow,
    };
  }, [
    typingState.status,
    typingState.config,
    typedText,
    currentText,
    onBufferLow,
  ]);

  //When engine idle
  useEffect(() => {
    if (engineStatus === "idle") {
      setTime(0);
      setTypedText("");
    }
  }, [engineStatus, config.difficulty, config.completeOn, config.wordRange]);

  const clearRunTimers = useCallback(() => {
    if (intervalIDRef.current !== null) clearInterval(intervalIDRef.current);
    if (endTimeoutIDRef.current !== null) clearTimeout(endTimeoutIDRef.current);
    intervalIDRef.current = null;
    endTimeoutIDRef.current = null;
  }, []);

  const terminateEngineRun = useCallback(
    (reason: EndReason, typedOverride?: string) => {
      if (isTerminatingRef.current) return;
      if (!recorder.recording) return;

      isTerminatingRef.current = true;
      clearRunTimers();

      recorder.tick();

      if (reason === "timeEnd") setTime(latest.current.config.duration);

      const pauseEvent = pauseObserver.stop();
      const finalSession = recorder.stop(
        reason,
        latest.current.currentText,
        typedOverride ?? latest.current.typedText,
        pauseEvent,
      );
      typingAction.setSession(finalSession);
      typingAction.setStatus("finished");
      action.changeLayoutMode("normal");
    },
    [typingAction, action, recorder, pauseObserver, clearRunTimers],
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

      if (currentStatus === "finished") return;
      if (ctrlKey || altKey || metaKey) return;

      const isBackspace = key === "Backspace";
      if (!isBackspace && [...key].length !== 1) return;

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
      pauseObserver.recordActivity();
      if (shouldBreak) return;

      if (currentStatus !== "idle" && currentStatus !== "running") return;

      let nextLength = activeTyped.length;

      if (isBackspace) {
        e.preventDefault();
        if (currentStatus === "idle") return;
        if (cursorIndex <= 0) return;

        nextLength = nextLength - 1;
        setTypedText((prev) => prev.slice(0, -1));
      } else {
        e.preventDefault();
        nextLength = activeTyped.length + 1;

        if (currentStatus === "idle") {
          setTime(0);
          setTypedText("");
          recorder.start();
          recorder.capture(key, activeText[cursorIndex], cursorIndex);
          pauseObserver.start();
          pauseObserver.recordActivity();
          isTerminatingRef.current = false;
          typingAction.setStatus("running");
          action.changeLayoutMode("focused");
        }

        setTypedText((prev) => prev + key);

        if (
          currentConfig.completeOn === "textEnd" &&
          nextLength >= activeText.length
        ) {
          terminateEngineRun("textEnd", activeTyped + key);
        }
      }

      if (currentConfig.completeOn === "timeEnd") {
        const remainingChars = activeText.length - nextLength;
        if (
          remainingChars <= PERFORMANCE_THRESHOLDS.REMAINING_BUFFER_THRESHOLD
        ) {
          latest.current.onBufferLow();
        }
      }
    },
    [typingAction, action, terminateEngineRun, recorder, pauseObserver],
  );

  useInputManager({ onInputReceive: handleIncomingInput });

  const synctTime = useCallback(
    (seconds: number) => {
      if (recorder.recording) {
        setTime(seconds);
      }
    },
    [recorder],
  );

  useSecondTicker(engineStatus === "running", recorder.getElapsedMs, synctTime);

  useEffect(() => {
    if (engineStatus !== "running") return;

    const { config: runConfig } = latest.current;

    if (runConfig.completeOn === "timeEnd") {
      const remainingMs = Math.max(
        0,
        runConfig.duration * 1000 - recorder.getElapsedMs(),
      );
      endTimeoutIDRef.current = window.setTimeout(
        () => terminateRef.current("timeEnd"),
        remainingMs,
      );
    }

    intervalIDRef.current = window.setInterval(() => {
      if (!recorder.recording) return;
      recorder.tick();
    }, PERFORMANCE_THRESHOLDS.LOOP_TICK_INTERVAL_MS);

    return clearRunTimers;
  }, [engineStatus, recorder, clearRunTimers]);

  return { typedText, time };
}
