// package.json is what the stores read: check that it points at real files and that the settings and command match the code.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const source = readFileSync('src/extension.ts', 'utf8');

describe('package.json', () => {
  it('names the publisher and a store-friendly id', () => {
    expect(`${pkg.publisher}.${pkg.name}`).toBe('rabbinatix.flow-pseudocode');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg.license).toBe('MIT');
    expect(pkg.repository.url).toContain('github.com/Rabbinatix/fpc-vscode');
  });
  it('points at files that exist', () => {
    const files = [pkg.icon, pkg.contributes.languages[0].configuration, ...pkg.contributes.grammars.map((g: { path: string }) => g.path)];
    for (const f of files) expect(existsSync(f), f).toBe(true);
    for (const f of ['LICENSE', 'README.md', 'CHANGELOG.md']) expect(existsSync(f), f).toBe(true);
  });
  it('has a 128×128 PNG icon', () => {
    const png = readFileSync(pkg.icon);
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([128, 128]);
  });
  it('declares the command and settings the code uses', () => {
    expect(pkg.contributes.commands.map((c: { command: string }) => c.command)).toEqual(['fpc.copyCheatSheet']);
    expect(source).toContain("'fpc.copyCheatSheet'");
    for (const key of Object.keys(pkg.contributes.configuration.properties)) expect(source, key).toContain(`'${key.replace(/^fpc\./, '')}'`);
  });
  it('opens .fpc files, and files whose first line is FPC 1.0', () => {
    const lang = pkg.contributes.languages[0];
    expect(lang.extensions).toContain('.fpc');
    expect(new RegExp(lang.firstLine).test('FPC 1.0\nLOGIC "x"')).toBe(true);
    expect(new RegExp(lang.firstLine).test('hello')).toBe(false);
  });
  it('runs on the desktop and in the web editors', () => {
    expect(pkg.main).toBe('./dist/extension.js');
    expect(pkg.browser).toBe('./dist/web/extension.js');
  });
});
