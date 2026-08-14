import { Mistake } from './types';

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

/**
 * Myers-diff / LCS Cross-check:
 * Client-side validation that compares input vs corrected text,
 * detecting any transformed spans missed by the model's mistakes[] array
 * and appending them so the explanation list is 100% complete.
 */
export function crossCheckMistakesWithDiff(
  originalText: string,
  correctedText: string,
  existingMistakes: Mistake[] = []
): Mistake[] {
  if (originalText === correctedText) {
    return existingMistakes;
  }

  const diff = computeWordDiff(originalText, correctedText);
  const result: Mistake[] = [...existingMistakes];

  let k = 0;
  while (k < diff.length) {
    if (diff[k].type === 'equal') {
      k++;
      continue;
    }

    let removed = '';
    let added = '';

    while (k < diff.length && diff[k].type !== 'equal') {
      if (diff[k].type === 'remove') {
        removed += diff[k].value;
      } else if (diff[k].type === 'add') {
        added += diff[k].value;
      }
      k++;
    }

    const trimmedOrig = removed.trim();
    const trimmedRepl = added.trim();

    if (!trimmedOrig && !trimmedRepl) {
      continue;
    }

    // Check if this span is already represented in existingMistakes
    const alreadyCovered = result.some((m) => {
      const orig = (m.original || '').trim();
      const repl = (m.replacement || '').trim();
      if (!orig && !repl) return false;
      return (
        (orig === trimmedOrig && repl === trimmedRepl) ||
        (trimmedOrig && orig && (trimmedOrig.includes(orig) || orig.includes(trimmedOrig))) ||
        (trimmedRepl && repl && (trimmedRepl.includes(repl) || repl.includes(trimmedRepl)))
      );
    });

    if (!alreadyCovered && (trimmedOrig || trimmedRepl)) {
      let category = 'grammar';
      if (trimmedOrig.toLowerCase() === trimmedRepl.toLowerCase()) {
        category = 'capitalization';
      } else if (/^[^\w\s]+$/.test(trimmedOrig) || /^[^\w\s]+$/.test(trimmedRepl)) {
        category = 'punctuation';
      } else if (trimmedOrig.split(/\s+/).length > 2 || trimmedRepl.split(/\s+/).length > 2) {
        category = 'style';
      }

      const explanation = trimmedOrig && trimmedRepl
        ? `Replaced "${trimmedOrig}" with "${trimmedRepl}".`
        : trimmedOrig
        ? `Removed unnecessary word(s) "${trimmedOrig}".`
        : `Added "${trimmedRepl}" for grammatical completeness.`;

      result.push({
        type: category,
        original: trimmedOrig,
        replacement: trimmedRepl,
        category,
        explanation,
        description: explanation,
      });
    }
  }

  return result;
}
