// src/extension.ts against the fake editor in test/vscode-fake.ts: the wiring, not the logic (see diagnostics.spec.ts and format.spec.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cheatSheet } from '@rabbinatix/flow-pseudocode';
import { fake } from './vscode-fake';
import { DELAY_MS, activate } from '../src/extension';

const GOOD = 'FPC 1.0\nLOGIC "x"\nINPUT a: string\nOUTPUT b: string\n\nSET b ← upper(a)\nRETURN { b }\n';
const PLAIN = 'FPC 1.0\nLOGIC "x"\nINPUT a: string\nOUTPUT b: string\nSET b <- upper(a)\nRETURN { b: b }\n';
const BAD = 'FPC 1.0\nLOGIC "x"\nINPUT a: string\nOUTPUT b: string\nSET b = upper(a)\nRETURN { b }\n';

/** BAD gives two problems: the error, and a warning that `b` is never set because of it */
const PROBLEMS = 2;

const start = () => { const subs: { dispose(): void }[] = []; activate({ subscriptions: subs } as never); return subs; };

beforeEach(() => { fake.reset(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

describe('problems', () => {
  it('shows errors when an FPC document opens, with the code, the source and the place', () => {
    start();
    fake.fire('open', fake.doc(BAD));
    const [d] = fake.diagnosticsFor()!;
    expect(d).toMatchObject({ message: 'Use ← (or <-) to set a value; = compares', severity: 0, source: 'fpc', code: 'syntax' });
    expect(d.range).toMatchObject({ startLine: 4, startChar: 6, endLine: 4, endChar: 7 });
  });
  it('shows nothing for a good document, and warnings as warnings', () => {
    start();
    fake.fire('open', fake.doc(GOOD));
    expect(fake.diagnosticsFor()).toEqual([]);
    fake.fire('open', fake.doc('FPC 1.1\nLOGIC "x"\nRETURN 1\n', { uri: 'file:///w.fpc' }));
    expect(fake.diagnosticsFor('file:///w.fpc')![0].severity).toBe(1);
  });
  it('ignores documents in other languages', () => {
    start();
    fake.fire('open', fake.doc(BAD, { languageId: 'markdown' }));
    expect(fake.diagnosticsFor()).toBeUndefined();
  });
  it('checks documents that were already open when it started', () => {
    fake.state.documents.push(fake.doc(BAD));
    start();
    expect(fake.diagnosticsFor()).toHaveLength(PROBLEMS);
  });
  it('waits for typing to stop: many edits, one check after the delay, of the latest text', () => {
    start();
    let text = GOOD;
    const doc = { ...fake.doc(''), getText: () => text };
    fake.fire('change', { document: doc });
    text = BAD;
    vi.advanceTimersByTime(DELAY_MS - 50);
    fake.fire('change', { document: doc });
    vi.advanceTimersByTime(DELAY_MS - 1);
    expect(fake.diagnosticsFor()).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(fake.diagnosticsFor()).toHaveLength(PROBLEMS);
  });
  it('checks at once on save, and clears on close', () => {
    start();
    const doc = fake.doc(BAD);
    fake.fire('save', doc);
    expect(fake.diagnosticsFor()).toHaveLength(PROBLEMS);
    fake.fire('close', doc);
    expect(fake.diagnosticsFor()).toBeUndefined();
  });
  it('does not check after a document was closed while a check was waiting', () => {
    start();
    const doc = fake.doc(BAD);
    fake.fire('change', { document: doc });
    fake.fire('close', doc);
    vi.advanceTimersByTime(DELAY_MS * 2);
    expect(fake.diagnosticsFor()).toBeUndefined();
  });
  it('can be turned off, and skips files over the size limit', () => {
    start();
    fake.state.settings = { 'diagnostics.enable': false };
    fake.fire('open', fake.doc(BAD));
    expect(fake.diagnosticsFor()).toBeUndefined();
    fake.state.settings = { 'diagnostics.maxFileSizeKb': 1 };
    fake.fire('open', fake.doc(BAD + '-- x\n'.repeat(300)));
    expect(fake.diagnosticsFor()).toBeUndefined();
  });
  it('checks open documents again when a setting changes', () => {
    start();
    fake.state.documents.push(fake.doc(BAD));
    fake.state.settings = { 'diagnostics.enable': true };
    fake.fire('config', { affectsConfiguration: (s: string) => s === 'fpc' });
    expect(fake.diagnosticsFor()).toHaveLength(PROBLEMS);
    fake.state.documents.length = 0;
  });
  it('stops its timers when disposed', () => {
    const subs = start();
    fake.fire('change', { document: fake.doc(BAD) });
    subs.forEach((s) => s.dispose());
    vi.advanceTimersByTime(DELAY_MS * 2);
    expect(fake.diagnosticsFor()).toBeUndefined();
  });
});

describe('Format Document', () => {
  const edits = (text: string) => fake.state.formatter!.provideDocumentFormattingEdits(fake.doc(text)) as { range: unknown; newText: string }[];
  it('replaces the whole document with the canonical text', () => {
    start();
    const e = edits(PLAIN);
    expect(e).toHaveLength(1);
    expect(e[0].newText).toBe(GOOD);
    expect(e[0].range).toMatchObject({ startLine: 0, startChar: 0 });
  });
  it('does nothing for a canonical document', () => {
    start();
    expect(edits(GOOD)).toEqual([]);
    expect(fake.state.statusBar).toEqual([]);
  });
  it('does nothing for a document with errors, and says why in the status bar', () => {
    start();
    expect(edits(BAD)).toEqual([]);
    expect(fake.state.statusBar).toEqual(["FPC: can't format while the document has an error"]);
  });
});

describe('the cheat sheet command', () => {
  it('copies the cheat sheet and says so', async () => {
    start();
    await fake.state.commands.get('fpc.copyCheatSheet')!();
    expect(fake.state.clipboard).toBe(cheatSheet());
    expect(fake.state.info[0]).toContain('copied');
  });
});
