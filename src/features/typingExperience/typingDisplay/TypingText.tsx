import clsx from "clsx";
import { Fragment } from "react/jsx-runtime";
import { useTypingContext } from "../context/TypingContext";
import { ProgressDisplay } from "../typingControls/ProgressDisplay";
import { useTestProgress } from "../typingControls/useTypingProgress";
import { generateTextTokens } from "../typingUtils/textHighlighter";
import { useEngineText } from "./engine/useEngineText";
import { useTypingEngine } from "./engine/useTypingEngine";
import { useAutoScroll } from "./useAutoScroll";
import styles from "./typing-text.module.css";

export default function TypingText() {
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
    <div className={styles.typingText}>
      <div
        className={clsx(styles.testProgress, {
          "fade-out": !isRunning,
        })}
      >
        <ProgressDisplay progress={progress} />
      </div>
      <div className={styles.typingArea}>
        <div
          className={styles.typingContent}
          style={{ transform: `translateY(-${scrollOffset}px)` }}
        >
          {tokens.map((token, index) => (
            <Fragment key={`${token.char}-${index}`}>
              <span
                ref={setSpanRef(index)}
                className={clsx(styles[token.classNameKey], {
                  [styles.caretAnchor]: token.isCaretBefore,
                })}
              >
                {token.isCaretBefore && (
                  <span
                    className={clsx(styles.caretIndicator, {
                      [styles.caretAnimated]: typingState.config.caretAnimation,
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
