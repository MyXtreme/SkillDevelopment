interface TokenConfig {
  char: string;
  classNameKey: "idleChar" | "correctChar" | "incorrectChar";
  isCaretBefore: boolean;
}

export function generateTextTokens(
  currentText: string,
  typedText: string,
): TokenConfig[] {
  const expectedChars: string[] = currentText.split("");
  const charsTyped: number = typedText.length;

  return expectedChars.map((char, index) => {
    let classNameKey: TokenConfig["classNameKey"] = "idleChar";

    if (index < charsTyped) {
      classNameKey =
        char === typedText[index] ? "correctChar" : "incorrectChar";
    }

    return {
      char,
      classNameKey,
      isCaretBefore: index === charsTyped,
    };
  });
}
