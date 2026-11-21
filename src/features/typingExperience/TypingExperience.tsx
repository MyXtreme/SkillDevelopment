import clsx from "clsx";

import { useAppContext } from "../../app/appContext";
import { TypingProvider } from "./context/TypingContext";
import TypingDisplay from "./typingDisplay/TypingDisplay";
import TypingResults from "./typingResults/TypingResults";
import { useTypingLifecycle } from "./useTypingLifecycle";

function TypingView() {
  const { app } = useAppContext();

  const { status, handler } = useTypingLifecycle();

  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isFinished = status === "finished";
  const immersive = app.layoutMode === "focused";
  return (
    <main className="section" id="main">
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
