import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// `vscode` only exists inside the editor: tests import a small fake of the parts of it that src/extension.ts uses.
export default defineConfig({
  resolve: { alias: { vscode: fileURLToPath(new URL('./test/vscode-fake.ts', import.meta.url)) } },
  test: { include: ['test/**/*.spec.ts'] },
});
