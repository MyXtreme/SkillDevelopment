import { useCallback, useEffect, useRef, useState } from "react";
import {
  useTypingContext,
  type EndReason,
  type KeyAction,
} from "../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";
import { createTypingSessionRecorder } from "../engine/typingRecorderFactory";
import { useAppContext } from "../../../context/appContext";
import useInputManager from "../../../hooks/useInputManager";

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

  const typedDelta = useRef("");
  const intervalID = useRef<number | null>(null);
  const lastKeyTimeRef = useRef<number | null>(null);
  const sessionRecord = useRef(createTypingSessionRecorder(config));

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
      typedDelta.current = "";
      lastKeyTimeRef.current = null;
    }
  }, [engineStatus]);

  useEffect(() => {
    if (engineStatus === "idle") {
      setTime(0);
      setTypedText("");
      typedDelta.current = "";
      lastKeyTimeRef.current = null;
    }
  }, [engineStatus, config.difficulty, config.completeOn, config.wordRange]);

  const terminateEngineRun = useCallback(
    (reason: EndReason) => {
      if (intervalID.current) clearInterval(intervalID.current);
      intervalID.current = null;

      const finalSession = sessionRecord.current.stop(
        reason,
        latest.current.currentText,
      );
      typingAction.setSession(finalSession);
      typingAction.setStatus("finished");
      action.changeLayoutMode("normal");
    },
    [typingAction, action],
  );

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

      if (currentStatus === "idle" || currentStatus === "running") {
        const now = Date.now();
        let actionType: KeyAction | null = null;
        let nextLength = activeTyped.length;

        if (key === "Backspace") {
          e.preventDefault();
          if (currentStatus === "idle") return;

          actionType = "delete";
          nextLength = Math.max(0, activeTyped.length - 1);
          setTypedText((prev) => prev.slice(0, -1));
          typedDelta.current = typedDelta.current.slice(0, -1);
        } else if (key.length === 1 || key === " ") {
          e.preventDefault();
          actionType = "insert";
          nextLength = activeTyped.length + 1;

          if (currentStatus === "idle") {
            sessionRecord.current = createTypingSessionRecorder(currentConfig);
            sessionRecord.current.start();
            typingAction.setStatus("running");
            action.changeLayoutMode("focused");
          }

          const charToAppend = key === " " ? " " : key;
          setTypedText((prev) => prev + charToAppend);
          typedDelta.current += charToAppend;
        }

        if (actionType !== null) {
          sessionRecord.current.record({
            prevKeyTimeStamp: lastKeyTimeRef.current,
            timestamp: now,
            key,
            cursorIndex: activeTyped.length,
            action: actionType,
          });
          lastKeyTimeRef.current = now;
        }

        if (currentConfig.completeOn === "timeEnd") {
          const remainingChars = activeText.length - nextLength;
          if (
            remainingChars <= PERFORMANCE_THRESHOLDS.REMAINING_BUFFER_THRESHOLD
          ) {
            onBufferLow();
          }
        }
        if (
          currentConfig.completeOn === "textEnd" &&
          nextLength >= activeText.length
        ) {
          terminateEngineRun("textEnd");
        }
      }
    },
    [typingAction, action, terminateEngineRun],
  );

  useInputManager({ onInputReceive: handleIncomingInput });

  useEffect(() => {
    if (engineStatus !== "running") return;

    intervalID.current = window.setInterval(() => {
      setTime((prev) => {
        const nextTime = prev + 1;
        if (
          latest.current.config.completeOn === "timeEnd" &&
          nextTime >= latest.current.config.duration
        ) {
          terminateEngineRun("timeEnd");
        }
        return nextTime;
      });

      const { typedText: curTyped, currentText: curOrig } = latest.current;
      const deltaLength = typedDelta.current.length;
      const caretIndex = curTyped.length;
      const deltaStart = Math.max(0, caretIndex - deltaLength);

      sessionRecord.current.tick(
        curOrig.slice(deltaStart, caretIndex),
        typedDelta.current,
        deltaStart,
      );
      typedDelta.current = "";
    }, PERFORMANCE_THRESHOLDS.LOOP_TICK_INTERVAL_MS);

    return () => {
      if (intervalID.current) clearInterval(intervalID.current);
    };
  }, [engineStatus, terminateEngineRun]);

  return { typedText, time };
}
