// Builds qa/ticket-traceability.md from git history. There are no ticket files in the
// repo; each commit (and squashed PR) is treated as one ticket.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const sh = (c) => execSync(c, { encoding: 'utf8', maxBuffer: 64 << 20 });
const area = (f) => {
  const m = f.match(/^src\/(backend|frontend)\/(?:src\/)?([^/]+)\/([^/]+)/) || f.match(/^src\/(backend|frontend)\/([^/]+)/);
  if (!m) return f.split('/')[0];
  if (m[2] === 'prisma') return 'database';
  if (m[1] === 'backend') return `api:${(m[3] || m[2]).replace(/\.js$/, '')}`;
  return `ui:${m[2] === 'pages' || m[2] === 'services' ? (m[3] || '').replace(/\.(jsx?|js)$/, '') : m[2]}`;
};
const log = sh(`git log --format='@@%h|%ad|%s' --date=short --name-only`).split('@@').filter(Boolean);
const rows = log.map((block) => {
  const [head, ...files] = block.trim().split('\n');
  const [sha, date, subject] = head.split('|');
  const fl = files.filter(Boolean);
  const areas = [...new Set(fl.map(area))];
  return {
    sha, date, subject, files: fl.length,
    schema: fl.some((f) => /schema\.prisma|migrations\//.test(f)),
    api: areas.filter((a) => a.startsWith('api:')).slice(0, 8),
    ui: areas.filter((a) => a.startsWith('ui:')).slice(0, 8),
    tests: fl.filter((f) => /\.test\.|\.spec\.|qa\//.test(f)).length,
  };
});
const out = ['# Ticket-to-functionality traceability', '',
  'There are no ticket files in the repository, so each commit is treated as one ticket. Commits #1–#28 are squashed pull requests; older commits came before the PR workflow. Requested scope is taken from the commit or PR title; "implemented" is what the diff touched.', '',
  `Commits: ${rows.length}. Commits that changed the database schema: ${rows.filter((r) => r.schema).length}. Commits that added tests: ${rows.filter((r) => r.tests).length}.`, '',
  '| Commit | Date | Ticket (title) | Files | Schema | API areas | UI areas | Tests added |', '|---|---|---|---:|:-:|---|---|---:|',
  ...rows.map((r) => `| ${r.sha} | ${r.date} | ${r.subject.replace(/\|/g, '/')} | ${r.files} | ${r.schema ? 'yes' : ''} | ${r.api.join(', ')} | ${r.ui.join(', ')} | ${r.tests} |`), ''];
fs.writeFileSync('qa/ticket-traceability.md', out.join('\n'));
console.log(rows.length, 'commits;', rows.filter((r) => r.tests).length, 'with tests');
