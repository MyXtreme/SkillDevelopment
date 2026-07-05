import clsx from "clsx";
import { useState } from "react";
import { useAppContext } from "../../../context/appContext";
import { useTypingContext } from "../context/TypingContext";
import { type TypingConfiguration } from "../context/TypingContext";

import controlStyles from "./controls.module.css";

interface TypingControlsProps {
  onClickDuration: (duration: TypingConfiguration["duration"]) => void;
  onClickWordRange: (content: TypingConfiguration["wordRange"]) => void;
  onClickDifficulty: (difficulty: TypingConfiguration["difficulty"]) => void;
}

function Controls({
  onClickDuration,
  onClickWordRange,
  onClickDifficulty,
}: TypingControlsProps) {
  const { app } = useAppContext();
  const { typingState } = useTypingContext();
  const difficulty = typingState.config.difficulty;
  const immersive = app.layoutMode === "focused";

  type ActivePanel = "none" | keyof TypingConfiguration;
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  return (
    <div
      className={clsx(controlStyles.configControls, { "fade-out": immersive })}
    >
      <div className={clsx(controlStyles.panels)}>
        <button
          className={clsx(
            controlStyles.displayPanels,
            controlStyles.controlItems,
            {
              [controlStyles.activePanel]: activePanel === "duration",
            },
          )}
          onClick={() => setActivePanel("duration")}
        >
          Duration
        </button>
        <button
          className={clsx(
            controlStyles.displayPanels,
            controlStyles.controlItems,
            {
              [controlStyles.activePanel]: activePanel === "wordRange",
            },
          )}
          onClick={() => setActivePanel("wordRange")}
        >
          Words
        </button>
        <button
          className={clsx(
            controlStyles.displayPanels,
            controlStyles.controlItems,
            {
              [controlStyles.activePanel]: activePanel === "difficulty",
            },
          )}
          onClick={() => setActivePanel("difficulty")}
        >
          Difficulty
        </button>
      </div>
      {activePanel === "duration" && (
        <div className={clsx(controlStyles.panels)}>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              {
                [controlStyles.activePanel]: typingState.config.duration === 15,
              },
            )}
            onClick={() => {
              const newTime = 15;
              onClickDuration(newTime);
            }}
          >
            15s
          </button>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              {
                [controlStyles.activePanel]: typingState.config.duration === 30,
              },
            )}
            onClick={() => {
              const newTime = 30;
              onClickDuration(newTime);
            }}
          >
            30s
          </button>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              {
                [controlStyles.activePanel]: typingState.config.duration === 60,
              },
            )}
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
        <div className={clsx(controlStyles.panels)}>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              {
                [controlStyles.activePanel]:
                  typingState.config.wordRange === 25,
              },
            )}
            onClick={() => {
              onClickWordRange(25);
            }}
          >
            25
          </button>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              {
                [controlStyles.activePanel]:
                  typingState.config.wordRange === 50,
              },
            )}
            onClick={() => {
              onClickWordRange(50);
            }}
          >
            50
          </button>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              {
                [controlStyles.activePanel]:
                  typingState.config.wordRange === 100,
              },
            )}
            onClick={() => {
              onClickWordRange(100);
            }}
          >
            100
          </button>
        </div>
      )}
      {activePanel === "difficulty" && (
        <div className={clsx(controlStyles.panels)}>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              { [controlStyles.activePanel]: difficulty.punctuation },
            )}
            onClick={() => {
              const newDifficulty = !difficulty.punctuation;
              onClickDifficulty({
                ...difficulty,
                punctuation: newDifficulty,
              });
            }}
          >
            Punctuation
          </button>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              { [controlStyles.activePanel]: difficulty.numbers },
            )}
            onClick={() => {
              const newDifficulty = !difficulty.numbers;
              onClickDifficulty({
                ...difficulty,
                numbers: newDifficulty,
              });
            }}
          >
            Numbers
          </button>
          <button
            className={clsx(
              controlStyles.controlItems,
              controlStyles.configurationPanels,
              { [controlStyles.activePanel]: difficulty.uppercase },
            )}
            onClick={() => {
              const newDifficulty = !difficulty.uppercase;
              onClickDifficulty({
                ...difficulty,
                uppercase: newDifficulty,
              });
            }}
          >
            Upper-case
          </button>
        </div>
      )}
    </div>
  );
}

export default Controls;
