import { useState, useEffect, Fragment } from "react";
import clsx from "clsx";
import commonWords from "./data/commonWordsEng.ts";
import "./styles/App.css";

function texGeneration(source: string[] = commonWords, wordRange = 40): string {
  const dataset: string[] = source;

  let index: number;
  const min: number = 0;
  const max: number = dataset.length;
  let text: string = "";
  for (let i = 0; i < wordRange; i++) {
    index = Math.floor(Math.random() * (max - min)) + min;
    text += dataset[index] + " ";
  }
  return text;
}

const getCharClassName = (
  index: number,
  character: string,
  splittedTypedText: string[],
): string => {
  if (index >= splittedTypedText.length) return "idle-char";

  return splittedTypedText[index] === character
    ? "correct-char"
    : "incorrect-char";
};

const spanSplittedCurrentText = (
  currentText: string,
  typedText: string,
): React.JSX.Element[] => {
  const splittedCurrentText: string[] = currentText.split("");
  const splittedTypedText: string[] = typedText.split("");
  return splittedCurrentText.map((character, index) =>
    index === typedText.length ? (
      <Fragment key={`caret-${index}`}>
        <span id="caret">|</span>
        <span
          id={`${character}-${index}`}
          key={`${character}-${index}`}
          className={getCharClassName(index, character, splittedTypedText)}
        >
          {character}
        </span>
      </Fragment>
    ) : (
      <span
        id={`${character}-${index}`}
        key={`${character}-${index}`}
        className={getCharClassName(index, character, splittedTypedText)}
      >
        {character}
      </span>
    ),
  );
};

const calculatetimeTick = (time: number): string => {
  const minute: string = Math.floor(time / 60).toString();
  const second: string = Math.floor(time % 60).toString();
  return `${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
};

const showResults = (results: boolean[], time: number) => {
  const correctChars = results.filter(Boolean).length;

  const accuracy = (correctChars / results.length) * 100;
  const raw = results.length / 5 / (time / 60);
  const wpm = correctChars / 5 / (time / 60);

  return {
    accuracy: Number(accuracy.toFixed(1)),
    raw: Number(raw.toFixed(1)),
    wpm: Number(Math.floor(wpm)),
  };
};

const calculateResults = (
  currentText: string,
  typedText: string,
  time: number,
) => {
  const splittedCurrentText: string[] = currentText.split("");
  const splittedTypedText: string[] = typedText.split("");
  const results: boolean[] = splittedTypedText.map<boolean>(
    (character, index) => character === splittedCurrentText[index],
  );
  return showResults(results, time);
};

function App() {
  type TestStatus = "idle" | "running" | "finished";

  type ActivePanel = "none" | "duration" | "words" | "complexity";
  type TestMode = "classic" | "race" | "story" | "chat";
  type Complexity = {
    simple: boolean;
    punctuation: boolean;
    numbers: boolean;
    upperCase: boolean;
  };

  const result = {
    accuracy: 0,
    raw: 0,
    wpm: 0,
  };

  //const logo = "";
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [duration, setDuration] = useState<number>(30);
  const [words, setWords] = useState<number>(60);
  const [complexity, setComplexity] = useState<Complexity>({
    simple: true,
    punctuation: false,
    numbers: false,
    upperCase: false,
  });
  const [time, setTime] = useState<number>(duration);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMode] = useState<TestMode>("classic");
  const [typedText, setTypedText] = useState<string>("");
  const [currentText, setCurrentText] = useState<string>(() =>
    texGeneration(commonWords, words),
  );
  const [scrollOffset, setScrollOffset] = useState(0);
  const [results, setResults] = useState(result);

  const handleTestReset = () => {
    setTestStatus("idle");
    setTypedText("");
    setTime(duration);
    setActivePanel("none");
  };

  const handleTestNext = () => {
    setTestStatus("idle");
    setTypedText("");
    setTime(duration);
    setActivePanel("none");
    setCurrentText(texGeneration(commonWords));
  };

  const toggleProperty = (property: keyof Complexity) => {
    setComplexity((prevComplexity) => ({
      ...prevComplexity,
      [property]: !prevComplexity[property],
    }));
  };

  useEffect(() => {
    const handlekeydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (testStatus === "finished" && time <= 0) return;
      if (testStatus === "idle") setTestStatus("running");
      event.preventDefault();

      if (event.key === "Tab") {
        handleTestNext();
      }
      if (event.key === "Backspace") {
        setTypedText((typedText) => typedText.slice(0, -1));
      } else if (event.key === "Space") {
        setTypedText((typedText) => typedText + event.key);
      } else if (event.key.length === 1) {
        setTypedText((typedText) => typedText + event.key);
      } else return;
    };

    window.addEventListener("keydown", handlekeydown);
    return () => {
      window.removeEventListener("keydown", handlekeydown);
    };
  }, [testStatus]);

  useEffect(() => {
    if (currentText.length * 0.7 <= typedText.length) {
      setCurrentText((currentText) => currentText + texGeneration(commonWords));
    }
  }, [typedText, currentText]);

  useEffect(() => {
    if (testStatus !== "running") return;

    setResults({ accuracy: 0, raw: 0, wpm: 0 });
    const interval = setInterval(() => {
      if (testMode === "classic") {
        setTime((time) => {
          if (time <= 0) return 0;
          return time - 1;
        });
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [testStatus]);

  useEffect(() => {
    if (time === 0) {
      setTestStatus("finished");
      setResults(calculateResults(currentText, typedText, duration));
    }
  }, [time]);

  useEffect(() => {
    if (typedText.length === 0) {
      setScrollOffset(0);
    }
    const currentCharIndex = typedText.length;
    if (currentCharIndex === 0) return;

    const getSpanAtIndex = (index: number) => {
      return document.getElementById(`${currentText[index]}-${index}`);
    };
    const currentCharSpan = getSpanAtIndex(currentCharIndex);
    const firstCharSpan = getSpanAtIndex(0);

    if (!currentCharSpan || !firstCharSpan) return;

    const lineTopHeight: number = firstCharSpan.offsetTop;
    const lineBetweenHeight = parseInt(
      window.getComputedStyle(currentCharSpan).lineHeight,
      10,
    );
    const getCurrentLineIndex = (currentCharIndex: number): number => {
      const currentCharSpan = getSpanAtIndex(currentCharIndex);
      if (!currentCharSpan) {
        console.log("not found such element at index: " + currentCharIndex);
        return -1;
      }
      return (currentCharSpan.offsetTop - lineTopHeight) / lineBetweenHeight;
    };

    const currentLineIndex = getCurrentLineIndex(currentCharIndex);
    const isLineChanged =
      currentLineIndex !== getCurrentLineIndex(currentCharIndex - 1);

    if (currentLineIndex === -1 || currentLineIndex === 1) return;
    if (isLineChanged) {
      setScrollOffset(Math.max(0, (currentLineIndex - 1) * lineBetweenHeight));
    }
  }, [typedText]);

  const isRunning = testStatus === "running";
  const isFinished = testStatus === "finished";

  console.log(complexity);

  return (
    <div id="app">
      <nav className="section" id="navigation">
        {/* TODO: add logo */}
        <div className="container">
          <h1>MyXtype</h1>
          <div
            className={clsx("placeholder1", { "fade-out": isRunning })}
          ></div>
        </div>
        <div className={clsx("placeholder1", { "fade-out": isRunning })}></div>
      </nav>
      {!isFinished && (
        <header
          className={clsx("section", { "fade-out": isRunning })}
          id="header"
        >
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
                    setTime(newTime);
                  }}
                >
                  15s
                </button>
                <button
                  onClick={() => {
                    const newTime = 30;
                    setDuration(newTime);
                    setTime(newTime);
                  }}
                >
                  30s
                </button>
                <button
                  onClick={() => {
                    const newTime = 60;
                    setDuration(newTime);
                    setTime(newTime);
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
      )}
      <main className="section" id="main">
        {(testStatus === "running" || testStatus === "idle") && (
          <div className="typing-wrapper">
            <div className={`test-progress ${isRunning ? "" : "fade-out"}`}>
              {calculatetimeTick(time)}
            </div>
            <div className="typing-area">
              <div
                className="typing-content"
                style={{ transform: `translateY(-${scrollOffset}px)` }}
              >
                {spanSplittedCurrentText(currentText, typedText)}
              </div>
            </div>
          </div>
        )}
        {isFinished && (
          <div className="results-area">
            <div className="visual">
              <div className="placeholder1"></div>
            </div>
            <div className="results">
              <div className="main-metrics">
                <div className="main-unit">
                  WPM
                  <div className="main-value">{results.wpm} </div>
                </div>
                <div className="main-unit">
                  ACC
                  <div className="main-value">{results.accuracy}% </div>
                </div>
              </div>
              <div className="secondary-metrics">
                <div className="unit">
                  Raw speed: <div className="unit-value">{results.raw}</div>
                </div>
                <div className="unit">Consistency</div>
              </div>
            </div>
            <div className="action-buttons">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleTestReset}
              >
                reset
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleTestNext}
              >
                next
              </button>
            </div>
          </div>
        )}
      </main>
      <section
        className={clsx("section", { "fade-out": isRunning })}
        id="bottomer"
      ></section>
      <footer
        className={clsx("section", { "fade-out": isRunning })}
        id="footer"
      >
        <div className="container">
          <div className="placeholder1"></div>
          <div className="placeholder1"></div>
          <div className="placeholder1"></div>
        </div>
        <div className="container">
          <div className="placeholder1"></div>
          <div className="placeholder1"></div>
        </div>
      </footer>
    </div>
  );
}

export default App;
