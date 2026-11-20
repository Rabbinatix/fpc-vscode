// Format Document: one decision, made without the editor so the tests can run it directly.
import { format } from '@rabbinatix/flow-pseudocode';

export type FormatOutcome =
  /** the canonical text is different: replace the document with it */
  | { kind: 'replace'; text: string }
  /** already canonical */
  | { kind: 'same' }
  /** has errors, so there is no canonical form; `errors` is how many */
  | { kind: 'invalid'; errors: number };

export function formatOutcome(text: string): FormatOutcome {
  const r = format(text);
  if (!r.ok || r.text === undefined) return { kind: 'invalid', errors: r.diagnostics.filter((d) => d.severity === 'error').length };
  return r.text === text ? { kind: 'same' } : { kind: 'replace', text: r.text };
}
