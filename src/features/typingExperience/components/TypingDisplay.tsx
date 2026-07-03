import clsx from "clsx";
import { useTypingContext } from "../context/TypingContext";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { formatTimeTick } from "../utils/timeUtils";
import { generateTextTokens } from "../utils/textHighlighter";

import typingDisplayStyles from "./typing-display.module.css";
import { Fragment } from "react/jsx-runtime";

interface TypingDisplay {
  time: number;
  typedText: string;
  currentText: string;
}

export default function TypingDisplay({
  time,
  typedText,
  currentText,
}: TypingDisplay) {
  const { typingState } = useTypingContext();

  const tokens = generateTextTokens(currentText, typedText);
  const { scrollOffset, setSpanRef } = useAutoScroll(typedText.length);

  const isRunning = typingState.status === "running";
  return (
    <div className={typingDisplayStyles.typingWrapper}>
      <div
        className={clsx(typingDisplayStyles.testProgress, {
          "fade-out": !isRunning,
        })}
      >
        {formatTimeTick(time)}
      </div>
      <div className={typingDisplayStyles.typingArea}>
        <div
          className={typingDisplayStyles.typingContent}
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
          {tokens.map((token, index) => (
            <Fragment key={`${token.char}-${index}`}>
              {token.isCaretBefore && <span className="caretIndicator">|</span>}
              <span
                ref={setSpanRef(index)}
                className={typingDisplayStyles[token.classNameKey]}
              >
                {token.char}
              </span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
