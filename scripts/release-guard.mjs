// Stops a release that would ship against a local copy of the package: while developing, flow-pseudocode may be installed
// from the sibling folder (`file:../flow-pseudocode`). Before publishing, it must be a version from npm.
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const dep = pkg.devDependencies?.['@rabbinatix/flow-pseudocode'];
if (!dep || /^(file:|link:|\.|\/)/.test(dep)) {
  console.error(`release guard: @rabbinatix/flow-pseudocode is "${dep ?? 'missing'}". Publish the package to npm, then run:\n  npm install -D @rabbinatix/flow-pseudocode@^1.1.0`);
  process.exit(1);
}
console.log(`release guard: @rabbinatix/flow-pseudocode ${dep} (from npm)`);
