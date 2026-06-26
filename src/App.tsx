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

  type ActivePanel = "none" | "testTime" | "testWordCount";
  type TestMode = "classic" | "race" | "story" | "chat";

  const result = {
    accuracy: 0,
    raw: 0,
    wpm: 0,
  };

  //const logo = "";
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [testTime, setTestTime] = useState<number>(30);
  const [testWordCount, setTestWordCount] = useState<number>(60);
  const [time, setTime] = useState<number>(testTime);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMode] = useState<TestMode>("classic");
  const [typedText, setTypedText] = useState<string>("");
  const [currentText, setCurrentText] = useState<string>(() =>
    texGeneration(commonWords, testWordCount),
  );
  const [scrollOffset, setScrollOffset] = useState(0);
  const [results, setResults] = useState(result);

  const handleTestReset = () => {
    setTestStatus("idle");
    setTypedText("");
    setTime(testTime);
    setActivePanel("none");
  };

  const handleTestNext = () => {
    setTestStatus("idle");
    setTypedText("");
    setTime(testTime);
    setActivePanel("none");
    setCurrentText(texGeneration(commonWords));
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
      setResults(calculateResults(currentText, typedText, testTime));
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
              className={clsx({ active: activePanel === "testTime" })}
              onClick={() => setActivePanel("testTime")}
            >
              Time
            </button>
            <button
              className={clsx({ active: activePanel === "testWordCount" })}
              onClick={() => setActivePanel("testWordCount")}
            >
              Word
            </button>
          </div>
          <div className="panels configuration-panels">
            {activePanel === "testTime" && (
              <div className="configuration-panels">
                <button
                  onClick={() => {
                    const newTime = 15;
                    setTestTime(newTime);
                    setTime(newTime);
                  }}
                >
                  15s
                </button>
                <button
                  onClick={() => {
                    const newTime = 30;
                    setTestTime(newTime);
                    setTime(newTime);
                  }}
                >
                  30s
                </button>
                <button
                  onClick={() => {
                    const newTime = 60;
                    setTestTime(newTime);
                    setTime(newTime);
                  }}
                >
                  60s
                </button>
              </div>
            )}
            {activePanel === "testWordCount" && (
              <div className="configuration-panels">
                <button
                  onClick={() => {
                    const wordCount = 40;
                    setTestWordCount(wordCount);
                  }}
                >
                  40
                </button>
                <button
                  onClick={() => {
                    const wordCount = 60;
                    setTestWordCount(wordCount);
                  }}
                >
                  60
                </button>
                <button
                  onClick={() => {
                    const wordCount = 80;
                    setTestWordCount(wordCount);
                  }}
                >
                  80
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
