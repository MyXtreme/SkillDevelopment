import commonWords from "../../../data/commonWordsEng";
const source: string[] = commonWords;
export function randomTexGeneration(wordRange = 40): string {
  const dataset: string[] = source;

  let index: number;
  const min: number = 0;
  const max: number = dataset.length;
  let text: string = "";
  for (let i = 0; i < wordRange; i++) {
    index = Math.floor(Math.random() * (max - min)) + min;
    text += dataset[index] + " ";
  }
  return text;
}
