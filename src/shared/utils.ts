export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ratio(done: number, total: number) {
  return total > 0 ? clamp(done / total, 0, 1) : 0;
}
