import clsx from "clsx";
import { useState } from "react";
import { useAppContext } from "../../../context/appContext";
import {
  useTypingContext,
  type TypingConfiguration,
} from "../context/TypingContext";

interface TypingControlsProps {
  onClickDuration: (duration: TypingConfiguration["duration"]) => void;
  //   onClickContent: (content: TypingConfiguration["content"]) => void;
  //   onClickDifficulty: (difficulty: TypingConfiguration["difficulty"]) => void;
}

function Controls({ onClickDuration }: TypingControlsProps) {
  const { app } = useAppContext();
  const { typingState } = useTypingContext();
  const immersive = app.layoutMode === "focused";

  type ActivePanel = "none" | keyof TypingConfiguration;
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  return (
    <header className={clsx("section", { "fade-out": immersive })} id="header">
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
