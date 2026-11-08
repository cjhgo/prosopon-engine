# v5 迁移 — 从 Quartz 4.5.2 到 Quartz 5.0.0（已落地 `v5` 分支）

> **状态：已冒烟验证（2026-11-09，`v5` 分支）。** 路径 B（fork 内注入）按方案落地；核心定制、生产裁剪、Bases 全部真机构建通过。
> 目的：拿到 **Obsidian Bases**（`cinematheque` / `antilibrary` 那类数据库视图）与 v5 插件生态，同时不丢本仓的定制。
> 上游事实：`jackyzha0/quartz` 已有 `v5` 分支与 `v5.0.0` tag；官方迁移指南 `docs/getting-started/migrating`；Bases 由 `@quartz-community/bases-page` 提供（MIT，v5 依赖里已自带）。

---

## 零、一句话结论

**把 `quartz/`（package root）换成 v5，自定义件继续住 fork 内（`components/custom`、`plugins/custom`），通过 `quartz.ts` 的 TS override + 配置对象注入接回管线。**
不把 8 个自定义件改造成外部插件包（v5 的外部插件模型对「一个包多组件、放置到不同 slot」不友好）；也不留在 v4 回移 bases-page（那会养一个孤儿 fork）。

---

## 一、v5 到底变了什么（影响本仓的）

| 维度 | v4（现状） | v5（目标） |
|---|---|---|
| 配置 | `quartz.config.ts` + `quartz.layout.ts`（TS） | `quartz.config.yaml`（YAML）+ `quartz.ts`（TS override） |
| 组件 | 核心 `components/` 里，改源码 | 多数变成社区插件（npm 依赖），装进 `.quartz/plugins/`；`quartz.ts` 可 override |
| 布局 | `quartz.layout.ts` 数组 | 每个插件声明 `layout.position/priority`；`quartz.ts` 可 `loadQuartzLayout(overrides)` |
| 内置 | `Plugin.FrontMatter()` 等 | `configuration.frontmatter/links/drafts/contentIndex` 内置；插件从 npm 装 |
| 页面类型 | 无 | content / folder / tag / 404 / canvas / **bases** 分派 |
| 图片 | 手改 `emitters/assets.ts` 跳过已接管图 | `configuration.publishAssets: "referenced"` 内置选项 |
| URL | 保留大小写 | **统一小写 + 连字符**（中文不受影响；英文文件名会变） |
| 插件安装 | 无 | `npm install` 已带官方插件；git 插件才需 `npx quartz plugin install` |

已核事实：
- `quartz/package.json` 的 dependencies 已包含全部官方插件（含 `@quartz-community/bases-page`），所以**走 npm 路径不需要 `plugin install`**。
- `-d/--directory` 仍指「内容目录」（`args.js` 原文：directory to look for content files），`prosopon-source/scripts/{preview,deploy}.sh` 的 `-d ../../prosopon-source/content` **无需改**。
- `zh-CN` locale 存在。
- 本机 Node v24.22.2，满足 v5 的 `>=22`。

---

## 二、三条路与裁决

| 路 | 做法 | 裁决 |
|---|---|---|
| **A. 自定义件 → 外部插件包** | 把 8 个件打包成 npm/git 插件，走 `.quartz/plugins` | ❌ 不选。v5 一个包只能注册**一个**布局组件名；我们要把 5 个自定义组件放到 3 个不同 slot，会被迫拆成多个包 + 构建链 |
| **B. fork 内注入（推荐）** | 自定义代码仍在 `quartz/quartz/{components,plugins}/custom`；`quartz.ts` 里 `loadQuartzConfig()` 后 push transformer/emitter，`loadQuartzLayout()` 后 append 组件 | ✅ **选它**。零额外包、零 dist 构建；upstream 侵入面从 v4 的 3 处降到 **0 处**（`quartz.ts` 与 custom 目录都是我们自己的） |
| **C. 留 v4 + 回移 bases-page** | 把 v5 插件移植到 v4 | ❌ 不选。依赖 v5 的 page type/types/runtime，等于养孤儿 fork，吃不到后续插件升级 |

**路径 B 的关键机制（已读源码确认）**：
- `loadQuartzConfig(configOverrides)` 返回普通 `QuartzConfig`；`build.ts` 直接遍历 `cfg.plugins.{transformers,emitters,...}`。**在 `quartz.ts` 里 push 自定义实例即可**。
- `loadQuartzLayout(overrides)` 的 `defaults` 是**浅合并**（`{...defaultLayout, ...tsDefaults}`）：只覆盖要动的 slot，其余保持 YAML 布局。
- 组件实例有 registry 缓存（按 constructor + options），重复调用不会重复注入脚本。
- `externalResources().additionalHead` 在 build 时从 `ctx.cfg.plugins` 收集，所以注入的 transformer 也能加 `<head>` 标签。

> ⚠️ **这是本方案唯一的非文档化假设**：在 `quartz.ts` 里 mutate `config.plugins` 不是官方示例，但类型允许、消费点确认。冒烟第一项就是验证它。

---

## 三、逐件映射（v4 → v5）

### transformers / emitters（继续住 `quartz/quartz/plugins/custom/`）

| v4 件 | v5 归属 | 需要的改动 |
|---|---|---|
| `FlattenLocalAssets` | 自定义 transformer，`quartz.ts` push | 类型改从 `@quartz-community/types`（或核心 `../types`）；`file.data.filePath/slug/frontmatter` 字段仍在；`write`/`joinSegments` 同名 |
| `AssetManifest` | 自定义 emitter，push | `emit(ctx, content)` / `write({ctx,slug,ext,content})` 签名不变 |
| `RawMarkdown` | 自定义 emitter，push | 同上；`ctx.cfg.configuration.pageTitle` 仍在 |
| `FrontmatterDate` | 自定义 transformer，push | 不变（保留「无 date 就留白」语义，不用 created-modified-date 的 git/fs 兜底） |
| `TelescopicText`（transform 侧） | 自定义 transformer，push | 不变 |
| `MarkdownAlternate`（新增） | 自定义 transformer + `additionalHead` | 替代 v4 对 `components/Head.tsx` 的 patch：输出 `<link rel="alternate" type="text/markdown" href="<slug>.md">` |
| `emitters/assets.ts` patch | **删除 patch** | 改 `configuration.publishAssets: "referenced"`：transformer 已把图改成 `/assets/<hash>`，源图不再被引用，Assets 不会产僵尸副本 |

### components（继续住 `quartz/quartz/components/custom/`）

| v4 件 | v5 归属 | 需要改动 |
|---|---|---|
| `CardList` ×5 分区 | 合并成一个 `HomeSections`，`afterBody`；内部按 folder 渲染 5 段，仅 `slug === "index"` 输出 | 去掉 `Date/getDate`（v5 核心不再导出），用 `Intl.DateTimeFormat` 或直接 `page.dates?.created` |
| `SiteFooter` | `footer` slot（替换官方 footer 插件） | 不变 |
| `CollapsibleHeaders` | `afterBody` | 不变；inline 脚本已监听 `nav`，与 v5 SPA 兼容 |
| `TelescopicText`（component 侧） | `afterBody` | 不变；`static/telescopic/` 拷进 `quartz/static/` |
| `MarkdownSourceLink` | **仅 content page type 的 `beforeBody`** | 不变；用 `byPageType.content` override 追加 |
| `Head.tsx` patch | **删除** | 由 `MarkdownAlternate` 的 `additionalHead` 取代 |
| `util/og.tsx` CJK patch | **v1 先不做** | 见 §六 开放项 |

### 布局怎么接

```ts
// quartz.ts（示意）
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { FrontmatterDate, FlattenLocalAssets, MarkdownAlternate } from "./quartz/quartz/plugins/custom"
import { AssetManifest, RawMarkdown, TelescopicText } from "./quartz/quartz/plugins/custom"
import HomeSections from "./quartz/quartz/components/custom/HomeSections"
import CollapsibleHeaders from "./quartz/quartz/components/custom/CollapsibleHeaders"
import TelescopicTextUI from "./quartz/quartz/components/custom/TelescopicText"
import SiteFooter from "./quartz/quartz/components/custom/SiteFooter"
import MarkdownSourceLink from "./quartz/quartz/components/custom/MarkdownSourceLink"

const config = await loadQuartzConfig({
  ignorePatterns: ["private", "templates", ".obsidian", ...(process.env.QUARTZ_PROD ? ["_refer/**"] : [])],
})
config.plugins.transformers.push(FrontmatterDate(), MarkdownAlternate(), FlattenLocalAssets(), TelescopicText())
config.plugins.emitters.push(AssetManifest(), RawMarkdown())
export default config

const base = await loadQuartzLayout()
export const layout = await loadQuartzLayout({
  defaults: {
    ...base.defaults,
    afterBody: [...(base.defaults.afterBody ?? []), HomeSections(), CollapsibleHeaders(), TelescopicTextUI()],
    footer: [SiteFooter()],
  },
  byPageType: {
    ...base.byPageType,
    content: {
      ...(base.byPageType.content ?? {}),
      beforeBody: [...(base.defaults.beforeBody ?? []), MarkdownSourceLink()],
    },
  },
})
```

> **顺序敏感**：`FlattenLocalAssets` 必须排在 OFM 之后（要处理 OFM 生成的 `<video>` html 节点）。push 到数组末尾天然满足。
> **`byPageType.content.beforeBody`** 用 `base.defaults.beforeBody` 作为底（v5 的 content page type 默认继承 defaults 的 beforeBody）。

---

## 四、迁移步骤（runbook，分支上进行）

```bash
cd ~/workspace/prosopon-engine
git checkout -b v5                       # main 不动
# 1) 取 upstream v5 到临时目录（不直接覆盖）
git clone --depth 1 -b v5 https://github.com/jackyzha0/quartz /tmp/quartz-v5
# 2) 备份 owned 命名空间
cp -R quartz/quartz/components/custom /tmp/owned-components
cp -R quartz/quartz/plugins/custom    /tmp/owned-plugins
cp -R quartz/quartz/static            /tmp/owned-static
cp quartz/quartz/styles/custom.scss   /tmp/owned-custom.scss
# 3) 用 v5 内容替换 package root（保留 engine 根的 docs/ skills/ README）
rm -rf quartz && cp -R /tmp/quartz-v5 quartz
# 4) 放回 owned 代码
cp -R /tmp/owned-components quartz/quartz/components/custom
cp -R /tmp/owned-plugins    quartz/quartz/plugins/custom
cp -R /tmp/owned-static     quartz/quartz/static
cp /tmp/owned-custom.scss   quartz/quartz/styles/custom.scss
# 5) 写 quartz.config.yaml + quartz.ts（按 §三/§五）
# 6) 安装 + 冒烟
cd quartz && npm install
npx quartz build -d ../../prosopon-source/content --serve
```

验证顺序（每步都可回退）：
1. **注入机制**：先只注入一个空 transformer，构建日志里能看到它，且 `static/contentIndex.json` 正常。
2. **自定义件逐个回归**：卡片首页、折叠标题、telescopic、页脚备案号、`.md` 源入口、**OG 中文**。
3. **图片链路**：本地预览 `/assets/<hash>` 正常；`ASSET_BASE_URL=https://assets.junhangc.cn` 时 URL 指向 OSS；`public/` 下**没有**源图僵尸副本。
4. **Bases**：放一个示例 `.base` + 3 条电影/读书 note，跑 `table/cards/gallery/board`。
5. **部署预演**：`bin/vps deploy-dir ... --domain v5.junhangc.cn`（泛域名证书已覆盖），线上自验后再切 `prosopon.junhangc.cn`。

---

## 五、v5 YAML 插件集（对齐 v4 功能）

保留 v5 默认集，按下面调整：

- **禁用**：`@quartz-community/footer`（用 SiteFooter）；`@quartz-community/created-modified-date`（用 FrontmatterDate）；`@quartz-community/comments`；`@quartz-community/citations`；`@quartz-community/ox-hugo`；`@quartz-community/roam`；`@quartz-community/explicit-publish`；`@quartz-community/canvas-page`（暂不用）；`@quartz-community/encrypted-pages`；`@quartz-community/stacked-pages`；`@quartz-community/unlisted-pages`。
- **启用**：`obsidian-flavored-markdown`、`github-flavored-markdown`、`syntax-highlighting`、`table-of-contents`、`description`、`latex`、`alias-redirects`、`favicon`、`explorer`、`graph`、`search`、`backlinks`、`article-title`、`content-meta`、`page-title`、`darkmode`、`reader-mode`、`breadcrumbs`、`tag-list`、`content-page`、`folder-page`、`tag-page`、**`bases-page`**。
- **配置内置**：
  - `frontmatter` 默认开；
  - `links.markdownLinkResolution: shortest`；
  - `drafts` 默认；
  - `contentIndex: { enableSiteMap: true, enableRSS: true }`；
  - `publishAssets: referenced`；
  - `locale: zh-CN`；
  - `baseUrl: prosopon.junhangc.cn`；
  - 天青盘配色/字体从 v4 `quartz.config.ts` 原样搬。
- **og-image**：本地 fork `../vendor/og-image`（官方插件 + Noto CJK fallback），见 §八。

---

## 六、开放项 / 风险

| # | 项 | 状态 / 建议 |
|---|---|---|
| 1 | `quartz.ts` mutate `config.plugins` 非官方示例 | **已验证**：transformer/emitter/布局组件三种注入全部生效（见 §八） |
| 2 | `loadQuartzLayout()` 调两次是否重复实例化 | registry 有 constructor+options 缓存，预期无重复脚本；构建后检查 `public/postscript*.js` 无重复片段 |
| 3 | og-image 中文 NO GLYPH | **已解决**：fork `vendor/og-image`，在 `getSatoriFonts` 追加 Noto Sans CJK SC fallback（v4 代码移植），并从 `fastly.jsdelivr.net` 取字体（`cdn.jsdelivr.net` 本机直连失败）。见 §八 |
| 4 | URL 小写化 | 中文 slug 不受影响；英文文件名会变。当前内容几乎为空，切换成本≈0；上线后不再有这个问题 |
| 5 | 自定义 SCSS 的 DOM 假设 | v5 外壳/类名可能变；构建后逐页看首页卡片、折叠按钮、telescopic、页脚 |
| 6 | `.base` 内容结构 | 迁移完成后另起：`content/观影/` 或 `content/读书/` + 对应 `.base`（本 session 不做，归书架/内容 session） |
| 7 | Node 版本 | 本机 v24 ✓；VPS 不构建（只收 public），无影响 |

---

## 七、不做的事（边界）

- 不把自定义件改造成社区插件包（除非注入机制验证失败）。
- 不引入 v5 新功能（canvas/encrypted/stacked/semantic search）——迁移只求**功能等价**。
- 不在迁移分支里写内容/选首篇；那是 prosopon 闸门的事。
- 不重开 hypertext 哲学决策（A/B/C/D/E/F/H/I/J 已封板）。

---

## 八、落地结果（2026-11-09，`v5` 分支）

### 已真机验证

- **注入机制**：`quartz.ts` 里 push 的 transformer 跑了（`<meta name="smoke-injected">` 带 page slug）；emitter 写了文件；布局组件渲染进 footer。
- **真实内容构建**：`npx quartz build -d ../../prosopon-source/content` 通过（4 个内容文件，预览含 `_refer`）。
- **定制回归**：首页 folder 分段卡片、备案 footer、`Markdown 源码 ↗`、`rel=alternate type=text/markdown`、折叠标题（`▾` + TOC 的 `{+}` 标记）、telescopic 占位/静态库、图片扁平化全部正常。
- **图片链路**：本地预览走 `/assets/<hash>`；生产 `ASSET_BASE_URL=https://assets.junhangc.cn` 时 HTML 指向 OSS；`public/` 无源图僵尸副本（`publishAssets: referenced` 生效）。
- **生产裁剪**：`QUARTZ_PROD=1` 时 `_refer/**` 不产出，`llms*.txt` / `.md` 也不含 `_refer`。
- **Bases**：临时 `.base` + 2 条电影 note → `观影.base.html` 正确渲染 table/cards（`Showing 3 of 3 entries`，标题/年份/导演/评分列与卡片均在）。
- **无重复脚本**：两次 `loadQuartzLayout()` 后 collapsible/telescopic 脚本各只出现一次。
- **浏览器控制台**：预览页无报错。
- **OG 中文**：每页生成 `<slug>-og-image.webp`；中文标题/描述/「分钟阅读」渲染正常（已目检图片）。

### 实际改动清单

- `quartz/` 整体换成 Quartz v5.0.0（upstream `v5` 分支）。
- 新增 `quartz/quartz.config.yaml`（天青盘 + zh-CN + 官方插件集 + `publishAssets: referenced` + `bases-page`）。
- 新增 `quartz/quartz.ts`（自有 transformer/emitter 注入 + 布局追加）。
- 自有件：`CardList` 合并为 `HomeSections`；新增 `headAlternate.ts`；其余原样（只依赖 v5 同名 API）。
- **删除** v4 的 3 处 upstream patch：`components/Head.tsx`、`plugins/emitters/assets.ts`、`util/og.tsx`。
- **新增 `vendor/og-image/`**：官方 og-image 插件的本地 fork，补 Noto CJK fallback（satori 无自动 CJK fallback）。`quartz.config.yaml` 以本地源 `../vendor/og-image` 启用。
- `styles/custom.scss` 去掉 `@use "./base.scss"`（v5 已单独加载 base，自定义层只写增量）。

### 遗留（非阻塞）

- **Bases URL**：`观影.base` 产出 `观影.base.html`（aarnphm 是干净的 `/cinematheque`）。若要干净 URL，可在 `观影.md` 里用 ` ```base ` 代码块嵌入（v5 transformer 支持），或后续给 BasesPage 加 slug 处理。
- **OG 字体源**：fork 从 `fastly.jsdelivr.net` 拉 Noto Sans CJK SC（`cdn.jsdelivr.net` 本机直连失败）；首次构建下载 16MB，缓存在 `.quartz-cache/fonts/`（gitignored）。
- **部署预演**：尚未跑 `v5.junhangc.cn`；下一步可先部署预演子域，再切正式站。
