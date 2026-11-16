// Phase 9: rows and cards that open on a click also open from the keyboard (Enter or Space).
// Run from src/frontend: node ../../qa/tools/codemods/phase9-clickable.cjs [--write]
const fs=require('fs'),path=require('path');const parser=require(path.resolve('node_modules/@babel/parser'));const traverse=require(path.resolve('node_modules/@babel/traverse')).default;
const WRITE=process.argv.includes('--write');const SRC=path.resolve('src');
const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(['mocks','node_modules'].includes(e.name)?[]:walk(path.join(d,e.name))):/\.jsx$/.test(e.name)?[path.join(d,e.name)]:[]);
const nameOf=n=>n.type==='JSXIdentifier'?n.name:'';const has=(el,n)=>el.openingElement.attributes.some(a=>a.type==='JSXAttribute'&&a.name.name===n);
// A table row or a list item keeps its own role, so a screen reader still reads the table.
const KEEP_ROLE=new Set(['TableRow','tr','ListItem']);
const TARGETS=new Set(['TableRow','Card','Paper','Box','Stack','ListItem','Grid','div','tr','TableCell','Typography','Avatar','span']);
const tally={};let files=0,total=0;
for(const f of walk(SRC)){const t=fs.readFileSync(f,'utf8');const ast=parser.parse(t,{sourceType:'module',plugins:['jsx']});const edits=[];
 traverse(ast,{JSXElement(p){const el=p.node,n=nameOf(el.openingElement.name);if(!TARGETS.has(n)||!has(el,'onClick'))return;
  if(['tabIndex','component','onKeyDown','onKeyUp','href','to'].some(k=>has(el,k)))return;
  // a click handler that only stops the click from reaching a parent is not an action
  const oc=el.openingElement.attributes.find(a=>a.type==='JSXAttribute'&&a.name.name==='onClick');const src=t.slice(oc.start,oc.end);
  if(/stopPropagation\(\)\s*\}?\s*\}$/.test(src)&&!/=>\s*\{[^}]*;/.test(src))return; if(/^onClick=\{\(?e?\)?\s*=>\s*e\.stopPropagation\(\)\}$/.test(src.replace(/\s+/g,' ')))return;
  tally[n]=(tally[n]||0)+1;edits.push({at:el.openingElement.name.end,text:(KEEP_ROLE.has(n)||has(el,'role')?'':' role="button"')+' tabIndex={0} onKeyDown={activateOnKey}'});}});
 if(!edits.length)continue;files++;total+=edits.length;if(!WRITE)continue;
 let out=t;for(const e of edits.sort((a,b)=>b.at-a.at))out=out.slice(0,e.at)+e.text+out.slice(e.at);
 if(!/utils\/activateOnKey['"]/.test(out)){let rel=path.relative(path.dirname(f),path.join(SRC,'utils/activateOnKey')).replace(/\\/g,'/');if(!rel.startsWith('.'))rel='./'+rel;const imps=ast.program.body.filter(b=>b.type==='ImportDeclaration');const at=imps.length?imps[imps.length-1].end:0;out=out.slice(0,at)+`\nimport { activateOnKey } from '${rel}'`+out.slice(at)}
 parser.parse(out,{sourceType:'module',plugins:['jsx']});fs.writeFileSync(f,out)}
console.log(JSON.stringify({write:WRITE,files,total,tally}));
