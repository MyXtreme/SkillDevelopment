import clsx from "clsx";
import { useState } from "react";
import { useAppContext } from "../../../context/appContext";
import { type TypingConfiguration } from "../context/TypingContext";

import controlStyles from "./controls.module.css";

interface TypingControlsProps {
  onClickDuration: (duration: TypingConfiguration["duration"]) => void;
  onClickWordRange: (content: TypingConfiguration["wordRange"]) => void;
  //   onClickDifficulty: (difficulty: TypingConfiguration["difficulty"]) => void;
}

function Controls({ onClickDuration, onClickWordRange }: TypingControlsProps) {
  const { app } = useAppContext();
  const immersive = app.layoutMode === "focused";

  type ActivePanel = "none" | keyof TypingConfiguration;
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  return (
    <header className={clsx("section", { "fade-out": immersive })} id="header">
      <div className={clsx(controlStyles.panels, controlStyles.displayPanels)}>
        <button onClick={() => setActivePanel("duration")}>Duration</button>
        <button onClick={() => setActivePanel("wordRange")}>Words</button>
        <button onClick={() => setActivePanel("difficulty")}>Difficulty</button>
      </div>
      <div
        className={clsx(
          controlStyles.panels,
          controlStyles.configurationPanels,
        )}
      >
        {activePanel === "duration" && (
          <div
            className={clsx(
              controlStyles.panels,
              controlStyles.configurationPanels,
            )}
          >
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
        {activePanel === "wordRange" && (
          <div
            className={clsx(
              controlStyles.panels,
              controlStyles.configurationPanels,
            )}
          >
            <button
              onClick={() => {
                onClickWordRange(25);
              }}
            >
              25
            </button>
            <button
              onClick={() => {
                onClickWordRange(50);
              }}
            >
              50
            </button>
            <button
              onClick={() => {
                onClickWordRange(100);
              }}
            >
              100
            </button>
          </div>
        )}
        {activePanel === "difficulty" && (
          <div
            className={clsx(
              controlStyles.panels,
              controlStyles.configurationPanels,
            )}
          >
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
