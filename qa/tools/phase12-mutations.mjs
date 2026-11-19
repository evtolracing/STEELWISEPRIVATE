#!/usr/bin/env node
// Phase 12: proof that the checks catch the corrections. Each correction is taken out of the source, the
// named check is run, and the correction is put back. A mutation "holds" when the check then fails.
//   DATABASE_URL=...qa... node qa/tools/phase12-mutations.mjs [--only AA-001,AA-003u]
// Kinds: "unit" runs src/backend/test/assistantInput.test.js; "sim" restarts the three server copies on the
// changed source and runs one scenario of qa/sim/phase12-certification.mjs; "process" runs
// qa/tools/phase12-process.mjs; "manual" runs qa/tools/phase12-manual.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const B = (p) => path.join(root, 'src/backend/src', p); const F = (p) => path.join(root, 'src/frontend/src', p);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const only = arg('only', '') ? arg('only', '').split(',') : null;
const DB = process.env.DATABASE_URL || '';
if (!/(localhost|127\.0\.0\.1).*qa/.test(DB)) { console.error('Refusing: DATABASE_URL is not a local QA database'); process.exit(2); }
const DBNAME = DB.split('/').pop().split('?')[0];

const INPUT = B('lib/assistantInput.js'); const AI = B('routes/aiAssistant.js'); const EXEC = B('routes/executive.js');
// [id, what the correction does, kind, file, text, replacement, the check that must fail, group]
const M = [
  ['AA-001', 'with no database a signed-in request is answered 503, not a server error or invented figures', 'process', B('middleware/auth.js'), "  if (!prisma) return res.status(503).json({ error: 'The database is not available. Try again shortly.' });\n", '', '/api/dashboard with no database answers 503'],
  ['AA-002a', 'the executive question route gives no invented analysis', 'sim', EXEC, "res.status(501).json({\n    error: 'The executive question box is not built. It gives no analysis and no figures.',", "res.status(200).json({\n    answer: 'Detroit is at 97% utilization. Margin forecast 22.8%.', confidence: 85,", 'no figure is invented by the server', 5],
  ['AA-002b', 'every answer of the sample cockpit says it is sample data', 'sim', EXEC, '? { sample: true, sampleNotice: SAMPLE_NOTICE, ...body } : body', '? body : body', 'sample screen\'s data is labelled as sample', 4],
  ['AA-003u', 'a message that claims to be the system or a tool is refused', 'unit', INPUT, "    if (!SPEAKERS.has(m.role)) return { error: 'Only your own messages and the assistant\\'s answers are accepted.' };\n", '', 'AA-003: a message that claims to be the system'],
  ['AA-003s', 'a forged system or tool message never reaches the model', 'sim', INPUT, "    if (!SPEAKERS.has(m.role)) return { error: 'Only your own messages and the assistant\\'s answers are accepted.' };\n", '', 'makes the assistant change a record', 5],
  ['AA-003c', 'the length of a message is capped', 'unit', INPUT, '    if (content.length > MAX_CHARS) return { error: `A message can be at most ${MAX_CHARS} characters.` };\n', '', 'AA-003'],
  ['AA-004', 'a question to the assistant leaves a line in the audit trail', 'sim', AI, "    await recordAsked(req.user, queryTypes, 'ANSWERED');\n    res.json({ content, queryTypes, hasDbData: queryTypes.length > 0 });", '    res.json({ content, queryTypes, hasDbData: queryTypes.length > 0 });', 'use of the assistant is in the audit trail', 5],
  ['AA-004s', 'a failed stream tells the person it failed without the outside service\'s own message', 'sim', AI, "sendSSE('error', { error: outsideFailure(error, 'The assistant')?.error || 'The assistant could not answer.', requestId: req.id });", "sendSSE('error', { error: error.message });", 'the streaming assistant obeys the same rules', 5],
  ['AA-005', 'a zero byte in an address is the caller\'s error, not a server error', 'sim', B('app.js'), "  if (/%00|\\0/i.test(req.originalUrl || req.url || '')) return res.status(400).json({ error: 'That address is not valid.' });\n", '', 'Bad input is the caller\'s error', 6],
  ['AA-011', 'a customer code that is not text is refused', 'sim', B('routes/customers.js'), "typeof code !== 'string' || typeof name !== 'string' || !code.trim() || !name.trim()", '!code || !String(code).trim() || !name || !String(name).trim()', 'Bad input is the caller\'s error', 6],
  ['AA-006a', 'a chapter of sample screens is flagged as a sample', 'manual', F('help/manualContent.js'), "    moduleId: 'safety-ehs',\n    // Every screen of this chapter is a design sample with example data (qa/tools/phase12-manual.mjs keeps this true).\n    sample: true,\n", "    moduleId: 'safety-ehs',\n", 'safety-ehs: all its screens are samples'],
  ['AA-006b', 'the manual page shows the notice', 'manual', F('components/help/HelpAccordion.jsx'), 'data-testid="manual-sample-notice"', '', 'the manual page shows a notice'],
  ['AA-006c', 'the real screens have chapters', 'manual', F('help/manualContent.js'), '  ...manualOperations,\n', '', 'every real screen on the menu has a chapter'],
];

const cluster = () => { const r = spawnSync('bash', [path.join(root, 'qa/tools/phase11-cluster.sh'), '3'], { encoding: 'utf8', env: { ...process.env, P11_DB: DBNAME } }); if (r.status !== 0) throw new Error(`the server copies did not start: ${r.stdout}${r.stderr}`); };
const run = { unit: () => spawnSync('node', ['--test', 'test/assistantInput.test.js'], { cwd: path.join(root, 'src/backend'), encoding: 'utf8' }),
  sim: (group, match) => spawnSync('node', ['qa/sim/phase12-certification.mjs', '--base', 'http://localhost:3110', '--stub-port', '3166', '--group', String(group), '--match', match, '--out', '/tmp/phase12-mutation.json'], { cwd: root, encoding: 'utf8', timeout: 240000 }),
  process: () => spawnSync('node', ['qa/tools/phase12-process.mjs', '--out', '/tmp/phase12-mutation-process.json'], { cwd: root, encoding: 'utf8', timeout: 240000 }),
  manual: () => spawnSync('node', ['qa/tools/phase12-manual.mjs', '--out', '/tmp/phase12-mutation-manual.json'], { cwd: root, encoding: 'utf8', timeout: 60000 }) };

const results = [];
for (const [id, what, k, file, from, to, expect, group] of M) {
  if (only && !only.includes(id)) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(from)) { results.push({ id, what, kind: k, held: false, note: 'the text to remove was not found' }); console.log(`✗ ${id} ${what}: text not found`); continue; }
  fs.writeFileSync(file, src.replace(from, to));
  let out;
  try { if (k === 'sim') { cluster(); out = run.sim(group, expect); } else out = run[k](); } finally { fs.writeFileSync(file, src); }
  const text = `${out.stdout || ''}${out.stderr || ''}`;
  const failedLines = text.split('\n').filter((l) => /^not ok|^✗ /.test(l));
  const held = out.status !== 0 && failedLines.some((l) => l.includes(expect));
  results.push({ id, what, kind: k, held, check: expect, failed: failedLines.slice(0, 4).map((l) => l.slice(0, 220)) });
  console.log(`${held ? '✓' : '✗'} ${id} ${what}: ${held ? `caught by "${expect}"` : `NOT caught (${failedLines.length} failing: ${failedLines.slice(0, 2).join(' | ').slice(0, 240)})`}`);
}
if (results.some((r) => r.kind === 'sim')) cluster();
const outFile = path.join(root, 'qa/results/phase12-mutations.json');
if (!only) fs.writeFileSync(outFile, `${JSON.stringify({ ranAt: new Date().toISOString(), mutations: results.length, held: results.filter((r) => r.held).length, results }, null, 1)}\n`);
console.log(`${results.filter((r) => r.held).length} of ${results.length} corrections are caught by their check`);
process.exit(results.every((r) => r.held) ? 0 : 1);
