#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const target = path.resolve(process.argv[2] || 'postman-gateway-macos.js');
if (!fs.existsSync(target)) {
  console.error(`Target not found: ${target}`);
  process.exit(1);
}

let source = fs.readFileSync(target, 'utf8');
const start = source.indexOf('function accountAdminPage() {');
const end = source.indexOf('\nfunction apiError(', start);

if (start === -1 || end === -1) {
  console.error('Admin page block not found; patch layout may have changed.');
  process.exit(1);
}

const replacement = `function accountAdminPage() {
  return \`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Postman Gateway Accounts</title>
<style>
body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f1115;color:#e7e9ee;margin:0;padding:28px}
main{max-width:980px;margin:auto}.card{background:#181b22;border:1px solid #2a2f3a;border-radius:12px;padding:18px;margin:12px 0}
h1{font-size:22px}.muted{color:#9aa3b2;font-size:13px}button{background:#2f6feb;color:#fff;border:0;border-radius:8px;padding:8px 12px;cursor:pointer}button[disabled]{opacity:.5;cursor:default}
pre{white-space:pre-wrap;word-break:break-word;background:#11141a;padding:10px;border-radius:8px}.ok{color:#57d38c}.bad{color:#ff7b72}
</style>
</head>
<body><main>
<h1>Postman Gateway 多账号管理</h1>
<p class="muted">仅提供账号状态查看和手动切换，不自动轮换账号。默认服务仅绑定 127.0.0.1。</p>
<div id="app">加载中...</div>
<script>
async function load(force=false){
  const r=await fetch('/admin/accounts'+(force?'?refresh=1':''));
  const d=await r.json();
  const root=document.getElementById('app');
  root.innerHTML=(d.accounts||[]).map(function(a){
    const status=a.ok?'<span class="ok">可用</span>':'<span class="bad">不可用</span>';
    const selected=a.selected?'✅ 当前账号':'';
    const disabled=(a.selected||!a.ok)?' disabled':'';
    return '<div class="card">' +
      '<div><strong>'+esc(a.name)+'</strong> '+selected+' '+status+'</div>' +
      '<div class="muted">models: '+(a.model_count??'-')+' | default: '+esc(a.default_model||'-')+' | user: '+esc(a.user_id||'-')+'</div>' +
      '<pre>'+esc(JSON.stringify(a.usage??a.error??null,null,2))+'</pre>' +
      '<button data-account="'+esc(a.name)+'"'+disabled+' onclick="selectAccount(this.dataset.account)">切换到此账号</button>' +
      '</div>';
  }).join('') || '<div class="card">没有发现账号 JSON。</div>';
}
async function selectAccount(name){
  const r=await fetch('/admin/account/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account:name})});
  const d=await r.json();
  if(!r.ok){alert(d.error?.message||d.detail||'切换失败');return;}
  await load(true);
}
function esc(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
load();
</script>
</main></body></html>\`;
}`;

source = source.slice(0, start) + replacement + '\n' + source.slice(end + 1);
fs.writeFileSync(target, source);
console.log(`Fixed admin UI syntax: ${target}`);
