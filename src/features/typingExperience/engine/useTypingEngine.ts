import { useCallback, useEffect, useRef, useState } from "react";
import {
  useTypingContext,
  type EndReason,
  type TypingSessionSummary,
} from "../context/TypingContext";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";
import { createTypingSessionRecorder } from "./typingRecorderFactory";
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
  const isTerminating = useRef(false);
  const sessionRecord = useRef(createTypingSessionRecorder(config));
  const statsRef = useRef<TypingSessionSummary>({
    net: {
      totalChars: 0,
      correctChars: 0,
      incorrectChars: 0,
    },
    gross: {
      totalKeyPresses: 0,
      totalBackspaces: 0,
    },
  });

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
    }
  }, [engineStatus]);

  useEffect(() => {
    if (engineStatus === "idle") {
      setTime(0);
      setTypedText("");
      typedDelta.current = "";
    }
  }, [engineStatus, config.difficulty, config.completeOn, config.wordRange]);

  const terminateEngineRun = useCallback(
    (reason: EndReason) => {
      if (isTerminating.current) return;
      if (!sessionRecord.current || !sessionRecord.current.recording) return;

      isTerminating.current = true;

      if (intervalID.current) clearInterval(intervalID.current);
      intervalID.current = null;
      statsRef.current.net.totalChars = latest.current.typedText.length;
      const { typedText: curTyped, currentText: curOrig } = latest.current;
      if (typedDelta.current.length > 0) {
        const caretIndex = curTyped.length;
        const deltaStart = Math.max(0, caretIndex - typedDelta.current.length);
        sessionRecord.current.tick(
          curOrig.slice(deltaStart, caretIndex),
          typedDelta.current,
        );
        typedDelta.current = "";
      }

      const finalSession = sessionRecord.current.stop(
        reason,
        latest.current.currentText,
        statsRef.current,
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

      const cursorIndex = activeTyped.length;
      const shouldBreak = sessionRecord.current.capture(
        key,
        activeText[cursorIndex],
        cursorIndex,
      );
      if (shouldBreak) {
        return;
      }
      if (currentStatus === "idle" || currentStatus === "running") {
        let nextLength = activeTyped.length;

        if (key === "Backspace") {
          e.preventDefault();
          if (currentStatus === "idle") return;

          nextLength = Math.max(0, activeTyped.length - 1);
          statsRef.current.gross.totalBackspaces++;

          if (cursorIndex <= 0) return;

          const indexToDelete = cursorIndex - 1;
          const charsToDelete = activeTyped[indexToDelete];
          const expectedChar = activeText[indexToDelete];

          if (charsToDelete === expectedChar) {
            statsRef.current.net.correctChars--;
          } else {
            statsRef.current.net.incorrectChars--;
          }
          setTypedText((prev) => prev.slice(0, -1));
          typedDelta.current = typedDelta.current.slice(0, -1);
        } else if (key.length === 1 || key === " ") {
          e.preventDefault();
          const currentIndex = activeTyped.length;
          nextLength = 1 + 1;

          if (currentStatus === "idle") {
            if (
              sessionRecord.current.typingSessionID === null &&
              sessionRecord.current === null
            ) {
              console.warn("created second session recorder");
              sessionRecord.current =
                createTypingSessionRecorder(currentConfig);
            }
            sessionRecord.current.start();
            sessionRecord.current.capture(
              key,
              activeText[cursorIndex],
              cursorIndex,
            );
            isTerminating.current = false;
            typingAction.setStatus("running");
            action.changeLayoutMode("focused");

            statsRef.current = {
              net: {
                totalChars: 0,
                correctChars: 0,
                incorrectChars: 0,
              },
              gross: {
                totalKeyPresses: 0,
                totalBackspaces: 0,
              },
            };
          }

          const charToAppend = key === " " ? " " : key;

          if (charToAppend === activeText[currentIndex]) {
            statsRef.current.net.correctChars++;
          } else {
            statsRef.current.net.incorrectChars++;
          }
          statsRef.current.gross.totalKeyPresses++;
          setTypedText((prev) => prev + charToAppend);
          typedDelta.current += charToAppend;

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

    intervalID.current = window.setInterval(() => {
      let holdingTermination = false;
      setTime((prev) => {
        const nextTime = prev + 1;
        if (
          latest.current.config.completeOn === "timeEnd" &&
          nextTime >= latest.current.config.duration
        ) {
          holdingTermination = true;
          setTimeout(() => {
            terminateEngineRun("timeEnd");
          }, 0);
        }
        return nextTime;
      });

      if (holdingTermination) return;
      const { typedText: curTyped, currentText: curOrig } = latest.current;
      const deltaLength = typedDelta.current.length;
      const caretIndex = curTyped.length;
      const deltaStart = Math.max(0, caretIndex - deltaLength);

      sessionRecord.current.tick(
        curOrig.slice(deltaStart, caretIndex),
        typedDelta.current,
      );
      typedDelta.current = "";
    }, PERFORMANCE_THRESHOLDS.LOOP_TICK_INTERVAL_MS);

    return () => {
      if (intervalID.current) clearInterval(intervalID.current);
    };
  }, [engineStatus, terminateEngineRun]);

  return { typedText, time };
}
