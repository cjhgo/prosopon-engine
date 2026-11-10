# runbook — 运维台账(怎么运行)

> agentswe 纪律 3:与四层正交的「怎么运行」truth。启动/构建/部署/数据落点。

## 多站总览

| 站       | 内容                               | 配置 / profile                                         | 产物                               | 发布                                         |
| -------- | ---------------------------------- | ------------------------------------------------------ | ---------------------------------- | -------------------------------------------- |
| prosopon | `prosopon-source/content/`         | `quartz.config.yaml` + `sites/prosopon/site.ts`        | ECS nginx + `assets.junhangc.cn`   | `prosopon-source/scripts/deploy.sh`          |
| aesvibe  | `prosopon-source/aesvibe/content/` | `aesvibe/quartz.config.yaml` + `sites/aesvibe/site.ts` | `aesvibe-fun`（香港，HTML+图同桶） | `prosopon-source/aesvibe/scripts/publish.sh` |

`QUARTZ_SITE` 选 profile，`QUARTZ_CONFIG` 选 YAML，`QUARTZ_CACHE_DIR` 选每站 asset cache。

## 本地开发

opencli/pi 等全局 CLI、node 走 nvm(非 brew node),PATH:

```
export PATH="$HOME/.nvm/versions/node/v24.22.2/bin:$PATH"
```

首次/依赖变化后装 v5 依赖（官方插件已作为 npm 依赖，无需 `plugin install`）:

```
cd quartz && npm install
```

`vendor/og-image`（本地 fork）的 `dist/` 已提交，正常构建不需要动；只在改它的 `src/` 后重建：

```
cd vendor/og-image && npm install && npm run build
```

构建 + 热重载预览(内容来自 sibling 仓):

```
cd quartz
npx quartz build -d ../../prosopon-source/content --serve   # localhost:8080,改 .ts/.scss 自动重建
npx quartz build -d ../../prosopon-source/content           # 一次性构建到 public/
```

- 改 config/组件/插件后 serve 会重建。`.quartz-cache` 是**有意保留的持久缓存**（OG/字体/扁平图），不要每次删；只有需要冷重建/清污染时才 `rm -rf public .quartz-cache`。
- 验证用 opencli 开 localhost 看;**注意**:screenshot 可能截在 lazy-load 之前,判断图是否加载以 `img.naturalWidth>0` 为准,别只信截图。

## 第二站 aesvibe（香港 OSS，HTML+图同桶）

配置在 `prosopon-source/aesvibe/quartz.config.yaml`；composition 在 `quartz/sites/aesvibe/site.ts`。

```bash
cd ../../prosopon-source/aesvibe
scripts/preview.sh     # localhost:8099；预览不扁平化，图走 per-md 相对路径
scripts/publish.sh     # build + postbuild + oss sync-site → www.aesvibe.fun
```

手动等价：

```bash
cd quartz
QUARTZ_SITE=aesvibe \
QUARTZ_CONFIG=../../prosopon-source/aesvibe/quartz.config.yaml \
QUARTZ_CACHE_DIR=../../prosopon-source/aesvibe/.quartz-cache \
FLATTEN_ASSETS=1 \
npx quartz build -d ../../prosopon-source/aesvibe/content -o ../../prosopon-source/aesvibe/public
python3 ../../prosopon-source/aesvibe/scripts/postbuild.py ../../prosopon-source/aesvibe/public
../../oikos/prosopon/skills/aliyun-ops/bin/oss sync-site ../../prosopon-source/aesvibe/public \
  --bucket aesvibe-fun --region cn-hongkong
```

- `ASSET_BASE_URL` 必须 **unset**：aesvibe 的图走 `public/assets/<hash>`，和 HTML 同桶（`aesvibe-fun` / `www.aesvibe.fun`）。
- `QUARTZ_CACHE_DIR` 必须设：否则 asset-registry / manifest 会混入主站。
- `postbuild.py` 内部链接补 `.html`（OSS 没有 nginx `$uri.html` 回退）、注入 `noindex`、写 `robots.txt`、删 `assets-manifest.json`。

## 仓库关系(三仓)

```
oikos/prosopon/        meta 决策(hypertext-数字花园.md 等)+ aliyun-ops 云运维
prosopon-source/       内容本体(md+图),被下面构建        git@github.com:cjhgo/prosopon-source.git
prosopon-engine/       本仓,代码载体                       git@github.com:cjhgo/prosopon-engine.git
  quartz/              Quartz v5 fork(在此 build)
  skills/              xhs-publish(待)、alt-text(pi-alt 脚本就绪)
```

本地布局三仓平级于 `~/workspace/`,`quartz build -d ../../prosopon-source/content` 依赖此相对关系(不用 submodule)。

## 产出与数据落点

- `quartz/public/` — 构建产物(gitignore)。预览时 `public/assets/<hash>.ext` 是本地扁平图；生产构建把 assets 放进 `.quartz-cache/assets`，`public/assets` 不再落盘。
- `quartz/public/static/assets-manifest.json` — 图片台账。
- `quartz/node_modules/` — gitignore。
- `.quartz-cache/` — **持久构建缓存**：`assets/`（内容 hash 扁平图，生产源）、`og/`（OG webp）、`fonts/`（CJK OTF）、`mouseion-dist/`（子域站产物）。默认保留以保持 warm build / 增量 OSS。
- `prosopon-source/aesvibe/public/` — 第二站产物（gitignore）；HTML + 扁平图同目录。
- `prosopon-source/aesvibe/.quartz-cache/` — 第二站独立 asset-registry（`QUARTZ_CACHE_DIR`），不与主站混。

## 部署(prosopon-source 内容 → 公网)

部署经 `prosopon-source/scripts/deploy.sh`（内部用 oikos 的 aliyun-ops）：

```
cd prosopon-source && scripts/deploy.sh
# 1) Quartz build + static/mouseion.json + aestic-site/build.py → public/aestic/
# 2) .quartz-cache/assets → OSS (ossutil --ignore-existing，只传新 hash)
# 3) mouseion-site/build.py → vps deploy-dir mouseion.junhangc.cn + use-cert
# 4) public/ → vps deploy-dir prosopon.junhangc.cn
```

也可单独手动：

```
# 在 oikos/prosopon/skills/aliyun-ops 下
bin/vps deploy-dir <engine>/quartz/public --domain prosopon.junhangc.cn
bin/vps deploy-dir <engine>/.quartz-cache/mouseion-dist --domain mouseion.junhangc.cn
bin/vps use-cert --domain mouseion.junhangc.cn   # 幂等：证书未变会 skip
```

- 源站:阿里云北京 ECS + nginx,已备案域名,泛域名 HTTPS。
- 备案号由 SiteFooter / MOUSEION footer 悬挂；deploy 层也有兜底。
- 第二站 aesvibe：`cd prosopon-source/aesvibe && scripts/publish.sh` → `oss sync-site` 到 `aesvibe-fun`（香港）；无备案、无 ECS，HTML+图同桶。

## secrets / 凭证

- engine 无 secrets。
- pi-alt 走本地 pi(modelbest 网关,token 在环境变量/`~/.pi/agent/`,见 skills/alt-text/pi-alt-draft.sh 头部纪要)。
- 云运维凭证在 aliyun-ops(本 repo 外)。

## 升级 upstream Quartz（v5）

> 对 upstream 的补丁 = 0（见 20-design）。升级只替换核心，不动 owned 命名空间。

1. 取新版 `jackyzha0/quartz` 的 `v5` 分支到临时目录。
2. 备份 owned：`quartz/quartz.ts`、`quartz/sites/`、`quartz/quartz.config.yaml`、`quartz/quartz/{components,plugins}/custom/`、`quartz/quartz/styles/custom.scss`、`quartz/quartz/static/`。
3. 用新版替换 `quartz/`（package root），再放回 owned。
4. `npm install` + 冒烟构建（见 `50-v5-migration.md` §八 的验证清单）。
5. 若 v5 上游改了 `loadQuartzConfig/loadQuartzLayout` 的签名，改 `quartz.ts` 的通用 entry + 各 `sites/*/site.ts` 的 profile 实现。
