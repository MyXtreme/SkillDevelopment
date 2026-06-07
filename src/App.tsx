import { useState, useEffect } from "react";
import commonWords from "./data/commonWordsEng.ts";
import "./styles/App.css";

function texGeneration(source: string[] = commonWords): string {
  const dataset: string[] = source;

  let index: number;
  const min: number = 0;
  const max: number = dataset.length;
  let text: string = "";
  for (let i = 0; i < 100; i++) {
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
  splittedCurrentText: string[],
  splittedTypedText: string[],
): React.JSX.Element[] => {
  return splittedCurrentText.map((character, index) => (
    <span
      key={`${character}-${index}`}
      className={getCharClassName(index, character, splittedTypedText)}
    >
      {character}
    </span>
  ));
};

const calculatetimeTick = (time: number): string => {
  const minute: string = Math.floor(time / 60).toString();
  const second: string = Math.floor(time % 60).toString();
  return `${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
};

function App() {
  type TestStatus = "idle" | "running" | "finished";
  type TestMode = "classic" | "race" | "story" | "chat";

  const logo = "/favicon.svg";
  const [time, setTime] = useState(20);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMode, setTestMode] = useState<TestMode>("classic");
  const [typedText, setTypedText] = useState<string>("");
  const [currentText, setCurrentText] = useState<string>(
    texGeneration(commonWords),
  );

  const splittedCurrentText: string[] = currentText.split("");
  const splittedTypedText: string[] = typedText.split("");

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
    if (testStatus !== "running") return;

    const interval = setInterval(() => {
      if (testMode === "classic") {
        setTime((time) => time - 1);
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [testStatus]);

  useEffect(() => {
    if (time <= 0) setTestStatus("finished");
  }, [time]);

  return (
    <>
      <header>
        <img src={logo} alt="logo"></img>
      </header>
      <main>
        <div id="timer">{calculatetimeTick(time)}</div>
        <div id="typing-area">
          {spanSplittedCurrentText(splittedCurrentText, splittedTypedText)}
        </div>
      </main>
    </>
  );
}

export default App;
