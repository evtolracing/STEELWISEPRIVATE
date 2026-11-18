#!/usr/bin/env node
// Phase 10: refuses a commit that carries a secret. Scans tracked files for the shapes of real keys,
// private keys, hosted database addresses with a password, chat and source-host tokens, and signed
// tokens. QA fixtures that say they are not real, and the .env.example files, are allowed.
//   node qa/tools/secret-scan.mjs        exit 1 and the file:line of each match (never the value)
import { spawnSync } from 'node:child_process';
const PATTERN = '(sk-[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|postgres(ql)?://[^:@/ ]+:[^@/ ]{6,}@[a-z0-9.-]*(supabase|amazonaws|neon|render)|xox[bp]-[0-9A-Za-z-]{10,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\\.[A-Za-z0-9_-]{20,}\\.)';
const r = spawnSync('git', ['grep', '-nIE', PATTERN, '--', '.', ':!**/package-lock.json'], { encoding: 'utf8' });
const allowed = (l) => /\.env\.example|qa-not-a-real|not-a-secret|example\.invalid|db\.xxx\.supabase|SECRETSECRET/.test(l); // documented placeholders and test fixtures
const hits = r.stdout.split('\n').filter(Boolean).filter((l) => !allowed(l)).map((l) => l.split(':').slice(0, 2).join(':'));
if (hits.length) { console.log(`✗ ${hits.length} possible secret(s) in tracked files (values not shown):\n  ${hits.join('\n  ')}`); process.exit(1); }
console.log('✓ No secret found in tracked files');
