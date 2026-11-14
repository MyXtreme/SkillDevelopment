import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useId,
  type PointerEvent,
} from "react";
import { clamp } from "../../shared/utils";

const MIN_THUMB_HEIGHT = 24;
const EDGE_TOLERANCE = 1;

interface DragStart {
  pointerY: number;
  scrollTop: number;
}

const getMaxScrollTop = (viewport: HTMLElement) =>
  Math.max(viewport.scrollHeight - viewport.clientHeight, 0);

export function useCustomScroller() {
  const viewportId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<DragStart | null>(null);

  const [isScrollable, setIsScrollable] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const sync = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !track || !thumb) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const maxScrollTop = getMaxScrollTop(viewport);
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
    thumb.style.transform = `translateY(${thumbTop}px)`;

    setIsScrollable(scrollable);
    setCanScrollUp(scrollable && scrollTop > EDGE_TOLERANCE);
    setCanScrollDown(scrollable && maxScrollTop - scrollTop > EDGE_TOLERANCE);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const track = trackRef.current;
    if (!viewport || !content || !track) return;

    sync();
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(viewport);
    resizeObserver.observe(content);
    resizeObserver.observe(track);
    return () => resizeObserver.disconnect();
  }, [sync]);

  return {
    viewportId,
    state: { isScrollable, canScrollUp, canScrollDown },
    refs: { viewportRef, contentRef, trackRef, thumbRef },
    handlers: {
      onScroll: sync,
    },
  };
}
