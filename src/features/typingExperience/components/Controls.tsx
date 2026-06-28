import clsx from "clsx";
import { useState } from "react";
import { useAppContext } from "../../../context/appContext";
import {
  useTypingContext,
  type TypingConfiguration,
} from "../context/TypingContext";

const { typingState } = useTypingContext();

interface TypingControlsProps {
  onClickDuration: (duration: typeof typingState.config.duration) => void;
  onClickContent: (content: typeof typingState.config.content) => void;
  onClickDifficulty: (difficulty: typeof typingState.config.difficulty) => void;
}

type ActivePanel = "none" | keyof TypingConfiguration;
const [activePanel, setActivePanel] = useState<ActivePanel>("none");

function Controls({
  onClickDuration,
  onClickContent,
  onClickDifficulty,
}: TypingControlsProps) {
  const { app } = useAppContext();
  const immersive = app.layoutMode === "focused";
  return (
    <header className={clsx({ "fade-out": immersive })} id="header">
      <div className="panels display-panels">
        <button onClick={() => setActivePanel("duration")}>Duration</button>
        <button onClick={() => setActivePanel("content")}>Content</button>
        <button onClick={() => setActivePanel("difficulty")}>Difficulty</button>
      </div>
      <div className="panels configuration-panels">
        {activePanel === "duration" && (
          <div className={clsx("panels configuration-panels")}>
            <button
              onClick={() => {
                const newTime = 15;
                onClickDuration(newTime);
              }}
            >
              15s
            </button>
            <button
              onClick={() => {
                const newTime = 30;
                onClickDuration(newTime);
              }}
            >
              30s
            </button>
            <button
              onClick={() => {
                const newTime = 60;
                onClickDuration(newTime);
              }}
            >
              60s
            </button>
          </div>
        )}
        {activePanel === "content" && (
          <div className="panels configuration-panels">
            Coming soon
            {/* <button
              onClick={() => {
                const contentType = "random";
                onClickContent(contentType);
              }}
            >
              Random
            </button>
            <button
              onClick={() => {
                const contentType = "quote";
                onClickContent(contentType);
              }}
            >
              quote
            </button>
            <button
              onClick={() => {
                const contentType = "story";
                onClickContent(contentType);
              }}
            >
              story
            </button> */}
          </div>
        )}
        {activePanel === "difficulty" && (
          <div className="panels configuration-panels">
            Coming soon
            {/* <button
              className={clsx({ active: complexity.punctuation })}
              onClick={() => {
                toggleProperty("punctuation");
              }}
            >
              Punctuation
            </button>
            <button
              className={clsx({ active: complexity.numbers })}
              onClick={() => {
                toggleProperty("numbers");
              }}
            >
              Numbers
            </button>
            <button
              className={clsx({ active: complexity.upperCase })}
              onClick={() => {
                toggleProperty("upperCase");
              }}
            >
              Upper-case
            </button> */}
          </div>
        )}
      </div>
    </header>
  );
}

export default Controls;
