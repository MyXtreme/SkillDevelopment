import { useEffect, useRef } from "react";

interface inputEventData {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
}
interface InputManagerOptions {
  onInputReceive: (data: inputEventData) => void;
}

export default function useInputManager({
  onInputReceive,
}: InputManagerOptions) {
  const savedHandler = useRef(onInputReceive);
  useEffect(() => {
    savedHandler.current = onInputReceive;
  }, [onInputReceive]);
  useWindowListener("keydown", (event) => {
    if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;

    savedHandler.current({
      key: event.key,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      preventDefault: () => event.preventDefault(),
    });
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
