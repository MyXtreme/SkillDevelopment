interface TokenConfig {
  char: string;
  classNameKay: "idleChar" | "correct" | "incorrect";
  isCaretBefore: boolean;
}

export function generateTextTokens(
  currentText: string,
  typedText: string,
): TokenConfig[] {
  const expectedChars: string[] = currentText.split("");
  const charsTyped: number = typedText.length;

  return expectedChars.map((char, index) => {
    let classNameKay: TokenConfig["classNameKay"] = "idleChar";

    if (index < charsTyped) {
      classNameKay = char === typedText[index] ? "correct" : "incorrect";
    }

    return {
      char,
      classNameKay,
      isCaretBefore: index === charsTyped,
    };
  });
}
