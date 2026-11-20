# Contributing to the Flow Pseudocode extension

Thanks for helping. This repo is the VS Code extension for [Flow Pseudocode](https://github.com/Rabbinatix/flow-pseudocode) (FPC).
The language, the parser and the command line live in that repo; this one connects them to the editor.

## Set up

```sh
git clone https://github.com/Rabbinatix/fpc-vscode.git
cd fpc-vscode
npm install
npm run check     # typecheck, tests, build
```

To try it in an editor: open the folder in VS Code and press **F5** (*Run the extension*). A second window opens; open or create a
`.fpc` file in it. After a change, run the *Developer: Reload Window* command in that window.

## The code map

| File | What it does |
|---|---|
| `src/extension.ts` | the thin part that connects to VS Code: checks a document when it opens, 300 ms after the last edit and on save; Format Document; the cheat sheet command |
| `src/diagnostics.ts` | turns the package's diagnostics (1-based line and column) into editor ranges (0-based). Pure: no `vscode` import |
| `src/format.ts` | decides what Format Document does: replace, nothing, or refuse. Pure |
| `syntaxes/fpc.tmLanguage.json` | the TextMate grammar that highlights `.fpc` files |
| `syntaxes/fpc.markdown.tmLanguage.json` | highlights ` ```fpc ` blocks in Markdown |
| `language-configuration.json` | comments, brackets, auto-indent and folding rules |
| `scripts/build.mjs` | bundles the extension **and the package** into `dist/extension.js` (desktop) and `dist/web/extension.js` (web editors) |
| `test/` | the tests. `test/vscode-fake.ts` is a small fake of the `vscode` API (the module only exists inside the editor) |

Keep logic out of `extension.ts`: put it in a pure file with a test, and leave `extension.ts` as wiring.

## When the language changes

FPC's keywords and functions come from the package's tables. `test/grammar.spec.ts` fails when a keyword or function is missing
from `syntaxes/fpc.tmLanguage.json`: add it there. New syntax shapes the test can't see (a new kind of key, a new
operator) need a look at the grammar by hand and a line in `syntaxes/` plus an example in the pull request.

## Code style

TypeScript, no runtime dependencies beyond the package (it is bundled in), 2 spaces, single quotes, semicolons, LF
(`.editorconfig`). Comment the why. Errors shown to people say what is wrong and what to write instead.

## Releasing (maintainers)

1. The package must be on npm: `npm install -D @rabbinatix/flow-pseudocode@^1.1.0` (during development it may be installed from the
   sibling folder, `file:../flow-pseudocode`; `npm run release:guard` refuses to release like that).
2. Bump `version` in `package.json` and add a line to `CHANGELOG.md`.
3. `npm run package` builds `flow-pseudocode-<version>.vsix` after the checks. Try it: *Install from VSIX*.
4. `npm run publish:vscode` (Visual Studio Marketplace, needs a token for the publisher `rabbinatix`: `VSCE_PAT`) and
   `npm run publish:openvsx` (Open VSX, for Cursor, VSCodium and Windsurf; needs `OVSX_PAT`).

## Pull requests

Keep them small. Run `npm run check`. By contributing you agree that your code is released under the MIT licence.
See also the [Code of Conduct](CODE_OF_CONDUCT.md).
