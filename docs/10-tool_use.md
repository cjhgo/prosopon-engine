# tool_use — 定制 Quartz 所需的理念与坑(leakback)

> agentswe 四层之 **tool_use**(外部事实)。不是 Quartz API 手册,是「不懂它 design 就会建错、用法就会派错」的 leaky 认知。
> 关键处标 `[leaky]`。端点/字段名留给 Quartz 官方文档(本机 `quartz/docs/`)。

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
