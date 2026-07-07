import { useState } from "react";
import { useTypingContext } from "../context/TypingContext";
import resultStyles from "./typing-results.module.css";

interface TypingResultsProps {
  onRetry: () => void;
  onNext: () => void;
}
type QualityTab = "speed" | "accuracy" | "consistency" | "none";
function TypingResults({ onRetry, onNext }: TypingResultsProps) {
  const { typingState } = useTypingContext();
  const [activeTab, setActiveTab] = useState<QualityTab>("none");

  //TODO: Implement average value of array or other proper delivery of summary

  const wpm = 0;
  const accuracy = 0;
  const raw = 0;

  const consistency = 0;

  //TODO: Implement visual graph building with chart.js library.
  return (
    <div className={resultStyles.resultsArea}>
      <div className={resultStyles.visual}>
        <div className={"placeholder1"}></div>
      </div>
      <div className={resultStyles.results}>
        <div className={resultStyles.mainMetrics}>
          <div className={resultStyles.mainUnit}>
            WPM
            <div className={resultStyles.mainValue}>{wpm} </div>
          </div>
          <div className={resultStyles.mainUnit}>
            ACC
            <div className={resultStyles.mainValue}>{accuracy}% </div>
          </div>
        </div>
        <div className={resultStyles.secondaryMetrics}>
          <div className={resultStyles.unit}>
            Raw speed: <div className={resultStyles.unitValue}>{raw}</div>
          </div>
          <div className={resultStyles.unit}>
            Consistency:{" "}
            <div className={resultStyles.unitValue}>{consistency}</div>{" "}
          </div>
        </div>
      </div>
      <div className={resultStyles.actionButtons}>
        <button onMouseDown={(e) => e.preventDefault()} onClick={onRetry}>
          reset
        </button>
        <button onMouseDown={(e) => e.preventDefault()} onClick={onNext}>
          next
        </button>
      </div>
    </div>
  );
}

export default TypingResults;
