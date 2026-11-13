// The job board has its own list of allowed moves. The server must accept every one of them.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { jobMoveError, JOB_STATUSES } from '../src/lib/workflowRules.js';

const file = new URL('../../frontend/src/constants/jobStatuses.js', import.meta.url);

test('every move the job board offers is accepted by the server', () => {
  const src = fs.readFileSync(file, 'utf8');
  const re = /\[JOB_STATUSES\.(\w+)\]: \{[\s\S]*?next: \[([^\]]*)\]/g;
  let m; let moves = 0; const statuses = new Set();
  while ((m = re.exec(src))) {
    statuses.add(m[1]);
    for (const to of m[2].split(',').map((x) => x.trim().replace('JOB_STATUSES.', '')).filter(Boolean)) {
      moves++;
      assert.equal(jobMoveError(m[1], to), null, `${m[1]} → ${to}`);
    }
  }
  assert.ok(moves >= 10, `expected to find the board's moves, found ${moves}`);
  assert.deepEqual([...statuses].sort(), [...JOB_STATUSES].sort(), 'board and server know the same statuses');
});
