import { CorrectionMode, WritingPreference } from './types';
import { CORRECTION_MODES } from './modes';

export function buildSystemPrompt(): string {
  return `You are WriteFix AI, an elite writing assistant and grammar expert.
Your job is to rewrite user-provided text according to the requested mode while preserving original meaning.

CRITICAL REQUIREMENT: You MUST respond ONLY with valid JSON matching this exact JSON schema:
{
  "corrected": "string (the fully improved text)",
  "mistakes": [
    {
      "type": "string (short error name)",
      "description": "string (teacher-like explanation of why this was changed)",
      "original": "string (original word or phrase changed)",
      "replacement": "string (improved replacement word or phrase)",
      "category": "grammar" | "spelling" | "punctuation" | "capitalization"
    }
  ],
  "confidence": number (0 to 100 confidence score)
}

Do NOT include markdown block syntax like \`\`\`json. Return pure JSON string only.`;
}

export function buildUserPrompt(text: string, mode: CorrectionMode, preferences?: WritingPreference[]): string {
  const modeInfo = CORRECTION_MODES[mode];
  let instructions = modeInfo?.description || 'Improve grammar and phrasing.';

  if (mode === 'humanize') {
    instructions = 'Rewrite this text to sound completely natural, authentic, and human. Remove stiff AI patterns, buzzwords, and robotic phrasing.';
  } else if (mode === 'professional') {
    instructions = 'Rewrite this text into professional, clear, and executive-level business English.';
  } else if (mode === 'natural') {
    instructions = 'Rewrite this text into fluent, natural, conversational everyday English.';
  } else if (mode === 'simple') {
    instructions = 'Simplify the vocabulary and sentence structure so it is extremely easy to read.';
  } else if (mode === 'short') {
    instructions = 'Condense and shorten the text to be brief and direct without losing key information.';
  } else if (mode === 'indian_professional') {
    instructions = 'Adapt this text to professional Indian workplace English tone (polite, respectful, clear corporate communication).';
  }

  let customRules = '';
  if (preferences && preferences.length > 0) {
    const activeRules = preferences.filter((p) => p.enabled).map((p) => `- ${p.rule}`).join('\n');
    if (activeRules) {
      customRules = `\nCustom User Rules:\n${activeRules}`;
    }
  }

  return `Task: Improve the following text.
Mode: ${modeInfo?.label || mode} (${instructions})
${customRules}

Text to improve:
"${text}"`;
}
