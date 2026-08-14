export interface DiffSegment {
  type: 'equal' | 'add' | 'remove';
  value: string;
}

export type DiffChunk = DiffSegment;

/**
 * Word-level Longest Common Subsequence (LCS) Diff Algorithm
 */
export function computeWordDiff(originalText: string, correctedText: string): DiffSegment[] {
  const words1 = tokenize(originalText);
  const words2 = tokenize(correctedText);

  const m = words1.length;
  const n = words2.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const result: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      result.unshift({ type: 'equal', value: words1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', value: words2[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'remove', value: words1[i - 1] });
      i--;
    }
  }

  const merged: DiffSegment[] = [];
  for (const seg of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === seg.type) {
      merged[merged.length - 1].value += seg.value;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

function tokenize(text: string): string[] {
  return text.match(/[\w']+|[^\w\s]+|\s+/g) || [text];
}
