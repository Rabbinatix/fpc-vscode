// A small fake of the parts of the `vscode` API that src/extension.ts uses, so the wiring can be tested without an editor.
// vitest.config.ts points the module name `vscode` here. Tests drive it with `fake.*`.

export class Range {
  constructor(public startLine: number, public startChar: number, public endLine: number, public endChar: number) {}
}
export const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 } as const;
export class Diagnostic {
  source?: string;
  code?: string | number;
  constructor(public range: Range, public message: string, public severity: number = DiagnosticSeverity.Error) {}
}
export const TextEdit = { replace: (range: Range, newText: string) => ({ range, newText }) };

type Handler = (arg: never) => unknown;
const handlers = new Map<string, Handler[]>();
const on = (event: string) => (h: Handler) => {
  handlers.set(event, [...(handlers.get(event) ?? []), h]);
  return { dispose: () => handlers.set(event, (handlers.get(event) ?? []).filter((x) => x !== h)) };
};

export interface FakeDoc {
  languageId: string;
  uri: { toString(): string };
  getText(): string;
  lineCount: number;
  validateRange(r: Range): Range;
}

const state = {
  settings: {} as Record<string, unknown>,
  diagnostics: new Map<string, Diagnostic[]>(),
  formatter: undefined as undefined | { provideDocumentFormattingEdits(doc: FakeDoc): unknown },
  commands: new Map<string, () => unknown>(),
  clipboard: '',
  statusBar: [] as string[],
  info: [] as string[],
  documents: [] as FakeDoc[],
};

export const workspace = {
  get textDocuments() { return state.documents; },
  getConfiguration: () => ({ get: <T>(key: string, fallback: T): T => (key in state.settings ? (state.settings[key] as T) : fallback) }),
  onDidOpenTextDocument: on('open'),
  onDidChangeTextDocument: on('change'),
  onDidSaveTextDocument: on('save'),
  onDidCloseTextDocument: on('close'),
  onDidChangeConfiguration: on('config'),
};
export const languages = {
  createDiagnosticCollection: () => ({
    set: (uri: { toString(): string }, list: Diagnostic[]) => void state.diagnostics.set(uri.toString(), list),
    delete: (uri: { toString(): string }) => void state.diagnostics.delete(uri.toString()),
    dispose: () => state.diagnostics.clear(),
  }),
  registerDocumentFormattingEditProvider: (_lang: string, p: { provideDocumentFormattingEdits(doc: FakeDoc): unknown }) => {
    state.formatter = p;
    return { dispose: () => { state.formatter = undefined; } };
  },
};
export const window = {
  setStatusBarMessage: (text: string) => void state.statusBar.push(text),
  showInformationMessage: (text: string) => { state.info.push(text); return Promise.resolve(undefined); },
};
export const commands = { registerCommand: (id: string, fn: () => unknown) => { state.commands.set(id, fn); return { dispose: () => state.commands.delete(id) }; } };
export const env = { clipboard: { writeText: async (t: string) => { state.clipboard = t; } } };

/** what tests use to drive and inspect the fake */
export const fake = {
  state,
  reset() {
    handlers.clear();
    state.settings = {};
    state.diagnostics.clear();
    state.formatter = undefined;
    state.commands.clear();
    state.clipboard = '';
    state.statusBar = [];
    state.info = [];
    state.documents = [];
  },
  doc(text: string, o: { languageId?: string; uri?: string } = {}): FakeDoc {
    const uri = o.uri ?? 'file:///a.fpc';
    return { languageId: o.languageId ?? 'fpc', uri: { toString: () => uri }, getText: () => text, lineCount: text.split('\n').length, validateRange: (r) => r };
  },
  /** raise an editor event */
  fire(event: 'open' | 'change' | 'save' | 'close' | 'config', arg: unknown) {
    for (const h of handlers.get(event) ?? []) (h as (a: unknown) => unknown)(arg);
  },
  diagnosticsFor(uri = 'file:///a.fpc') { return state.diagnostics.get(uri); },
};
