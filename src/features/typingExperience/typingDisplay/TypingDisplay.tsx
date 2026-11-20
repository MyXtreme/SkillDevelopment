import clsx from "clsx";
import { useTypingContext } from "../context/TypingContext";
import { useAutoScroll } from "./useAutoScroll";
import { generateTextTokens } from "../typingUtils/textHighlighter";

import typingDisplayStyles from "./typing-display.module.css";
import { Fragment } from "react/jsx-runtime";
import { useTypingEngine } from "./engine/useTypingEngine";
import { useEngineText } from "./engine/useEngineText";
import { ProgressDisplay } from "../typingControls/ProgressDisplay";
import { useTestProgress } from "../typingControls/useTypingProgress";

export default function TypingDisplay() {
  const { typingState } = useTypingContext();
  const { currentText, appendBuffer } = useEngineText();
  const { typedText, time } = useTypingEngine({
    currentText,
    onBufferLow: appendBuffer,
  });

  const tokens = generateTextTokens(currentText, typedText);
  const { scrollOffset, setSpanRef } = useAutoScroll(typedText.length);
  const progress = useTestProgress({
    completeOn: typingState.config.completeOn,
    duration: typingState.config.duration,
    elapsedSeconds: time,
    typedLength: typedText.length,
    text: currentText,
  });

  const isRunning = typingState.status === "running";
  return (
    <div className={typingDisplayStyles.typingWrapper}>
      <div
        className={clsx(typingDisplayStyles.testProgress, {
          "fade-out": !isRunning,
        })}
      >
        <ProgressDisplay progress={progress} />
      </div>
      <div className={typingDisplayStyles.typingArea}>
        <div
          className={typingDisplayStyles.typingContent}
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
          {tokens.map((token, index) => (
            <Fragment key={`${token.char}-${index}`}>
              <span
                ref={setSpanRef(index)}
                className={clsx(typingDisplayStyles[token.classNameKey], {
                  [typingDisplayStyles.caretAnchor]: token.isCaretBefore,
                })}
              >
                {token.isCaretBefore && (
                  <span
                    className={clsx(typingDisplayStyles.caretIndicator, {
                      [typingDisplayStyles.caretAnimated]:
                        typingState.config.caretAnimation,
                    })}
                    aria-hidden="true"
                  />
                )}
                {token.char}
              </span>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
