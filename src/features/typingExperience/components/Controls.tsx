import clsx from "clsx";
import { useState } from "react";
import { useAppContext } from "../../../context/appContext";

type ActivePanel = "none" | "duration" | "words" | "complexity";
type Complexity = {
  simple: boolean;
  punctuation: boolean;
  numbers: boolean;
  upperCase: boolean;
};

const [activePanel, setActivePanel] = useState<ActivePanel>("none");

export const [duration, setDuration] = useState<number>(30);
export const [words, setWords] = useState<number>(60);
export const [complexity, setComplexity] = useState<Complexity>({
  simple: true,
  punctuation: false,
  numbers: false,
  upperCase: false,
});

const toggleProperty = (property: keyof Complexity) => {
  setComplexity((prevComplexity) => ({
    ...prevComplexity,
    [property]: !prevComplexity[property],
  }));
};

function Controls() {
  const { app } = useAppContext();
  const immersive = app.layoutMode === "focused";
  return (
    <header className={clsx({ "fade-out": immersive })} id="header">
      <div className="panels display-panels">
        <button
          className={clsx({ active: activePanel === "duration" })}
          onClick={() => setActivePanel("duration")}
        >
          Duration
        </button>
        <button
          className={clsx({ active: activePanel === "words" })}
          onClick={() => setActivePanel("words")}
        >
          Words
        </button>
        <button
          className={clsx({ active: activePanel === "complexity" })}
          onClick={() => setActivePanel("complexity")}
        >
          Complexity
        </button>
      </div>
      <div className="panels configuration-panels">
        {activePanel === "duration" && (
          <div className={clsx("panels configuration-panels")}>
            <button
              onClick={() => {
                const newTime = 15;
                setDuration(newTime);
              }}
            >
              15s
            </button>
            <button
              onClick={() => {
                const newTime = 30;
                setDuration(newTime);
              }}
            >
              30s
            </button>
            <button
              onClick={() => {
                const newTime = 60;
                setDuration(newTime);
              }}
            >
              60s
            </button>
          </div>
        )}
        {activePanel === "words" && (
          <div className="panels configuration-panels">
            <button
              onClick={() => {
                const wordCount = 40;
                setWords(wordCount);
              }}
            >
              40
            </button>
            <button
              onClick={() => {
                const wordCount = 60;
                setWords(wordCount);
              }}
            >
              60
            </button>
            <button
              onClick={() => {
                const wordCount = 80;
                setWords(wordCount);
              }}
            >
              80
            </button>
          </div>
        )}
        {activePanel === "complexity" && (
          <div className="panels configuration-panels">
            <button
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
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Controls;
