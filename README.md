# prosopon-engine

junhang 数字花园的**定制代码 monorepo**(载体,非本体;内容在 prosopon-source)。

## 布局

- `quartz/` — **Quartz v5.0.0** fork(在此 build)。
- `vendor/og-image/` — 官方 og-image 的本地 fork(Noto CJK fallback;`dist/` 已提交)。
- `skills/` — 发布/工具 skill(如 `xhs-publish/`)。

## 构建(内容来自 sibling 的 prosopon-source)

```
cd quartz && npm install          # 首次/依赖变化
npx quartz build -d ../../prosopon-source/content --serve
```

生产构建(图走 OSS + 裁掉 `_refer`):

```
QUARTZ_PROD=1 ASSET_BASE_URL=https://assets.junhangc.cn npx quartz build -d ../../prosopon-source/content
```

## 定制入口

配置 + 自有件注入在 `quartz/quartz.ts`(通用 entry) + `quartz/sites/<site>/site.ts`(站点 composition)；官方配置在 `quartz/quartz.config.yaml`。
速查:`CUSTOMIZATIONS.md`;完整认知:`docs/`;v4→v5 迁移记录:`docs/50-v5-migration.md`。

## upstream Quartz 基线

vendored from jackyzha0/quartz `v5` @ `ec1d0b4c066e5a7afc7dd81b0a57cc97d20a1dca`(已剥离其 .git)。
升级:替换 `quartz/` 核心后重放 owned 命名空间,见 `docs/30-runbook.md`。
