import { type ReactNode } from "react";
import styles from "./custom-scroller.module.css";
import { useCustomScroller } from "./useCustomScroller.ts";

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.2 11.1Q4.7 11.1 5.1 10.7l4.4-5.3q.5-.6 1 0l4.4 5.3q.4.4-.1.4Z" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5.2 8.9q-.5 0-.1.4l4.4 5.3q.5.6 1 0l4.4-5.3q.4-.4-.1-.4Z" />
    </svg>
  );
}

interface CustomScrollerProps {
  children: ReactNode;
  className?: String;
  ariaLabel?: String;
}
export function CustomScroller({
  children,
  className,
  ariaLabel,
}: CustomScrollerProps) {
  const { refs, state, handlers } = useCustomScroller();
  return (
    <div className={styles.scroller}>
      <div ref={refs.viewportRef} onScroll={handlers.onScroll}>
        <div ref={refs.contentRef}>{children}</div>
      </div>

      <div className={styles.controls} data-visible={state.isScrollable}>
        <button className={styles.arrowButton}>
          <ArrowUpIcon />
        </button>
        <div className={styles.track} ref={refs.trackRef}>
          <div className={styles.thumb} ref={refs.thumbRef}></div>
        </div>
        <button className={styles.arrowButton}>
          <ArrowDownIcon />
        </button>
      </div>
    </div>
  );
}
