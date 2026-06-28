import { useState, useEffect } from "react";
import { useTypingContext } from "../context/TypingContext";
import { useAppContext } from "../../../context/appContext";
import { randomTexGeneration } from "../utils/textUtils";

export function useTypingEngine() {
  const { app } = useAppContext();
  const { typingState, typingAction } = useTypingContext();
  const [time, setTime] = useState<number>(typingState.config.duration);
  const [typedText, setTypedText] = useState<string>("");
  const [currentText, setCurrentText] = useState<string>(() =>
    randomTexGeneration(),
  );
  const [scrollOffset, setScrollOffset] = useState(0);

  const showResults = (results: boolean[], time: number) => {
    const correctChars = results.filter(Boolean).length;

    const accuracy = (correctChars / results.length) * 100;
    const raw = results.length / 5 / (time / 60);
    const wpm = correctChars / 5 / (time / 60);

    return {
      wpm: Number(Math.floor(wpm)),
      accuracy: Number(accuracy.toFixed(1)),
      raw: Number(raw.toFixed(1)),
      consistency: 0,
    };
  };

  const calculateResults = (
    currentText: string,
    typedText: string,
    time: number,
  ) => {
    const splittedCurrentText: string[] = currentText.split("");
    const splittedTypedText: string[] = typedText.split("");
    const results: boolean[] = splittedTypedText.map<boolean>(
      (character, index) => character === splittedCurrentText[index],
    );
    return showResults(results, time);
  };

  const handleRetry = () => {
    typingAction.setStatus("idle");
    setTime(typingState.config.duration);
    setTypedText("");
  };

  const handleNext = () => {
    typingAction.setStatus("idle");
    setTime(typingState.config.duration);
    setTypedText("");
    setCurrentText(() => randomTexGeneration());
  };

  const handleClickDuration = (duration: number) => {
    typingAction.setConfig({ ...typingState.config, duration });
    setTime(typingState.config.duration);
  };

  useEffect(() => {
    if (typingState.status !== "running") return;

    const interval = setInterval(() => {
      setTime((time) => {
        if (time <= 0) return 0;
        return time - 1;
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [typingState.status]);

  useEffect(() => {
    const handlekeydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (typingState.status === "finished" && time <= 0) return;
      if (typingState.status === "idle") {
        typingAction.setStatus("running");
      }
      event.preventDefault();

      if (event.key === "Tab") {
        handleNext();
      }
      if (event.key === "Backspace") {
        setTypedText((typedText) => typedText.slice(0, -1));
      } else if (event.key === "Space") {
        setTypedText((typedText) => typedText + event.key);
      } else if (event.key.length === 1) {
        setTypedText((typedText) => typedText + event.key);
      } else return;
    };

    window.addEventListener("keydown", handlekeydown);
    return () => {
      window.removeEventListener("keydown", handlekeydown);
    };
  }, [typingState.status]);

  useEffect(() => {
    if (currentText.length * 0.7 <= typedText.length) {
      setCurrentText((currentText) => currentText + randomTexGeneration());
    }
  }, [typedText, currentText]);

  useEffect(() => {
    if (typedText.length === 0) {
      setScrollOffset(0);
    }
    const currentCharIndex = typedText.length;
    if (currentCharIndex === 0) return;

    const getSpanAtIndex = (index: number) => {
      return document.getElementById(`${currentText[index]}-${index}`);
    };
    const currentCharSpan = getSpanAtIndex(currentCharIndex);
    const firstCharSpan = getSpanAtIndex(0);

    if (!currentCharSpan || !firstCharSpan) return;

    const lineTopHeight: number = firstCharSpan.offsetTop;
    const lineBetweenHeight = parseInt(
      window.getComputedStyle(currentCharSpan).lineHeight,
      10,
    );
    const getCurrentLineIndex = (currentCharIndex: number): number => {
      const currentCharSpan = getSpanAtIndex(currentCharIndex);
      if (!currentCharSpan) {
        console.log("not found such element at index: " + currentCharIndex);
        return -1;
      }
      return (currentCharSpan.offsetTop - lineTopHeight) / lineBetweenHeight;
    };

    const currentLineIndex = getCurrentLineIndex(currentCharIndex);
    const isLineChanged =
      currentLineIndex !== getCurrentLineIndex(currentCharIndex - 1);

    if (currentLineIndex === -1 || currentLineIndex === 1) return;
    if (isLineChanged) {
      setScrollOffset(Math.max(0, (currentLineIndex - 1) * lineBetweenHeight));
    }
  }, [typedText]);

  useEffect(() => {
    if (time === 0) {
      typingAction.setStatus("finished");
      const results = {
        ...typingState.session,
        summary: calculateResults(
          currentText,
          typedText,
          typingState.config.duration,
        ),
      };
      typingAction.setSession(results);
    }
  }, [time]);

  return {
    time,
    typedText,
    currentText,
    scrollOffset,
    handleClickDuration,
    handleNext,
    handleRetry,
  };
}
