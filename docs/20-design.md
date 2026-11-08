# design — 定制的架构建模(人 own)

> agentswe 四层之 **design**(人 own)。客观事实(tool_use)之上的架构落点:每个自定义件是什么实体、解决哪个 leaky、数据怎么流。独立于具体代码行。

## 定制 vs 源码:owned 命名空间(架构纪律)

定制只住这些地方,**绝不原地改 upstream 文件**:

| 命名空间 | 承载 |
|---|---|
| `quartz.config.ts` / `quartz.layout.ts` | 配置 + 布局(Quartz 设计上就该改) |
| `quartz/quartz/styles/custom.scss` | 唯一自定义样式入口(`@use base`,不碰 base.scss) |
| `quartz/quartz/components/custom/**` | 自定义组件 |
| `quartz/quartz/plugins/custom/**` | 自定义 transformer/emitter |
| `skills/**` | 发布/工具 skill |

**唯一例外**:`components/index.ts`、`plugins/index.ts` 注册自定义件(加 import/export)。升级 upstream 时这是唯二要手动 merge 的上游文件。

## 自定义件清单(实体 → 职责 → 治哪个 leaky)

### 组件(components/custom/)

- **CardList.tsx** — 首页卡片网格分区。读 `allFiles`,按 `folder` 过滤、按 `date` 排序,渲染成卡片(cover/标题/描述/日期/首个 tag)。props: `{title, folder, limit}`。**内容分类只认 folder,无 type**。
- **SiteFooter.tsx** — 自定义页脚。替掉 Quartz 默认的 GitHub/Discord 推广,放站点标语 + 备案号(`豫ICP备2025138597号-1`)。

### 插件(plugins/custom/)

- **flattenAssets.ts**(transformer `FlattenLocalAssets` + emitter `AssetManifest`)—— 本仓核心。一次解决两个 leaky(tool_use §4 碎图 + §5 slug 耦合):
  - transformer:`markdownPlugins` 里 visit `image` 节点 + ofm 生成的 `html`(video)节点 + frontmatter `cover`;把本地相对图/视频/封面按**内容 sha256 前 12 位**改写成站点绝对 `/assets/<hash>.ext`;登记进 `REGISTRY`(hash→{absSrc,ext,refs,size})和 `MANAGED_SRCS`(已接管源路径集合)。
  - emitter:按 REGISTRY 把物理图拷到 `public/assets/<hash>.ext`(扁平、hash 去重)+ 产 `static/assets-manifest.json`(hash→url/src/refs/size/alt)。
  - **数据流**:源 md 标准相对图 → transformer 改写+登记 → emitter 拷贝扁平目录+出 manifest。
  - **性质兑现**:与 slug/folder 解耦(内容挪动 URL 不变)、同图去重、**迁 COS 只换 `/assets/` base**。manifest = 图片总体视图 db + pi-alt 回填 alt 的地基。
  - **生产/预览切换**:环境变量 `ASSET_BASE_URL`(deploy 设 `https://assets.junhangc.cn` → 图走 OSS;serve 留空 → 本地 `/assets/`)。见 tool_use §10。
- **rawMarkdown.ts**(emitter `RawMarkdown`)—— 每页输出 `<slug>.md` 原始 markdown(从 `file.data.filePath` 读盘)+ 全站聚合 `llms-full.txt`。给 AI/爬虫/读者喂原文(40-references)。
- **telescopicText.ts**(transformer `TelescopicText`)+ **components/custom/TelescopicText.tsx** —— 把 ` ```telescopic ` 代码块(嵌套 bullet=展开层级)标记成 `code.telescopic-source`;组件脚本动态加载 `/static/telescopic/` 的 lib(全局声明,无 export),调 `createTelescopicTextFromBulletedList` 渲染成可点击逐层展开的文本。lib 复制在 `quartz/static/telescopic/`。
- **components/custom/CollapsibleHeaders.tsx** —— Dynalist 风格可折叠标题:纯前端脚本(afterDOMLoaded)给正文每个 heading 注入 **`<button class="ch-toggle">`**(原生可聚焦/键盘 Enter·Space/`aria-expanded`,无障碍),点击折叠其下内容到下一个同级/更高级 heading 前,localStorage 按 slug+heading 记忆。
  - frontmatter `collapseHeaders: false` → 本页关闭折叠;`collapseDefault: closed` → 本页默认折叠;标题末尾 `{-}` → 该标题不折叠。
  - 与 aarnphm 参考实现的差距:他服务端包 `<section>`(结构更语义),我们用客户端兄弟隐藏(更轻);无「加密内容/transclusion」等本仓不需要的扩展。
- **frontmatterDate.ts**(transformer `FrontmatterDate`)—— 替掉内置 CreatedModifiedDate(tool_use §6)。只认 frontmatter `date`(或 created/modified/published),有则设 `file.data.dates`,无则 `delete dates`(留白,绝不伪造)。`defaultDateType: created`。

### 对 upstream 的侵入(有记录的例外,升级 Quartz 时手动 merge)

1. **emitters/assets.ts**:Assets emitter 加 `isManaged()`(`import { MANAGED_SRCS }`)跳过已扁平化接管的图,避免源结构僵尸副本(tool_use §5)。
2. **util/og.tsx**:`getSatoriFonts` 末尾追加 Noto Sans CJK SC fallback 修 og 中文 NO GLYPH(tool_use §9)。字体首次下载缓存 `.quartz-cache/fonts/noto-sans-cjk-sc.otf`。
3. 注册点:`components/index.ts`、`plugins/index.ts`(加自定义件 import/export)。
+ config 层:`quartz.config.ts`(baseUrl=prosopon.junhangc.cn、天青盘、插件链)、`quartz.layout.ts`(首页 folder 分段)。

## 内容组织模型(engine 侧的消费约定)

- **folder = 唯一内容分类轴**:主题大类 + `随笔/`(短内容)。首页 CardList 按 folder 分段。
- **frontmatter** 见 prosopon-source/CLAUDE.md 的 schema(title/date/tags/domain/description/cover/platforms/status/source)。**无 type 字段**。
- **cover** 从 content 根写相对路径,构建时被 flattenAssets 扁平化。

## 配色/字体(config 层,非代码)

天青·文人盘(light+dark):冷白微青底 + 黛青字 + 天青强调 `#2f8296`(汝窑向)+ 暖赭点缀 `#bc7a3e`(冷暖对比)。字体 Inter + 系统 CJK 回退。详 quartz.config.ts。
