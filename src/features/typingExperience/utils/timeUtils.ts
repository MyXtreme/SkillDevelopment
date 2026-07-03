export const formatTimeTick = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60).toString();
  const seconds = Math.floor(timeInSeconds % 60).toString();
  return `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
};
