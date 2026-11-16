// Two ratchets on the screens (Phase 2, findings B-024 and C-007). Both can only go down.
//  1. Effects and callbacks that read a value they do not list (eslint react-hooks/exhaustive-deps).
//  2. A screen that invents a record when the server fails: a catch block that sets a list holding a literal { id: … }.
//  3. Phase 9 (B-015 and the Phase 9 findings): an icon button or a field with no name, a routed page with no
//     main heading, a sample-screen button with no action and no notice, a row or card that opens on a click
//     and cannot be reached by keyboard. Each is counted by the tool that fixed it, run without --write.
//   node qa/tools/frontend-checks.mjs [--max-effects N] [--max-invented N]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? Number(process.argv[i + 1]) : d; };
const MAX_EFFECTS = arg('max-effects', 38);
const MAX_INVENTED = arg('max-invented', 0);

let report;
try { report = execFileSync('npx', ['eslint', 'src/frontend/src', '-f', 'json'], { cwd: root, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) { report = e.stdout?.toString() || '[]'; }
const effects = JSON.parse(report).flatMap((f) => f.messages.filter((m) => m.ruleId === 'react-hooks/exhaustive-deps').map((m) => `${path.relative(root, f.filePath)}:${m.line}`));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (['mocks', 'node_modules'].includes(e.name) ? [] : walk(path.join(dir, e.name))) : /\.jsx?$/.test(e.name) ? [path.join(dir, e.name)] : []));
const invented = [];
for (const file of walk(path.join(root, 'src/frontend/src'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/catch\s*(\(\w*\))?\s*\{(?:[^{}]|\{[^{}]*\})*?set\w+\(\s*\[\s*\{\s*id:\s*['"`]/g)) invented.push(`${path.relative(root, file)}:${text.slice(0, m.index).split('\n').length}`);
}
const fe = path.join(root, "src/frontend");
const dry = (tool) => { const out = execFileSync("node", [path.join(root, "qa/tools/codemods", tool)], { cwd: fe, maxBuffer: 64 * 1024 * 1024 }).toString(); const a = out.indexOf("{"); let depth = 0, b = a; for (let i = a; i < out.length; i += 1) { if (out[i] === "{") depth += 1; if (out[i] === "}") { depth -= 1; if (!depth) { b = i; break; } } } return JSON.parse(out.slice(a, b + 1)); };
const a11y = dry("phase9-a11y.cjs"); const notBuilt = dry("phase9-not-built.cjs"); const clickable = dry("phase9-clickable.cjs");
const MAX_NO_TITLE = arg("max-no-title", 2);
const phase9 = {
  iconButtonsWithNoName: a11y.buttonsNamed + a11y.buttonsNotNamed,
  fieldsWithNoName: a11y.fieldsNamed + a11y.fieldsNotNamed,
  pagesMissingAMainHeading: a11y.headingsMade,
  pagesWhereNoTitleCouldBeFound: a11y.pagesWithNoTitleFound,
  sampleButtonsWithNoActionAndNoNotice: notBuilt.buttonsGivenTheNotice,
  clickOnlyRowsAndCards: clickable.total,
};
const phase9Bad = phase9.iconButtonsWithNoName + phase9.fieldsWithNoName + phase9.pagesMissingAMainHeading + phase9.sampleButtonsWithNoActionAndNoNotice + phase9.clickOnlyRowsAndCards > 0 || phase9.pagesWhereNoTitleCouldBeFound > MAX_NO_TITLE;
fs.writeFileSync(path.join(root, "qa/results/frontend-checks.json"), JSON.stringify({ at: new Date().toISOString(), effects, invented, phase9 }, null, 1));
console.log("phase 9 (each must be 0; pages with no title found, ceiling " + MAX_NO_TITLE + "): " + JSON.stringify(phase9));
console.log(`effects that read a value they do not list: ${effects.length} (ceiling ${MAX_EFFECTS}); screens that invent a record when the server fails: ${invented.length} (ceiling ${MAX_INVENTED})`);
for (const i of invented) console.log(`  invented record: ${i}`);
process.exit(effects.length > MAX_EFFECTS || invented.length > MAX_INVENTED || phase9Bad ? 1 : 0);
