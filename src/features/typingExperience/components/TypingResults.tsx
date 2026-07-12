import { useState, type ReactNode } from "react";
import { useTypingContext } from "../context/TypingContext";
import resultStyles from "./typing-results.module.css";
import { useTypingSessionResults } from "../typingResults/useTypingResults";
import clsx from "clsx";
import { SpeedChart } from "../typingResults/speedGraph";
import { analyzeSpeedSeries } from "../typingResults/analyzer";

interface TypingResultsProps {
  onRetry: () => void;
  onNext: () => void;
}
type QualityTab = "speed" | "accuracy" | "consistency" | "none";

export default function TypingResults({ onRetry, onNext }: TypingResultsProps) {
  const [activeTab, setActiveTab] = useState<QualityTab>("none");

  const result = useTypingSessionResults();
  const wpm = result.metrics.speed.wpm;
  const accuracy = result.metrics.accuracy.accuracy;
  const consistency = result.metrics.consistency.score;
  const afkTime = result.metrics.engagement.afkTime;

  //TODO: Implement visual graph building with chart.js library.
  return (
    <div className={resultStyles.resultsArea}>
      <div
        className={clsx(resultStyles.resultWrapper, {
          [resultStyles.hasDetails]: activeTab !== "none",
        })}
      >
        <div className={resultStyles.heroRow}>
          <div
            className={clsx(resultStyles.heroTab, {
              [resultStyles.active]: activeTab === "speed",
            })}
            onClick={() =>
              setActiveTab(activeTab === "speed" ? "none" : "speed")
            }
          >
            <span className={resultStyles.label}>WPM</span>
            <span className={resultStyles.value}>{wpm}</span>
          </div>
          <div
            className={clsx(resultStyles.heroTab, {
              [resultStyles.active]: activeTab === "accuracy",
            })}
            onClick={() =>
              setActiveTab(activeTab === "accuracy" ? "none" : "accuracy")
            }
          >
            <span className={resultStyles.label}>ACC</span>
            <span className={resultStyles.value}>{accuracy}</span>
          </div>
          <div
            className={clsx(resultStyles.heroTab, resultStyles.comboTab, {
              [resultStyles.active]: activeTab === "consistency",
            })}
            onClick={() => {
              setActiveTab(
                activeTab === "consistency" ? "none" : "consistency",
              );
            }}
          >
            <div className={resultStyles.subMetric}>
              <span className={resultStyles.label}>Consistency</span>
              <span className={resultStyles.subValue}>{consistency}</span>
            </div>
            <div className={resultStyles.subMetric}>
              <span className={resultStyles.label}>AFK Time</span>
              <span className={resultStyles.subValue}>{afkTime}</span>
            </div>
          </div>
        </div>
        {activeTab !== "none" && (
          <div className={resultStyles.detailsArea}>
            {activeTab === "speed" && (
              <SpeedChart
                speedPoints={result.speedSeries}
                showRaw={true}
                averageWpm={result.metrics.speed.averageWpm}
              />
            )}
            {activeTab === "accuracy" && <></>}
            {activeTab === "consistency" && <></>}
          </div>
        )}
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
