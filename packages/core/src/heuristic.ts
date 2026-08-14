import { WritingProvider, CorrectionRequest, CorrectionResponse, Mistake } from './types';

const COMMON_TYPOS: Record<string, string> = {
  teh: 'the',
  recieve: 'receive',
  recieved: 'received',
  recieving: 'receiving',
  seperate: 'separate',
  seperated: 'separated',
  definately: 'definitely',
  occured: 'occurred',
  occuring: 'occurring',
  untill: 'until',
  accomodate: 'accommodate',
  wierd: 'weird',
  beleive: 'believe',
  beleived: 'believed',
  acheive: 'achieve',
  acheived: 'achieved',
  embarass: 'embarrass',
  truely: 'truly',
  goverment: 'government',
  enviroment: 'environment',
  tommorrow: 'tomorrow',
  alot: 'a lot',
  noone: 'no one',
  everytime: 'every time',
  thier: 'their',
  untilll: 'until',
  wich: 'which',
  whos: 'who\'s',
  neccessary: 'necessary',
  peice: 'piece',
  freind: 'friend',
  beleif: 'belief',
  calender: 'calendar',
  begining: 'beginning',
  existance: 'existence',
  experiance: 'experience',
  intelligant: 'intelligent',
  maintainance: 'maintenance',
  priviledge: 'privilege',
  recommand: 'recommend',
  sucessful: 'successful',
  tommorow: 'tomorrow',
};

const CONTRACTIONS: Record<string, string> = {
  dont: "don't",
  cant: "can't",
  wont: "won't",
  didnt: "didn't",
  doesnt: "doesn't",
  isnt: "isn't",
  arent: "aren't",
  wasnt: "wasn't",
  werent: "weren't",
  couldnt: "couldn't",
  shouldnt: "shouldn't",
  wouldnt: "wouldn't",
  havent: "haven't",
  hasnt: "hasn't",
  hadnt: "hadn't",
  youre: "you're",
  theyre: "they're",
  weve: "we've",
  theyve: "they've",
  youve: "you've",
  whats: "what's",
  thats: "that's",
  theres: "there's",
  im: "I'm",
  id: "I'd",
  ill: "I'll",
  ive: "I've",
};

export class OfflineHeuristicProvider implements WritingProvider {
  readonly name = 'offline-heuristic';
  readonly requiresApiKey = false;

  async correct(request: CorrectionRequest): Promise<CorrectionResponse> {
    let text = request.text;
    const mistakes: Mistake[] = [];

    // 1. Fix duplicate consecutive spaces
    text = text.replace(/([^\S\r\n]){2,}/g, (match) => {
      mistakes.push({
        type: 'duplicate_space',
        description: 'Removed unnecessary duplicate spaces.',
        original: match,
        replacement: ' ',
        category: 'punctuation',
      });
      return ' ';
    });

    // 2. Fix space before punctuation (e.g. "word ." -> "word.")
    text = text.replace(/\s+([.,!?;:])/g, (match, punct) => {
      mistakes.push({
        type: 'space_before_punct',
        description: `Removed space before "${punct}".`,
        original: match,
        replacement: punct,
        category: 'punctuation',
      });
      return punct;
    });

    // 3. Fix missing space after punctuation (e.g. "word,word" -> "word, word")
    text = text.replace(/([.,!?;:])([a-zA-Z])/g, (match, punct, letter) => {
      mistakes.push({
        type: 'missing_space_after_punct',
        description: `Added missing space after "${punct}".`,
        original: match,
        replacement: `${punct} ${letter}`,
        category: 'punctuation',
      });
      return `${punct} ${letter}`;
    });

    // 4. Fix duplicate words (e.g. "the the" -> "the")
    text = text.replace(/\b(\w+)\s+\1\b/gi, (match, word) => {
      mistakes.push({
        type: 'duplicate_word',
        description: `Removed repeated word "${word}".`,
        original: match,
        replacement: word,
        category: 'grammar',
      });
      return word;
    });

    // 5. Fix lone lowercase 'i' and contraction 'i' -> 'I'
    text = text.replace(/\bi\b/g, (match) => {
      mistakes.push({
        type: 'lowercase_i',
        description: 'Capitalized personal pronoun "I".',
        original: match,
        replacement: 'I',
        category: 'capitalization',
      });
      return 'I';
    });

    text = text.replace(/\bi'([a-z]+)\b/gi, (match, suffix) => {
      if (match.startsWith('i')) {
        const rep = `I'${suffix}`;
        mistakes.push({
          type: 'lowercase_i_contraction',
          description: `Capitalized "${rep}".`,
          original: match,
          replacement: rep,
          category: 'capitalization',
        });
        return rep;
      }
      return match;
    });

    // 6. Fix common contractions & typos (word by word scanning)
    text = text.replace(/\b[a-zA-Z']+\b/g, (rawWord) => {
      const lower = rawWord.toLowerCase();

      if (CONTRACTIONS[lower]) {
        const replacement = CONTRACTIONS[lower];
        if (rawWord !== replacement && lower !== replacement.toLowerCase()) {
          mistakes.push({
            type: 'missing_apostrophe',
            description: `Added missing apostrophe: "${replacement}".`,
            original: rawWord,
            replacement,
            category: 'spelling',
          });
          return replacement;
        }
      }

      if (COMMON_TYPOS[lower]) {
        let replacement = COMMON_TYPOS[lower];
        if (rawWord[0] === rawWord[0].toUpperCase()) {
          replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        mistakes.push({
          type: 'common_typo',
          description: `Corrected spelling: "${replacement}".`,
          original: rawWord,
          replacement,
          category: 'spelling',
        });
        return replacement;
      }

      return rawWord;
    });

    // 7. Fix sentence capitalization (first letter after . ! ? or start of string)
    text = text.replace(/(^|[.!?]\s+)([a-z])/g, (_match, prefix, letter) => {
      const upper = letter.toUpperCase();
      mistakes.push({
        type: 'sentence_capitalization',
        description: 'Capitalized first letter of sentence.',
        original: letter,
        replacement: upper,
        category: 'capitalization',
      });
      return `${prefix}${upper}`;
    });

    // 8. Subject-verb agreement heuristics
    const svRules: Array<[RegExp, string, string]> = [
      [/\b(he|she|it)\s+have\b/gi, '$1 has', 'has'],
      [/\b(they|we|you)\s+has\b/gi, '$1 have', 'have'],
      [/\b(I)\s+has\b/g, 'I have', 'have'],
      [/\b(a)\s+([aeiouAEIOU]\w+)\b/g, 'an $2', 'an'],
      [/\b(an)\s+([^aeiouAEIOU\s\d]\w+)\b/g, 'a $2', 'a'],
    ];

    for (const [pattern, replacementStr, cleanWord] of svRules) {
      text = text.replace(pattern, (match) => {
        const result = match.replace(pattern, replacementStr);
        mistakes.push({
          type: 'grammar_agreement',
          description: `Grammar agreement: corrected to "${cleanWord}".`,
          original: match,
          replacement: result,
          category: 'grammar',
        });
        return result;
      });
    }

    const confidence = Math.max(75, Math.min(98, 100 - mistakes.length * 4));

    return {
      corrected: text,
      mistakes,
      confidence,
      provider: this.name,
    };
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }
}
