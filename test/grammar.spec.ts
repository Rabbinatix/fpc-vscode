// The highlighting grammar must know every word of the language. The package's tables (keywords, functions) are the source of truth.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FPC_FUNCTIONS, FPC_KEYWORDS } from '@rabbinatix/flow-pseudocode';

describe('syntaxes/fpc.tmLanguage.json', () => {
  const grammar = readFileSync('syntaxes/fpc.tmLanguage.json', 'utf8');
  const words = new Set(grammar.match(/[A-Za-z][A-Za-z0-9]*/g));
  it('mentions every keyword', () => {
    expect(FPC_KEYWORDS.filter((k) => !words.has(k))).toEqual([]);
  });
  it('mentions every function', () => {
    expect(FPC_FUNCTIONS.map((f) => f.name).filter((n) => !words.has(n))).toEqual([]);
  });
  it('is valid JSON with the scope the manifest names', () => {
    expect(JSON.parse(grammar).scopeName).toBe('source.fpc');
  });
});
