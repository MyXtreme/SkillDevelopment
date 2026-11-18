import type { ReactElement } from "react";
import type {
  TestProgress,
  ProgressCount,
  ProgressUnit,
} from "../hooks/useTypingProgress";
import styles from "./typing-display.module.css";

interface ProgressDisplayProps {
  progress: TestProgress;
}

const NUMBER_BY_UNIT: Record<
  ProgressUnit,
  (count: ProgressCount) => ReactElement
> = {
  seconds: ({ remaining }) => (
    <div className={styles.number} aria-label="Time remaining">
      {remaining}
    </div>
  ),
  words: ({ passed, total }) => (
    <div
      className={styles.number}
      aria-label="Words typed"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={passed}
    >
      {passed}
      <span className={styles.numberTotal}>/{total}</span>
    </div>
  ),
};
export function ProgressDisplay({
  progress,
}: ProgressDisplayProps): ReactElement {
  return NUMBER_BY_UNIT[progress.count.unit](progress.count);
}
