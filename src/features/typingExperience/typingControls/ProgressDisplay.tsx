import type { CSSProperties, ReactElement } from "react";
import type {
  TestProgress,
  ProgressCount,
  ProgressUnit,
} from "./useTypingProgress";
import { DEFAULT_PROGRESS_APPEARANCE } from "../typingDefaults";

import styles from "./typing-display.module.css";

export type VariantType = "number" | "bar";
export type DirectionType = "grow" | "shrink";
export interface ProgressAppearance {
  variant: VariantType;
  direction: DirectionType;
}

interface ProgressDisplayProps {
  progress: TestProgress;
  appearance?: ProgressAppearance;
}

const NUMBER_BY_UNIT: Record<
  ProgressUnit,
  (count: ProgressCount) => ReactElement
> = {
  seconds: ({ remaining }) => (
    <div className={styles.number} role="timer" aria-label="Time remaining">
      {remaining}
    </div>
  ),
  words: ({ current: passed, total }) => (
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
interface BarProps {
  progress: TestProgress;
  direction: DirectionType;
}
function Bar({ progress, direction }: BarProps): ReactElement {
  const scale =
    direction === "grow" ? progress.fraction : 1 - progress.fraction;

  return (
    <div className={styles.bar}>
      <div
        className={styles.barFill}
        style={{ "--scale": scale, "--transition": 500 } as CSSProperties}
      />
    </div>
  );
}
export function ProgressDisplay({
  progress,
  appearance = DEFAULT_PROGRESS_APPEARANCE,
}: ProgressDisplayProps): ReactElement {
  return (
    <>
      {appearance.variant === "number" &&
        NUMBER_BY_UNIT[progress.count.unit](progress.count)}
      {appearance.variant === "bar" && (
        <Bar progress={progress} direction={appearance.direction}></Bar>
      )}
    </>
  );
}
