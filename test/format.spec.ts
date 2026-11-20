import { describe, expect, it } from 'vitest';
import { formatOutcome } from '../src/format';

const GOOD = 'FPC 1.0\nLOGIC "x"\nINPUT a: string\nOUTPUT b: string\n\nSET b ← upper(a)\nRETURN { b }\n';
const PLAIN = 'FPC 1.0\nLOGIC "x"\nINPUT a: string\nOUTPUT b: string\nSET b <- upper(a)\nRETURN { b: b }\n';
const BAD = 'FPC 1.0\nLOGIC "x"\nINPUT a: string\nOUTPUT b: string\nSET b = upper(a)\nRETURN { b }\n';

describe('formatOutcome', () => {
  it('replaces a document that is valid but not canonical', () => {
    expect(formatOutcome(PLAIN)).toEqual({ kind: 'replace', text: GOOD });
  });
  it('says "same" for canonical text, and formatting twice changes nothing', () => {
    expect(formatOutcome(GOOD)).toEqual({ kind: 'same' });
  });
  it('refuses a document with errors and counts them', () => {
    expect(formatOutcome(BAD)).toEqual({ kind: 'invalid', errors: 1 });
    expect(formatOutcome('')).toMatchObject({ kind: 'invalid' });
  });
});
