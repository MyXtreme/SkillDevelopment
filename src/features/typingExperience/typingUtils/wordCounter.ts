export function findWordEnds(text: string): number[] {
  const pattern = /\S+\s*/g;
  const ends: number[] = [];
  while (pattern.exec(text) !== null) ends.push(pattern.lastIndex);
  return ends;
}

export function countWordsCompleted(
  wordEnds: readonly number[],
  cursor: number,
): number {
  let low = 0;
  let high = wordEnds.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (wordEnds[mid] <= cursor) low = mid + 1;
    else high = mid;
  }
  return low;
}
