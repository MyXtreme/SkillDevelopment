import clsx from "clsx";
import { useState } from "react";
import { useAppContext } from "../../../context/appContext";
import { useTypingContext } from "../context/TypingContext";
import { type TypingConfiguration } from "../context/TypingContext";
import { MEASURE_CONFIG_OPTIONS } from "../typingDefaults";

import controlStyles from "./controls.module.css";
import { useTypingConfig } from "../hooks/useTypingConfig";

function Controls() {
  const { app } = useAppContext();
  const { config, configAction } = useTypingConfig();
  const immersive = app.layoutMode === "focused";

  type ActivePanel = "none" | keyof TypingConfiguration;
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");

  const getItemClass = (isActive: boolean, customPanelStyle?: string) =>
    clsx(controlStyles.controlItems, customPanelStyle, {
      [controlStyles.activePanel]: isActive,
    });

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
          {MEASURE_CONFIG_OPTIONS.DURATION_OPTIONS.map((time) => {
            return (
              <button
                key={time}
                className={getItemClass(
                  config.duration === time,
                  controlStyles.configurationPanels,
                )}
                onClick={() => configAction.setDuration(time)}
              >
                {time}
              </button>
            );
          })}
        </div>
      )}

      {activePanel === "wordRange" && (
        <div className={clsx(controlStyles.panels)}>
          {MEASURE_CONFIG_OPTIONS.WORD_RANGE_OPTIONS.map((range) => {
            return (
              <button
                key={range}
                className={getItemClass(
                  config.wordRange === range,
                  controlStyles.configurationPanels,
                )}
                onClick={() => configAction.setWordRange(range)}
              >
                {range}
              </button>
            );
          })}
        </div>
      )}
      {activePanel === "difficulty" && (
        <div className={clsx(controlStyles.panels)}>
          {(["punctuation", "numbers", "uppercase"] as const).map((key) => {
            const isActive = config.difficulty[key];
            return (
              <button
                key={key}
                className={clsx(
                  controlStyles.controlItems,
                  controlStyles.configurationPanels,
                  { [controlStyles.activePanel]: isActive },
                )}
                onClick={() =>
                  configAction.setDifficulty({
                    ...config.difficulty,
                    [key]: !isActive,
                  })
                }
              >
                {key}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Controls;
