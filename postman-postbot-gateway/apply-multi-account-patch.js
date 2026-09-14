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
if (source.includes('POSTMAN_ACCOUNTS_DIR') && source.includes('/admin/accounts')) {
  console.log('Multi-account patch is already applied.');
  process.exit(0);
}

function replaceOnce(label, before, after) {
  const index = source.indexOf(before);
  if (index === -1) {
    throw new Error(`Patch failed at ${label}: expected upstream block was not found. This patch targets postman-postbot-gateway v0.2.9.`);
  }
  if (source.indexOf(before, index + before.length) !== -1) {
    throw new Error(`Patch failed at ${label}: upstream block matched more than once.`);
  }
  source = source.slice(0, index) + after + source.slice(index + before.length);
}

replaceOnce(
  'CLI arguments',
  `const postmanDataDirArg = getArgValue('--postman-data-dir', '-d');\nconst workspaceIdArg = getArgValue('--workspace-id', '-w');`,
  `const postmanDataDirArg = getArgValue('--postman-data-dir', '-d');\nconst workspaceIdArg = getArgValue('--workspace-id', '-w');\nconst accountsDirArg = getArgValue('--accounts-dir', '-a');\nconst accountArg = getArgValue('--account', '-A');`
);

replaceOnce(
  'account loader',
  `const POSTMAN_DATA_DIR = postmanDataDirArg || process.env.POSTMAN_DATA_DIR || getDefaultPostmanDataDir();\nconst STATE_FILE = process.env.POSTMAN_GATEWAY_STATE_FILE || path.join(os.homedir(), '.postman-postbot-gateway', 'sessions.json');\n\nfunction getPostmanAuthInfo() {\n  const partitionFile = path.join(POSTMAN_DATA_DIR, 'storage', 'userPartitionData.json');\n  if (!fs.existsSync(partitionFile)) {\n    throw new Error(\`Postman 登录信息文件未找到: \${partitionFile}\`);\n  }\n  const data = JSON.parse(fs.readFileSync(partitionFile, 'utf8'));\n  const activePartition = data.v8PartitionsNamespaceMeta?.users?.activePartition;\n  const user = activePartition && data.v8Partitions?.[activePartition];\n  if (!user) throw new Error('未找到 Postman 活跃用户，请先登录 Postman');\n  const auth = JSON.parse(user.meta?.raw || '{}').auth;\n  if (!auth?.access_token) throw new Error('Postman 登录令牌不存在，请重新登录 Postman');\n  return {\n    accessToken: auth.access_token,\n    teamId: user.context?.teamId,\n    userId: user.context?.userId\n  };\n}`,
  `const POSTMAN_DATA_DIR = postmanDataDirArg || process.env.POSTMAN_DATA_DIR || getDefaultPostmanDataDir();\nconst ACCOUNTS_DIR = accountsDirArg || process.env.POSTMAN_ACCOUNTS_DIR || path.join(process.cwd(), 'accounts');\nconst STATE_FILE = process.env.POSTMAN_GATEWAY_STATE_FILE || path.join(os.homedir(), '.postman-postbot-gateway', 'sessions.json');\nlet activeAccountName = accountArg || process.env.POSTMAN_ACCOUNT || null;\n\nfunction parsePostmanAuthData(data, sourceLabel) {\n  if (data && typeof data === 'object' && (data.accessToken || data.access_token)) {\n    const accessToken = data.accessToken || data.access_token;\n    if (!accessToken) throw new Error(\`账号文件缺少 access token: \${sourceLabel}\`);\n    return {\n      accessToken,\n      teamId: data.teamId || data.team_id || null,\n      userId: data.userId || data.user_id || null\n    };\n  }\n\n  const activePartition = data?.v8PartitionsNamespaceMeta?.users?.activePartition;\n  const user = activePartition && data?.v8Partitions?.[activePartition];\n  if (!user) throw new Error(\`未找到 Postman 活跃用户: \${sourceLabel}\`);\n  const auth = JSON.parse(user.meta?.raw || '{}').auth;\n  if (!auth?.access_token) throw new Error(\`Postman 登录令牌不存在: \${sourceLabel}\`);\n  return {\n    accessToken: auth.access_token,\n    teamId: user.context?.teamId || null,\n    userId: user.context?.userId || null\n  };\n}\n\nfunction listAccountFiles() {\n  if (!fs.existsSync(ACCOUNTS_DIR)) return [];\n  return fs.readdirSync(ACCOUNTS_DIR, { withFileTypes: true })\n    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))\n    .map((entry) => entry.name)\n    .sort((a, b) => a.localeCompare(b));\n}\n\nfunction getPostmanAuthInfo(accountName = null) {\n  const accountFiles = listAccountFiles();\n  if (accountFiles.length) {\n    const requested = accountName || activeAccountName || accountFiles[0];\n    if (!accountFiles.includes(requested)) {\n      throw new Error(\`账号不存在: \${requested}。可用账号: \${accountFiles.join(', ')}\`);\n    }\n    const accountFile = path.join(ACCOUNTS_DIR, requested);\n    const data = JSON.parse(fs.readFileSync(accountFile, 'utf8'));\n    const auth = parsePostmanAuthData(data, accountFile);\n    if (!activeAccountName) activeAccountName = requested;\n    return { ...auth, accountName: requested, sourcePath: accountFile };\n  }\n\n  const partitionFile = path.join(POSTMAN_DATA_DIR, 'storage', 'userPartitionData.json');\n  if (!fs.existsSync(partitionFile)) {\n    throw new Error(\`Postman 登录信息文件未找到: \${partitionFile}\`);\n  }\n  const data = JSON.parse(fs.readFileSync(partitionFile, 'utf8'));\n  const auth = parsePostmanAuthData(data, partitionFile);\n  return { ...auth, accountName: 'postman-default', sourcePath: partitionFile };\n}`
);

replaceOnce(
  'per-account config cache',
  `let configCache = null;\nasync function getPostmanConfig(force = false) {\n  if (!force && configCache && configCache.expiresAt > Date.now()) return configCache.value;\n  const { accessToken } = getPostmanAuthInfo();\n  const response = await fetch(\`\${POSTMAN_GATEWAY_URL}/config?platform=\${PLATFORM}\`, {\n    headers: postmanHeaders(accessToken)\n  });\n  const text = await response.text();\n  if (!response.ok) throw new GatewayError(\`Postman 配置接口返回 HTTP \${response.status}: \${text.slice(0, 300)}\`, 502);\n  const parsed = JSON.parse(text);\n  const value = parsed.data || parsed;\n  if (value.result && value.result !== 'success') throw new GatewayError(\`Postman 配置接口失败: \${value.result}\`, 502);\n  configCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };\n  return value;\n}`,
  `let configCache = new Map();\nasync function getPostmanConfig(force = false, accountName = null) {\n  const authInfo = getPostmanAuthInfo(accountName);\n  const cacheKey = authInfo.accountName || 'postman-default';\n  const cached = configCache.get(cacheKey);\n  if (!force && cached && cached.expiresAt > Date.now()) return cached.value;\n  const response = await fetch(\`\${POSTMAN_GATEWAY_URL}/config?platform=\${PLATFORM}\`, {\n    headers: postmanHeaders(authInfo.accessToken)\n  });\n  const text = await response.text();\n  if (!response.ok) throw new GatewayError(\`Postman 配置接口返回 HTTP \${response.status}: \${text.slice(0, 300)}\`, 502);\n  const parsed = JSON.parse(text);\n  const value = parsed.data || parsed;\n  if (value.result && value.result !== 'success') throw new GatewayError(\`Postman 配置接口失败: \${value.result}\`, 502);\n  configCache.set(cacheKey, { value, expiresAt: Date.now() + 5 * 60 * 1000 });\n  return value;\n}\n\nasync function getAccountStatuses(force = false) {\n  const files = listAccountFiles();\n  const names = files.length ? files : ['postman-default'];\n  const statuses = [];\n  for (const name of names) {\n    try {\n      const auth = getPostmanAuthInfo(files.length ? name : null);\n      const config = await getPostmanConfig(force, files.length ? name : null);\n      statuses.push({\n        name: auth.accountName,\n        selected: auth.accountName === getPostmanAuthInfo().accountName,\n        user_id: auth.userId || null,\n        team_id: auth.teamId || null,\n        ok: true,\n        model_count: (config.models || []).length,\n        default_model: config.defaultModel || null,\n        usage: config.usage || null\n      });\n    } catch (error) {\n      statuses.push({ name, selected: name === activeAccountName, ok: false, error: error.message });\n    }\n  }\n  return statuses;\n}\n\nfunction selectPostmanAccount(name) {\n  const files = listAccountFiles();\n  if (!files.length) throw new GatewayError('未配置 accounts 目录，当前只能使用 Postman 默认登录账号', 400);\n  if (!files.includes(name)) throw new GatewayError(\`账号不存在: \${name}\`, 404);\n  getPostmanAuthInfo(name);\n  activeAccountName = name;\n  configCache.clear();\n  if (typeof sessionStore !== 'undefined') {\n    sessionStore.states.clear();\n    sessionStore.aliases.clear();\n    sessionStore.toolCalls.clear();\n    sessionStore.responses.clear();\n    sessionStore.persist();\n  }\n  return activeAccountName;\n}`
);

replaceOnce(
  'HTML helper',
  `function json(res, status, value) {\n  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });\n  res.end(JSON.stringify(value));\n}`,
  `function json(res, status, value) {\n  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });\n  res.end(JSON.stringify(value));\n}\n\nfunction html(res, status, value) {\n  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });\n  res.end(value);\n}\n\nfunction accountAdminPage() {\n  return \`<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Postman Gateway Accounts</title>\n<style>\nbody{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f1115;color:#e7e9ee;margin:0;padding:28px}\nmain{max-width:980px;margin:auto}.card{background:#181b22;border:1px solid #2a2f3a;border-radius:12px;padding:18px;margin:12px 0}\nh1{font-size:22px}.muted{color:#9aa3b2;font-size:13px}button{background:#2f6feb;color:#fff;border:0;border-radius:8px;padding:8px 12px;cursor:pointer}button[disabled]{opacity:.5;cursor:default}\npre{white-space:pre-wrap;word-break:break-word;background:#11141a;padding:10px;border-radius:8px}.ok{color:#57d38c}.bad{color:#ff7b72}\n</style>\n</head>\n<body><main>\n<h1>Postman Gateway 多账号管理</h1>\n<p class="muted">仅提供账号状态查看和手动切换，不自动轮换账号。默认服务仅绑定 127.0.0.1。</p>\n<div id="app">加载中...</div>\n<script>\nasync function load(force=false){\n  const r=await fetch('/admin/accounts'+(force?'?refresh=1':''));\n  const d=await r.json();\n  const root=document.getElementById('app');\n  root.innerHTML=(d.accounts||[]).map(a=>\`<div class="card">\n    <div><strong>\${esc(a.name)}</strong> \${a.selected?'✅ 当前账号':''} \${a.ok?'<span class="ok">可用</span>':'<span class="bad">不可用</span>'}</div>\n    <div class="muted">models: \${a.model_count??'-'} | default: \${esc(a.default_model||'-')} | user: \${esc(a.user_id||'-')}</div>\n    <pre>\${esc(JSON.stringify(a.usage??a.error??null,null,2))}</pre>\n    <button \${a.selected||!a.ok?'disabled':''} onclick="selectAccount('\\\${js(a.name)}')">切换到此账号</button>\n  </div>\`).join('') || '<div class="card">没有发现账号 JSON。</div>';\n}\nasync function selectAccount(name){\n  const r=await fetch('/admin/account/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account:name})});\n  const d=await r.json();\n  if(!r.ok){alert(d.error?.message||d.detail||'切换失败');return;}\n  await load(true);\n}\nfunction esc(v){return String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}\nfunction js(v){return String(v).replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'");}\nload();\n</script>\n</main></body></html>\`;
}`
);

replaceOnce(
  'admin routes',
  `      if (req.method === 'GET' && route === '/') {\n        return json(res, 200, {`,
  `      if (req.method === 'GET' && route === '/admin') {\n        return html(res, 200, accountAdminPage());\n      }\n\n      if (req.method === 'GET' && route === '/admin/accounts') {\n        const url = new URL(req.url, 'http://localhost');\n        const accounts = await getAccountStatuses(url.searchParams.get('refresh') === '1');\n        return json(res, 200, {\n          active_account: getPostmanAuthInfo().accountName,\n          accounts_dir: listAccountFiles().length ? ACCOUNTS_DIR : null,\n          accounts\n        });\n      }\n\n      if (req.method === 'POST' && route === '/admin/account/select') {\n        const payload = await readJsonBody(req);\n        if (!payload.account || typeof payload.account !== 'string') {\n          throw new GatewayError('请求体需要 account 字段', 400, 'invalid_account');\n        }\n        const selected = selectPostmanAccount(payload.account);\n        return json(res, 200, { success: true, active_account: selected });\n      }\n\n      if (req.method === 'GET' && route === '/') {\n        return json(res, 200, {`
);

replaceOnce(
  'root status account fields',
  `          postmanVersion: APP_VERSION,\n          workspaceDetected: Boolean(discoverWorkspaceId()),`,
  `          postmanVersion: APP_VERSION,\n          workspaceDetected: Boolean(discoverWorkspaceId()),\n          activeAccount: getPostmanAuthInfo().accountName,\n          accountCount: Math.max(1, listAccountFiles().length),`
);

replaceOnce(
  'help options',
  `  -d, --postman-data-dir <path> Postman 用户数据目录\n  -w, --workspace-id <uuid>     Postman 工作区；默认从客户端日志自动识别`,
  `  -d, --postman-data-dir <path> Postman 用户数据目录\n  -w, --workspace-id <uuid>     Postman 工作区；默认从客户端日志自动识别\n  -a, --accounts-dir <path>     多账号 JSON 目录；默认 ./accounts\n  -A, --account <file.json>     启动时选择指定账号文件`
);

replaceOnce(
  'help endpoints',
  `  GET  /                         健康状态\n  GET  /v1/models                真实可用模型`,
  `  GET  /                         健康状态\n  GET  /admin                    多账号状态与手动切换页面\n  GET  /admin/accounts           多账号状态 JSON\n  POST /admin/account/select     手动切换账号\n  GET  /v1/models                真实可用模型`
);

replaceOnce(
  'startup account info',
  `    console.log(\` 登录信息: \${accountReady ? '✅ 已读取（令牌不会输出）' : '❌ 未读取'}\`);\n    console.log(\` 工作区: \${discoverWorkspaceId() ? '✅ 已自动识别' : '❌ 未识别，请传入 --workspace-id'}\`);`,
  `    console.log(\` 登录信息: \${accountReady ? '✅ 已读取（令牌不会输出）' : '❌ 未读取'}\`);\n    if (accountReady) {\n      const auth = getPostmanAuthInfo();\n      console.log(\` 当前账号: ✅ \${auth.accountName}\`);\n      console.log(\` 账号目录: \${listAccountFiles().length ? \`✅ \${ACCOUNTS_DIR}（\${listAccountFiles().length} 个 JSON）\` : '未启用，使用 Postman 默认登录文件'}\`);\n    }\n    console.log(\` 工作区: \${discoverWorkspaceId() ? '✅ 已自动识别' : '❌ 未识别，请传入 --workspace-id'}\`);`
);

const backup = `${target}.before-multi-account`;
if (!fs.existsSync(backup)) fs.copyFileSync(target, backup);
fs.writeFileSync(target, source);
console.log(`Patched: ${target}`);
console.log(`Backup:  ${backup}`);
console.log('Features: accounts/*.json scan, quota/status view, manual account switching, /admin Web UI.');
