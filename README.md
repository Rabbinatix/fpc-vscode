# Flow Pseudocode (FPC) for VS Code

Support for **Flow Pseudocode (FPC)**: a strict, typed pseudocode that developers and AI assistants can both read, write and check.
Works in VS Code, Cursor, VSCodium, Windsurf and the web editors (vscode.dev, github.dev).

```fpc
FPC 1.0
FLOW "User login" KEY FLOW-AUTH-LOGIN-001 VERSION 1.3.0
INPUT email: string(email), password: string, rememberMe?: boolean
OUTPUT token: string, expiresIn: integer

STEP LOGIC-AUTH-LOGIN-001/CHK "Inputs valid?"
  IF email IS EMPTY OR password IS EMPTY THEN
    FAIL 400 "email is required"
  END IF

STEP LOGIC-AUTH-LOGIN-001/CALL
  SET result ← CALL AuthService POST /api/v2/login WITH { email, password }
  IF result.status = 401 THEN
    FAIL 401 "Invalid credentials"
  END IF
  RETURN { token: result.body.accessToken, expiresIn: result.body.expiresIn }
```

## What you get

- **Errors as you type.** A mistake is underlined with what is wrong and often what to write instead
  (`Unknown function isEmial(): did you mean isEmail()?`). The checks run from the same parser as the
  [`@rabbinatix/flow-pseudocode`](https://github.com/Rabbinatix/flow-pseudocode) package, so you see what the command line and
  your CI will see. Errors and warnings are in the Problems panel too.
- **Format Document** (and format on save) writes the canonical form: Unicode arrows, `SET` on every assignment, two-space
  indentation. A document with errors is left alone, and the status bar says why.
- **Highlighting** for `.fpc` files, for any file whose first line is `FPC 1.0`, and for ` ```fpc ` blocks in Markdown.
- **Editing help:** `--` comments, bracket matching, auto-indent after `IF … THEN`, `FOR`, `MATCH` and the other blocks, and folding
  from a block to its `END`.
- **Cheat sheet for your AI assistant:** the command **FPC: Copy cheat sheet for an AI assistant** (Command Palette) copies the
  one-page rules to the clipboard. Paste it into the assistant, ask for FPC, and the errors show up here.

## Settings

| Setting | Default | |
|---|---|---|
| `fpc.diagnostics.enable` | `true` | show errors and warnings as you type |
| `fpc.diagnostics.maxFileSizeKb` | `500` | don't check files larger than this (keeps the editor responsive) |

To format on save for FPC only:

```json
"[fpc]": { "editor.formatOnSave": true }
```

## Install

Search for **Flow Pseudocode (FPC)** (publisher **Rabbinatix**) in the Extensions view. VS Code installs from the Visual Studio
Marketplace; Cursor, VSCodium and Windsurf install from Open VSX. Or install a `.vsix` file: Extensions view → `…` → *Install
from VSIX*.

## About FPC

FPC has a typed header (`INPUT email: string(email)`), explicit API calls (`CALL AuthService POST /api/v2/login`), a stable key on
every `STEP`, and a small strict grammar, so a mistake is an error with a line and column and never a guess.

- Spec (CC BY 4.0), grammar, cheat sheet, parser and the `rfpc` command line: https://github.com/Rabbinatix/flow-pseudocode
- Try it in your browser: https://rabbinatix.com/guide/pseudocode
- FPC is the text form of logic in [Rabbinatix](https://rabbinatix.com). It stands on its own: you don't need Rabbinatix to use it.

## Contributing

Bug reports and pull requests are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md). MIT licence.
