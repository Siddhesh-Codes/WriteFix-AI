/**
 * Levenshtein distance & confidence calculation
 */
export function computeChangeMetrics(original: string, corrected: string): { distance: number; changePercent: number; color: 'green' | 'yellow' | 'red' } {
  const distance = levenshteinDistance(original, corrected);
  const maxLen = Math.max(1, original.length);
  const changePercent = Math.min(100, Math.round((distance / maxLen) * 100));

  let color: 'green' | 'yellow' | 'red' = 'green';
  if (changePercent > 40) color = 'red';
  else if (changePercent > 15) color = 'yellow';

  return { distance, changePercent, color };
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
