import { useMemo } from "react";
import {
  useTypingContext,
  type TypingSession,
  type TypingStatus,
} from "../context/TypingContext";
import {
  analyzeCharacterState,
  analyzeReplay,
  analyzeSpeedSeries,
  analyzeMetrics,
  createEmptyMetrics,
} from "./analyzer";

export function useTypingSessionResults() {
  const { typingState } = useTypingContext();
  const { session, status } = typingState;

  const validation = useMemo(
    () => validateTypingSession(session, status),
    [session, status],
  );

  const metrics = useMemo(
    () => (validation.valid ? analyzeMetrics(session) : createEmptyMetrics()),
    [session, validation.valid],
  );

  const speedSeries = useMemo(
    () => (validation.valid ? analyzeSpeedSeries(session) : []),
    [session, validation.valid],
  );
  const characterStates = useMemo(
    () => (validation.valid ? analyzeCharacterState(session) : []),
    [session, validation.valid],
  );
  const replay = useMemo(
    () => (validation.valid ? analyzeReplay(session) : []),
    [session, validation.valid],
  );
  return {
    metrics,
    speedSeries,
    characterStates,
    replay,
    error: validation.error ?? null,
    message: validation.message ?? null,
  };
}

interface ValidationMessage {
  readonly valid: boolean;
  readonly message?: string;
  readonly error?: string;
}
function validateTypingSession(
  session: TypingSession,
  status: TypingStatus,
): ValidationMessage {
  if (status !== "finished")
    return {
      valid: false,
      error: "results rendering yet session not finished.",
    };
  if (!session.header.startTimestamp || !session.header.endTimestamp) {
    return {
      valid: false,
      error: "typing session finished without valid timestamp",
    };
  }
  if (session.header.endTimestamp - session.header.startTimestamp < 500) {
    return {
      valid: false,
      error: "session was too short to generate meaningfull metrics.",
    };
  }
  if (session.header.reason === "force-exit") {
    return {
      valid: false,
      error: "session didn't take place due to force exit",
    };
  }
  if (session.body.summary.gross.totalKeyPresses === 0) {
    return { valid: false, error: "no keystrokes recorded." };
  }
  return { valid: true, message: "success, typing session is valid." };
}
