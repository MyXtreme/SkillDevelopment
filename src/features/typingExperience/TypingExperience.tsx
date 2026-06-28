import clsx from "clsx";

import { useAppContext } from "../../context/appContext";
import { TypingProvider, useTypingContext } from "./context/TypingContext";
import Controls from "./components/Controls";
import TypingSession from "./components/TypingSession";
import TypingResults from "./components/TypingResults";
import { useTypingEngine } from "./hooks/useTypingEngine";

function TypingView() {
  const { app } = useAppContext();
  const { typingState } = useTypingContext();

  const isIdle = typingState.status === "idle";
  const isRunning = typingState.status === "running";
  const isFinished = typingState.status === "finished";

  const { handleRetry, handleNext, handleClickDuration } = useTypingEngine();
  const immersive = app.layoutMode === "focused";
  return (
    <main className="section" id="main">
      {!isFinished && <Controls onClickDuration={handleClickDuration} />}
      {(isIdle || isRunning) && <TypingSession />}
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
