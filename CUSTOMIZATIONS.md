# CUSTOMIZATIONS — 快速索引（Quartz 5）

> 完整的「定制 Quartz」ctx 知识按 agentswe 四层记在 **[docs/](docs/README.md)**。本文件只留一张速查表。
> 本仓 `quartz/` 是 **jackyzha0/quartz v5.0.0** 的 vendored 副本（`v5` 分支，已剥 upstream `.git`）。
> 迁移方案与冒烟结果：**[docs/50-v5-migration.md](docs/50-v5-migration.md)**。

## 纪律：定制只住 owned 命名空间，不侵入 upstream

| 命名空间 | 承载 |
|---|---|
| `quartz/quartz.ts` | **注入入口**：YAML 配置 + 自有 transformer/emitter push + 布局追加 |
| `quartz/quartz.config.yaml` | 官方插件集 + 天青盘 + zh-CN + `publishAssets: referenced` |
| `quartz/quartz/styles/custom.scss` | 唯一自定义样式入口（只写增量） |
| `quartz/quartz/components/custom/**` | 自定义组件 |
| `quartz/quartz/plugins/custom/**` | 自定义 transformer/emitter |
| `quartz/quartz/static/**` | 站点静态资产（icon / og 兜底 / telescopic lib） |
| `skills/**` | 发布/工具 skill |

**对 upstream 的侵入 = 0。** v4 的三处 merge 点（`components/index.ts`、`plugins/index.ts`、`emitters/assets.ts`）已全部消除。

## 速查：改了什么

| 文件 | 做了什么 | 详见 |
|---|---|---|
| `quartz.config.yaml` | 天青盘(light+dark)、Inter/CJK、zh-CN、`markdownLinkResolution: shortest`、`publishAssets: referenced`、官方插件集(含 `bases-page`) | docs/20 |
| `quartz.ts` | `viewRegistry.register({id:"mouseion"})`；`loadQuartzConfig({ignorePatterns})` + push `FrontmatterDate/MarkdownAlternate/TelescopicText/FlattenLocalAssets` + `AssetManifest/RawMarkdown`；`loadQuartzLayout` 追加 `HomeSections/CollapsibleHeaders/TelescopicTextUI/SiteFooter` + content 页 `MarkdownSourceLink` | docs/20, docs/50 |
| `components/custom/HomeSections.tsx` | 首页按 folder 分段卡片（仅 index），v4 的 5 个 CardList 合并 | docs/20 |
| `components/custom/SiteFooter.tsx` | 页脚去推广 + 备案号 | docs/20 |
| `components/custom/MarkdownSourceLink.tsx` | 「Markdown 源码 ↗」入口（content 页） | docs/20 |
| `components/custom/CollapsibleHeaders.tsx` | Dynalist 可折叠标题（`{+}`/`{-}` 标记） | docs/20 |
| `components/custom/TelescopicText.tsx` + `static/telescopic/` | telescopic 可展开文本 | docs/20 |
| `components/custom/MouseionView.tsx` + `mouseionStyles.ts` | **MOUSEION 综合页自定义 Bases 视图**：书境书架 / 影境胶片夹 / 音境密铺封面墙(名字/歌手优先)；在 `quartz.ts` 里 `viewRegistry.register({id:"mouseion"})` | 内容页 `content/mouseion/` |
| `plugins/custom/flattenAssets.ts` | 图片 → `/assets/<hash>` 扁平化 + `assets-manifest.json`；生产落 `.quartz-cache/assets`（只拷新 hash，deploy 增量同步） | docs/10 §4-5, docs/20 |
| `plugins/custom/frontmatterDate.ts` | 只认 frontmatter date，缺则留白 | docs/10 §6 |
| `plugins/custom/rawMarkdown.ts` | 每页 `<slug>.md` + `llms.txt` / `llms-full.txt` | docs/20 |
| `plugins/custom/mouseionFeed.ts` | 书影音 → `static/mouseion.json`（独立子域站的数据投影；主站仍是 SoT） | — |
| `mouseion-site/`（engine 根） | **MOUSEION 独立全屏站**：`build.py` 读 feed 生成暗色三境画廊；`deploy.sh` 部署到 `mouseion.junhangc.cn` | — |
| `plugins/custom/telescopicText.ts` | ```telescopic 代码块 → 客户端渲染源 | docs/20 |
| `plugins/custom/headAlternate.ts` | `<link rel=alternate type=text/markdown>`（v5 `additionalHead`） | docs/20 |
| `quartz/styles/custom.scss` | 卡片/分区/页脚/CJK 回退 + `text-wrap: pretty` | docs/20 |
| `vendor/og-image/` | 官方 og-image 的本地 fork：Noto Sans CJK SC fallback（修中文 OG 豆腐块）+ 中文「分钟阅读」+ `.quartz-cache/og` 持久缓存（warm build 不再重画） | docs/50 §八 |
| `skills/{xhs-publish,alt-text}/` | 发布 skill 占位 + pi-alt 脚本 | — |

## v5 迁移的注意项（非阻塞）

- **Bases URL**：`观影.base` → `观影.base.html`；要干净 URL 可用 md 内 ` ```base ` 嵌入。
- **og-image 字体源**：`fastly.jsdelivr.net`（`cdn.jsdelivr.net` 本机直连失败）；字体缓存 16MB 在 `.quartz-cache/fonts/`。

## turntrout 拿来（license=CC BY-SA 4.0，保 copyleft-free）

- ✅ `text-wrap: pretty/balance`（纯 CSS 已入）。
- 🧩 alt-text：走本地 pi，脚本在 `skills/alt-text/pi-alt-draft.sh`。
- 🔁 图片防 CLS / 卡片：拿思路自己写。
- ❌ punctilio/smallcaps/dropcap（英文专用）、测试 CI 军备（过度工程）。
