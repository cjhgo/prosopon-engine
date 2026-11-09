# tool_use — 定制 Quartz 所需的理念与坑(leakback)

> agentswe 四层之 **tool_use**(外部事实)。不是 Quartz API 手册,是「不懂它 design 就会建错、用法就会派错」的 leaky 认知。
> 关键处标 `[leaky]`。端点/字段名留给 Quartz 官方文档(本机 `quartz/docs/`)。

## 0. v5 增量（迁移后必读）

- **配置分层**：`quartz.config.yaml`（官方插件/主题/`configuration`）+ `quartz.ts`（TS override）。`loadQuartzConfig()` 返回普通对象；自有 transformer/emitter **push 进去**即可，`build.ts` 直接遍历 `cfg.plugins.*`。
- **布局**：`loadQuartzLayout(overrides)`，`defaults` 是**浅合并**（只覆盖要动的 slot）；布局组件是有 `css` / `afterDOMLoaded` 属性的函数，registry 按 constructor+options 缓存实例。
- **官方插件 = npm 依赖**：`npm install` 已带全部 `@quartz-community/*`；只有 git 源插件才需要 `npx quartz plugin install`。
- **`publishAssets: "referenced"`**：Assets 只复制被页面引用的源资产。我们的 transformer 已把图改写成 `/assets/<hash>`，源图不再被引 → 自动不产僵尸副本，**不需要改 upstream assets.ts**。
- **`additionalHead`**：插件 `externalResources()` 可按页注入 `<head>` 元素（函数收到当前页 `QuartzPluginData`），用来做 `rel=alternate` 等。
- **URL 小写化**：v5 统一小写 + 连字符；中文不受影响，英文文件名会变（AliasRedirects 默认兜底）。
- **Page types**：content / folder / tag / 404 / canvas / bases 分派；`bases-page` 把 `.base` 渲染为 table/list/cards/gallery/board。

## 1. Quartz 的构建模型:transformer(map)→ filter → emitter(reduce)

- **transformer** 逐文件处理(map)。两类 hook 关键:`textTransform(src)` 改原始文本;`markdownPlugins()` 返回 remark 插件、拿得到 `file.data`(含 `filePath`/`slug`/`frontmatter`),在 mdast 上 `visit` 节点。
- **emitter** 全文件解析完后跑(reduce),能做**跨文件**运算 + 产出 public 文件。
- `[leaky]` **顺序敏感**:transformer 按数组顺序作用。我们的 `FlattenLocalAssets` 必须在 `ObsidianFlavoredMarkdown`(ofm)**之后**,因为它要处理 ofm 把 `![](x.mp4)` 转成的 `<video>` html 节点。
- `[leaky]` **backlink/graph 为何必须是 emitter**:一篇在全 vault 解析完前,根本不知道谁链接了它。反向边只能在所有文件就位后全局算。这是「图=本体,全局 pass 兑现成可见产品」的工程根源。

## 2. `[leaky]` Quartz 的 `.tsx` 不是 React 运行时

自定义组件(components/custom/*.tsx)长得像 React,但**服务端渲染成静态 HTML**:`useState`/`useEffect`/`onClick` 全部失效。
- 交互只能走 `.beforeDOMLoaded`/`.afterDOMLoaded`(脚本字符串)+ 监听 SPA 的 `nav` 事件 + 直接操作 DOM。
- 组件拿 props 五件套:`fileData`(本页)、`cfg`、`tree`(HTML AST)、`allFiles`(全站元数据,做列表/卡片用)、`displayClass`。
- 我们的 CardList 就是读 `allFiles` 的 frontmatter 过滤+排序渲染——本质 `SELECT * WHERE folder ORDER BY date`。按 React 心智写必踩空。

## 3. `[leaky]` scss 无 CSS modules

组件里声明的样式是**全局作用域**。class 要够独特(我们用 `card-*`/`site-footer` 前缀),否则污染全站。自定义样式只写 `styles/custom.scss`(`@use base`),不碰 base.scss(升级会冲突)。

## 4. `[leaky]` 图片的两端矛盾 —— 本仓最硬的坑

**现象**:同一张本地图,「本地普通预览(VSCode/cweijan)」与「Quartz 上线」要求的写法相反。
- 标准相对 `![](image/x.png)`:本地预览器认 ✓,但 Quartz **emit flat html**(`生活/十月的光.html`,非 `.../index.html`)+ 内链 href 无 trailing slash,导致浏览器 base 落在 `/生活/`,相对图 src 算错一层 → **碎图**。
- wikilink `![[x.png]]`:Quartz 的 slug resolver 算对 ✓,但普通预览器不认 → 本地空白。

**根因**:flat-html + href 无 slash。不是写法问题,是 Quartz 的 URL 形态。

**解法(本仓)**:作者写**标准相对**(本地完整),构建时 transformer 转换。详见 design 的 FlattenLocalAssets。
→ 这就是「矛盾在 transform 时隐藏」的落地:源 md 两端友好,矛盾被管线吃掉。

## 5. `[leaky]` slug 编进图 URL(迁 COS 的隐形锁)

Quartz 内置 `Assets` emitter **按源目录结构**拷图 → 上线 URL = `/生活/image/十月的光/x.png`,把 slug 编进了图 URL。后果:内容挪 folder/改标题、迁 COS,图都要跟着内容结构走。
→ 违反 carrier≠本体。解法:扁平化到 `/assets/<内容hash>`,与内容位置解耦(design 的 FlattenLocalAssets)。

## 6. `[leaky]` 内置 CreatedModifiedDate 会伪造日期

`CreatedModifiedDate` 在无日期时,`coerceDate(undefined)` 兜底成 `new Date()`(**构建时刻**)。于是没写 frontmatter date 的文章显示「今天」这种假创作日期,且 `fileData.dates` 恒非空 → ContentMeta 永远显示。
→ 违反 reproducibility(显示未发生的事)。解法:自定义 FrontmatterDate 只认 frontmatter,缺则不设 dates(design)。

## 7. wikilink 解析规则(非模糊)

- `markdownLinkResolution: "shortest"`:`[[标题]]` 按**文件名全局解析**,与 folder 无关 → **跨 folder、挪 folder 都不断链**(图片 basename 同理)。要求文件名全局唯一。
- `[leaky]` **不模糊**:错字/异大小写 → 静默死链(不报错不标红)。仅首尾空格 trim、空格转连字符是规则。要「不精确也能链」用目标 frontmatter 的 `aliases:`(显式登记,非自动猜),`AliasRedirects` emitter 兜底。
- 写作时 `[[` 弹候选是 **Obsidian/编辑器**的 fuzzy finder,不是 Quartz。

## 8. 组织的三正交零件(别混)

- **frontmatter(语义)**:领域/时间/tag 视图都是 transform 读 frontmatter **自动生成**的派生视图。
- **wikilink(图的边)**:按名解析,folder 无关。
- **folder(物理 + 面包屑)**:只管文件放哪 + 面包屑定位,**不承载唯一分类**。
- `[leaky]` 「把 Quartz 当 Hugo 使」= folder 成为唯一组织 + 链接按路径 + 无 frontmatter 视图。只要保留后两者,分 folder 是锦上添花不是退化。详见上游 hypertext-数字花园.md §1.5a。
- **本仓落地**:内容分类**只用 folder**(不用 `type` 字段——「长短文」信息量太低不配一个字段);短内容统一放 `随笔/`。首页 CardList 按 folder 分段(生活/工作/读书/新知/随笔)。

## 9. `[leaky]` og-image 中文会 NO GLYPH(satori 不 fallback CJK)

- `CustomOgImages` 用 **satori** 离线渲染(build 时 HTML→SVG→图),字体只从 `config.theme.typography` 取(我们是 Inter,纯拉丁)。
- **satori 不像浏览器会自动 fallback 到系统 CJK 字体** → 中文全渲染成 `NO GLYPH` 黑块(英文/数字正常)。浏览器里中文正常是因浏览器有系统 fallback,og 离线生成没有。
- **解**:satori 支持**多字体 fallback**(按字形在数组里逐个找)。在拉丁字体后**追加一个中文字体**(Noto Sans CJK SC),拉丁走 Inter、中文走 Noto。
- `[leaky]` **satori 吃 ttf/otf/woff,不吃 woff2**(现代 CJK 子集字体多只发 woff2,取不到)→ 用完整 OTF(16MB),首次 build 下载缓存 `.quartz-cache/fonts`。
- 实现落点(v5):`vendor/og-image/` 本地 fork（`getSatoriFonts` 追加 CJK，`dist/` 已提交）；不再 patch `util/og.tsx`。
- `[leaky]` OG 是逐页 satori/sharp 生成，内容页多了会很贵。本仓 fork 加 `.quartz-cache/og` 持久缓存（page/title/description/theme 变了才重画）；虚拟 tag/folder 页和 `mouseion/` 不生成（Head 不引用它们的生成图），内容页的 `socialImage` 直接复用封面。

## 10. 部署:图走 OSS / HTML 走 ECS 的 ASSET_BASE 切换

- `flattenAssets` 读环境变量 `ASSET_BASE_URL`:**生产**(deploy)设 `https://assets.junhangc.cn` → HTML 里图 URL 指 OSS;**预览**(serve)留空 → `/assets/<hash>` 由本地 Quartz 服务。同一份源,两种产出。
- **资产缓存**：生产把扁平图落到 `.quartz-cache/assets`（内容 hash 持久缓存，只拷新 hash）；deploy 用 `oss sync --ignore-existing` 只传新对象。预览仍落 `public/assets`。
- **MOUSEION 子域**：主站 build 额外产 `static/mouseion.json`；`mouseion-site/build.py` 读它生成独立全屏站，`deploy.sh` 部署到 `mouseion.junhangc.cn`。条目 links 回主站 `/mouseion/<slug>`。
- 为什么:ECS 云助手上传是分块(慢),图(大头)挪 OSS、HTML(小)留 ECS。部署管线见 aliyun-ops/references/deploy-ctx.md(含 OSS 中转 tar 治分块往返)。
