# design — 定制的架构建模(人 own)

> agentswe 四层之 **design**(人 own)。客观事实(tool_use)之上的架构落点:每个自定义件是什么实体、解决哪个 leaky、数据怎么流。独立于具体代码行。

## 定制 vs 源码:owned 命名空间(架构纪律)

> v5 起采用 **fork 内注入**（见 `50-v5-migration.md`）：定制住 fork 内，但通过 `quartz.ts` 接入，**不侵入任何 upstream 文件**。

定制只住这些地方：

| 命名空间 | 承载 |
|---|---|
| `quartz/quartz.ts` | **注入入口**：YAML 配置 + 自有 transformer/emitter push + 布局追加（我们自己的文件） |
| `quartz/quartz.config.yaml` | 官方插件集 + 主题/语言/`publishAssets`（配置层） |
| `quartz/quartz/styles/custom.scss` | 唯一自定义样式入口（只写增量，不 `@use base`） |
| `quartz/quartz/components/custom/**` | 自定义组件 |
| `quartz/quartz/plugins/custom/**` | 自定义 transformer/emitter |
| `quartz/quartz/static/**` | 站点静态资产（icon / og 兜底 / telescopic lib） |
| `skills/**` | 发布/工具 skill |

**对 upstream 的侵入 = 0**：v4 时代的 `components/index.ts`、`plugins/index.ts`、`emitters/assets.ts` 三处 merge 点全部消失（分别由 `quartz.ts` 注入、`publishAssets: referenced` 取代）。升级 v5 时只需替换 `quartz/quartz/` 核心，重放 custom 目录与 `quartz.ts`。

## 扩展点地图(每个 feature 住在 Quartz 流水线哪一层)

> 心智模型:Quartz 不是"一个 md parser",是一条 5 段流水线;我们的定制散在**不同层**。这决定了升级/替换时各改各的、内容永远是纯 md。

| 扩展点 | 阶段 | 本仓放这的 |
|---|---|---|
| ① markdown parser(mdast) | 解析 | `TelescopicText`(标记 ```telescopic 块)、`FlattenLocalAssets`(改写 image/cover URL)、`FrontmatterDate`(读 date) |
| ② HTML AST(rehype/HAST) | 后处理 | (暂未用;排版/标题锚点可放这) |
| ③ emitters(产出文件) | 构建 | `RawMarkdown`(`.md`+`llms.txt`)、`AssetManifest`(图片台账/资产缓存)、`MouseionFeed`(`static/mouseion.json`)、contentPage 等 |
| ④ components + 浏览器脚本 | 渲染/水合 | `CollapsibleHeaders`、`TelescopicText` 客户端、`HomeSections`、`SiteFooter`、`MarkdownSourceLink`、`MarkdownAlternate`(additionalHead) |
| ⑤ config / layout / static | 配置 | `quartz.config.yaml`(天青盘/zh-CN/官方插件) + `quartz.ts`(注入/布局追加)、`static/telescopic`(客户端库) |

`[leaky]` 要点:**折叠标题不在 parser**(纯浏览器脚本给 DOM 加按钮);**伸缩文本解析在客户端**(parser 只标记代码块)。所以内容永远是普通 md,feature 不污染写作;各层解耦、可独立替换。

## 自定义件清单(实体 → 职责 → 治哪个 leaky)

### 组件(components/custom/)

- **HomeSections.tsx** — 首页卡片网格分区（v5 由 v4 的 5 个 `CardList` 合并）。读 `allFiles`，按 folder（生活/工作/读书/新知/随笔）分段、按 date 排序，渲染卡片（cover/标题/描述/日期/首个 tag）；**仅 `slug === "index"` 输出**，其余页返回 null。日期用 `Intl.DateTimeFormat("zh-CN")`（v5 核心不再导出 `Date/getDate`）。
- **SiteFooter.tsx** — 自定义页脚。替掉 Quartz 默认推广，放站点标语 + 备案号(`豫ICP备2025138597号-1`)。
- **MarkdownSourceLink.tsx** — content 页的「Markdown 源码 ↗」入口（指向 `RawMarkdown` 产出的 `<slug>.md`）。通过 `byPageType.content.beforeBody` 注入，只出现在正文页。
- **MouseionView.tsx + mouseionStyles.ts** — MOUSEION 综合页的 custom Bases view（`viewRegistry.register({id:"mouseion"})`）。按 `medium` 分组：书境书架 / 影境胶片夹 / 音境密铺封面墙；每一格固定显示名字/作者，封面只作纹理。`MAX_PER_REALM=12`，music 不设上限。

### 插件(plugins/custom/)

- **flattenAssets.ts**(transformer `FlattenLocalAssets` + emitter `AssetManifest`)—— 本仓核心。一次解决两个 leaky(tool_use §4 碎图 + §5 slug 耦合):
  - transformer:`markdownPlugins` 里 visit `image` 节点 + ofm 生成的 `html`(video)节点 + frontmatter `cover`;把本地相对图/视频/封面按**内容 sha256 前 12 位**改写成站点绝对 `/assets/<hash>.ext`;登记进 `REGISTRY`(hash→{absSrc,ext,refs,size})和 `MANAGED_SRCS`(已接管源路径集合)。
  - emitter:按 REGISTRY 把物理图拷到 destinations。**生产**(`ASSET_BASE_URL` 非空)落 `.quartz-cache/assets/<hash>.ext`（持久缓存，只拷新 hash；deploy 增量同步 OSS）；**预览**落 `public/assets/<hash>.ext`。并产 `static/assets-manifest.json`(hash→url/src/refs/size/alt)。
  - **数据流**:源 md 标准相对图 → transformer 改写+登记 → emitter 拷贝扁平目录+出 manifest。
  - **性质兑现**:与 slug/folder 解耦(内容挪动 URL 不变)、同图去重、**迁 COS 只换 `/assets/` base**。manifest = 图片总体视图 db + pi-alt 回填 alt 的地基。
  - **生产/预览切换**:环境变量 `ASSET_BASE_URL`(deploy 设 `https://assets.junhangc.cn` → 图走 OSS;serve 留空 → 本地 `/assets/`)。见 tool_use §10。
- **mouseionFeed.ts**(emitter `MouseionFeed`) —— 把 `content/mouseion/` 的笔记投影成 `public/static/mouseion.json`（title/medium/creator/year/cover/tags/href），供独立子域站消费。主站仍是 SoT；不产生第二份内容。
- **rawMarkdown.ts**(emitter `RawMarkdown`)—— 每页输出 `<slug>.md` 原始 markdown(从 `file.data.filePath` 读盘)+ 全站聚合 `llms-full.txt`。给 AI/爬虫/读者喂原文(40-references)。
- **telescopicText.ts**(transformer `TelescopicText`)+ **components/custom/TelescopicText.tsx** —— 把 ` ```telescopic ` 代码块(嵌套 bullet=展开层级)标记成 `code.telescopic-source`;组件脚本动态加载 `/static/telescopic/` 的 lib(全局声明,无 export),调 `createTelescopicTextFromBulletedList` 渲染成可点击逐层展开的文本。lib 复制在 `quartz/static/telescopic/`。
- **components/custom/CollapsibleHeaders.tsx** —— Dynalist 风格可折叠标题:纯前端脚本(afterDOMLoaded)给正文每个 heading 注入 **`<button class="ch-toggle">`**(原生可聚焦/键盘 Enter·Space/`aria-expanded`,无障碍),点击折叠其下内容到下一个同级/更高级 heading 前,localStorage 按 slug+heading 记忆。
  - **默认展开**。标题末尾 `{+}` → 该节默认折叠;`{-}` → 该节不折叠(无 toggle);标记自动剥离不显示。frontmatter `collapseHeaders: false` → 整个关闭,`collapseDefault: closed` → 全页默认折叠。
  - 与 aarnphm 参考实现的差距:他服务端包 `<section>`(结构更语义),我们用客户端兄弟隐藏(更轻);无「加密内容/transclusion」等本仓不需要的扩展。
- **frontmatterDate.ts**(transformer `FrontmatterDate`)—— 替掉官方 CreatedModifiedDate（v5 里已禁用）。只认 frontmatter `date`(或 created/modified/published)，有则设 `file.data.dates`，无则 `delete dates`(留白，绝不伪造)。
- **headAlternate.ts**(transformer `MarkdownAlternate`)—— 用 v5 的 `externalResources().additionalHead` 给每页注入 `<link rel="alternate" type="text/markdown" href="<slug>.md">`，替代 v4 对 `components/Head.tsx` 的 patch。

### 对 upstream 的侵入（v5 起 = 0）

v4 的三处例外全部消失：

| v4 侵入 | v5 替代 |
|---|---|
| `emitters/assets.ts` 加 `isManaged()` | `configuration.publishAssets: "referenced"`（图已被改写成 `/assets/<hash>`，源图不再被引，自然不复制） |
| `util/og.tsx` 加 CJK fallback | `vendor/og-image/` 本地 fork：Noto Sans CJK SC fallback + `.quartz-cache/og` 持久缓存；不侵入 upstream |
| `components/index.ts` / `plugins/index.ts` 注册 | `quartz.ts` 直接 import + push / append 布局 |

配置层：`quartz.config.yaml`（baseUrl / 天青盘 / 官方插件集 / publishAssets）+ `quartz.ts`（`ignorePatterns` 动态、自有件注入、布局追加）。

## 内容组织模型(engine 侧的消费约定)

- **folder = 唯一内容分类轴**:主题大类 + `随笔/`(短内容)。首页 `HomeSections` 按 folder 分段。
- **Bases**（v5）：`.base` 或 md 内 ` ```base ` 由 `@quartz-community/bases-page` 渲染成 table/list/cards/gallery/board。`/mouseion/{books,film,music}/` 用嵌入 base，默认 Cards；`/mouseion/` 用 `mouseion` custom view。内容仍是普通 md + frontmatter。
- **MOUSEION 第二载体**：主站 build 产出 `static/mouseion.json` → `mouseion-site/build.py` 生成独立全屏站 → `mouseion.junhangc.cn`。note 页仍在主站 `/mouseion/<slug>`（canonical），子域只做门面/入口。
- **MOUSEION 3D room**：`/book/ /film/ /music/` 共用 `mouseion-site/shelf.js` 一套参数化 Three.js 场景（medium 决定版式/列数/机位/材质：书=浅色木架 2:3，影=钢架+齿孔 2:3，音=暖色木架 1:1）；数据与同源裁切封面由 `build.py` 从 feed + `assets-manifest.json` 生成，Three.js vendor 在 `mouseion-site/vendor/`，不依赖 CDN。
- **frontmatter** 见 prosopon-source/CLAUDE.md 的通用 schema + 书影音专用字段(medium/added/creator/year/raw_tags/cover_source/cover_status)。**无 type 字段**。
- **cover** 从 content 根写相对路径,构建时被 flattenAssets 扁平化；`socialImage` 跟着 cover 一起改写。

## 配色/字体(config 层,非代码)

天青·文人盘(light+dark)：冷白微青底 + 黛青字 + 天青强调 `#2f8296`(汝窑向) + 暖赭点缀 `#bc7a3e`(冷暖对比)。字体 Inter + 系统 CJK 回退。详 `quartz.config.yaml`。
