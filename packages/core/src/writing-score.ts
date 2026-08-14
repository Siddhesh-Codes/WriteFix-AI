export interface WritingScoreInput {
  grammarErrors: number;
  spellingErrors: number;
  punctuationErrors: number;
  capitalizationErrors: number;
  fleschKincaidGrade: number;
}

export const SCORE_WEIGHTS = {
  grammar: 8,
  spelling: 6,
  punctuation: 3,
  capitalization: 2,
  readability: 2,
} as const;

export function computeWritingScore(input: WritingScoreInput): number {
  const penalty =
    input.grammarErrors * SCORE_WEIGHTS.grammar +
    input.spellingErrors * SCORE_WEIGHTS.spelling +
    input.punctuationErrors * SCORE_WEIGHTS.punctuation +
    input.capitalizationErrors * SCORE_WEIGHTS.capitalization +
    Math.max(0, input.fleschKincaidGrade - 12) * SCORE_WEIGHTS.readability;

  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}
