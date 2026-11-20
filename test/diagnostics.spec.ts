import { describe, expect, it } from 'vitest';
import { check } from '@rabbinatix/flow-pseudocode';
import { splitLines, toRange } from '../src/diagnostics';

const lines = ['FPC 1.0', 'LOGIC "x"', 'SET b = upper(a)', '', 'RETURN 1'];

describe('toRange', () => {
  it('turns 1-based line and column into 0-based, and uses endCol when there is one', () => {
    expect(toRange({ line: 3, col: 7, endCol: 8 }, lines)).toEqual({ startLine: 2, startChar: 6, endLine: 2, endChar: 7 });
    expect(toRange({ line: 1, col: 1, endCol: 8 }, lines)).toEqual({ startLine: 0, startChar: 0, endLine: 0, endChar: 7 });
  });
  it('underlines the word at the column when there is no endCol', () => {
    expect(toRange({ line: 3, col: 9 }, lines)).toEqual({ startLine: 2, startChar: 8, endLine: 2, endChar: 16 });
  });
  it('keeps the range inside the line: a column past the end, or an endCol past it', () => {
    expect(toRange({ line: 5, col: 40, endCol: 50 }, lines)).toEqual({ startLine: 4, startChar: 7, endLine: 4, endChar: 8 });
    expect(toRange({ line: 5, col: 8, endCol: 99 }, lines)).toEqual({ startLine: 4, startChar: 7, endLine: 4, endChar: 8 });
  });
  it('keeps the range inside the document: a line past the end lands on the last line; line 0 on the first', () => {
    expect(toRange({ line: 99, col: 1 }, lines).startLine).toBe(4);
    expect(toRange({ line: 0, col: 0 }, lines).startLine).toBe(0);
  });
  it('handles an empty line and an empty document', () => {
    expect(toRange({ line: 4, col: 1 }, lines)).toEqual({ startLine: 3, startChar: 0, endLine: 3, endChar: 0 });
    expect(toRange({ line: 1, col: 1 }, [''])).toEqual({ startLine: 0, startChar: 0, endLine: 0, endChar: 0 });
    expect(toRange({ line: 1, col: 1 }, [])).toEqual({ startLine: 0, startChar: 0, endLine: 0, endChar: 0 });
  });
  it('underlines the last character when there is nothing at the column', () => {
    expect(toRange({ line: 1, col: 8 }, lines)).toEqual({ startLine: 0, startChar: 6, endLine: 0, endChar: 7 });
  });
  it('splits any line ending', () => {
    expect(splitLines('a\r\nb\rc\nd')).toEqual(['a', 'b', 'c', 'd']);
  });
  it('puts every real diagnostic on a range inside the text', () => {
    const text = 'FPC 1.0\nLOGIC "x"\nINPUT a: strng\nSET b = upper(a)\nIF a THEN\n';
    const ls = splitLines(text);
    const found = check(text).diagnostics;
    expect(found.length).toBeGreaterThan(2);
    for (const d of found) {
      const r = toRange(d, ls);
      expect(r.startLine).toBeLessThan(ls.length);
      expect(r.startChar).toBeLessThanOrEqual(r.endChar);
      expect(r.endChar).toBeLessThanOrEqual(ls[r.endLine].length);
    }
  });
});
