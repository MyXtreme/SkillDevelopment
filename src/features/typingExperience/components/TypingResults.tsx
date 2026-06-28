import { useAppContext } from "../../../context/appContext";
import { useTypingContext } from "../context/TypingContext";

interface TypingResultsProps {
  onRetry: () => void;
  onNext: () => void;
}

function TypingResults({ onRetry, onNext }: TypingResultsProps) {
  const { app } = useAppContext();
  const { typingState, typingAction } = useTypingContext();

  const wpm = typingState.session.summary.wpm;
  const accuracy = typingState.session.summary.accuracy;
  const raw = typingState.session.summary.raw;

  return (
    <div className="results-area">
      <div className="visual">
        <div className="placeholder1"></div>
      </div>
      <div className="results">
        <div className="main-metrics">
          <div className="main-unit">
            WPM
            <div className="main-value">{wpm} </div>
          </div>
          <div className="main-unit">
            ACC
            <div className="main-value">{accuracy}% </div>
          </div>
        </div>
        <div className="secondary-metrics">
          <div className="unit">
            Raw speed: <div className="unit-value">{raw}</div>
          </div>
          <div className="unit">Consistency</div>
        </div>
      </div>
      <div className="action-buttons">
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
