# runbook — 运维台账(怎么运行)

> agentswe 纪律 3:与四层正交的「怎么运行」truth。启动/构建/部署/数据落点。

## 本地开发

opencli/pi 等全局 CLI、node 走 nvm(非 brew node),PATH:
```
export PATH="$HOME/.nvm/versions/node/v24.22.2/bin:$PATH"
```

构建 + 热重载预览(内容来自 sibling 仓):
```
cd quartz
npx quartz build -d ../../prosopon-source/content --serve   # localhost:8080,改 .ts/.scss 自动重建
npx quartz build -d ../../prosopon-source/content           # 一次性构建到 public/
```
- 改 config/组件/插件后 serve 会重建;偶发缓存不一致时 `rm -rf public .quartz-cache` 再 build。
- 验证用 opencli 开 localhost 看;**注意**:screenshot 可能截在 lazy-load 之前,判断图是否加载以 `img.naturalWidth>0` 为准,别只信截图。

## 仓库关系(三仓)

```
oikos/prosopon/        meta 决策(hypertext-数字花园.md 等)+ aliyun-ops 云运维
prosopon-source/       内容本体(md+图),被下面构建        git@github.com:cjhgo/prosopon-source.git
prosopon-engine/       本仓,代码载体                       git@github.com:cjhgo/prosopon-engine.git
  quartz/              Quartz v4 fork(在此 build)
  skills/              xhs-publish(待)、alt-text(pi-alt 脚本就绪)
```
本地布局三仓平级于 `~/workspace/`,`quartz build -d ../../prosopon-source/content` 依赖此相对关系(不用 submodule)。

## 产出与数据落点

- `quartz/public/` — 构建产物(gitignore)。`public/assets/<hash>.ext` 扁平图;`public/static/assets-manifest.json` 图片台账。
- `quartz/node_modules/` — gitignore。
- `.quartz-cache/` — 构建缓存,可删。

## 部署(prosopon-source 内容 → 公网)

部署经 oikos 的 **aliyun-ops** tool_use(`oikos/prosopon/skills/aliyun-ops/`):
```
# 在 oikos/prosopon/skills/aliyun-ops 下
bin/vps deploy-dir <engine>/quartz/public --domain <子域名>   # 分块传 + nginx vhost(cert-aware)
```
- 源站:阿里云北京 ECS + nginx,已备案域名,泛域名 HTTPS。
- 部署即构建产物整目录上传;备案号已由 SiteFooter 注入页面(deploy 层也有兜底)。

## secrets / 凭证

- engine 无 secrets。
- pi-alt 走本地 pi(modelbest 网关,token 在环境变量/`~/.pi/agent/`,见 skills/alt-text/pi-alt-draft.sh 头部纪要)。
- 云运维凭证在 aliyun-ops(本 repo 外)。

## 升级 upstream Quartz

1. 取新版 jackyzha0/quartz 到临时目录。
2. 覆盖 `quartz/` 下除 owned 命名空间外的文件(custom/、custom.scss 不动)。
3. 手动 3-way merge:`quartz.config.ts`、`quartz.layout.ts`、`components/index.ts`、`plugins/index.ts`、`emitters/assets.ts`(只我们那几行,见 20-design)。
4. `npm install` + 冒烟构建。
