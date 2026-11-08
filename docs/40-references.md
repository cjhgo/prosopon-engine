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

视觉回归/属性/变异测试全家桶(turntrout 磨了 428 天斗 flaky)、cryptographic timestamping 上链、付费改字体 + 字体 patch 流水线、mascot 吉祥物、telescopic-text、PDF reader/flashcards、浏览器内语义搜索(中文模型 + 低端机负担)、dropcap 首字下沉(中文无此传统)、smallcaps/oldstyle numerals/英文智能引号(英文专用)。

## 溯源

- gwern.net 是 turntrout+aarnphm 共同设计源头(inline favicons/dropcaps/related-by-embedding 都引它),深挖可看 gwern.net/design。
- aarnphm 定制强绑 Obsidian 生态 + 客户端 ML(telescopic-text/JSON Canvas/Bases/浏览器内 embedding),**可抄度远低于 turntrout**;turntrout 的 /design 才是整合首要参照。
