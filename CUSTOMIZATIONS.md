# CUSTOMIZATIONS — 快速索引

> 完整的「定制 Quartz」ctx 知识按 agentswe 四层记在 **[docs/](docs/README.md)**。本文件只留一张速查表。

本仓 `quartz/` 是 **jackyzha0/quartz v4.5.2 @ `d25a6ea`** 的 vendored 副本(已剥 upstream .git)。

## 纪律:定制只住 owned 命名空间,不原地改 upstream

`quartz.config.ts` · `quartz.layout.ts` · `quartz/quartz/styles/custom.scss` · `quartz/quartz/components/custom/**` · `quartz/quartz/plugins/custom/**` · `skills/**`。
例外(升级 upstream 要手动 merge):`components/index.ts`、`plugins/index.ts`、`emitters/assets.ts`(加了 MANAGED_SRCS 跳过)。

## 速查:改了什么

| 文件 | 做了什么 | 详见 |
|---|---|---|
| `quartz.config.ts` | 天青·文人盘(light+dark)+ Inter/CJK 回退;插件链加 FlattenLocalAssets/AssetManifest/FrontmatterDate | docs/20 |
| `quartz.layout.ts` | 首页按 folder 分段(历史/思考/随笔);footer 换 SiteFooter | docs/20 |
| `styles/custom.scss` | CJK 字体回退 + text-wrap + 卡片/分区/页脚样式 | docs/20 |
| `components/custom/CardList.tsx` | 首页卡片网格,读 allFiles 按 folder 过滤(无 type) | docs/20 |
| `components/custom/SiteFooter.tsx` | 页脚去推广 + 备案号 | docs/20 |
| `plugins/custom/flattenAssets.ts` | 图片资产扁平化 `/assets/<hash>` + manifest(治碎图+slug耦合+僵尸) | docs/10 §4-5, docs/20 |
| `plugins/custom/frontmatterDate.ts` | 只认 frontmatter date,缺则留白(不伪造) | docs/10 §6, docs/20 |
| `components/index.ts` / `plugins/index.ts` | 注册自定义件(唯二要 merge 的 upstream 文件) | docs/20 |
| `emitters/assets.ts` | 跳过已扁平化的图(MANAGED_SRCS) | docs/20 |
| `plugins/custom/rawMarkdown.ts` | emitter `RawMarkdown`:每页 `<slug>.md` + `llms-full.txt` + `llms.txt`(标准索引) | docs/20 |
| `plugins/custom/telescopicText.ts` + `components/custom/TelescopicText.tsx` + `static/telescopic/` | telescopic 可展开文本(` ```telescopic ` 代码块) | docs/20 |
| `components/custom/CollapsibleHeaders.tsx` | Dynalist 可折叠标题 | docs/20 |
| `util/og.tsx` | og-image 中文 NO GLYPH 修复:getSatoriFonts 末尾追加 Noto Sans CJK SC fallback(首次下载缓存 .quartz-cache/fonts) | docs/10 §9 |
| `components/Head.tsx` | 加 `<link rel=alternate type=text/markdown>` 指向每页 `<slug>.md`(markdown 源显式入口) | docs/20 |
| `skills/{xhs-publish,alt-text}/` | 发布 skill 占位 + pi-alt 脚本(就绪待 run) | — |

## turntrout 拿来(license=CC BY-SA 4.0,保 copyleft-free)

- ✅ `text-wrap: pretty/balance`(纯 CSS 已入)。
- 🧩 alt-text:走本地 pi(非 OpenRouter),脚本在 `skills/alt-text/pi-alt-draft.sh`。
- 🔁 图片防 CLS / 卡片:拿思路自己写。
- ❌ punctilio/smallcaps/dropcap(英文专用)、测试 CI 军备(过度工程)。
