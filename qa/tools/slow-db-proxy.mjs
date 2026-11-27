#!/usr/bin/env node
// A stand-in for a database that is far away: every message the client sends waits DELAY_MS before it
// is passed on to the local QA database. A request that takes many round trips then takes as long here
// as it does on the hosted server, where each one costs tens of milliseconds.
//   node qa/tools/slow-db-proxy.mjs --listen 6543 --delay 20
import net from 'node:net';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const LISTEN = Number(arg('listen', 6543)); const TARGET = Number(arg('target', 5432)); const DELAY = Number(arg('delay', 20));
let messages = 0;
const server = net.createServer((client) => {
  const db = net.connect(TARGET, '127.0.0.1');
  let queue = Promise.resolve();
  client.on('data', (chunk) => { messages += 1; queue = queue.then(() => new Promise((done) => setTimeout(() => { if (!db.destroyed) db.write(chunk); done(); }, DELAY))); });
  db.on('data', (chunk) => { if (!client.destroyed) client.write(chunk); });
  const end = () => { client.destroy(); db.destroy(); };
  client.on('close', end); db.on('close', end); client.on('error', end); db.on('error', end);
});
server.listen(LISTEN, '127.0.0.1', () => console.log(`slow database proxy: 127.0.0.1:${LISTEN} -> ${TARGET}, ${DELAY} ms per message`));
process.on('SIGUSR2', () => { console.log(`messages so far: ${messages}`); });
process.on('SIGTERM', () => { console.log(`messages: ${messages}`); process.exit(0); });
