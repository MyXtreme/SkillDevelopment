import clsx from "clsx";

import { useAppContext } from "../../context/appContext";
import { TypingProvider, useTypingContext } from "./context/TypingContext";
import Controls from "./components/Controls";
import TypingDisplay from "./components/TypingDisplay";
import TypingResults from "./components/TypingResults";
import { useTypingLifecycle } from "./hooks/useTypingLifecycle";

function TypingView() {
  const { app } = useAppContext();

  const { status, handler } = useTypingLifecycle();

  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isFinished = status === "finished";
  const immersive = app.layoutMode === "focused";
  return (
    <main className="section" id="main">
      {!isFinished && <Controls />}
      {(isIdle || isRunning) && <TypingDisplay />}
      {isFinished && (
        <TypingResults onRetry={handler.retry} onNext={handler.continue} />
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
