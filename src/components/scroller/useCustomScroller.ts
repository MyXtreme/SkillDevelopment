import { useRef, useState, useCallback } from "react";
import { clamp } from "../../shared/utils";

const MIN_THUMB_HEIGHT = 24;

export function useCustomScroller() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [isScrollable, setIsScrollable] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const sync = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !track || !thumb) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 0);
    const trackHeight = track.clientHeight;
    const scrollable = maxScrollTop > 0 && trackHeight > 0;

    const thumbHeight = scrollable
      ? clamp(
          (trackHeight * clientHeight) / scrollHeight,
          Math.min(MIN_THUMB_HEIGHT, trackHeight),
          trackHeight,
        )
      : trackHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = scrollable ? (scrollTop / maxScrollTop) * maxThumbTop : 0;

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `${thumbTop}px`;

    setIsScrollable(scrollable);
    setCanScrollUp(scrollable && scrollTop > 0);
    setCanScrollDown(scrollable && maxScrollTop - scrollTop > 0);
  }, []);

  return {
    state: { isScrollable, canScrollUp, canScrollDown },
    refs: { viewportRef, contentRef, trackRef, thumbRef },
    handlers: {
      onScroll: sync,
    },
  };
}
