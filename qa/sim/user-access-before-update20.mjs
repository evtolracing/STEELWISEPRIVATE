// Role matrix, phase 4: the server before database update 20 is applied. Run against a QA server whose
// database has had prisma/upgrades/rollback/20261121090000_user_primary_role.down.sql run on it:
//   node qa/sim/user-access-before-update20.mjs      (then apply the update again)
const B='http://localhost:3011';
const j=async(m,u,t,b)=>{const r=await fetch(B+u,{method:m,headers:{'content-type':'application/json',...(t&&{authorization:`Bearer ${t}`})},body:b?JSON.stringify(b):undefined});return {s:r.status,b:await r.json().catch(()=>null)}};
const login=async(e)=>(await j('POST','/api/auth/login',null,{email:e,password:'qa-password-1'})).b;
const admin=await login('qa-admin@qa.test'); const csr=await login('qa-csr@qa.test');
const out=[];
const ok=(n,c,d='')=>out.push(`${c?'ok  ':'FAIL'} ${n} ${c?'':JSON.stringify(d).slice(0,200)}`);
ok('sign-in works', Boolean(admin.token&&csr.token));
const me=await j('GET','/api/auth/me',csr.token); ok('/me works with permissions', me.s===200 && (me.b.user||me.b).permissions.length>10, me);
const id=(me.b.user||me.b).id;
const acc=await j('GET',`/api/users/${id}/access`,admin.token); ok('access reads, custom main role not ready', acc.s===200 && acc.b.customMainRoleReady===false, acc);
const role=await j('POST','/api/users/roles',admin.token,{displayName:'QA pre20 '+Date.now().toString(36),grants:['finance:view']}); ok('custom role made', role.s===201, role);
const main=await j('PUT',`/api/users/${id}/access`,admin.token,{primaryRoleId:role.b.id}); ok('custom main role answers 503 naming update 20', main.s===503 && /update 20/.test(main.b.error), main);
const ex=await j('PUT',`/api/users/${id}/access`,admin.token,{extras:[{roleId:role.b.id}]}); ok('extra role still works', ex.s===200, ex);
ok('and takes effect', (await j('GET','/api/ledger/status',csr.token)).s===200);
const list=await j('GET',`/api/users/roles/${role.b.id}`,admin.token); ok('role detail reads', list.s===200 && list.b.holders===1, list);
ok('users list reads', (await j('GET','/api/users',admin.token)).s===200);
ok('user form change with a role works', (await j('PUT',`/api/users/${id}`,admin.token,{title:'Clerk'})).s===200);
ok('cleared', (await j('PUT',`/api/users/${id}/access`,admin.token,{extras:[]})).s===200);
ok('role deleted', (await j('DELETE',`/api/users/roles/${role.b.id}`,admin.token)).s===200);
console.log(out.join('\n'));
