# CUSTOMIZATIONS — 定制 vs 上游源码

本仓库 `quartz/` 是 **jackyzha0/quartz v4.5.2 @ `d25a6ea`** 的 vendored 副本(已剥 upstream .git)。
为「区分管理我们的定制和上游源码」,遵守一条纪律。

## 纪律:定制只住在「owned 命名空间」,绝不原地改上游文件

| owned 命名空间 | 说明 |
|---|---|
| `quartz.config.ts` | 站点配置(主题色/字体/插件开关)——Quartz 设计上就该改 |
| `quartz.layout.ts` | 页面布局(组件摆放)——同上 |
| `quartz/styles/custom.scss` | **唯一**自定义样式入口(`@use "./base.scss"`);**不动** base.scss |
| `quartz/components/custom/**` | 所有自定义组件 |
| `quartz/plugins/custom/**` | 所有自定义插件(transformer/emitter/filter) |
| `skills/**` | 发布/工具 skill(如 xhs-publish),非 Quartz |

**唯一例外**:`quartz/components/index.ts` —— 注册自定义组件必须在此加 import/export。
我们只在此加了 `CardList` / `SiteFooter` 各一组 import+export,其余不动。
升级 upstream 时,这是**唯一**需要手动 merge 的上游文件。

## 本站定制清单(2026-11-08 夜)

| 文件 | 类型 | 做了什么 |
|---|---|---|
| `quartz.config.ts` | 改配置 | pageTitle=生活工作读书新知;字体 Inter / JetBrains Mono;**天青·文人盘**(light+dark):冷白微青底 + 黛青字 + 天青强调 `#2f8296`(汝窑/宋瓷向,偏青)+ 克制暖赭点缀 `#bc7a3e`(冷暖对比避免冷死)。主色由"蓝调偏爱"定,偏青方向;可微调轴:更墨(藏青)/ 点缀换金或去掉 |
| `quartz.layout.ts` | 改布局 | 首页 afterBody 两段卡片 feed(随记 / 文章);footer 换成 SiteFooter |
| `quartz/styles/custom.scss` | 自定义样式 | CJK 字体回退(Latin 走 Inter、中文走系统);`text-wrap: pretty/balance`(turntrout 借鉴);卡片/分区/页脚样式 |
| `quartz/components/custom/CardList.tsx` | 新组件 | 读 `allFiles` 渲染分区卡片网格(type 徽章 / cover 缩略图 / 日期 / tag);props: `title/types/exclude/limit` |
| `quartz/components/custom/SiteFooter.tsx` | 新组件 | 自定义页脚:去掉 Quartz/Discord 推广,放站点标语 + 备案号(`豫ICP备2025138597号-1`) |
| `quartz/components/index.ts` | **注册(上游文件)** | +2 import、+2 export(CardList / SiteFooter) |
| `skills/xhs-publish/` | skill 占位 | 将来的小红书发布器(读 prosopon-source 的双用 frontmatter) |
| `skills/alt-text/` | skill 脚手架 | turntrout `alt-text-llm` 接入文档(未运行,缺 OpenRouter key) |

## turntrout「拿来」落地情况
- ✅ **`text-wrap: pretty/balance`** —— 已入 custom.scss(纯 CSS、无 license 负担、CJK 受益)。
- 🧩 **alt-text-llm** —— 脚手架 + 文档在 `skills/alt-text/`,**未跑**(无 key)。
- 🔁 **图片防 CLS** —— 卡片缩略图已用固定高度(无 CLS);正文图的构建时宽高注入 transformer 留 `plugins/custom/` 日后写(拿思路自己写,避 CC BY-SA)。
- ❌ 跳过:punctilio/smallcaps/dropcap(英文专用);测试 CI 军备(过度工程)。

## 升级 upstream Quartz
1. 取新版 jackyzha0/quartz 到临时目录。
2. 用新版覆盖 `quartz/` 下**除 owned 命名空间外**的文件(`components/custom`、`plugins/custom`、`styles/custom.scss` 不动)。
3. 手动 3-way merge 三处:`quartz.config.ts`、`quartz.layout.ts`、`quartz/components/index.ts`(只我们那几行)。
4. `npm install` + 冒烟构建。

## 与内容仓的关系
内容(md + 随文图)在 sibling 仓 **prosopon-source**,本仓只放代码。构建:
```
cd quartz && npx quartz build -d ../../prosopon-source/content --serve
```
