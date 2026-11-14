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
  className?: string;
  ariaLabel?: string;
  autoScroll?: boolean;
}

export function CustomScroller({
  children,
  className,
  ariaLabel = "Scrollable content",
  autoScroll = false,
}: CustomScrollerProps) {
  const { viewportId, refs, state, handlers } = useCustomScroller({
    autoScroll,
  });

  return (
    <div className={styles.scroller}>
      <div
        id={viewportId}
        ref={refs.viewportRef}
        className={[styles.viewport, className].filter(Boolean).join(" ")}
        role="region"
        tabIndex={state.isScrollable ? 0 : -1}
        aria-labe={ariaLabel}
        onScroll={handlers.onScroll}
      >
        <div ref={refs.contentRef}>{children}</div>
      </div>

      <div
        className={styles.controls}
        aria-hidden="true"
        data-visible={state.isScrollable}
      >
        <button
          className={styles.arrowButton}
          type="button"
          disabled={!state.canScrollUp}
          tabIndex={-1}
          {...handlers.upButton}
        >
          <ArrowUpIcon />
        </button>

        <div
          className={styles.track}
          ref={refs.trackRef}
          onPointerDown={handlers.onTrackPointerDown}
        >
          <div
            className={styles.thumb}
            ref={refs.thumbRef}
            onPointerDown={handlers.onThumbPointerDown}
            onPointerMove={handlers.onThumbPointerMove}
            onPointerUp={handlers.onThumbPointerUp}
            onPointerCancel={handlers.onThumbPointerUp}
          ></div>
        </div>

        <button
          className={styles.arrowButton}
          type="button"
          disabled={!state.canScrollDown}
          tabIndex={-1}
          {...handlers.downButton}
        >
          <ArrowDownIcon />
        </button>
      </div>
    </div>
  );
}
