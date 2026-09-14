# Postman Postbot Gateway 多账号手动管理版

这是基于 `LeeFeee/postman-postbot-gateway` v0.2.9 的补丁式增强版本。

增加的功能：

- 扫描 `accounts/*.json` 中的多个 Postman 登录 JSON。
- 分别读取每个账号的模型配置和 `usage` 状态。
- 提供 `/admin` Web 管理页。
- 提供手动账号切换；切换时会清空网关会话缓存，避免旧账号 conversationId 与新账号混用。
- 保留原有 OpenAI / Anthropic / Responses 兼容接口。
- 支持 Docker Compose 长期运行。

本版本**不包含自动账号轮换，也不会在一个账号额度耗尽后自动消耗其他账号额度**。

## 1. 下载

```bash
git clone -b postman-multi-account --single-branch https://github.com/FJ-double/multi-agent.git
cd multi-agent/postman-postbot-gateway
bash setup.sh
```

`setup.sh` 会拉取并固定到上游提交：

```text
c82a5baa8f7fcc971f3e315911dbf1a60dce748a
```

对应上游 `postman-postbot-gateway 0.2.9`，然后自动应用多账号补丁并执行 `node --check`。

## 2. 放入账号 JSON

把你已有的账号 JSON 放到：

```text
postman-postbot-gateway/accounts/
```

例如：

```text
accounts/
├── account-a.json
├── account-b.json
└── account-c.json
```

支持两种格式：

1. Postman 原始 `userPartitionData.json` 结构。
2. 简化 JSON：包含 `access_token` 或 `accessToken`，以及可选 `teamId/userId`。

账号 JSON 已被 `.gitignore` 排除，**不要把登录令牌提交到 GitHub**。

## 3. 配置 Workspace

```bash
cp .env.example .env
nano .env
```

至少填写：

```env
POSTMAN_WORKSPACE_ID=你的-workspace-uuid
```

如果希望固定启动账号：

```env
POSTMAN_ACCOUNT=account-a.json
```

留空则按文件名排序使用第一个账号。

## 4. Docker 长期运行

先执行过：

```bash
bash setup.sh
```

然后：

```bash
docker compose up -d --build
```

查看状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f --tail=100
```

默认宿主机只监听：

```text
127.0.0.1:9887
```

不会直接暴露公网。

## 5. Web 管理页

服务器本机：

```text
http://127.0.0.1:9887/admin
```

如果你从 Windows 电脑访问服务器，建议 SSH 隧道：

```bash
ssh -L 9887:127.0.0.1:9887 ubuntu@你的服务器IP
```

然后电脑浏览器打开：

```text
http://127.0.0.1:9887/admin
```

管理页会显示：

- 账号 JSON 文件名
- 当前选中的账号
- 账号是否能正常读取配置
- 模型数量
- 默认模型
- Postman 返回的 `usage` 信息
- 手动切换按钮

页面不会显示 access token。

## 6. API

账号状态：

```bash
curl -s http://127.0.0.1:9887/admin/accounts
```

强制刷新每个账号的配置 / usage：

```bash
curl -s 'http://127.0.0.1:9887/admin/accounts?refresh=1'
```

手动切换：

```bash
curl -s -X POST http://127.0.0.1:9887/admin/account/select \
  -H 'Content-Type: application/json' \
  -d '{"account":"account-b.json"}'
```

切换后现有会话缓存会被清空，新的请求使用新账号。

原项目接口继续保留：

```text
GET  /
GET  /v1/models
POST /v1/chat/completions
POST /v1/messages
POST /v1/messages/count_tokens
POST /v1/responses
```

## 7. 非 Docker 运行

```bash
cd runtime
POSTMAN_ACCOUNTS_DIR=../accounts \
POSTMAN_WORKSPACE_ID='你的-workspace-uuid' \
node postman-gateway-macos.js
```

或指定账号：

```bash
node postman-gateway-macos.js \
  --accounts-dir ../accounts \
  --account account-a.json \
  --workspace-id '你的-workspace-uuid'
```

## 安全说明

Postman 登录 JSON 内包含敏感登录凭据。服务默认只监听本机，建议保持 `127.0.0.1:9887`，通过 SSH 隧道查看管理页。若以后必须通过公网访问，应在 Caddy/Nginx 层增加真正的鉴权和 HTTPS，不要直接公开 9887。
