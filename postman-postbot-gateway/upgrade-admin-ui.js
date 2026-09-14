#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const target = path.resolve(process.argv[2] || 'runtime/postman-gateway-macos.js');
if (!fs.existsSync(target)) {
  console.error(`Target not found: ${target}`);
  process.exit(1);
}

let source = fs.readFileSync(target, 'utf8');
const startMarker = 'function accountAdminPage() {';
const endMarker = '\nfunction apiError(';
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  console.error('Could not locate accountAdminPage() in target file.');
  process.exit(1);
}

const replacement = `function accountAdminPage() {
  return String.raw\`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Postman Gateway Accounts</title>
<style>
:root{color-scheme:dark;--bg:#0b0d12;--panel:#151922;--panel2:#1b202b;--line:#2a3140;--text:#f3f5f7;--muted:#97a1b3;--good:#42d392;--warn:#f3b63f;--danger:#ff6b6b;--accent:#6c8cff}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#0a0c11 0%,#10141c 100%);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;min-height:100vh}
main{max-width:1180px;margin:0 auto;padding:32px 20px 56px}.topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.title h1{font-size:26px;line-height:1.2;margin:0 0 8px}.title p{margin:0;color:var(--muted);font-size:14px}.toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.btn{appearance:none;border:1px solid #394258;background:#222938;color:#fff;border-radius:10px;padding:10px 14px;font-weight:650;cursor:pointer}.btn:hover{background:#293247}.btn.primary{background:var(--accent);border-color:var(--accent)}.btn:disabled{opacity:.48;cursor:not-allowed}
.summary{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0 22px}.summary-item{background:rgba(21,25,34,.82);border:1px solid var(--line);border-radius:12px;padding:10px 13px;color:var(--muted);font-size:13px}.summary-item strong{color:var(--text);font-size:14px;margin-left:5px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px}.card{position:relative;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 10px 30px rgba(0,0,0,.18)}.card.selected{border-color:rgba(108,140,255,.8);box-shadow:0 0 0 1px rgba(108,140,255,.25),0 12px 30px rgba(0,0,0,.22)}.head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.name{font-size:17px;font-weight:750;word-break:break-all}.badges{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.badge{font-size:11px;font-weight:750;padding:5px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted);background:#11151c}.badge.ok{color:#a9f3d2;border-color:rgba(66,211,146,.35);background:rgba(66,211,146,.09)}.badge.warn{color:#ffe0a0;border-color:rgba(243,182,63,.35);background:rgba(243,182,63,.09)}.badge.bad{color:#ffc0c0;border-color:rgba(255,107,107,.35);background:rgba(255,107,107,.09)}.badge.active{color:#c7d3ff;border-color:rgba(108,140,255,.5);background:rgba(108,140,255,.12)}
.meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:16px 0}.meta-box{background:#11151c;border:1px solid #252c39;border-radius:11px;padding:10px 11px}.meta-label{font-size:11px;color:var(--muted);margin-bottom:4px}.meta-value{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.quota{margin-top:8px;padding-top:15px;border-top:1px solid var(--line)}.quota-line{display:flex;align-items:flex-end;justify-content:space-between;gap:14px}.quota-title{font-size:13px;color:var(--muted)}.quota-percent{font-size:28px;font-weight:820;letter-spacing:-1px}.meter{height:12px;background:#0d1016;border:1px solid #242b38;border-radius:999px;overflow:hidden;margin:11px 0 9px}.fill{height:100%;border-radius:999px;transition:width .45s ease;background:linear-gradient(90deg,#42d392,#6c8cff)}.fill.warn{background:linear-gradient(90deg,#f3b63f,#e58b3a)}.fill.danger{background:linear-gradient(90deg,#ff6b6b,#d94f70)}.numbers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.num{padding:9px 10px;background:#11151c;border:1px solid #252c39;border-radius:10px}.num span{display:block;color:var(--muted);font-size:11px;margin-bottom:3px}.num strong{font-size:14px}.foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:15px}.hint{font-size:12px;color:var(--muted)}.error{color:#ffc0c0;background:rgba(255,107,107,.08);border:1px solid rgba(255,107,107,.25);padding:11px;border-radius:10px;margin-top:14px;word-break:break-word}.empty{padding:28px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center}
@media(max-width:640px){main{padding:22px 14px 44px}.topbar{flex-direction:column}.grid{grid-template-columns:1fr}.meta{grid-template-columns:1fr}.numbers{grid-template-columns:1fr}.quota-percent{font-size:24px}}
</style>
</head>
<body><main>
<div class="topbar"><div class="title"><h1>Postman Gateway 账号管理</h1><p>账号额度每 15 秒自动刷新；额度条显示剩余比例。</p></div><div class="toolbar"><button class="btn" id="refreshBtn">立即刷新</button></div></div>
<div class="summary" id="summary"><div class="summary-item">正在加载账号状态...</div></div>
<div class="grid" id="accounts"></div>
<script>
const REFRESH_MS=15000;
let refreshing=false;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmt(v){var n=Number(v);return Number.isFinite(n)?new Intl.NumberFormat('zh-CN').format(n):'-';}
function userType(v){var s=String(v||'').toUpperCase();if(s==='PAID_USER')return '付费用户';if(s==='FREE_USER')return '免费用户';return v||'未知';}
function accountStatus(a,u,remaining){var state=String((u&&u.usageState)||'').toUpperCase();if(!a.ok)return {text:'异常',cls:'bad'};if(state==='BLOCKED')return {text:'已阻止',cls:'bad'};if(Number(u.limit)>0&&remaining<=0&&!u.allowOverage)return {text:'额度用尽',cls:'bad'};return {text:'正常',cls:'ok'};}

function accountCard(a){
  if(!a.ok){
    return '<article class="card'+(a.selected?' selected':'')+'"><div class="head"><div class="name">'+esc(a.name)+'</div><div class="badges"><span class="badge bad">异常</span>'+(a.selected?'<span class="badge active">当前账号</span>':'')+'</div></div><div class="error">'+esc(a.error||'无法读取账号状态')+'</div></article>';
  }
  var u=a.usage||{};
  var limit=Math.max(0,Number(u.limit)||0);
  var used=Math.max(0,Number(u.usage)||0);
  var remaining=limit>0?Math.max(0,limit-used):0;
  var remainingPct=limit>0?Math.max(0,Math.min(100,remaining/limit*100)):0;
  var tone=remainingPct<=10?'danger':remainingPct<=25?'warn':'';
  var status=accountStatus(a,u,remaining);
  var extra='';
  if(Number(u.overage)>0)extra='<div class="num"><span>超额使用</span><strong>'+fmt(u.overage)+'</strong></div>';
  return '<article class="card'+(a.selected?' selected':'')+'">'
    +'<div class="head"><div><div class="name">'+esc(a.name)+'</div><div class="hint" style="margin-top:5px">User '+esc(a.user_id||'-')+' · Team '+esc(a.team_id||'-')+'</div></div><div class="badges"><span class="badge '+status.cls+'">'+status.text+'</span>'+(a.selected?'<span class="badge active">当前账号</span>':'')+'</div></div>'
    +'<div class="meta"><div class="meta-box"><div class="meta-label">账号类型</div><div class="meta-value">'+esc(userType(u.userType))+'</div></div><div class="meta-box"><div class="meta-label">额度范围</div><div class="meta-value">'+(u.isTeamPooled?'团队共享':'个人额度')+'</div></div><div class="meta-box"><div class="meta-label">默认模型</div><div class="meta-value">'+esc(a.default_model||'-')+'</div></div><div class="meta-box"><div class="meta-label">可用模型</div><div class="meta-value">'+fmt(a.model_count)+' 个</div></div></div>'
    +'<div class="quota"><div class="quota-line"><div><div class="quota-title">剩余额度</div><div class="quota-percent">'+remainingPct.toFixed(1)+'%</div></div><div class="hint">'+(u.allowOverage?'允许超额':'不可超额')+'</div></div><div class="meter"><div class="fill '+tone+'" style="width:'+remainingPct.toFixed(2)+'%"></div></div><div class="numbers"><div class="num"><span>剩余</span><strong>'+fmt(remaining)+'</strong></div><div class="num"><span>已使用</span><strong>'+fmt(used)+'</strong></div><div class="num"><span>总额度</span><strong>'+fmt(limit)+'</strong></div>'+extra+'</div></div>'
    +'<div class="foot"><div class="hint">'+(u.isPaidPostbotUser?'Postbot 付费权益':'Postbot 标准权益')+'</div><button class="btn primary" data-account="'+esc(a.name)+'" '+(a.selected?'disabled':'')+'>'+(a.selected?'正在使用':'切换到此账号')+'</button></div>'
    +'</article>';
}

async function load(force){
  if(refreshing)return;
  refreshing=true;
  var btn=document.getElementById('refreshBtn');
  btn.disabled=true;btn.textContent='刷新中...';
  try{
    var r=await fetch('/admin/accounts'+(force?'?refresh=1':''),{cache:'no-store'});
    var d=await r.json();
    if(!r.ok)throw new Error((d.error&&d.error.message)||d.detail||'读取失败');
    var list=d.accounts||[];
    document.getElementById('summary').innerHTML='<div class="summary-item">账号<strong>'+list.length+'</strong></div><div class="summary-item">当前<strong>'+esc(d.active_account||'-')+'</strong></div><div class="summary-item">最后刷新<strong id="lastUpdated">'+new Date().toLocaleTimeString()+'</strong></div>';
    var root=document.getElementById('accounts');
    root.innerHTML=list.length?list.map(accountCard).join(''):'<div class="empty">没有发现账号 JSON。</div>';
    root.querySelectorAll('button[data-account]').forEach(function(el){el.addEventListener('click',function(){selectAccount(el.getAttribute('data-account'));});});
  }catch(e){
    document.getElementById('accounts').innerHTML='<div class="error">刷新失败：'+esc(e.message)+'</div>';
  }finally{
    refreshing=false;btn.disabled=false;btn.textContent='立即刷新';
  }
}

async function selectAccount(name){
  try{
    var r=await fetch('/admin/account/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account:name})});
    var d=await r.json();
    if(!r.ok)throw new Error((d.error&&d.error.message)||d.detail||'切换失败');
    await load(true);
  }catch(e){alert('切换失败：'+e.message);}
}

document.getElementById('refreshBtn').addEventListener('click',function(){load(true);});
load(true);
setInterval(function(){load(true);},REFRESH_MS);
</script>
</main></body></html>\`;
}`;

const backup = `${target}.before-admin-cards`;
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
source = source.slice(0, start) + replacement + source.slice(end);
fs.writeFileSync(target, source);
console.log(`Admin UI upgraded: ${target}`);
console.log('Features: account cards, live quota, remaining progress bar, 15s auto refresh, manual refresh.');
