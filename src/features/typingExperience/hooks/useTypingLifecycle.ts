import { useCallback } from "react";
import { useTypingContext, type TypingSession } from "../context/TypingContext";
import { useAppContext } from "../../../context/appContext";

interface Handler {
  retry: () => void;
  continue: () => void;
  forceExit: () => void;
}
export function useTypingLifecycle() {
  const { action } = useAppContext();
  const { typingState, typingAction } = useTypingContext();

  const createEmptySession = useCallback(
    (preservedText: string | null = null): TypingSession => {
      return {
        header: {
          id: null,
          startTimestamp: null,
          endTimestamp: null,
          configuration: typingState.config,
          reason: "exit",
        },
        body: {
          text: preservedText,
          timeLine: [],
          event: {
            mistakeEvent: [],
            keyEvent: [],
          },
        },
      };
    },
    [typingState.config],
  );

  const handleRetry = useCallback(() => {
    const currentTextSnapshot = typingState.session.body.text;

    action.changeLayoutMode("normal");
    typingAction.setSession(createEmptySession(currentTextSnapshot));
    typingAction.setStatus("idle");
  }, [typingState.session.body.text, typingAction, action, createEmptySession]);

  const handleNext = useCallback(() => {
    action.changeLayoutMode("normal");
    typingAction.setSession(createEmptySession(null));
    typingAction.setStatus("idle");
  }, [typingAction, action, createEmptySession]);

  const handleForceExit = useCallback(() => {
    action.changeLayoutMode("normal");
    typingAction.setSession(createEmptySession(null));
    typingAction.setStatus("idle");
  }, [typingAction, action, createEmptySession]);

  const handler: Handler = {
    retry: handleRetry,
    continue: handleNext,
    forceExit: handleForceExit,
  };

  return {
    status: typingState.status,
    activity: typingState.activity,
    handler,
  };
}
