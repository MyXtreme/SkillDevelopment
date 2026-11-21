import Controls from "../typingControls/Controls";
import styles from "./typing-display.module.css";
import TypingText from "./TypingText";

export default function TypingDisplay() {
  return (
    <div className={styles.typingDisplay}>
      <Controls />
      <TypingText />
    </div>
  );
}
