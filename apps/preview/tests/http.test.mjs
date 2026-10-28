// Exploratory end-to-end HTTP tests for LOCAL preview. Not CAT-generated.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const script=path.resolve(here,'../src/server.mjs');
test('complete HTTP editing/publication/read workflow + reload persistence', { timeout:20000 }, async () => {
  const dir=mkdtempSync(path.join(tmpdir(),'eternalia-http-'));
  const port=18000+Math.floor(Math.random()*18000);
  let proc, key='';
  const base=`http://127.0.0.1:${port}`;
  async function start(){
    proc=spawn(process.execPath,[script],{env:{...process.env,PREVIEW_PORT:String(port),PREVIEW_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
    let logs='';proc.stdout.on('data',data=>{logs+=data.toString();const m=/\/admin#key=([0-9a-f]{48})/.exec(logs);if(m)key=m[1];});
    proc.stderr.on('data',data=>logs+=data.toString());
    for(let i=0;i<60;i++){if(proc.exitCode!==null)throw Error('preview exited '+logs);if(key){try{const r=await fetch(base+'/api/health');if(r.ok)return;}catch{}}await wait(70);}
    throw Error('Preview failed to start '+logs);
  }
  function stop(){if(proc&&!proc.killed)proc.kill('SIGTERM');}
  async function request(path,method='GET',body,auth=false){const response=await fetch(base+path,{method,headers:{...(auth?{'X-Preview-Key':key}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};}
  async function create(kind,parentId,title){const r=await request('/api/admin/nodes','POST',{kind,parentId,content:{title,body:'原稿',details:{}}},true);assert.equal(r.status,201,JSON.stringify(r.data));return r.data.id;}
  async function rev(id){const r=await request('/api/admin/nodes','GET',undefined,true);assert.equal(r.status,200);return r.data.find(n=>n.id===id)?.revision;}
  async function pub(id){const r=await request(`/api/admin/nodes/${id}/publish`,'POST',{expectedRevision:await rev(id)},true);assert.equal(r.status,200,JSON.stringify(r.data));}
  try{
    await start();
    assert.equal((await request('/api/admin/nodes')).status,401,'unauthenticated writer list denied');
    assert.equal((await request('/api/public/series')).data.length,0);
    const s=await create('series',null,'世界α');const v=await create('volume',s,'編');const p=await create('part',v,'部');const c=await create('chapter',p,'章');
    await pub(c);assert.equal((await request(`/api/public/items/${c}`)).status,404);
    for(const id of [s,v,p])await pub(id);
    assert.equal((await request(`/api/public/items/${c}`)).status,200);
    const revision=await rev(c);
    let r=await request(`/api/admin/nodes/${c}`,'PATCH',{expectedRevision:revision,content:{title:'改稿章',body:'未公開の文章',details:{}}},true);assert.equal(r.status,200);
    r=await request(`/api/public/items/${c}`);assert.equal(r.data.content.title,'章');assert.ok(!JSON.stringify(r.data).includes('未公開の文章'));
    r=await request(`/api/admin/nodes/${c}`,'PATCH',{expectedRevision:revision,content:{title:'古い編集',body:'',details:{}}},true);assert.equal(r.status,409);
    await pub(c);r=await request(`/api/public/items/${c}`);assert.equal(r.data.content.body,'未公開の文章');
    r=await request(`/api/admin/nodes/${v}/visibility`,'POST',{expectedRevision:await rev(v),isPublic:false,publicSince:null},true);assert.equal(r.status,200);assert.equal((await request(`/api/public/items/${c}`)).status,404);
    assert.equal((await request(`/api/public/series/${s}/tree`)).data.length,1,'hidden subtree excluded');
    assert.equal((await request('/api/public/series')).data.length,1,'series remains public');
    const html=await fetch(base+'/admin');assert.equal(html.status,200);assert.ok((await html.text()).includes('作者の書斎'));
    stop();await wait(100);await start();
    assert.equal((await request(`/api/public/items/${c}`)).status,404,'private ancestor persisted');
    assert.equal(JSON.parse(readFileSync(path.join(dir,'preview-data.json'),'utf8')).nodes.length,4,'persistent library');
    const denyStatus=await new Promise((resolve,reject)=>{const request=http.get({hostname:'127.0.0.1',port,path:'/api/admin/nodes',headers:{Host:`attacker.example:${port}`,'X-Preview-Key':key}},response=>{response.resume();resolve(response.statusCode);});request.on('error',reject);});assert.equal(denyStatus,403);
    r=await fetch(base+'/api/admin/nodes',{method:'POST',headers:{'X-Preview-Key':key,'Origin':'http://attacker.example','Content-Type':'application/json'},body:'{}'});assert.equal(r.status,403);
  }finally{stop();rmSync(dir,{force:true,recursive:true});}
});
