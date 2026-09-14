#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_DIR="$ROOT_DIR/runtime"
UPSTREAM_REPO="https://github.com/LeeFeee/postman-postbot-gateway.git"
UPSTREAM_COMMIT="c82a5baa8f7fcc971f3e315911dbf1a60dce748a"

command -v git >/dev/null 2>&1 || { echo "缺少 git"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "缺少 Node.js 20+"; exit 1; }

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "需要 Node.js 20+，当前版本: $(node -v)"
  exit 1
fi

if [ ! -d "$RUNTIME_DIR/.git" ]; then
  if [ -e "$RUNTIME_DIR" ] && [ "$(ls -A "$RUNTIME_DIR" 2>/dev/null || true)" ]; then
    echo "runtime 目录已存在且非空，请先移走: $RUNTIME_DIR"
    exit 1
  fi
  git clone "$UPSTREAM_REPO" "$RUNTIME_DIR"
fi

git -C "$RUNTIME_DIR" fetch origin "$UPSTREAM_COMMIT" --depth=1
git -C "$RUNTIME_DIR" checkout --detach "$UPSTREAM_COMMIT"

cp "$ROOT_DIR/apply-multi-account-patch.js" "$RUNTIME_DIR/apply-multi-account-patch.js"
cp "$ROOT_DIR/fix-admin-ui.js" "$RUNTIME_DIR/fix-admin-ui.js"
(
  cd "$RUNTIME_DIR"
  node apply-multi-account-patch.js
  node fix-admin-ui.js
)
node "$ROOT_DIR/upgrade-admin-ui.js" "$RUNTIME_DIR/postman-gateway-macos.js"
node --check "$RUNTIME_DIR/postman-gateway-macos.js"

mkdir -p "$ROOT_DIR/accounts" "$ROOT_DIR/state"

if [ -d "$RUNTIME_DIR/.git/info" ]; then
  grep -qxF '/accounts/' "$RUNTIME_DIR/.git/info/exclude" 2>/dev/null || echo '/accounts/' >> "$RUNTIME_DIR/.git/info/exclude"
fi

if [ ! -f "$ROOT_DIR/.env" ]; then
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

echo
echo "✅ 安装完成"
echo "上游版本: postman-postbot-gateway 0.2.9 @ $UPSTREAM_COMMIT"
echo "运行目录: $RUNTIME_DIR"
echo "账号目录: $ROOT_DIR/accounts"
echo
echo "下一步："
echo "1. 把你已有的账号 JSON 放进 $ROOT_DIR/accounts/（不要提交到 Git）"
echo "2. 编辑 $ROOT_DIR/.env，填入 POSTMAN_WORKSPACE_ID"
echo "3. 直接运行: cd $RUNTIME_DIR && POSTMAN_ACCOUNTS_DIR=$ROOT_DIR/accounts POSTMAN_WORKSPACE_ID=<workspace-id> node postman-gateway-macos.js"
echo "   或 Docker: cd $ROOT_DIR && docker compose up -d --build"
echo "4. 管理页: http://127.0.0.1:9887/admin"
