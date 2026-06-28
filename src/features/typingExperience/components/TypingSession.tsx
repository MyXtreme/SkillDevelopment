import clsx from "clsx";
import { Fragment, useState } from "react";
import { useAppContext } from "../../../context/appContext";
import { useTypingContext } from "../context/TypingContext";
import { useTypingEngine } from "../hooks/useTypingEngine";

const calculatetimeTick = (time: number): string => {
  const minute: string = Math.floor(time / 60).toString();
  const second: string = Math.floor(time % 60).toString();
  return `${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
};

const getCharClassName = (
  index: number,
  character: string,
  splittedTypedText: string[],
): string => {
  if (index >= splittedTypedText.length) return "idle-char";

  return splittedTypedText[index] === character
    ? "correct-char"
    : "incorrect-char";
};

const spanSplittedCurrentText = (
  currentText: string,
  typedText: string,
): React.JSX.Element[] => {
  const splittedCurrentText: string[] = currentText.split("");
  const splittedTypedText: string[] = typedText.split("");
  return splittedCurrentText.map((character, index) =>
    index === typedText.length ? (
      <Fragment key={`caret-${index}`}>
        <span id="caret">|</span>
        <span
          id={`${character}-${index}`}
          key={`${character}-${index}`}
          className={getCharClassName(index, character, splittedTypedText)}
        >
          {character}
        </span>
      </Fragment>
    ) : (
      <span
        id={`${character}-${index}`}
        key={`${character}-${index}`}
        className={getCharClassName(index, character, splittedTypedText)}
      >
        {character}
      </span>
    ),
  );
};

function TypingSession() {
  const { app } = useAppContext();
  const { typingState } = useTypingContext();
  const { time, typedText, currentText, scrollOffset } = useTypingEngine();

  // const isIdle = typingState.status === "idle";
  const isRunning = typingState.status === "running";
  // const isFinished = typingState.status === "finished";
  return (
    <div className="typing-wrapper">
      <div className={clsx("test-progress", { "fade-out": !isRunning })}>
        {calculatetimeTick(time)}
      </div>
      <div className="typing-area">
        <div
          className="typing-content"
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
          {spanSplittedCurrentText(currentText, typedText)}
        </div>
      </div>
    </div>
  );
}

export default TypingSession;
