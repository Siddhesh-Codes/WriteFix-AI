export interface TextStats {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  readingTimeSec: number;
  fleschKincaidGrade: number;
  readingLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

export function computeTextStats(text: string): TextStats {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      charCount: 0,
      sentenceCount: 0,
      readingTimeSec: 0,
      fleschKincaidGrade: 0,
      readingLevel: 'Beginner',
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;
  const sentences = trimmed.split(/[.!?]+/).filter(Boolean);
  const sentenceCount = Math.max(1, sentences.length);

  let syllableCount = 0;
  for (const word of words) {
    syllablesInWord(word);
    syllableCount += syllablesInWord(word);
  }

  const grade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllablesInWordCount(words) / wordCount) - 15.59;
  const fleschKincaidGrade = Math.max(1, Math.min(18, Math.round(grade * 10) / 10));

  let readingLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
  if (fleschKincaidGrade <= 6) readingLevel = 'Beginner';
  else if (fleschKincaidGrade >= 12) readingLevel = 'Advanced';

  const readingTimeSec = Math.max(1, Math.ceil((wordCount / 200) * 60));

  return {
    wordCount,
    charCount,
    sentenceCount,
    readingTimeSec,
    fleschKincaidGrade,
    readingLevel,
  };
}

function syllablesInWord(word: string): number {
  word = word.toLowerCase().replace(/(?:[^laeiouy]|ed|es|e)$/, '').replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function syllablesInWordCount(words: string[]): number {
  return words.reduce((acc, w) => acc + syllablesInWord(w), 0);
}
