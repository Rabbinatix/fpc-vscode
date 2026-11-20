// The extension: what runs inside the editor. Everything with logic is in diagnostics.ts and format.ts (tested without the
// editor); this file only connects them to VS Code:
//   - problems: check a document when it opens, 300 ms after the last edit, and on save; clear it on close
//   - Format Document: replace the whole document with the canonical text (valid documents only)
//   - the command "FPC: Copy cheat sheet for an AI assistant"
// The same file is bundled for the desktop editor (dist/extension.js) and the web editors (dist/web/extension.js).
import * as vscode from 'vscode';
import { check, cheatSheet } from '@rabbinatix/flow-pseudocode';
import { splitLines, toRange } from './diagnostics';
import { formatOutcome } from './format';

const LANGUAGE = 'fpc';
/** how long to wait after the last keystroke before checking */
export const DELAY_MS = 300;

export function activate(context: vscode.ExtensionContext): void {
  const problems = vscode.languages.createDiagnosticCollection('fpc');
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const settings = () => {
    const c = vscode.workspace.getConfiguration('fpc');
    return { enabled: c.get<boolean>('diagnostics.enable', true), maxBytes: c.get<number>('diagnostics.maxFileSizeKb', 500) * 1024 };
  };

  /** check one document now and show what is wrong with it */
  const refresh = (doc: vscode.TextDocument) => {
    if (doc.languageId !== LANGUAGE) return;
    const { enabled, maxBytes } = settings();
    const text = doc.getText();
    if (!enabled || text.length > maxBytes) {
      problems.delete(doc.uri);
      return;
    }
    const lines = splitLines(text);
    problems.set(
      doc.uri,
      check(text).diagnostics.map((d) => {
        const r = toRange(d, lines);
        const out = new vscode.Diagnostic(
          new vscode.Range(r.startLine, r.startChar, r.endLine, r.endChar),
          d.message,
          d.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning,
        );
        out.source = 'fpc';
        out.code = d.code;
        return out;
      }),
    );
  };

  const later = (doc: vscode.TextDocument) => {
    if (doc.languageId !== LANGUAGE) return;
    const key = doc.uri.toString();
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => { timers.delete(key); refresh(doc); }, DELAY_MS));
  };

  context.subscriptions.push(
    problems,
    vscode.workspace.onDidOpenTextDocument(refresh),
    vscode.workspace.onDidChangeTextDocument((e) => later(e.document)),
    vscode.workspace.onDidSaveTextDocument(refresh),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      clearTimeout(timers.get(doc.uri.toString()));
      timers.delete(doc.uri.toString());
      problems.delete(doc.uri);
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('fpc')) vscode.workspace.textDocuments.forEach(refresh);
    }),
    vscode.languages.registerDocumentFormattingEditProvider(LANGUAGE, {
      provideDocumentFormattingEdits(doc) {
        const out = formatOutcome(doc.getText());
        if (out.kind === 'invalid') {
          vscode.window.setStatusBarMessage(`FPC: can't format while the document has ${out.errors === 1 ? 'an error' : `${out.errors} errors`}`, 5000);
          return [];
        }
        if (out.kind === 'same') return [];
        const whole = new vscode.Range(0, 0, doc.lineCount, 0);
        return [vscode.TextEdit.replace(doc.validateRange(whole), out.text)];
      },
    }),
    vscode.commands.registerCommand('fpc.copyCheatSheet', async () => {
      await vscode.env.clipboard.writeText(cheatSheet());
      void vscode.window.showInformationMessage('FPC cheat sheet copied: paste it into your AI assistant.');
    }),
    { dispose: () => timers.forEach(clearTimeout) },
  );

  // documents that were open before the extension started
  vscode.workspace.textDocuments.forEach(refresh);
}

export function deactivate(): void {}
