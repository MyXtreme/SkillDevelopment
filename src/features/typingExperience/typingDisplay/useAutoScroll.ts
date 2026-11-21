import { useEffect, useRef, useState } from "react";

export function useAutoScroll(typedTextLength: number, fontSize: number = 64) {
  const [scrollOffset, setScrollOffset] = useState<number>(0);

  const spanRefsMap = useRef<Map<number, HTMLSpanElement | null>>(new Map());

  const setSpanRef = (index: number) => (elem: HTMLSpanElement | null) => {
    if (elem) spanRefsMap.current.set(index, elem);
    else spanRefsMap.current.delete(index);
  };

  useEffect(() => {
    if (typedTextLength === 0) {
      setScrollOffset(0);
      return;
    }

    const firstCharSpan = spanRefsMap.current.get(0);
    const currentCharSpan = spanRefsMap.current.get(typedTextLength);
    const prevCharSpan = spanRefsMap.current.get(typedTextLength - 1);

    if (!currentCharSpan || !firstCharSpan || !prevCharSpan) return;

    const lineTopHeight: number = firstCharSpan.offsetTop;
    const lineHeight: number = parseInt(
      window.getComputedStyle(currentCharSpan).lineHeight,
      10,
    );
    const getLineIndex = (elem: HTMLSpanElement) => {
      return (elem.offsetTop - lineTopHeight) / lineHeight;
    };
    const currentLineIndex = getLineIndex(currentCharSpan);
    const isLineChanged = currentLineIndex !== getLineIndex(prevCharSpan);
    if (isLineChanged) {
      setScrollOffset(Math.max(0, currentLineIndex * lineHeight));
    }
  }, [typedTextLength, fontSize]);

  return { scrollOffset, setSpanRef };
}
