# references — 可借鉴的 Quartz 定制(backlog)

> 不是本仓现状(现状看 20-design),是**将来可挑的增强清单**。
> 源:[turntrout.com/design](https://turntrout.com/design)(工程金矿,几乎每项带实现路径)+ [aarnphm.xyz/colophon](https://aarnphm.xyz/colophon)(重 Obsidian 绑定,可抄度低)。
> 筛选口径:已剔除本仓做过的(天青/CardList/SiteFooter/flattenAssets→OSS/frontmatter-date/og 中文/folder 组织);只留**对中文个人花园性价比高**的。采不采纳由 junhang 定。

## 认知前提(抄任何排版 transformer 前先建)

`[leaky]` **Quartz transform 两层,别混**(turntrout):

- **text-transform**:作用于原始文本(正则改字符串)——**会误伤链接地址/代码**。
- **html-AST-transform**(rehype/HAST):作用于解析后的树,能避开 link/code 节点精确定位。
- **原则:凡可能误伤 URL/代码的改写,一律放 html-AST 层,不放 text 层。** 中文排版 transformer 尤其要遵守。

## Top 推荐(按性价比,高→低)

1. **字体全站 subset 子集化** — **中文站第一性能杀手是字体**。按全站实际用到的汉字子集化,几 MB → 几百 KB。构建期跑 fonttools/subfont 扫用字。**性价比第一**(我们现在 og 用的 16MB Noto 也该子集化)。
2. **防布局抖动(CLS):构建期注入图片宽高** — 写 transformer 读图尺寸(我们图在 OSS,manifest 已有 size,可扩展存 w/h)写进 `<img>`,浏览器按 aspect-ratio 预留空间。Quartz 默认不做,OSS 图同样抖。低成本高收益。
3. **`URL + .md` 暴露 markdown 原文 + `llms-full.txt`**(两站共有)— 一个 emitter,给 AI/爬虫/读者原文。两人都把"喂 AI 原文"当一等公民。成本极低。
4. **首屏性能三连**(turntrout,各自独立小改):① 首图 `loading=eager`+`fetchpriority=high`(首图是 LCP,覆盖 Quartz 全 lazy);② 非阻塞 css(KaTeX 等非首屏 css 用 `media="print"` 加载、onload 换 `media="all"`);③ inline critical css。
5. **`<head>` 前 9KB 放 meta/title 保社媒预览** — Slack/微信/飞书/知乎分享卡可能只读 head 前段,og 标签靠后会 flaky。post-build 检查强制顺序。我们做了 og-image 但没管 head 顺序。
6. **间距全用基准边距的倍数 + lint 强制**(turntrout)— 纯 SCSS 变量约束(间距必须是基准的 n±2⁻ᵏ),一条 lint,排版一致性质变。成本极低。
7. **link-by-title(`@title` 构建期填目标当前标题)+ markdown 静态校验** — 内链多的中文花园防标题漂移断链;校验:断链/重复 id/frontmatter 必填/描述长度/预览图 ≤300KB。便宜防手滑。
8. **中文排版 transformer**(照 turntrout `punctilio` 方法论,放 html-AST 层)— 中英混排加空格(pangu.js 式)、全角标点规范化、**中文行首行尾禁则**(标点不能在行首/行尾,CSS `line-break`/`word-break` + 可能 JS)。对中文阅读质感是 turntrout 对英文那种级别提升。成本中-高(自写)。
9. **暗色模式图片处理**(两站)— 白底技术截图在暗色下刺眼:亮色 `mix-blend-mode:multiply`、暗色 `screen`+`filter:grayscale(50%)`(纯 CSS 起步);进阶:构建期预计算"真 HSL 反转"变体(平均亮度>0.7 则反转)。中文技术笔记白底图多。
10. **发现机制增强**(turntrout)— embedding 相似文章推荐(top-5 余弦,比 graph 实用,中文换模型即可)+ backlink 带引用上下文摘录 + Mermaid 服务端渲染(省 JS、适配暗色)。

## 可挑的小愉悦(低成本)

- **代码块软换行**(长 LLM 输出不溢出,悬挂缩进对齐行号)、**admonition 折叠**、**spoiler 块**(`>!` 点击显示,屏幕阅读器不泄露)、**remark-attributes**(md 里给表格指定 css class 不写整段 html)、**print mode**(去导航/展开折叠/白底省墨)、**emoji 构建期统一 Twemoji 风格**。
- **拦截 clipboard 保证复制原文**(turntrout)— 任何做了视觉改写的 transformer(如中文排版),复制时给原始文本而非渲染后文本。
- **资产管线补强**(turntrout)— 我们 flattenAssets 已传 OSS,可补:**exiftool 剥 EXIF**(防照片泄露位置)+ 本地镜像备份。
- **inline favicons**(链接后缀小图标,≥6 次引用或白名单才显示;`nowrap-span` 防图标单独换行)— 技术笔记引 GitHub/arxiv 受益。

## 明确不抄(个人中文花园过度工程)

视觉回归/属性/变异测试全家桶(turntrout 磨了 428 天斗 flaky)、cryptographic timestamping 上链、付费改字体 + 字体 patch 流水线、mascot 吉祥物、PDF reader/flashcards、浏览器内语义搜索(中文模型 + 低端机负担)、dropcap 首字下沉(中文无此传统)、smallcaps/oldstyle numerals/英文智能引号(英文专用)。

## 溯源

- gwern.net 是 turntrout+aarnphm 共同设计源头(inline favicons/dropcaps/related-by-embedding 都引它),深挖可看 gwern.net/design。
- aarnphm 定制强绑 Obsidian 生态 + 客户端 ML(telescopic-text/JSON Canvas/Bases/浏览器内 embedding),**可抄度远低于 turntrout**;turntrout 的 /design 才是整合首要参照。

---

# 附:两站完整定制清单(subagent 如实提炼,全量存档)

> 上面是按性价比的**导读/筛选**;下面是 turntrout + aarnphm 两站的**完整分类清单**,原样存档供日后深挖。标 **独有巧思** = 非 Quartz 自带、也非常见做法。

## aarnphm.xyz 的 Quartz 定制



1. [https://aarnphm.xyz/colophon](https://aarnphm.xyz/colophon) — 作者 aarnphm 的 Quartz 定制站,colophon 页讲他对 Quartz 做了哪些定制。



aarnphm = "忒修斯之船"级重 fork(Quartz v4.6.0 + Cloudflare Workers),偏**功能炫技**,多依赖 Obsidian 生态 + 客户端 ML,工程密度不如 turntrout 可直接抄。

**内容处理 transformer / parser**

- **micromark/remark 扩展自写 OFM 解析器**(wikilinks、sidenotes、callouts)——把 Obsidian-Flavored-Markdown 解析独立成可发布的 `micromark-extension-ofm-*` 包。适用性:中(用 Obsidian 且依赖 wikilink/callout 才值,否则 Quartz 自带够)。
- **`.md` 源可直取**(任意 URL 加 `.md` 返回 markdown 原文)+ `llms-full.txt` 全站聚合——**✅ 已实现**(emitter `RawMarkdown`:每页 `<slug>.md` + `llms-full.txt`)。
- **telescopic-text**(可展开嵌套文本,点击逐层展开)——**✅ 已实现**(transformer `telescopicText` + 组件 `TelescopicText`,lib 在 static/telescopic,` ```telescopic ` 代码块)。**独有巧思**。
- **JSON Canvas / Obsidian Bases 支持**(渲染 canvas 白板和 Bases 数据库视图:表格/画廊/地图/看板)。适用性:低-中(强 Obsidian 绑定)。

**组件**

- **sidenotes(Tufte 式页边注)+ sidepanel(Alt/Cmd/Ctrl+click 内链在侧栏打开)**——Tufte CSS 风格动态尺寸边注。**独有巧思**(sidepanel 比默认 popover 更进)。适用性:中(中文长文边注有价值,移动端布局成本高)。
- **collapsible header(Dynalist 风格可折叠标题)**——**✅ 已实现**(组件 `CollapsibleHeaders`,纯前端脚本给 heading 注入 toggle,折叠到下一个同级标题前,localStorage 记忆)。
- **custom popover / reader view(cmd+shift+b)/ 多种 pageLayout**(Tractatus 专用、技术文档、法语、本科笔记、embeddings 布局)——按内容类型切 layout。适用性:中(多 layout 机制可借,具体 layout 不通用)。
- **mascot(手绘吉祥物爬在标题/代码块/图边,随滚动移动,Ctrl+p 关闭,尊重 prefers-reduced-motion)**。**独有巧思**。适用性:低(趣味)。
- **drop caps(garamond/yinit/goudy + procedural 程序化生成带 seed)**——`dropcap` 代码块语法。**独有巧思**。适用性:不适用-低(中文无首字下沉传统)。

**交互**

- **vim/键盘导航**(`f` 跳链、`gh` 导航 ToC、`Cmd/Ctrl+P` 命令面板、`gs` 分享卡编辑器、`gv` 发音设置)。**独有巧思**(命令面板 + f-link-hint 像 vimium)。适用性:中。
- **语义搜索**(词法搜索 + 客户端语义:EmbeddingGemma 经 Transformers.js 预计算全站 embedding,浏览器内 RAG)。**独有巧思**。适用性:中(中文换模型,低端机负担)。
- **kit de presse / 分享卡编辑器(`gs`,类 Strava,每篇可定制 social card)**。适用性:低。
- **daylight/system/dark/light 四态主题循环**(按 `D` 循环)。适用性:中。

**其他**

- **Cloudflare R2 托管 LFS + middleware proxy client**(大文件走对象存储 + 代理中间件)——与 flattenAssets-to-OSS 同思路,加了 proxy 中间件层。适用性:中。
- **PDF reader / flashcards(FSRS 间隔重复)/ feed(聚合 are.na+curius)**——重功能强个人化。适用性:低。

## turntrout.com 的 Quartz 定制(design 页)



1. [https://turntrout.com/design](https://turntrout.com/design) — 作者 Alex Turner 的 Quartz fork,design 页详述大量工程/设计优化(这个页很长很密)。


Alex Turner 的 fork = **工程严谨 + 排版洁癖 + 性能/测试**,技术密度极高、几乎每项带实现路径,**可直接抄的金矿**。

**内容处理 transformer(两阶段 text-transform → html-AST-transform)**

- **架构认知(leaky)**:见本文件开头"认知前提"。
- **punctilio(自写英文排版库:智能引号/em-en dash/省略号/数学符号/箭头/分数/上标/连字,html-aware 跨标签)**——GFM smartypants 太糙所以自写 + 发 npm 包 + Prettier 插件 + pre-commit。**独有巧思**。适用性:不直接适用但**方法论高**——中文照此写**中文排版 transformer**(pangu 中英加空格 + 全角标点规范化 + 行首行尾禁则),放 html-AST 层。
- **automatic smallcaps(≥3 连续大写转小型大写,排除罗马数字)+ oldstyle numerals + 拦截 clipboard 保证复制原文**。适用性:不适用(中文无大小写),但"**拦截 clipboard 复制原文而非渲染后文本**"对任何视觉改写 transformer 都适用——中。
- **en-dash number range / hyphen→minus / 乘号检测(2x→2×)/ 上标序数(1st)/ `:=`→`≝`**。适用性:低-中(中文数字范围用 ~ 或 –,乘号可借)。
- **`color:red` 构建期归一到站点红**(裸 red/green/blue 和语法高亮色构建期统一成主题色)。**独有巧思**。适用性:中(导入旧内容保配色统一)。
- **spoiler 插件(`>!` 行变点击才显示的剧透块,屏幕阅读器不泄露)**。适用性:中。
- **remark-attributes(md 里给表格等指定 css class,不写整段 html)**。适用性:**高**(给特定表格/图加样式,低成本)。

**样式排版**

- **指数字号(base 20/22/24px 按 mobile/tablet/desktop,header 按 1.2ⁿ)+ 正文列宽固定 750px(~75 字符/行)**。适用性:**高**(中文每行最佳约 35-45 汉字,需重标定,方法论直接可用)。
- **所有间距 = 基准边距的简单倍数(必须 n±2⁻ᵏ,lint 强制)**。**独有巧思**(把"间距和谐"做成可 lint 硬约束)。适用性:**高**(纯 SCSS 变量,成本极低)。
- **dropcap 双色拆分(`::before` 伪元素花饰,字母与装饰分两层)+ 7% 概率随机彩色**。适用性:低(中文无首字下沉)。
- **付费定制 EB Garamond(斜杠零/oldstyle 斜体数字)+ 斜体中直立标点(Bringhurst 5.3.2,改 3000+ kerning pair)+ 可复现字体 patch 流水线**。**独有巧思**。适用性:不适用(中文字体工程另一量级),但"**字体 subset 流水线**"思路适用。
- **text-wrap: balance(标题/caption)+ pretty(正文)、禁连字符断词、行首禁孤立破折号(word-joiner 粘连)**。适用性:中-高(中文有**行首行尾禁则**,CSS line-break/word-break + 可能 JS;balance/pretty 对中文标题有效,纯 CSS)。

**SEO / 性能(价值最高,几乎全可抄)**

- **字体 subset(自写 fork 的 subfont 全站子集化,砍未用 OpenType 表,1.5MB→609KB)**。适用性:**高且关键**——中文字体是花园最大性能杀手。**中文站性价比第一**。
- **图片 avif(10× 压 png,280MB→25MB),视频 webm(VP9)+ Safari fallback mp4(hvc1)双 source**。适用性:高(avif 构建期转)。Safari webm 不自动播/不支持透明的坑要记。
- **防 CLS:构建期抓每个 asset 宽高写进 `<img>`,浏览器据 aspect-ratio 预留空间**。**可直接抄**。适用性:高(Quartz 默认不做,OSS 图同样抖)。
- **inline critical css(`critical` 包构建末尾算首屏关键样式内联进 head,主样式加载后删)**。适用性:高。
- **非阻塞 css(KaTeX 等非首屏 css 用 media="print" 加载,onload 换 media="all")**。适用性:高。
- **首图 eager + fetchpriority=high(覆盖 Quartz 全 lazy,因首图是 LCP)**。适用性:高(一行改动)。
- **无缝滚动恢复(`instantScrollRestoration.js` 内联脚本,首次 paint 前恢复位置,requestAnimationFrame 3s 内对抗晚加载图片位移,监听 wheel/touch/keydown 判断用户介入)**。**独有巧思**。适用性:中-高。
- **micromorph 去重 html 请求(导航只换变化 DOM,共享元素不更新)**。适用性:中(Quartz 新版部分已有)。
- **`<head>` 元素重排保社媒预览(Slack 只读 head 前段,meta/title 塞进前 9KB,post-build 检查强制)**。**独有巧思**。适用性:高(微信/飞书/知乎分享卡同理)。
- **Lighthouse CI(6 页强制 a11y/best-practices/seo 满 100、perf≥90,独立 CLS<0.05)**。适用性:中。

**暗色模式资产反转**

- **亮色浅底图 `mix-blend-mode: multiply` 融背景(伪透明);暗色深底图 `screen`;暗色再加 `filter: grayscale(50%)` 降饱和**。适用性:中-高(纯 CSS)。
- **浅底图在暗色下反转:构建期预计算"真 HSL 反转"变体(翻转亮度保色相饱和),浏览器选图;视频用 svg filter;平均亮度 >0.7 则反转,人工网格复检**。**独有巧思**。适用性:中。

**构建管线 / 测试 / CI(严谨度天花板,选择性抄)**

- **资产管线:Obsidian 粘贴图 → asset_staging/ → 构建期压缩 + exiftool 剥 EXIF + 传 R2 + 本地镜像备份 + 更新 md 引用**。适用性:高(flattenAssets 可补 **exiftool 剥元数据** + **本地镜像备份**)。
- **发出 html 全量校验(Nu validator + 几十类:坏锚点/重复 id/非 cdn 外链/未渲染 emphasis-marker/footnote 不匹配/OG 描述长度/缺字体 preload/RSS schema)**。**独有巧思**。适用性:中(可裁子集)。
- **markdown 源静态校验(frontmatter 必填/url 不重/文件名无空格/预览图 ≤300KB 且在 cdn/表格须声明列对齐)**。适用性:中-高(便宜防手滑)。
- **link-by-title(`@title` 作链接文本,构建期填目标当前标题,防标题漂移)**。**独有巧思**。适用性:高(内链多的中文花园)。
- **pre-commit/pre-push/GitHub Actions 三道闸**(gitleaks 扫密钥、actionlint、codespell、>1MB 文件拒绝、merge-conflict marker 检查;pre-push 用 rich 显示进度 + 断点续跑)。适用性:中(gitleaks + 大文件拒绝对 OSS 工作流有用)。
- **视觉回归测试(Playwright 截图 vs R2 基线,CI 发 expected/actual/diff 三联图,批准晋升基线)+ 属性测试(fast-check/Hypothesis fuzz)+ 变异测试(Stryker/mutmut)**。**独有巧思**(428 天磨 flaky)。适用性:低-中(重型)。
- **Mermaid 服务端渲染(替代图片:一致配色 + 小体积 + 适配暗色)+ 修 Mermaid id 冲突 PR**。适用性:高(中文站画流程图,SSR 省 JS)。
- **auto 仓库统计(构建期算 commit 数注入 populate-* span,空则构建失败)、OpenTimestamps 上链防篡改、uv 管 Python 依赖、Action 全 pin 到 commit sha**。适用性:低(洁癖级)。

**可访问性**

- **alt-text-llm(LLM 生成 alt + imgcat 终端预览 + 交互审批,550 图 $12.5)、WCAG 2.1 AA(pa11y CI)、skip-to-content(`::after` 渲染避免被 Ctrl+F 命中)、5:1 对比度手调**。适用性:中(alt-text-llm 对中文图说明可复用,方法论高)。

**其他小特性(低成本高愉悦)**

- **inline favicons(链接后缀小图标,server-side html transform 查 hostname 的 svg;≥6 次引用或白名单才显示;css mask 统一配色;nowrap-span 防图标单独换行;按前一字母微调间距)**。**独有巧思**。适用性:中。
- **embedding 相似度推荐相关文章(top-5 余弦)**。适用性:高(比 graph 实用,中文换模型)。
- **backlinks + 引用上下文(哪些页链到本页 + 摘录引用处)**。适用性:高(Quartz 有 backlink,带引用上下文是增强)。
- **admonitions 折叠 + 图标 preload、代码块软换行(长 LLM 输出不溢出,悬挂缩进对齐行号)、print mode(去导航/展开折叠/白底省墨/链接显 URL)、滚动溢出渐变提示、BibTeX 一键引用**。适用性:中-高。
- **emoji 构建期统一 Twemoji 风格(跨平台一致)**。适用性:中。
