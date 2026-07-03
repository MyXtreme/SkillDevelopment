import { useEffect, useRef } from "react";

interface InputManagerOptions {
  onInputReceive: (key: string, isShortcut: boolean) => void;
}

export default function useInputManager({
  onInputReceive,
}: InputManagerOptions) {
  const savedHandler = useRef(onInputReceive);
  useEffect(() => {
    savedHandler.current = onInputReceive;
  }, [onInputReceive]);
  useWindowListener("keydown", (event) => {
    //TODO: Add proper shortcut handler
    if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const key = event.key;
    const isShortcut = key.length > 1 && key !== " " && key !== "Backspace";

    if (key === " " || key === "Backspace" || key === "Tab") {
      event.preventDefault();
    }

    savedHandler.current(key, isShortcut);
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
