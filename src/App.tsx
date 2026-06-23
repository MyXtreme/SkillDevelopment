import { useState, useEffect, Fragment, use } from "react";
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
  type TestMode = "classic" | "race" | "story" | "chat";

  const result = {
    accuracy: 0,
    raw: 0,
    wpm: 0,
  };

  //const logo = "";
  const [testTime, setTestTime] = useState<number>(30);
  const [customTime, setCustomTime] = useState<number>(120);
  const [time, setTime] = useState(testTime);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMode] = useState<TestMode>("classic");
  const [typedText, setTypedText] = useState<string>("");
  const [currentText, setCurrentText] = useState<string>(() =>
    texGeneration(commonWords),
  );
  const [scrollOffset, setScrollOffset] = useState(0);
  const [results, setResults] = useState(result);

  const handleTestReset = () => {
    setTestStatus("idle");
    setTypedText("");
    setTime(testTime);
  };

  const handleTestNext = () => {
    setTestStatus("idle");
    setTypedText("");
    setTime(testTime);
    setCurrentText(texGeneration(commonWords));
  };

  useEffect(() => {
    const handlekeydown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (testStatus === "finished" && time <= 0) return;

      setTestStatus("running");
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

  console.log("RENDER", {
    testStatus,
    isEditing,
    time,
    typedLength: typedText.length,
  });

  const isRunning = testStatus === "running";
  const isFinished = testStatus === "finished";

  return (
    <div id="app">
      <nav className="section" id="navigation">
        {/* {<img src={logo} alt="logo" />} */}
        <div className="container">
          <h1>MyXtype</h1>
          <div className={`placeholder1 ${isRunning ? "fade-out" : ""}`}></div>
        </div>
        <div className={`placeholder1 ${isRunning ? "fade-out" : ""}`}></div>
      </nav>
      <header className={`section ${isRunning ? "fade-out" : ""}`} id="header">
        {/* <div className=""> */}
        {isEditing && testStatus !== "running" ? (
          <div className="timer-menu">
            <div
              onClick={() => {
                const newTime = 15;
                setTestTime(newTime);
                setIsEditing(false);
                setTime(newTime);
              }}
            >
              15s
            </div>
            <div
              onClick={() => {
                const newTime = 30;
                setTestTime(newTime);
                setIsEditing(false);
                setTime(newTime);
              }}
            >
              30s
            </div>
            <div
              onClick={() => {
                const newTime = 60;
                setTestTime(newTime);
                setIsEditing(false);
                setTime(newTime);
              }}
            >
              60s
            </div>
            <input
              id="timer-input"
              className="clear-input"
              type="number"
              min={1}
              max={1800}
              value={customTime}
              onChange={(e) => setCustomTime(Number(e.target.value))}
              onBlur={() => {
                setTestTime(customTime);
                setTime(customTime);
                setIsEditing(false);
              }}
            />
          </div>
        ) : (
          <div
            className="info-area"
            onClick={() => {
              if (testStatus === "running") {
                setIsEditing(false);
                return;
              }
              setIsEditing(true);
            }}
          >
            {calculatetimeTick(time)}
          </div>
        )}
        <div className="placeholder2"></div>
        <div className="placeholder2"></div>
        {/* </div> */}
      </header>
      <main className="section" id="main">
        {(testStatus === "running" || testStatus === "idle") && (
          <div className="typing-area">
            <div
              className="typing-content"
              style={{ transform: `translateY(-${scrollOffset}px)` }}
            >
              {spanSplittedCurrentText(currentText, typedText)}
            </div>
          </div>
        )}
        {testStatus === "finished" && (
          <div className="results-area">
            <div className="wpm">WPM: {results.wpm}</div>
            <div className="metrics">Accuracy: {results.accuracy}%</div>
            <div className="metrics">Raw speed: {results.raw}</div>
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
        className={`section ${isRunning ? "fade-out" : ""}`}
        id="bottomer"
      ></section>
      <footer className={`section ${isRunning ? "fade-out" : ""}`} id="footer">
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
