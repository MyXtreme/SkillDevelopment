import { COMMON_WORDS } from "../../../data/commonWordsEng";
import { PUNCTUATION_STD_LIST, DIGITS_LIST } from "../../../data/nonText";
import { PERFORMANCE_THRESHOLDS } from "../typingDefaults";
export function randomTexGeneration(
  withNum: boolean,
  withPunctuation: boolean,
  withUpperCase: boolean,
  wordRange: number | null = null,
): string {
  let generationLength = PERFORMANCE_THRESHOLDS.INIT_RENDER_TEXT_LENGTH;
  if (wordRange && wordRange > 0) generationLength = wordRange;

  const wordsDataset: string[] = COMMON_WORDS;
  const numDataset: string[] = DIGITS_LIST;
  const punctuationDataset: string[] = PUNCTUATION_STD_LIST;

  let text: string = "";
  let index: number = 0;
  for (let i = 0; i < generationLength; i++) {
    let chooseNum = Math.random() < 0.3;
    let usePunctuation = Math.random() < 0.1;
    let useUpperCase = Math.random() < 0.4;
    if (withNum && chooseNum) {
      index = randomIntBetween(0, DIGITS_LIST.length);
      text += numDataset[index];
    } else {
      index = randomIntBetween(0, wordsDataset.length);
      let word = wordsDataset[index];
      if (withUpperCase && useUpperCase)
        word = word.charAt(0).toUpperCase() + word.slice(1);
      text += word;
    }
    if (withPunctuation) {
      index = randomIntBetween(0, punctuationDataset.length);
      text += usePunctuation ? punctuationDataset[index] : "";
    }
    if (wordRange && i + 1 === wordRange) continue;
    text += " ";
  }
  return text;
}

function randomIntBetween(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start)) + start;
}
