import type { CharState } from "./analyzer";
import type { MistakeType } from "../context/TypingContext";
import minimapStyles from "../components/typing-results.module.css";

interface AccuracyMinimapProps {
  characterStates: CharState[];
}

const mistakeClassByType: Record<MistakeType, string> = {
  incorrect: minimapStyles.mistakeIncorrect,
  miss: minimapStyles.mistakeMiss,
  repeated: minimapStyles.mistakeRepeated,
  spam: minimapStyles.mistakeSpam,
  doubleTap: minimapStyles.mistakeDoubleTap,
  transposed: minimapStyles.mistakeTransposed,
};

function displayCharacter(character: string): string {
  if (character === " ") return "\u00a0";
  if (character === "\n") return "\u00b7";
  if (character === "\t") return "\u2192";
  return character;
}

export function AccuracyMinimap({ characterStates }: AccuracyMinimapProps) {
  return (
    <div className={minimapStyles.minimap} aria-label="Typing accuracy minimap">
      <div className={minimapStyles.minimapText}>
        {characterStates.map((character) => {
          const characterClass =
            character.expected === " "
              ? minimapStyles.minimapSpace
              : character.status === "correct"
                ? minimapStyles.minimapCorrect
                : character.status === "incorrect"
                  ? character.mistakeType
                    ? mistakeClassByType[character.mistakeType]
                    : minimapStyles.mistakeIncorrect
                  : minimapStyles.minimapIdle;

          return (
            <span
              className={characterClass}
              key={character.index}
              title={
                character.mistakeType
                  ? `${character.mistakeType} mistake`
                  : undefined
              }
            >
              {displayCharacter(character.typed ?? character.expected)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
