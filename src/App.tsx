import { useState, useEffect } from "react";
import commonWords from "./data/commonWordsEng.ts";
import "./styles/App.css";

function texGeneration(source: string[] = commonWords): string {
  const dataset: string[] = source;

  let index: number;
  const min: number = 0;
  const max: number = dataset.length;
  let text: string = "";
  for (let i = 0; i < 20; i++) {
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
      <>
        <span key={`caret-${index}`} id="caret">
          |
        </span>
        <span
          key={`${character}-${index}`}
          className={getCharClassName(index, character, splittedTypedText)}
        >
          {character}
        </span>
      </>
    ) : (
      <span
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

const showResults = (results: boolean[], time: number): string => {
  const correctChars = results.filter(Boolean).length;

  const accuracy = (correctChars / results.length) * 100;
  const raw = results.length / 5 / (time / 60);
  const wpm = correctChars / 5 / (time / 60);

  return `Accuracy:  ${accuracy.toFixed(1)}% 
          Raw speed: ${raw.toFixed(1)} 
          WPM:       ${Math.floor(wpm)}`;
};

const calculateResults = (
  currentText: string,
  typedText: string,
  time: number,
): string => {
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

  const logo = "/favicon.svg";
  const testTime: number = 20;
  const [time, setTime] = useState(testTime);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMode] = useState<TestMode>("classic");
  const [typedText, setTypedText] = useState<string>("");
  const [currentText, setCurrentText] = useState<string>(
    texGeneration(commonWords),
  );
  const [results, setResults] = useState<string>("");

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
      if (testStatus === "finished") return;
      setTestStatus("running");
      event.preventDefault();

      if (event.key === "Backspace") {
        setTypedText((typedText) => typedText.slice(0, -1));
      } else if (event.key === "Space") {
        setTypedText((typedText) => typedText + event.key);
      } else if (event.key.length === 1) {
        setTypedText((typedText) => typedText + event.key);
      }
    };

    window.addEventListener("keydown", handlekeydown);
    return () => {
      window.removeEventListener("keydown", handlekeydown);
    };
  }, [testStatus]);

  useEffect(() => {
    if (currentText.length * 0.7 <= typedText.length)
      setCurrentText((currentText) => currentText + texGeneration(commonWords));
  }, [typedText, currentText]);

  useEffect(() => {
    if (testStatus !== "running") return;

    setResults("");
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

  return (
    <div id="app">
      <header>
        <img src={logo} alt="logo" />
        <h1>MyXtype</h1>
      </header>
      <main>
        <div className="info-area">{calculatetimeTick(time)}</div>
        <div className="typing-area">
          {spanSplittedCurrentText(currentText, typedText)}
        </div>
        <div className="results-area">
          <div className="results-area">
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
          <div>{results}</div>
        </div>
      </main>
    </div>
  );
}

export default App;
