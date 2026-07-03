import { useAppContext } from "../../../context/appContext";
import { useTypingContext } from "../context/TypingContext";
import resultStyles from "./typing-results.module.css";

interface TypingResultsProps {
  onRetry: () => void;
  onNext: () => void;
}

function TypingResults({ onRetry, onNext }: TypingResultsProps) {
  const { app } = useAppContext();
  const { typingState, typingAction } = useTypingContext();

  const snapshot = typingState.session.timeLine.at(-1);
  //TODO: Implement average value of array or other proper delivery of summary
  if (!snapshot)
    throw Error(
      "the session data is undefined, unable to render results from undefined",
    );
  const wpm = snapshot.metrics.wpm;
  const accuracy = snapshot.metrics.accuracy;
  const raw = snapshot.metrics.raw;

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
