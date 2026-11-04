import { useEffect, useState } from "react";
import type { ReplayFrame } from "./analyzer";
import resultStyles from "../components/typing-results.module.css";

interface ReplayProps {
  frames: ReplayFrame[];
}

export function Replay({ frames }: ReplayProps) {
  const [frameIndex, setFrameIndex] = useState(-1);

  useEffect(() => {
    setFrameIndex(-1);
    if (frames.length === 0) return;

    const timers = frames.map((frame, index) =>
      window.setTimeout(() => setFrameIndex(index), frame.elapsedMs),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [frames]);

  const currentText =
    frameIndex >= 0 ? frames[frameIndex].text : "";

  return (
    <div className={resultStyles.replay}>
      <div className={resultStyles.replayHeader}>
        <span className={resultStyles.replayTitle}>Typing replay</span>
        <span className={resultStyles.replayProgress}>
          {frameIndex + 1} / {frames.length}
        </span>
      </div>
      <div className={resultStyles.replayViewport}>
        <div className={resultStyles.replayText}>
          {currentText}
          <span className={resultStyles.replayCaret} aria-hidden="true">
            |
          </span>
        </div>
      </div>
    </div>
  );
}
