import clsx from "clsx";
import { Fragment } from "react";
import { useAppContext } from "../../../context/appContext";
import { useTypingContext } from "../context/TypingContext";

import sessionStyles from "./typing-test.module.css";

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
          className={
            sessionStyles[getCharClassName(index, character, splittedTypedText)]
          }
        >
          {character}
        </span>
      </Fragment>
    ) : (
      <span
        id={`${character}-${index}`}
        key={`${character}-${index}`}
        className={
          sessionStyles[getCharClassName(index, character, splittedTypedText)]
        }
      >
        {character}
      </span>
    ),
  );
};

interface TypingTest {
  time: number;
  typedText: string;
  currentText: string;
  scrollOffset: number;
}

function TypingTest({
  time,
  typedText,
  currentText,
  scrollOffset,
}: TypingTest) {
  const { app } = useAppContext();
  const { typingState } = useTypingContext();

  // const isIdle = typingState.status === "idle";
  const isRunning = typingState.status === "running";
  // const isFinished = typingState.status === "finished";
  return (
    <div className={sessionStyles.typingWrapper}>
      <div
        className={clsx(sessionStyles.testProgress, { "fade-out": !isRunning })}
      >
        {calculatetimeTick(time)}
      </div>
      <div className={sessionStyles.typingArea}>
        <div
          className={sessionStyles.typingContent}
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
          {spanSplittedCurrentText(currentText, typedText)}
        </div>
      </div>
    </div>
  );
}

export default TypingTest;
