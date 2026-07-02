import { useEffect, useRef } from "react";
import { useAppContext } from "../context/appContext";

interface InputManagerOptions {
  onInputReceive: (key: string, isShortcut: boolean) => void;
}

export default function useInputManager({
  onInputReceive,
}: InputManagerOptions) {
  useWindowListener("keydown", (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const key = event.key;
    const isShortcut = key.length > 0 && key !== " " && key !== "Backspace";

    if (key === " " || key === "Backspace" || key === "Tab") {
      event.preventDefault();
    }

    onInputReceive(key, isShortcut);
  });
}

function useWindowListener<K extends keyof WindowEventMap>(
  eventType: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
) {
  const savedListener = useRef(listener);

  useEffect(() => {
    savedListener.current = listener;
  }, [listener]);

  useEffect(() => {
    const eventRouter = (event: WindowEventMap[K]) => {
      savedListener.current.call(window, event);
    };
    window.addEventListener(eventType, eventRouter);
    return () => {
      window.removeEventListener(eventType, eventRouter);
    };
  }, [eventType]);
}
