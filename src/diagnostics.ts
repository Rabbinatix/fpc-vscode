// Turns the package's diagnostics into editor ranges. Pure: it doesn't import `vscode`, so the tests run it directly.
// The package counts lines and columns from 1; the editor counts from 0.
import type { Diagnostic } from '@rabbinatix/flow-pseudocode';

/** a range in the editor's own terms (0-based) */
export interface RangeLike { startLine: number; startChar: number; endLine: number; endChar: number }

/**
 * Where to underline a diagnostic. It uses `endCol` when the package gives one; otherwise it underlines the word that
 * starts at the column. A position past the end of a line or of the document is pulled back inside it, so a problem
 * "at the end of the document" still shows on the last character.
 */
export function toRange(d: Pick<Diagnostic, 'line' | 'col' | 'endCol'>, lines: readonly string[]): RangeLike {
  const line = Math.min(Math.max(d.line - 1, 0), Math.max(lines.length - 1, 0));
  const text = lines[line] ?? '';
  let start = Math.min(Math.max(d.col - 1, 0), text.length);
  let end: number;
  if (d.endCol !== undefined && d.endCol - 1 > start) end = Math.min(d.endCol - 1, text.length);
  else {
    end = start;
    while (end < text.length && !/\s/.test(text[end])) end++;
    if (end === start) end = Math.min(start + 1, text.length);
  }
  // nothing to underline at the end of a line: underline its last character instead
  if (end === start && start > 0) start = end - 1;
  return { startLine: line, startChar: start, endLine: line, endChar: end };
}

/** the text of a document as lines, for `toRange` */
export function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/);
}
