// Sends 50 to 400 list requests at once (three in four as a branch login) to a server on the
// scaled copy of the QA database, and records times, failures and the peak number of database
// connections.   node qa/perf/phase3-load.mjs
const BASE='http://localhost:3013';
const tok=async(e)=>(await (await fetch(BASE+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:e,password:'qa-password-1'})})).json()).token;
const t={b:await tok('qa-branch-a@qa.test'),a:await tok('qa-admin@qa.test')};
const urls=['/api/orders?limit=50','/api/shipments?limit=50','/api/inventory?limit=50','/api/jobs?limit=50','/api/invoices?limit=50','/api/coils?limit=50','/api/quotes?limit=50'];
import { createRequire } from 'node:module';
const pg = createRequire(new URL('../../src/backend/package.json', import.meta.url))('pg');
for (const n of [50,100,200,400]) {
  let peak=0, on=true; const c=new pg.Client({connectionString:'postgresql://postgres:password@localhost:5432/postgres'}); await c.connect();
  const w=(async()=>{while(on){const r=await c.query("select count(*)::int n from pg_stat_activity where datname='steelwise_qa_scale3'");peak=Math.max(peak,r.rows[0].n);}})();
  const t0=performance.now();
  const rs=await Promise.all(Array.from({length:n},async(_,i)=>{const s=performance.now();try{const r=await fetch(BASE+urls[i%urls.length],{headers:{authorization:'Bearer '+(i%4?t.b:t.a)}});await r.arrayBuffer();return{ms:performance.now()-s,st:r.status}}catch{return{ms:performance.now()-s,st:0}}}));
  on=false; await w; await c.end();
  const ms=rs.map(r=>r.ms).sort((a,b)=>a-b);
  console.log(`${n} at once: wall ${Math.round(performance.now()-t0)} ms, p50 ${Math.round(ms[n>>1])} ms, p95 ${Math.round(ms[Math.floor(n*.95)])} ms, max ${Math.round(ms[n-1])} ms, not 200: ${rs.filter(r=>r.st!==200).length}, peak database connections ${peak}`);
}
