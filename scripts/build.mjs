// Bundles src/extension.ts, and the flow-pseudocode package with it, into one file per platform, so the .vsix needs no
// node_modules: dist/extension.js (desktop, Node) and dist/web/extension.js (vscode.dev and github.dev, browser).
import { build } from 'esbuild';

const common = { entryPoints: ['src/extension.ts'], bundle: true, format: 'cjs', external: ['vscode'], sourcemap: true, logLevel: 'info' };
await build({ ...common, platform: 'node', target: 'node18', outfile: 'dist/extension.js' });
await build({ ...common, platform: 'browser', target: 'es2022', outfile: 'dist/web/extension.js' });
