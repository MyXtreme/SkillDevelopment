import clsx from "clsx";

import { useAppContext } from "../../context/appContext";
import { TypingProvider, useTypingContext } from "./context/TypingContext";
import Controls from "./components/Controls";
import TypingDisplay from "./components/TypingDisplay";
import TypingResults from "./components/TypingResults";
import { useTypingLifecycle } from "./engine/useTypingLifecycle";

function TypingView() {
  const { app } = useAppContext();
  const { typingState } = useTypingContext();

  const isIdle = typingState.status === "idle";
  const isRunning = typingState.status === "running";
  const isFinished = typingState.status === "finished";

  const {
    ui,
    handleRetry,
    handleNext,
    handleClickDuration,
    handleClickWordRange,
    handleClickDifficulty,
  } = useTypingLifecycle();
  const immersive = app.layoutMode === "focused";
  return (
    <main className="section" id="main">
      {!isFinished && (
        <Controls
          onClickDuration={handleClickDuration}
          onClickWordRange={handleClickWordRange}
          onClickDifficulty={handleClickDifficulty}
        />
      )}
      {(isIdle || isRunning) && (
        <TypingDisplay
          time={ui.time}
          typedText={ui.typedText}
          currentText={ui.currentText}
        />
      )}
      {isFinished && (
        <TypingResults onRetry={handleRetry} onNext={handleNext} />
      )}
      <section
        className={clsx({ "fade-out": immersive })}
        id="bottomer"
      ></section>
    </main>
  );
}

function TypingExperience() {
  return (
    <TypingProvider>
      <TypingView />
    </TypingProvider>
  );
}

export default TypingExperience;
