import type { ReactElement } from "react";
import type { TestProgress } from "../hooks/useTypingProgress";
import styles from "./typing-display.module.css";

interface ProgressDisplayProps {
  progress: TestProgress;
}

export function ProgressDisplay({
  progress,
}: ProgressDisplayProps): ReactElement {
  const { unit, passed, total, remaining } = progress.count;
  return (
    <>
      {progress.completeOn === "timeEnd" && (
        <div className={styles.number} role="timer" aria-label="Time remaining">
          {remaining}
        </div>
      )}
      {progress.completeOn === "textEnd" && (
        <div
          className={styles.number}
          role="progressbar"
          aria-label="Words typed"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={passed}
        >
          {passed}
          <span className={styles.numberTotal}>/{total}</span>
        </div>
      )}
    </>
  );
}
